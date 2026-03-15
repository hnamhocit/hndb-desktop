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
import { dataSourcesService } from '@/services'
import { useContextMenuStore, useDataSourcesStore } from '@/stores'
import { notifyError } from '@/utils'

interface DeleteDialogProps {
	id: string
}

const DeleteDialog = ({ id }: DeleteDialogProps) => {
	const { target, setIsSubmitting, isSubmitting, actionType, closeAction } =
		useContextMenuStore()
	const { setDatasources, datasources } = useDataSourcesStore()

	const isOpen =
		target?.dataSourceId === id &&
		actionType === 'delete' &&
		target.database === null

	const handleDelete = async () => {
		setIsSubmitting(true)

		try {
			const { error } = await dataSourcesService.delete(id)

			if (error) {
				toast.error(error.message, { position: 'top-center' })
				return
			}

			toast.success('Deleted successfully')
			setDatasources(datasources.filter((ds) => ds.id !== id))
		} catch (error) {
			notifyError(error, 'Failed to delete data source.')
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
						Are you sure you want to delete this data source?
					</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogFooter>
					{/* Thêm nút Cancel để UX tốt hơn */}
					<AlertDialogCancel disabled={isSubmitting}>
						Cancel
					</AlertDialogCancel>
					<Button
						variant='destructive'
						onClick={handleDelete}
						disabled={isSubmitting}>
						{isSubmitting ? 'Deleting...' : 'Delete'}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default DeleteDialog
