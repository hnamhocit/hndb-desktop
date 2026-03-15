import { CheckCircle2Icon, TerminalIcon } from 'lucide-react'

import { IQueryResult } from '@/interfaces'

interface ExecutionLogProps {
	result: IQueryResult
	query: string
}

const ExecutionLog = ({ result, query }: ExecutionLogProps) => {
	// Format thời gian hiện tại
	const now = new Date().toLocaleTimeString()

	return (
		<div className='w-full h-full overflow-auto bg-[#1e1e1e] text-neutral-300 font-mono text-sm p-4'>
			<div className='flex items-center gap-2 mb-4 text-neutral-500'>
				<TerminalIcon size={16} />
				<span>Console Output</span>
			</div>

			{/* Block hiển thị câu query */}
			<div className='bg-black/30 p-3 rounded border border-neutral-800 mb-4'>
				<span className='text-blue-400 select-none'>&gt; </span>
				<span className='text-neutral-200 whitespace-pre-wrap'>
					{query || 'No query executed'}
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
						Execution successful
					</span>

					<span className='text-neutral-400'>
						[{now}] Query executed in{' '}
						<span className='text-yellow-400'>
							{result.durationMs?.toFixed(2) || 0} ms
						</span>
					</span>

					<span className='text-neutral-400'>
						Rows affected / returned:{' '}
						<span className='text-yellow-400'>
							{result.rows?.length || result.affectedRows || 0}
						</span>
					</span>
				</div>
			</div>
		</div>
	)
}

export default ExecutionLog
