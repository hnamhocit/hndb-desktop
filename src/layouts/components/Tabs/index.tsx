'use client'

import { useNavigate } from 'react-router'

import { ITab } from '@/interfaces'
import { useDataSourcesStore, useTabsStore } from '@/stores'
import Tab from './Tab'

const Tabs = () => {
	const navigate = useNavigate()
	const { tabs, setTabs, setActiveTabId, commitContent } = useTabsStore()
	const { dataSourceId, database, table } = useDataSourcesStore()

	const handleNewQueryTab = () => {
		const id = Date.now().toString()
		const newTab: ITab = {
			id,
			title: `Query ${tabs.length + 1}`,
			type: 'query',
			dataSourceId,
			database,
			table,
		}
		commitContent(id, '\n\n\n\n\n\n\n\n\n\n\n')

		setTabs([...tabs, newTab])
		setActiveTabId(id)
		navigate('/')
	}

	return (
		<div className='h-12 border-b flex items-end overflow-x-scroll'>
			<div
				className='shrink-0 h-full cursor-pointer relative min-w-1/10 hover:bg-primary hover:text-primary-foreground transition-colors duration-300 select-none flex items-center justify-center border-r px-4 sm:px-0'
				onClick={handleNewQueryTab}>
				<div className='font-medium font-mono'>New</div>
			</div>

			{tabs.map((tab, index) => (
				<Tab
					key={tab.id}
					tab={tab}
					index={index}
				/>
			))}
		</div>
	)
}

export default Tabs
