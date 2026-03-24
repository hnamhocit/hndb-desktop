import { CheckCircle2Icon } from 'lucide-react'

import QueryTable from '@/components/QueryTable'
import { useI18n } from '@/hooks'
import { IQueryResult } from '@/interfaces'
import { formatCompactCount, formatDurationMs } from '@/utils'
import { TabId } from '..'
import ExecutionLog from '../ExecutionLog'
import QueryPlan from '../QueryPlan'

interface TabContentProps {
	currentTab: TabId
	result: IQueryResult | null
	executedQuery: string
	connectionDriver: 'postgres' | 'mysql' | 'mariadb' | 'sqlite' | 'mssql'
	executionError?: string | null
}

const TabContent = ({
	currentTab,
	result,
	executedQuery,
	connectionDriver,
	executionError = null,
}: TabContentProps) => {
	const { t } = useI18n()

	return (
		<div className='relative h-full min-h-0 w-full overflow-hidden bg-white dark:bg-[#090b10]'>
			{currentTab === 'results' && result && result.rows.length > 0 && (
				<QueryTable
					columns={Object.keys(result.rows[0] || [])}
					rows={result.rows || []}
				/>
			)}

			{currentTab === 'results' && result &&
				(!result.rows || result.rows.length === 0) && (
					<div className='w-full h-full flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-400 gap-4 animate-in fade-in duration-300'>
						<div className='w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400'>
							<CheckCircle2Icon size={32} />
						</div>
							<div className='text-center'>
								<h3 className='text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-1'>
									{t('query.successTitle')}
								</h3>
								<p className='text-sm'>
									<span className='font-bold text-neutral-700 dark:text-neutral-300'>
										{formatCompactCount(result.affectedRows || 0)}
									</span>{' '}
									{t('table.result.rowsAffectedIn')}{' '}
									<span className='font-bold text-neutral-700 dark:text-neutral-300'>
										{formatDurationMs(result.durationMs)}
									</span>
								</p>
							</div>
					</div>
				)}

			{currentTab === 'execution-log' && (
				<ExecutionLog
					result={result}
					query={executedQuery}
					errorMessage={executionError}
				/>
			)}

			{currentTab === 'query-plan' && (
				<QueryPlan
					query={executedQuery}
					driver={connectionDriver}
				/>
			)}
		</div>
	)
}

export default TabContent
