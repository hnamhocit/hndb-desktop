import clsx from 'clsx'
import { DatabaseIcon, DatabaseZapIcon } from 'lucide-react'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { useDatabases } from '@/hooks'
import { useActiveTab } from '@/hooks'
import { useActiveStore, useConnectionStore, useTabsStore } from '@/stores'
import DatabaseContextMenu from '../DatabaseContextMenu'
import Tables from './Tables'

interface DatabasesProps {
	dataSourceId: string
	autoFetch?: boolean
}

const Databases = ({ dataSourceId, autoFetch = true }: DatabasesProps) => {
	const { databases, isLoading, errorMessage } = useDatabases(dataSourceId, {
		autoFetch,
	})
	const connectionStatus = useConnectionStore(
		(state) => state.statuses[dataSourceId],
	)
	const activeTab = useActiveTab()
	const { updateTab } = useTabsStore()
	const { database, setDatabase, setTable } = useActiveStore()

	const handleSelectDatabase = (db: string) => {
		setDatabase(db)
		setTable(null)

		if (activeTab?.type === 'query') {
			updateTab(activeTab.id, {
				workspaceId: dataSourceId,
				connectionId: dataSourceId,
				dataSourceId,
				database: db,
				table: null,
			})
		}
	}

	if (isLoading) {
		return (
			<div className='px-4 py-6 text-center text-sm text-muted-foreground'>
				Loading databases...
			</div>
		)
	}

	if (connectionStatus === false) {
		return (
			<div className='px-4 py-6 text-center text-sm text-muted-foreground'>
				Connection is disconnected. Connect again to load databases.
			</div>
		)
	}

	if (errorMessage && databases.length === 0) {
		return (
			<div className='px-4 py-6 text-center text-sm text-destructive'>
				{errorMessage}
			</div>
		)
	}

	if (databases.length === 0) {
		return (
			<div className='px-4 py-6 text-center text-sm text-muted-foreground'>
				No databases found.
			</div>
		)
	}

	return (
		<Accordion
			type='single'
			collapsible
			className='space-y-2 px-3 py-3'>
			{databases.map((db) => (
				<AccordionItem
					value={db}
					key={db}
					className='overflow-hidden rounded-lg border border-border/70 bg-background'>
					<DatabaseContextMenu
						dataSourceId={dataSourceId}
						database={db}>
						<AccordionTrigger
							onClick={() => handleSelectDatabase(db)}
							className={clsx(
								'px-4 py-3 hover:no-underline',
								database === db && 'bg-primary/5 text-primary',
							)}>
							<div
								className={clsx(
									'min-w-0 flex items-center gap-3 font-mono text-sm',
									database === db ? 'text-primary' : (
										'text-foreground/80'
									),
								)}>
								{database === db ?
									<DatabaseZapIcon
										size={16}
										className='shrink-0'
									/>
								:	<DatabaseIcon
										size={16}
										className='shrink-0 text-muted-foreground'
									/>
								}
								<span className='truncate'>{db}</span>
							</div>
						</AccordionTrigger>
					</DatabaseContextMenu>

					<AccordionContent className='px-3 pb-3 pt-1'>
						<Tables
							database={db}
							dataSourceId={dataSourceId}
						/>
					</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	)
}

export default Databases
