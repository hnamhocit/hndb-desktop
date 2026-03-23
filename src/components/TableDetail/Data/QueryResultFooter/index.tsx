import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	HardDriveIcon,
	KeyboardIcon,
} from 'lucide-react'
import { motion } from 'motion/react'

import { useI18n } from '@/hooks'
import { IQueryResult } from '@/interfaces'
import { formatCompactCount, formatDataSize, formatDurationMs } from '@/utils'

interface QueryResultFooterProps {
	result: IQueryResult
}

const fadeUp = {
	initial: { opacity: 0, y: 6 },
	animate: { opacity: 1, y: 0 },
}

const QueryResultFooter = ({ result }: QueryResultFooterProps) => {
	const { t } = useI18n()
	const affectedRows = result.affectedRows ?? result.rows?.length ?? 0
	const durationLabel = formatDurationMs(result.durationMs)

	return (
		<motion.div
			className='shrink-0 px-3 py-2 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t bg-neutral-50 dark:bg-neutral-900'
			initial='initial'
			animate='animate'
			variants={{
				initial: {},
				animate: {
					transition: {
						staggerChildren: 0.06,
					},
				},
			}}>
			<motion.div
				className='flex items-center gap-2'
				variants={fadeUp}
				transition={{ duration: 0.2, ease: 'easeOut' }}>
				<motion.div
					initial={{ scale: 0.96, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.18, ease: 'easeOut' }}>
					<CheckCircle2Icon
						className='text-green-600'
						size={18}
					/>
				</motion.div>

				<div className='text-xs sm:text-sm text-neutral-600 dark:text-neutral-300'>
					<span className='font-semibold'>
						{formatCompactCount(affectedRows)}
					</span>
					<span className='sm:hidden'>
						{' '}
						{t('table.result.rows')} •{' '}
						<span className='font-semibold'>{durationLabel}</span>
					</span>
					<span className='hidden sm:inline'>
						{' '}
						{t('table.result.rowsAffectedIn')}{' '}
						<span className='font-semibold'>{durationLabel}</span>
					</span>
				</div>
			</motion.div>

			{result.isLimited && (
				<motion.div
					className='flex items-center gap-2 rounded border border-amber-300/80 bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-300'
					variants={fadeUp}
					transition={{ duration: 0.2, ease: 'easeOut' }}>
					<AlertTriangleIcon size={14} />
					<span>{t('table.result.resultLimited')}</span>
				</motion.div>
			)}

			<motion.div
				className='flex items-center gap-3 sm:gap-4'
				variants={fadeUp}
				transition={{ duration: 0.2, ease: 'easeOut', delay: 0.04 }}>
				<motion.div
					className='flex items-center gap-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300'
					whileHover={{ scale: 1.02 }}
					transition={{
						type: 'spring',
						stiffness: 300,
						damping: 22,
					}}>
					<HardDriveIcon size={16} />
					<span className='sm:hidden'>
						{formatDataSize(result.sizeBytes || 0)}
					</span>
					<span className='hidden sm:inline'>
						{t('table.result.memory', {
							size: formatDataSize(result.sizeBytes || 0),
						})}
					</span>
				</motion.div>

				<div className='w-px h-4 sm:h-8 bg-neutral-300 dark:bg-neutral-700' />

				<motion.div
					className='flex items-center gap-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300'
					whileHover={{ scale: 1.02 }}
					transition={{
						type: 'spring',
						stiffness: 300,
						damping: 22,
					}}>
					<KeyboardIcon size={16} />
					<span>{t('table.result.encodingUtf8')}</span>
				</motion.div>
			</motion.div>
		</motion.div>
	)
}

export default QueryResultFooter
