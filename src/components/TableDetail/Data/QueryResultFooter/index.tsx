import { CheckCircle2Icon, HardDriveIcon, KeyboardIcon } from 'lucide-react'
import { motion } from 'motion/react'

import { IQueryResult } from '@/interfaces'
import { formatDataSize } from '@/utils'

interface QueryResultFooterProps {
	result: IQueryResult
}

const fadeUp = {
	initial: { opacity: 0, y: 6 },
	animate: { opacity: 1, y: 0 },
}

const formatDuration = (durationMs?: number) => {
	if (!durationMs || durationMs <= 0) return '0ms'
	if (durationMs >= 1000) return `${(durationMs / 1000).toFixed(1)}s`
	if (durationMs >= 100) return `${Math.round(durationMs)}ms`
	return `${durationMs.toFixed(1)}ms`
}

const QueryResultFooter = ({ result }: QueryResultFooterProps) => {
	const affectedRows = result.affectedRows ?? result.rows?.length ?? 0
	const durationLabel = formatDuration(result.durationMs)

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
					<span className='font-semibold'>{affectedRows}</span>
					<span className='sm:hidden'>
						{' '}
						rows • <span className='font-semibold'>{durationLabel}</span>
					</span>
					<span className='hidden sm:inline'>
						{' '}
						rows affected in{' '}
						<span className='font-semibold'>{durationLabel}</span>
					</span>
				</div>
			</motion.div>

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
						Memory: {formatDataSize(result.sizeBytes || 0)}
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
					<span>UTF8</span>
				</motion.div>
			</motion.div>
		</motion.div>
	)
}

export default QueryResultFooter
