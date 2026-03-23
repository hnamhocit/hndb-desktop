'use client'

import { CheckCircle2Icon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import DatabaseTable from '@/components/DatabaseTable'
import { useActiveTab, useI18n, useSchema } from '@/hooks'
import { IQueryResult } from '@/interfaces'
import { connectionService } from '@/services'
import { useConnectionStore, useDataEditorStore } from '@/stores'
import {
	buildTablePath,
	buildColumnsFromRows,
	getTabConnectionId,
	notifyError,
	resolveSchemaColumns,
} from '@/utils'
import Actions from './Actions'
import QueryResultFooter from './QueryResultFooter'

const Data = () => {
	const { t } = useI18n()
	const [resultMeta, setResultMeta] = useState<IQueryResult | null>(null)
	const [rows, setRows] = useState<Record<string, unknown>[]>([])
	const [isInitialLoading, setIsInitialLoading] = useState(false)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [hasLoadedInitialPage, setHasLoadedInitialPage] = useState(false)
	const [page, setPage] = useState(1)
	const [limit] = useState(200)
	const [hasMore, setHasMore] = useState(true)

	const rowsRef = useRef<Record<string, unknown>[]>([])
	const loadCycleRef = useRef(0)

	const activeTab = useActiveTab()
	const { initializeTable, discardTableChanges } = useDataEditorStore()

	const connectionId = getTabConnectionId(activeTab) ?? ''
	const connectionStatus = useConnectionStore(
		(state) => state.statuses[connectionId],
	)
	const database = activeTab?.database ?? ''
	const table = activeTab?.table ?? ''
	const isDisconnected = connectionStatus === false

	const canLoad = !!connectionId && !!database && !!table && !isDisconnected

	const { schema, isLoading: isSchemaLoading } = useSchema(connectionId, database)

	const columns = useMemo(() => {
		if (!table) return []
		const resolvedColumns = resolveSchemaColumns(schema, table)

		if (resolvedColumns.length > 0) {
			return resolvedColumns
		}

		return buildColumnsFromRows(rows)
	}, [rows, schema, table])

	const primaryColumnName =
		columns.find((col) => col.is_primary)?.column_name ||
		(columns.some((col) => col.column_name === 'id') ? 'id' : (
			columns[0]?.column_name || '__rowIndex'
		))

	const tablePath = buildTablePath(connectionId, database, table)

	const syncRows = useCallback((nextRows: Record<string, unknown>[]) => {
		rowsRef.current = nextRows
		setRows(nextRows)
	}, [])

	const fetchPage = useCallback(
		async (
			nextPage: number,
			mode: 'replace' | 'append',
			cycleId: number,
		) => {
			if (!connectionId || !database || !table) return

			if (mode === 'replace') {
				setIsInitialLoading(true)
			} else {
				setIsLoadingMore(true)
			}

			try {
				const { data } = await connectionService.getTablePreview(
					connectionId,
					database,
					table,
					nextPage,
					limit,
				)

				const nextRows = data.data.rows || []
				const mergedRows =
					mode === 'replace' ? nextRows : (
						[...rowsRef.current, ...nextRows]
					)

				if (cycleId !== loadCycleRef.current) {
					return
				}

				rowsRef.current = mergedRows
				setResultMeta(data.data)
				setHasMore(nextRows.length === limit)
				setRows(mergedRows)

				if (tablePath) {
					discardTableChanges(tablePath)
					initializeTable(tablePath, mergedRows)
				}
			} catch (error) {
				notifyError(error, t('errors.failedFetchTablePreview'))
			} finally {
				if (cycleId !== loadCycleRef.current) {
					return
				}

				if (mode === 'replace') {
					setIsInitialLoading(false)
					setHasLoadedInitialPage(true)
				} else {
					setIsLoadingMore(false)
				}
			}
		},
		[
			connectionId,
			database,
			table,
			tablePath,
			limit,
			discardTableChanges,
			initializeTable,
		],
	)

	useEffect(() => {
		if (!isDisconnected) return

		loadCycleRef.current += 1
		setPage(1)
		syncRows([])
		setResultMeta(null)
		setHasMore(true)
		setHasLoadedInitialPage(false)
		setIsInitialLoading(false)
		setIsLoadingMore(false)
	}, [isDisconnected, syncRows])

	useEffect(() => {
		if (!canLoad) return

		setPage(1)
		syncRows([])
		setResultMeta(null)
		setHasMore(true)
		setHasLoadedInitialPage(false)

		loadCycleRef.current += 1
		const cycleId = loadCycleRef.current

		void fetchPage(1, 'replace', cycleId)
	}, [canLoad, connectionId, database, table, fetchPage, syncRows])

	const refreshData = useCallback(async () => {
		setPage(1)
		syncRows([])
		setResultMeta(null)
		setHasMore(true)
		setHasLoadedInitialPage(false)

		loadCycleRef.current += 1
		const cycleId = loadCycleRef.current

		await fetchPage(1, 'replace', cycleId)
	}, [fetchPage, syncRows])

	const handleLoadMore = useCallback(async () => {
		if (
			isLoadingMore ||
			isInitialLoading ||
			!hasMore ||
			rowsRef.current.length === 0
		) {
			return
		}

		const nextPage = page + 1
		setPage(nextPage)
		await fetchPage(nextPage, 'append', loadCycleRef.current)
	}, [page, hasMore, isLoadingMore, isInitialLoading, fetchPage])

	if (!connectionId || !database || !table) return null

	if (isDisconnected) {
		return (
			<div className='flex h-64 items-center justify-center px-6 text-center text-sm text-muted-foreground'>
				{t('table.states.disconnected')}
			</div>
		)
	}

	return (
		<>
			<Actions
				columns={columns}
				refreshData={refreshData}
				primaryColumnName={primaryColumnName}
			/>

			{(!hasLoadedInitialPage ||
				isInitialLoading ||
				(isSchemaLoading && columns.length === 0)) ?
				<div className='w-full h-64 flex items-center justify-center gap-2 text-primary'>
					<CheckCircle2Icon
						size={18}
						className='animate-spin'
					/>
					<span>
						{isSchemaLoading && columns.length === 0 ?
							t('table.states.loadingSchema')
						:	t('table.states.loadingData')}
					</span>
				</div>
			:	<DatabaseTable
					columns={columns}
					initialData={rows}
					primaryColumnName={primaryColumnName}
					isLoadingMore={isLoadingMore}
					hasMore={hasMore}
					onLoadMore={handleLoadMore}
				/>
			}

			{resultMeta && !isInitialLoading && (
				<QueryResultFooter
					result={{
						...resultMeta,
						rows,
					}}
				/>
			)}
		</>
	)
}

export default Data
