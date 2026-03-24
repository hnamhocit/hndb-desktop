// SqlContextSelector.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useActiveTab, useDatabases, useI18n } from '@/hooks'
import { connectionService } from '@/services'
import {
	useActiveStore,
	useConnectionStore,
	useTabsStore,
} from '@/stores'
import { notifyError } from '@/utils'
import { getTabConnectionId } from '@/utils'
import SelectChip from './SelectChip'

type Option = {
	label: string
	value: string
}

export default function SqlContextSelector() {
	const { t } = useI18n()
	const connections = useConnectionStore((state) => state.connections)
	const updateStatus = useConnectionStore((state) => state.updateStatus)
	const { updateTab } = useTabsStore()
	const { setConnectionId, setDatabase, setTable } = useActiveStore()
	const [connectingId, setConnectingId] = useState<string | null>(null)
	const connectingIdRef = useRef<string | null>(null)

	const activeTab = useActiveTab()
	const activeConnectionId = getTabConnectionId(activeTab) ?? ''
	const connectionStatus = useConnectionStore((state) =>
		activeConnectionId ? state.statuses[activeConnectionId] : undefined,
	)
	const hasActiveConnection = connections.some(
		(connection) => connection.id === activeConnectionId,
	)

	const { databases, isLoading: isDatabasesLoading } = useDatabases(
		activeConnectionId,
		{
			autoFetch: true,
			showAllOverride: true,
		},
	)
	const isAutoConnecting = connectingId === activeConnectionId

	const ensureConnected = useCallback(
		async (nextConnectionId: string) => {
			if (!nextConnectionId) return
			if (connectingIdRef.current === nextConnectionId) return

			const nextStatus =
				useConnectionStore.getState().statuses[nextConnectionId]
			if (nextStatus !== false) return

			connectingIdRef.current = nextConnectionId
			setConnectingId(nextConnectionId)

			try {
				await connectionService.connect(nextConnectionId)
				updateStatus(nextConnectionId, true)
			} catch (error) {
				updateStatus(nextConnectionId, false)
				notifyError(error, t('errors.failedConnectDataSource'))
			} finally {
				if (connectingIdRef.current === nextConnectionId) {
					connectingIdRef.current = null
				}

				setConnectingId((currentId) =>
					currentId === nextConnectionId ? null : currentId,
				)
			}
		},
		[t, updateStatus],
	)

	useEffect(() => {
		if (!activeConnectionId || !hasActiveConnection) return
		if (connectionStatus !== false) return

		void ensureConnected(activeConnectionId)
	}, [
		activeConnectionId,
		connectionStatus,
		ensureConnected,
		hasActiveConnection,
	])

	const databaseOptions = useMemo<Option[]>(() => {
		return databases.map((db) => ({
			label: db,
			value: db,
		}))
	}, [databases])

	const dataSourceOptions = useMemo<Option[]>(() => {
		return connections.map((ds) => ({
			label: ds.name || ds.config.driver,
			value: ds.id,
		}))
	}, [connections])

	if (!activeTab) return null

	const handleSelectDataSource = (value: string | null) => {
		if (!value) return

		setConnectionId(value)
		setDatabase(null)
		setTable(null)

		updateTab(activeTab.id, {
			workspaceId: value,
			connectionId: value,
			dataSourceId: value,
			database: null,
			table: null,
		})

		void ensureConnected(value)
	}

	const handleSelectDatabase = (value: string | null) => {
		setDatabase(value)
		setTable(null)

		updateTab(activeTab.id, {
			database: value,
			table: null,
		})
	}

	return (
		<div className='flex items-center gap-1 rounded-md border px-2 py-1 w-fit max-w-full overflow-x-auto whitespace-nowrap'>
			<SelectChip
				value={
					activeTab.connectionId ??
					activeTab.workspaceId ??
					activeTab.dataSourceId
				}
				placeholder={t('query.context.dataSources')}
				options={dataSourceOptions}
				onSelect={handleSelectDataSource}
			/>

			{activeConnectionId && (
				<>
					<span className='text-muted-foreground'>/</span>

					<SelectChip
						value={activeTab.database}
						placeholder={
							isDatabasesLoading || isAutoConnecting ?
								t('query.context.loading')
							:	t('query.context.database')
						}
						options={databaseOptions}
						onSelect={handleSelectDatabase}
						nullableLabel={t('query.context.unspecified')}
						disabled={
							isDatabasesLoading ||
							isAutoConnecting ||
							connectionStatus === false
						}
					/>
				</>
			)}
		</div>
	)
}
