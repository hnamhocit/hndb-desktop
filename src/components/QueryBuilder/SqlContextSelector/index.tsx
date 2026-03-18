// SqlContextSelector.tsx
'use client'

import { useMemo } from 'react'

import { useActiveTab, useDatabases } from '@/hooks'
import {
	useActiveStore,
	useConnectionStore,
	useTabsStore,
} from '@/stores'
import { getTabConnectionId } from '@/utils'
import SelectChip from './SelectChip'

type Option = {
	label: string
	value: string
}

export default function SqlContextSelector() {
	const { connections } = useConnectionStore()
	const { updateTab } = useTabsStore()
	const { setConnectionId, setDatabase, setTable } = useActiveStore()

	const activeTab = useActiveTab()
	const activeConnectionId = getTabConnectionId(activeTab) ?? ''

	const { databases, isLoading: isDatabasesLoading } = useDatabases(
		activeConnectionId,
		{
			autoFetch: true,
			showAllOverride: true,
		},
	)

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
				placeholder='{data_sources}'
				options={dataSourceOptions}
				onSelect={handleSelectDataSource}
			/>

			{activeConnectionId && (
				<>
					<span className='text-muted-foreground'>/</span>

					<SelectChip
						value={activeTab.database}
						placeholder={
							isDatabasesLoading ? '{loading...}' : '{database}'
						}
						options={databaseOptions}
						onSelect={handleSelectDatabase}
						nullableLabel='Unspecified'
						disabled={isDatabasesLoading}
					/>
				</>
			)}
		</div>
	)
}
