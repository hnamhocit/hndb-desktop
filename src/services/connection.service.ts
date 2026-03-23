import { invoke } from '@tauri-apps/api/core'

import type { IColumn, IConnection, IRelationship } from '@/interfaces'
import type { ConnectionConfigPayload } from '@/components/DataSourceDialog/utils'
import { useConnectionStore } from '@/stores'
import { formatErrorMessage } from '@/utils'

const wrapData = <T>(value: T) => ({
	data: {
		data: value,
	},
})

const syncConnectionStatuses = async () => {
	const statuses = await invoke<Record<string, boolean>>(
		'list_connection_statuses',
	)
	useConnectionStore.getState().setBulkStatuses(statuses)
}

const syncConnectionStatusesInBackground = () => {
	void syncConnectionStatuses().catch((error) => {
		console.error('Failed to refresh connection statuses:', error)
	})
}

const getCommandName = (query: string) =>
	query.trim().split(/\s+/)[0]?.toUpperCase() || null

const MAX_SELECT_STAR_ROWS = 50_000
const SELECT_STAR_FROM_REGEX = /^SELECT\s+\*\s+FROM\b/i

const stripSqlComments = (query: string) =>
	query
		.replace(/\/\*[\s\S]*?\*\//g, ' ')
		.replace(/--.*$/gm, ' ')
		.trim()

const trimTrailingSemicolons = (query: string) => query.replace(/;+\s*$/, '')

const shouldCapSelectStarRows = (query: string) => {
	const normalizedQuery = trimTrailingSemicolons(stripSqlComments(query))

	return (
		Boolean(normalizedQuery) &&
		SELECT_STAR_FROM_REGEX.test(normalizedQuery) &&
		!/\bLIMIT\b/i.test(normalizedQuery)
	)
}

const applySelectStarRowCap = (query: string) => {
	if (!shouldCapSelectStarRows(query)) {
		return { query, wasCapped: false }
	}

	const queryWithoutSemicolons = trimTrailingSemicolons(query.trim())
	return {
		query: `${queryWithoutSemicolons} LIMIT ${MAX_SELECT_STAR_ROWS}`,
		wasCapped: true,
	}
}

const isExplainableQuery = (query: string) => {
	const firstCommand = getCommandName(stripSqlComments(query))
	return firstCommand === 'SELECT' || firstCommand === 'WITH'
}

const invokeQueryRows = async (
	connectionId: string,
	database: string | null,
	query: string,
	forced: boolean = false,
) => {
	const raw = await invoke<string>('execute_query', {
		id: connectionId,
		database,
		query,
		forced,
	})

	return JSON.parse(raw) as Record<string, unknown>[]
}

const mapRowsToQueryResult = (
	rows: Record<string, unknown>[],
	query: string,
	startedAt: number,
	metadata?: {
		isLimited?: boolean
	},
) => ({
	rows,
	durationMs: Date.now() - startedAt,
	isLimited: metadata?.isLimited ?? false,
	affectedRows: null,
	command: getCommandName(query),
	sizeBytes: new Blob([JSON.stringify(rows)]).size,
})

export const connectionService = {
	list() {
		return invoke<IConnection[]>('list_connections')
	},

	listStatuses() {
		return invoke<Record<string, boolean>>('list_connection_statuses')
	},

	resetSessions() {
		return invoke<void>('reset_connection_sessions')
	},

	delete(connectionId: string) {
		return invoke<void>('delete_connection', { connectionId })
	},

	disconnect(connectionId: string) {
		return invoke<void>('disconnect_connection', { id: connectionId })
	},

	connect(connectionId: string) {
		return invoke<void>('connect_session', { id: connectionId })
	},

	reconnect(connectionId: string) {
		return invoke<void>('invalidate_connection', { id: connectionId })
	},

	rename(connectionId: string, newName: string) {
		return invoke<void>('rename_connection', { connectionId, newName })
	},

	async getDatabases(connectionId: string, _showAll: boolean) {
		const databases = await invoke<string[]>('list_databases', {
			id: connectionId,
		})
		syncConnectionStatusesInBackground()

		return wrapData(databases)
	},

	async getTables(connectionId: string, database: string) {
		const tables = await invoke<string[]>('list_tables', {
			id: connectionId,
			database,
		})
		syncConnectionStatusesInBackground()

		return wrapData(tables)
	},

	async executeQuery(
		connectionId: string,
		database: string | null,
		query: string,
		forced: boolean = false,
	) {
		const startedAt = Date.now()
		const { query: queryToRun, wasCapped } = applySelectStarRowCap(query)
		const rows = await invokeQueryRows(
			connectionId,
			database,
			queryToRun,
			forced,
		)
		syncConnectionStatusesInBackground()
		return wrapData(
			mapRowsToQueryResult(rows, query, startedAt, {
				isLimited: wasCapped && rows.length >= MAX_SELECT_STAR_ROWS,
			}),
		)
	},

	async runQuery(
		connectionId: string,
		database: string | null,
		query: string,
		forced: boolean = false,
	) {
		return this.executeQuery(connectionId, database, query, forced)
	},

	update(
		connectionId: string,
		payload: {
			connectionName: string
			config: ConnectionConfigPayload
			overrides: Record<string, string>
		},
	) {
		return invoke<void>('update_connection', {
			connectionId,
			connectionName: payload.connectionName,
			config: payload.config,
			overrides: payload.overrides,
		})
			.then(() => ({ error: null }))
			.catch((error: unknown) => ({
				error: {
					message: formatErrorMessage(
						error,
						'Failed to update data source.',
					),
				},
			}))
	},

	async getTablePreview(
		connectionId: string,
		database: string,
		table: string,
		page: number = 1,
		limit: number = 200,
	) {
		const preview = await invoke<{
			rows: Record<string, unknown>[]
			durationMs: number
			isLimited: boolean
			affectedRows: number | null
			command: string | null
			sizeBytes: number
		}>('get_table_preview', {
			id: connectionId,
			database,
			table,
			page,
			limit,
		})
		syncConnectionStatusesInBackground()

		return wrapData(preview)
	},

	async getTableRelationships(
		_connectionId: string,
		_database: string,
		_table: string,
	) {
		return wrapData([] as IRelationship[])
	},

	async getTableSchema(connectionId: string, database: string) {
		const schema = await invoke<Record<string, IColumn[]>>(
			'get_table_schema',
			{
				id: connectionId,
				database,
			},
		)
		syncConnectionStatusesInBackground()

		return wrapData(schema)
	},

	async queryPlan(
		connectionId: string,
		query: string,
		database: string | null,
	) {
		if (!query.trim() || !isExplainableQuery(query)) {
			return wrapData(null)
		}

		const explainQuery = `EXPLAIN ${trimTrailingSemicolons(query.trim())}`
		const rows = await invokeQueryRows(connectionId, database, explainQuery)
		syncConnectionStatusesInBackground()

		return wrapData(rows)
	},
}
