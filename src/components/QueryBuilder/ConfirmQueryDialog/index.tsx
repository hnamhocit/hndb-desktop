import { AlertTriangleIcon } from 'lucide-react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useI18n } from '@/hooks'

interface ConfirmQueryDialogProps {
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	onRunQuery: (force: boolean) => void
}

const ConfirmQueryDialog = ({
	isOpen,
	onOpenChange,
	onRunQuery,
}: ConfirmQueryDialogProps) => {
	const { t } = useI18n()

	return (
		<AlertDialog
			open={isOpen}
			onOpenChange={onOpenChange}>
			<AlertDialogContent className='border-red-500/20'>
				<AlertDialogHeader>
					<AlertDialogTitle className='flex items-center gap-2 text-red-600 dark:text-red-500'>
						<AlertTriangleIcon size={20} />
						{t('query.confirmDanger.title')}
					</AlertDialogTitle>

					<AlertDialogDescription className='text-neutral-600 dark:text-neutral-300'>
						{t('query.confirmDanger.description')}
					</AlertDialogDescription>

					<div className='mt-2 p-3 bg-red-50 dark:bg-red-950/30 rounded border border-red-100 dark:border-red-900 font-mono text-sm text-red-800 dark:text-red-400 font-semibold'>
						{t('query.confirmDanger.detail')}
					</div>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => onRunQuery(true)}
						className='bg-red-600 hover:bg-red-700 text-white'>
						{t('query.confirmDanger.executeAnyway')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export default ConfirmQueryDialog
