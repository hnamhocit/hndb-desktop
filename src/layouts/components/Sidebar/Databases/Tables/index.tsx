import clsx from 'clsx'
import { CornerDownLeftIcon, Table2Icon } from 'lucide-react'
import { useNavigate } from 'react-router'

// Xoá import AccordionContent ở đây đi
import { useSchema } from '@/hooks'
import { ITab } from '@/interfaces'
import { useDataSourcesStore, useTabsStore } from '@/stores'

interface TablesProps {
	dataSourceId: string
	database: string
}

const Tables = ({ dataSourceId, database }: TablesProps) => {
	const navigate = useNavigate()
	const {
		setTable,
		table: activeTable,
		database: activeDatabase,
	} = useDataSourcesStore()
	const { tabs, setTabs, setActiveTabId } = useTabsStore()

	const { schema, isLoading } = useSchema(dataSourceId, database)

	const tableList = Object.keys(schema || {})

	const handleTableClick = (e: React.MouseEvent, tableName: string) => {
		e.stopPropagation()

		const id = `${dataSourceId}-${database}-${tableName}`
		const newTab: ITab = {
			id,
			type: 'table',
			title: tableName,
			dataSourceId,
			database,
			table: tableName,
		}

		setActiveTabId(id)
		setTable(tableName)
		navigate('/')

		if (!tabs.find((tab) => tab.id === id)) {
			setTabs([...tabs, newTab])
		}
	}

	if (isLoading) {
		return (
			<div className='text-center text-gray-500 py-3 font-mono'>
				Loading tables...
			</div>
		)
	}

	if (tableList.length === 0) {
		return (
			<div className='text-center text-gray-500 py-3 font-mono'>
				No tables found.
			</div>
		)
	}

	// Đổi AccordionContent thành div hoặc Fragment
	return (
		<div className='flex flex-col'>
			{tableList.map((tableName) => {
				const isActive =
					activeTable === tableName && activeDatabase === database

				return (
					<div
						key={tableName}
						onClick={(e) => handleTableClick(e, tableName)}
						className={clsx(
							'relative select-none flex items-center justify-between gap-4 py-2 px-4 transition-all duration-200 cursor-pointer font-mono',
							isActive ?
								'text-primary bg-linear-to-r from-primary/10 to-transparent font-medium before:absolute before:left-0 before:top-0 before:h-full before:w-0.75 before:bg-primary before:rounded-r-full'
							:	'text-gray-500 hover:text-primary hover:bg-gray-50/50 dark:hover:bg-gray-800/30',
						)}>
						<div className='flex items-center gap-3'>
							<Table2Icon size={16} />
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
