import {
	EvChargerIcon,
	PencilIcon,
	PenIcon,
	PlusIcon,
	RotateCcwIcon,
	Trash2Icon,
	UnplugIcon,
} from 'lucide-react'
import { ReactNode } from 'react'

import DataSourceDialog from '@/components/DataSourceDialog'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useDatabases } from '@/hooks'
import { IDataSource } from '@/interfaces'
import { dataSourcesService } from '@/services'
import { useContextMenuStore } from '@/stores'
import CreateDatabaseDialog from './CreateDatabaseDialog'
import DeleteDialog from './DeleteDialog'
import RenameDialog from './RenameDialog' // Import thêm RenameDialog

interface DriverContextMenuProps {
	ds: IDataSource
	children: ReactNode
}

const DriverContextMenu = ({ ds, children }: DriverContextMenuProps) => {
	const { reload } = useDatabases(ds.id, { autoFetch: false })

	const { isSubmitting, target, openAction, closeAction, actionType } =
		useContextMenuStore()
	const isOpen =
		target?.dataSourceId === ds.id &&
		actionType === 'edit' &&
		target.database === null

	const handleOpen = (type: string) => {
		openAction(
			{
				dataSourceId: ds.id,
				database: null,
			},
			type,
		)
	}

	return (
		<>
			<ContextMenu>
				<ContextMenuTrigger>{children}</ContextMenuTrigger>

				<ContextMenuContent>
					<ContextMenuGroup>
						<ContextMenuItem
							onSelect={() =>
								openAction(
									{
										dataSourceId: ds.id,
										database: null,
									},
									'create-database',
								)
							}>
							<PlusIcon className='mr-2 h-4 w-4' />
							Create database
						</ContextMenuItem>

						<ContextMenuItem onSelect={() => handleOpen('edit')}>
							<PenIcon className='mr-2 h-4 w-4' />
							Edit connection
						</ContextMenuItem>
					</ContextMenuGroup>

					<ContextMenuSeparator />

					<ContextMenuGroup>
						<ContextMenuItem
							onClick={() => dataSourcesService.reconnect(ds.id)}>
							<EvChargerIcon className='mr-2 h-4 w-4' />
							Invalidate/Reconnect
						</ContextMenuItem>

						<ContextMenuItem
							onClick={() =>
								dataSourcesService.disconnect(ds.id)
							}>
							<UnplugIcon className='mr-2 h-4 w-4' />
							Disconnect
						</ContextMenuItem>
					</ContextMenuGroup>

					<ContextMenuSeparator />

					<ContextMenuGroup>
						<ContextMenuItem
							disabled={isSubmitting}
							variant='destructive'
							onSelect={() => handleOpen('delete')}>
							<Trash2Icon className='mr-2 h-4 w-4' />
							Delete
						</ContextMenuItem>

						<ContextMenuItem
							disabled={isSubmitting}
							onSelect={() => handleOpen('rename')}>
							<PencilIcon className='mr-2 h-4 w-4' />
							Rename
						</ContextMenuItem>
					</ContextMenuGroup>

					<ContextMenuSeparator />

					<ContextMenuGroup>
						<ContextMenuItem onClick={reload}>
							<RotateCcwIcon className='mr-2 h-4 w-4' />
							Refresh
						</ContextMenuItem>
					</ContextMenuGroup>
				</ContextMenuContent>
			</ContextMenu>

			{/* Render 2 Modal ở đây */}
			<DeleteDialog id={ds.id} />
			<RenameDialog
				id={ds.id}
				currentName={ds.name || ds.type}
			/>
			<DataSourceDialog
				dataSourceId={ds.id}
				open={isOpen}
				onOpenChange={closeAction}
			/>
			<CreateDatabaseDialog dataSourceId={ds.id} />
		</>
	)
}

export default DriverContextMenu
