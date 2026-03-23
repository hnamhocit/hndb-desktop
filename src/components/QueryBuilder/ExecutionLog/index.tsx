import { AlertTriangleIcon, CheckCircle2Icon, TerminalIcon } from 'lucide-react'

import { useI18n } from '@/hooks'
import { IQueryResult } from '@/interfaces'
import { formatCompactCount, formatDurationMs } from '@/utils'

interface ExecutionLogProps {
	result: IQueryResult
	query: string
}

const ExecutionLog = ({ result, query }: ExecutionLogProps) => {
	const { t } = useI18n()
	// Format thời gian hiện tại
	const now = new Date().toLocaleTimeString()

	return (
		<div className='w-full h-full overflow-auto bg-[#1e1e1e] text-neutral-300 font-mono text-sm p-4'>
			<div className='flex items-center gap-2 mb-4 text-neutral-500'>
				<TerminalIcon size={16} />
				<span>{t('query.log.consoleOutput')}</span>
			</div>

			{/* Block hiển thị câu query */}
			<div className='bg-black/30 p-3 rounded border border-neutral-800 mb-4'>
				<span className='text-blue-400 select-none'>&gt; </span>
				<span className='text-neutral-200 whitespace-pre-wrap'>
					{query || t('query.log.noQueryExecuted')}
				</span>
			</div>

			{/* Block trạng thái */}
			<div className='flex items-start gap-3 mt-4'>
				<CheckCircle2Icon
					className='text-green-500 mt-0.5'
					size={18}
				/>
				<div className='flex flex-col gap-1'>
					<span className='text-green-400 font-bold'>
						{t('query.log.executionSuccessful')}
					</span>

					<span className='text-neutral-400'>
						[{now}] {t('query.log.queryExecutedIn')}{' '}
						<span className='text-yellow-400'>
							{formatDurationMs(result.durationMs)}
						</span>
					</span>

					<span className='text-neutral-400'>
						{t('query.log.rowsAffectedReturned')}{' '}
						<span className='text-yellow-400'>
							{formatCompactCount(
								result.rows?.length || result.affectedRows || 0,
							)}
						</span>
					</span>

					{result.isLimited && (
						<span className='inline-flex items-center gap-1 text-amber-400'>
							<AlertTriangleIcon size={14} />
							{t('query.log.resultLimited')}
						</span>
					)}
				</div>
			</div>
		</div>
	)
}

export default ExecutionLog
