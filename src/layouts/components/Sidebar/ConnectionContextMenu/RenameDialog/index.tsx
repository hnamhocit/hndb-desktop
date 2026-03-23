import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useI18n } from '@/hooks'
import { connectionService } from '@/services'
import { useConnectionStore, useContextMenuStore } from '@/stores'
import { notifyError } from '@/utils'

interface RenameDialogProps {
	id: string
	currentName: string
}

const RenameDialog = ({ id, currentName }: RenameDialogProps) => {
	const [renameInput, setRenameInput] = useState(currentName)
	const { t } = useI18n()

	const { target, isSubmitting, setIsSubmitting, actionType, closeAction } =
		useContextMenuStore()

	const { connections, setConnections } = useConnectionStore()

	useEffect(() => {
		if (target?.dataSourceId === id) {
			setRenameInput(currentName)
		}
	}, [target, currentName, id])

	const isOpen =
		target?.dataSourceId === id &&
		actionType === 'rename' &&
		target.database === null

	const handleRename = async () => {
		if (!renameInput.trim()) return

		setIsSubmitting(true)
		try {
			await connectionService.rename(id, renameInput.trim())

			toast.success(t('connection.toast.renamed'))

			setConnections(
				connections.map((ds) =>
					ds.id === id ? { ...ds, name: renameInput.trim() } : ds,
				),
			)
		} catch (error) {
			notifyError(error, t('errors.failedRenameDataSource'))
		} finally {
			setIsSubmitting(false)
			closeAction()
		}
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={closeAction}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('connection.dialog.renameDataSource.title')}</DialogTitle>
				</DialogHeader>

				<div className='py-4'>
					<Input
						value={renameInput}
						onChange={(e) => setRenameInput(e.target.value)}
						placeholder={t('connection.dialog.renameDataSource.placeholder')}
						autoFocus
					/>
				</div>

				<DialogFooter>
					<Button
						variant='outline'
						onClick={closeAction}
						disabled={isSubmitting}>
						{t('common.cancel')}
					</Button>

					<Button
						onClick={handleRename}
						disabled={
							isSubmitting ||
							!renameInput.trim() ||
							renameInput.trim() === currentName
						}>
						{isSubmitting ?
							t('connection.dialog.renameDataSource.saving')
						:	t('common.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default RenameDialog
