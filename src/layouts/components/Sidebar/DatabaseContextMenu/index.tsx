import { PencilIcon, RefreshCcwIcon, Trash2Icon } from 'lucide-react'
import { ReactNode } from 'react'

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { databaseService, dataSourcesService } from '@/services'
import { useContextMenuStore, useDataSourcesStore } from '@/stores'
import { notifyError, resolveQueryByDialect } from '@/utils'
import RenameDialog from './RenameDialog'

interface DatabaseContextMenuProps {
	children: ReactNode
	dataSourceId: string
	database: string
}

const DatabaseContextMenu = ({
	children,
	dataSourceId,
	database,
}: DatabaseContextMenuProps) => {
	const { cachedDatabases, setCachedDatabases, setCachedSchema } =
		useDataSourcesStore()

	const { isSubmitting, setIsSubmitting, openAction } = useContextMenuStore()

	const handleReloadSchema = async () => {
		try {
			const { data } = await databaseService.getTableSchema(
				dataSourceId,
				database,
			)

			setCachedSchema(`${dataSourceId}-${database}`, data.data ?? {})
		} catch (error) {
			notifyError(error, 'Failed to refresh schema.')
		}
	}

	const handleDropDatabase = async () => {
		setIsSubmitting(true)

		try {
			const sql = resolveQueryByDialect(dataSourceId, {
				postgresql: `DROP DATABASE "${database}";`,
				mysql: `DROP DATABASE \`${database}\`;`,
				'maria-db': `DROP DATABASE \`${database}\`;`,
				'sql-server': `DROP DATABASE [${database.replace(/]/g, ']]')}];`,
			})

			if (!sql) {
				throw new Error(
					'Drop database is not supported for this database type.',
				)
			}

			await dataSourcesService.runQuery(dataSourceId, database, sql, true)

			const currentDatabases = cachedDatabases[dataSourceId] ?? []
			setCachedDatabases(
				dataSourceId,
				currentDatabases.filter((db) => db !== database),
			)

			setCachedSchema(`${dataSourceId}-${database}`, {})
		} catch (error) {
			notifyError(error, 'Failed to drop database.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<ContextMenu>
				<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>

				<ContextMenuContent className='w-56'>
					<ContextMenuGroup>
						<ContextMenuItem
							onSelect={() =>
								openAction({ dataSourceId, database }, 'rename')
							}>
							<PencilIcon className='mr-2 h-4 w-4' />
							Rename
						</ContextMenuItem>

						<ContextMenuItem
							disabled={isSubmitting}
							variant='destructive'
							onSelect={handleDropDatabase}>
							<Trash2Icon className='mr-2 h-4 w-4' />
							Delete
						</ContextMenuItem>
					</ContextMenuGroup>

					<ContextMenuSeparator />

					<ContextMenuItem
						disabled={isSubmitting}
						onSelect={handleReloadSchema}>
						<RefreshCcwIcon className='mr-2 h-4 w-4' />
						Refresh
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>

			<RenameDialog
				dataSourceId={dataSourceId}
				database={database}
			/>
		</>
	)
}

export default DatabaseContextMenu
