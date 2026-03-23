'use client'

import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

import { useI18n } from '@/hooks'
import { ITab } from '@/interfaces'
import { useActiveStore, useTabsStore } from '@/stores'
import { PlusIcon } from 'lucide-react'
import Tab from './Tab'

const Tabs = () => {
	const navigate = useNavigate()
	const { t } = useI18n()
	const { tabs, setTabs, commitContent } = useTabsStore()
	const { setActiveTabId, connectionId, database, table } = useActiveStore()
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const handleWheel = (e: WheelEvent) => {
			if (e.deltaY !== 0) {
				e.preventDefault()
				container.scrollLeft += e.deltaY
			}
		}

		container.addEventListener('wheel', handleWheel, { passive: false })
		return () => container.removeEventListener('wheel', handleWheel)
	}, [])

	const handleNewQueryTab = () => {
		const id = Date.now().toString()
		const newTab: ITab = {
			id,
			title: t('tabs.newQueryTitle', {
				index: tabs.length + 1,
			}),
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
		<div
			ref={containerRef}
			className='h-10 xl:h-12 border-b flex items-end overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
		>
			{tabs.map((tab, index) => (
				<Tab
					key={tab.id}
					tab={tab}
					index={index}
				/>
			))}

			<div
				data-hotkey-new-query
				className='shrink-0 h-full cursor-pointer relative min-w-10 xl:min-w-12 hover:bg-primary hover:text-primary-foreground transition-colors duration-300 select-none flex items-center justify-center border-r px-3 sm:px-0'
				onClick={handleNewQueryTab}>
				<PlusIcon className='h-4 w-4 xl:h-5 xl:w-5' />
			</div>
		</div>
	)
}

export default Tabs
