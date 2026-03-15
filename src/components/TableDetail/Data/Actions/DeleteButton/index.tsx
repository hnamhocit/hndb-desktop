import { Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'

interface DeleteButtonProps {
	keysLength: number
	onClick: () => void
	disabled: boolean
}

const DeleteButton = ({ onClick, disabled, keysLength }: DeleteButtonProps) => {
	const [isOpen, setIsOpen] = useState(false)

	const handleConfirm = async (e: React.MouseEvent) => {
		// Ngăn Dialog đóng lập tức nếu bạn muốn xử lý async xong mới đóng
		e.preventDefault()
		await onClick()
		setIsOpen(false)
	}

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						// Chỉ cho phép bấm khi có item được chọn và không đang xóa
						disabled={disabled || keysLength === 0}
						size='icon'
						variant='ghost'
						onClick={() => setIsOpen(true)}>
						<Trash2Icon
							className={keysLength > 0 ? 'text-red-500' : ''}
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>Delete {keysLength} selected rows</p>
				</TooltipContent>
			</Tooltip>

			<AlertDialog
				open={isOpen}
				onOpenChange={setIsOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you sure you want to delete?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. There will be{' '}
							<strong className='text-foreground'>
								{keysLength} row(s)
							</strong>{' '}
							deleted and permanently removed from the Database.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel disabled={disabled}>
							Cancel
						</AlertDialogCancel>

						{/* Dùng Button thường thay vì AlertDialogAction
                           để handle async/loading tốt hơn
                        */}
						<Button
							onClick={handleConfirm}
							disabled={disabled}
							className='bg-red-600 hover:bg-red-700 text-white'>
							{disabled ? 'Deleting...' : 'Confirm'}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

export default DeleteButton
