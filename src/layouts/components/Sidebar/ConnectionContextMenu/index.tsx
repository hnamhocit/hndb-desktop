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
import { toast } from 'sonner'

import DataSourceDialog from '@/components/DataSourceDialog'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useDatabases, useI18n } from '@/hooks'
import { IConnection } from '@/interfaces'
import { connectionService } from '@/services'
import { useConnectionStore, useContextMenuStore, useMetadataStore } from '@/stores'
import { notifyError } from '@/utils'
import CreateDatabaseDialog from './CreateDatabaseDialog'
import DeleteDialog from './DeleteDialog'
import RenameDialog from './RenameDialog' // Import thêm RenameDialog

interface ConnectionContextMenuProps {
	ds: IConnection
	children: ReactNode
}

const ConnectionContextMenu = ({ ds, children }: ConnectionContextMenuProps) => {
	const { t } = useI18n()
	const { reload } = useDatabases(ds.id, { autoFetch: false })
	const { statuses, updateStatus } = useConnectionStore()
	const { clearConnectionMetadata } = useMetadataStore()

	const {
		isSubmitting,
		setIsSubmitting,
		target,
		openAction,
		closeAction,
		actionType,
	} = useContextMenuStore()
	const isConnected = statuses[ds.id] ?? false
	const isOpen =
		target?.dataSourceId === ds.id &&
		actionType === 'edit' &&
		target?.database === null

	const handleConnectOrReconnect = async () => {
		setIsSubmitting(true)

		try {
			if (isConnected) {
				updateStatus(ds.id, false)
				await connectionService.reconnect(ds.id)
			} else {
				await connectionService.connect(ds.id)
			}

				updateStatus(ds.id, true)
				toast.success(
					isConnected ?
						t('connection.toast.reconnected')
					:	t('connection.toast.connected'),
					{ position: 'top-center' },
				)

			try {
				await reload()
			} catch {
				// useDatabases already surfaces its own error toast on reload failure.
			}
		} catch (error) {
			updateStatus(ds.id, false)
				notifyError(
					error,
					isConnected ?
						t('errors.failedReconnectDataSource')
					:	t('errors.failedConnectDataSource'),
				)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleDisconnect = async () => {
		setIsSubmitting(true)

		try {
			updateStatus(ds.id, false)
			await connectionService.disconnect(ds.id)
			clearConnectionMetadata(ds.id)
				toast.success(t('connection.toast.closed'), {
					position: 'top-center',
				})
			} catch (error) {
				updateStatus(ds.id, true)
				notifyError(error, t('errors.failedDisconnectDataSource'))
			} finally {
				setIsSubmitting(false)
			}
	}

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
								{t('connection.menu.createDatabase')}
							</ContextMenuItem>

							<ContextMenuItem onSelect={() => handleOpen('edit')}>
								<PenIcon className='mr-2 h-4 w-4' />
								{t('connection.menu.editConnection')}
							</ContextMenuItem>
					</ContextMenuGroup>

					<ContextMenuSeparator />

					<ContextMenuGroup>
							<ContextMenuItem
								disabled={isSubmitting}
								onSelect={handleConnectOrReconnect}>
								<EvChargerIcon className='mr-2 h-4 w-4' />
								{isConnected ?
									t('connection.menu.invalidateReconnect')
								:	t('connection.menu.connect')}
							</ContextMenuItem>

							<ContextMenuItem
								disabled={!isConnected || isSubmitting}
								onSelect={handleDisconnect}>
								<UnplugIcon className='mr-2 h-4 w-4' />
								{t('connection.menu.disconnect')}
							</ContextMenuItem>
					</ContextMenuGroup>

					<ContextMenuSeparator />

					<ContextMenuGroup>
							<ContextMenuItem
								disabled={isSubmitting}
								variant='destructive'
								onSelect={() => handleOpen('delete')}>
								<Trash2Icon className='mr-2 h-4 w-4' />
								{t('connection.menu.delete')}
							</ContextMenuItem>

							<ContextMenuItem
								disabled={isSubmitting}
								onSelect={() => handleOpen('rename')}>
								<PencilIcon className='mr-2 h-4 w-4' />
								{t('connection.menu.rename')}
							</ContextMenuItem>
					</ContextMenuGroup>

					<ContextMenuSeparator />

						<ContextMenuGroup>
							<ContextMenuItem onSelect={reload}>
								<RotateCcwIcon className='mr-2 h-4 w-4' />
								{t('connection.menu.refresh')}
							</ContextMenuItem>
						</ContextMenuGroup>
				</ContextMenuContent>
			</ContextMenu>

			{/* Render 2 Modal ở đây */}
			<DeleteDialog id={ds.id} />
			<RenameDialog
				id={ds.id}
				currentName={ds.name || ds.config.driver}
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

export default ConnectionContextMenu
