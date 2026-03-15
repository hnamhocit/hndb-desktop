// SqlContextSelector.tsx
'use client'

import { useMemo } from 'react'

import { useActiveTab, useDatabases } from '@/hooks'
import { useDataSourcesStore, useTabsStore } from '@/stores'
import SelectChip from './SelectChip'

type Option = {
	label: string
	value: string
}

export default function SqlContextSelector() {
	const { datasources } = useDataSourcesStore()
	const { updateTab } = useTabsStore()

	const activeTab = useActiveTab()
	const activeDataSourceId = activeTab?.dataSourceId || ''

	const { databases, isLoading: isDatabasesLoading } = useDatabases(
		activeDataSourceId,
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
		return datasources.map((ds) => ({
			label: ds.name || ds.type,
			value: ds.id,
		}))
	}, [datasources])

	if (!activeTab) return null

	const handleSelectDataSource = (value: string | null) => {
		if (!value) return

		updateTab(activeTab.id, {
			dataSourceId: value,
			database: null,
			table: null,
		})
	}

	const handleSelectDatabase = (value: string | null) => {
		updateTab(activeTab.id, {
			database: value,
			table: null,
		})
	}

	return (
		<div className='flex items-center gap-1 rounded-md border px-2 py-1 w-fit max-w-full overflow-x-auto whitespace-nowrap'>
			<SelectChip
				value={activeTab.dataSourceId}
				placeholder='{data_sources}'
				options={dataSourceOptions}
				onSelect={handleSelectDataSource}
			/>

			{activeTab.dataSourceId && (
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
