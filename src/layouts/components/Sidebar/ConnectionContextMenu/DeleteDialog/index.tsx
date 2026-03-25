import { toast } from 'sonner'

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks'
import { connectionService } from '@/services'
import {
	useActiveStore,
	useConnectionStore,
	useContextMenuStore,
	useDataEditorStore,
	useMetadataStore,
	useTabsStore,
} from '@/stores'
import { notifyError } from '@/utils'

interface DeleteDialogProps {
	id: string
}

const DeleteDialog = ({ id }: DeleteDialogProps) => {
	const { t } = useI18n()
	const { target, setIsSubmitting, isSubmitting, actionType, closeAction } =
		useContextMenuStore()
	const { connections, setConnections, clearStatus } = useConnectionStore()
	const clearConnectionMetadata = useMetadataStore(
		(state) => state.clearConnectionMetadata,
	)
	const clearConnectionTables = useDataEditorStore(
		(state) => state.clearConnectionTables,
	)
	const removeTabsByConnection = useTabsStore(
		(state) => state.removeTabsByConnection,
	)

	const isOpen =
		target?.dataSourceId === id &&
		actionType === 'delete' &&
		target.database === null

	const handleDelete = async () => {
		setIsSubmitting(true)

		try {
			await connectionService.delete(id)

			const nextConnections = connections.filter((ds) => ds.id !== id)
			removeTabsByConnection(id)
			clearConnectionMetadata(id)
			clearConnectionTables(id)
			setConnections(nextConnections)
			clearStatus(id)

			const activeState = useActiveStore.getState()
			if (activeState.connectionId === id) {
				useActiveStore.setState({
					connectionId:
						nextConnections[nextConnections.length - 1]?.id ?? null,
					database: null,
					table: null,
				})
			}

			toast.success(t('connection.toast.deleted'))
		} catch (error) {
			notifyError(error, t('errors.failedDeleteDataSource'))
		} finally {
			setIsSubmitting(false)
			closeAction()
		}
	}

	return (
		<AlertDialog
			open={isOpen}
			onOpenChange={closeAction}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t('connection.dialog.deleteDataSource.confirmTitle')}
					</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogFooter>
					{/* Thêm nút Cancel để UX tốt hơn */}
					<AlertDialogCancel disabled={isSubmitting}>
						{t('common.cancel')}
					</AlertDialogCancel>
					<Button
						variant='destructive'
						onClick={handleDelete}
						disabled={isSubmitting}>
						{isSubmitting ?
							t('connection.dialog.deleteDataSource.deleting')
						:	t('common.delete')}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default DeleteDialog
