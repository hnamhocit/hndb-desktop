import clsx from 'clsx'
import { CornerDownLeftIcon, Table2Icon } from 'lucide-react'
import { useNavigate } from 'react-router'

import { useActiveTab, useI18n, useTables } from '@/hooks'
import { ITab } from '@/interfaces'
import {
	useActiveStore,
	useTabsStore,
} from '@/stores'

interface TablesProps {
	dataSourceId: string
	database: string
}

const Tables = ({ dataSourceId, database }: TablesProps) => {
	const navigate = useNavigate()
	const { t } = useI18n()
	const activeTab = useActiveTab()
	const {
		setConnectionId,
		setDatabase,
		setTable,
		table: activeTable,
		database: activeDatabase,
		setActiveTabId,
	} = useActiveStore()
	const { tabs, setTabs, updateTab } = useTabsStore()

	const { tables, isLoading } = useTables(dataSourceId, database)

	const handleTableClick = (e: React.MouseEvent, tableName: string) => {
		e.stopPropagation()

		const id = `${dataSourceId}-${database}-${tableName}`
		const newTab: ITab = {
			id,
			type: 'table',
			title: tableName,
			workspaceId: dataSourceId,
			connectionId: dataSourceId,
			dataSourceId,
			database,
			table: tableName,
		}

		if (!tabs.find((tab) => tab.id === id)) {
			setTabs([...tabs, newTab])
		}

		setConnectionId(dataSourceId)
		setDatabase(database)
		setTable(tableName)

		if (activeTab?.type === 'query') {
			updateTab(activeTab.id, {
				workspaceId: dataSourceId,
				connectionId: dataSourceId,
				dataSourceId,
				database,
				table: tableName,
			})
		}

		setActiveTabId(id)
		navigate('/')
	}

	if (isLoading) {
		return (
			<div className='px-3 py-3 text-center font-mono text-xs text-muted-foreground'>
				{t('sidebar.loadingTables')}
			</div>
		)
	}

	if (tables.length === 0) {
		return (
			<div className='px-3 py-3 text-center font-mono text-xs text-muted-foreground'>
				{t('sidebar.noTablesFound')}
			</div>
		)
	}

	return (
		<div className='flex flex-col gap-1 pt-1'>
			{tables.map((tableName) => {
				const isActive =
					activeTable === tableName && activeDatabase === database

				return (
					<div
						key={tableName}
						onClick={(e) => handleTableClick(e, tableName)}
						className={clsx(
							'relative flex cursor-pointer select-none items-center justify-between gap-3 rounded-md px-3 py-2 transition-all duration-200 font-mono text-sm',
							isActive ?
								'bg-primary/8 font-medium text-primary'
							:	'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
						)}>
						<div className='flex items-center gap-3'>
							<Table2Icon
								size={15}
								className='shrink-0 opacity-80'
							/>
							<span className='truncate'>{tableName}</span>
						</div>

						{isActive && (
							<CornerDownLeftIcon
								size={14}
								className='text-primary/70 shrink-0'
							/>
						)}
					</div>
				)
			})}
		</div>
	)
}

export default Tables
