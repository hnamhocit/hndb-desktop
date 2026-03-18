'use client'

import { DatabaseIcon, SearchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { Input } from '@/components/ui/input'
import { useActiveTab } from '@/hooks'
import {
	useActiveStore,
	useConnectionStore,
	useTabsStore,
} from '@/stores'

const DataSourceSearch = () => {
	const navigate = useNavigate()
	const activeTab = useActiveTab()

	const { updateTab } = useTabsStore()
	const { connections } = useConnectionStore()
	const { setConnectionId, setDatabase, setTable } = useActiveStore()

	const [query, setQuery] = useState('')
	const [isOpen, setIsOpen] = useState(false)

	const filteredDataSources = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase()
		const list =
			normalizedQuery ?
				connections.filter((ds) =>
					(ds.name || ds.config.driver)
						.toLowerCase()
						.includes(normalizedQuery),
				)
			:	connections

		return list.slice(0, 8)
	}, [connections, query])

	const handleSelectDataSource = (id: string, label: string) => {
		setQuery(label)
		setIsOpen(false)

		setConnectionId(id)
		setDatabase(null)
		setTable(null)

		if (activeTab) {
			updateTab(activeTab.id, {
				workspaceId: id,
				connectionId: id,
				dataSourceId: id,
				database: null,
				table: null,
			})
		}

		navigate('/')
	}

	return (
		<div className='relative hidden md:block w-72'>
			<SearchIcon
				size={14}
				className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
			/>
			<Input
				type='text'
				placeholder='Search data sources...'
				value={query}
				onFocus={() => setIsOpen(true)}
				onBlur={() => setTimeout(() => setIsOpen(false), 120)}
				onChange={(e) => setQuery(e.target.value)}
				className='pl-8'
			/>

			{isOpen && (
				<div className='absolute z-40 mt-2 w-full rounded-md border bg-popover shadow-md'>
					{filteredDataSources.length > 0 ?
						<ul className='max-h-72 overflow-y-auto p-1'>
							{filteredDataSources.map((ds) => {
								const label = ds.name || ds.config.driver
								return (
									<li key={ds.id}>
										<button
											type='button'
											className='w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center justify-between gap-2'
											onMouseDown={(e) => {
												e.preventDefault()
												handleSelectDataSource(
													ds.id,
													label,
												)
											}}>
											<span className='truncate'>
												{label}
											</span>
											<span className='inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0'>
												<DatabaseIcon size={12} />
												{ds.config.driver}
											</span>
										</button>
									</li>
								)
							})}
						</ul>
					:	<div className='px-3 py-4 text-sm text-muted-foreground'>
							No data source found.
						</div>}
				</div>
			)}
		</div>
	)
}

export default DataSourceSearch
