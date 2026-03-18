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
import { connectionService } from '@/services'
import { useConnectionStore, useContextMenuStore } from '@/stores'
import { notifyError } from '@/utils'

interface RenameDialogProps {
	id: string
	currentName: string
}

const RenameDialog = ({ id, currentName }: RenameDialogProps) => {
	const [renameInput, setRenameInput] = useState(currentName)

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

			toast.success('Renamed successfully')

			setConnections(
				connections.map((ds) =>
					ds.id === id ? { ...ds, name: renameInput.trim() } : ds,
				),
			)
		} catch (error) {
			notifyError(error, 'Failed to rename data source.')
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
					<DialogTitle>Rename Data Source</DialogTitle>
				</DialogHeader>

				<div className='py-4'>
					<Input
						value={renameInput}
						onChange={(e) => setRenameInput(e.target.value)}
						placeholder='Enter new data source name'
						autoFocus
					/>
				</div>

				<DialogFooter>
					<Button
						variant='outline'
						onClick={closeAction}
						disabled={isSubmitting}>
						Cancel
					</Button>

					<Button
						onClick={handleRename}
						disabled={
							isSubmitting ||
							!renameInput.trim() ||
							renameInput.trim() === currentName
						}>
						{isSubmitting ? 'Saving...' : 'Save'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default RenameDialog
