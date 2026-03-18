'use client'

import { useNavigate } from 'react-router'

import { ITab } from '@/interfaces'
import { useActiveStore, useTabsStore } from '@/stores'
import { PlusIcon } from 'lucide-react'
import Tab from './Tab'

const Tabs = () => {
	const navigate = useNavigate()
	const { tabs, setTabs, commitContent } = useTabsStore()
	const { setActiveTabId, connectionId, database, table } = useActiveStore()

	const handleNewQueryTab = () => {
		const id = Date.now().toString()
		const newTab: ITab = {
			id,
			title: `Query ${tabs.length + 1}`,
			type: 'query',
			workspaceId: connectionId,
			connectionId,
			dataSourceId: connectionId,
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
			{tabs.map((tab, index) => (
				<Tab
					key={tab.id}
					tab={tab}
					index={index}
				/>
			))}
			<div
				className='shrink-0 h-full cursor-pointer relative min-w-12 hover:bg-primary hover:text-primary-foreground transition-colors duration-300 select-none flex items-center justify-center border-r px-4 sm:px-0'
				onClick={handleNewQueryTab}>
				<PlusIcon />
			</div>
		</div>
	)
}

export default Tabs
