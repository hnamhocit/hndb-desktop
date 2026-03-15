import clsx from 'clsx'
import { BoxesIcon, GroupIcon, TableIcon } from 'lucide-react'
import { useState } from 'react'

import Data from './Data'
import ERDiagram from './ERDiagram'
import Structure from './Structure'

const tabs = [
	{
		id: 'data',
		title: 'Data',
		icon: <BoxesIcon />,
	},
	{
		id: 'structure',
		title: 'Structure',
		icon: <TableIcon />,
	},
	{
		id: 'er-diagram',
		title: 'ER Diagram',
		icon: <GroupIcon />,
	},
]

const TableDetail = () => {
	const [currentTab, setCurrentTab] = useState('data')

	return (
		<div className='flex flex-col h-[calc(100vh-6rem)]'>
			<div className='flex items-center justify-between px-4 pt-4 border-b'>
				<div className='flex gap-4'>
					{tabs.map((tab) => (
						<div
							key={tab.id}
							className={clsx(
								'flex items-center gap-2 cursor-pointer border-b-2 transition-colors duration-300 pb-2 select-none',
								{
									'border-primary text-primary':
										currentTab === tab.id,
									'border-transparent hover:border-gray-300':
										currentTab !== tab.id,
								},
							)}
							onClick={() => setCurrentTab(tab.id)}>
							{tab.icon}
							<div className='font-medium'>{tab.title}</div>
						</div>
					))}
				</div>
			</div>

			{currentTab === 'data' ?
				<Data />
			: currentTab === 'structure' ?
				<Structure />
			:	<ERDiagram />}
		</div>
	)
}

export default TableDetail
