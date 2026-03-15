import { ActivityIcon, AlertCircleIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useActiveTab } from '@/hooks'
import { IQueryResult } from '@/interfaces'
import { databaseService } from '@/services'
import { notifyError } from '@/utils'
import JsonViewer from './JsonViewer'

interface QueryPlanProps {
	query: string
}

const QueryPlan = ({ query }: QueryPlanProps) => {
	const [planData, setPlanData] = useState<IQueryResult | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const activeTab = useActiveTab()

	useEffect(() => {
		;(async () => {
			if (!activeTab || !activeTab.dataSourceId) {
				setPlanData(null)
				return
			}

			setIsLoading(true)
			setPlanData(null)

			try {
				const { data } = await databaseService.queryPlan(
					activeTab.dataSourceId,
					query,
					activeTab.database || '',
				)

				setPlanData(data.data)
			} catch (error) {
				notifyError(error, 'Failed to fetch query plan.')
			} finally {
				setIsLoading(false)
			}
		})()
	}, [query, activeTab])

	if (isLoading) {
		return (
			<div className='w-full h-full flex items-center justify-center gap-2 text-primary'>
				<ActivityIcon
					size={18}
					className='animate-spin'
				/>
				<span>Loading Query Plan...</span>
			</div>
		)
	}

	return (
		<div className='w-full h-full overflow-auto bg-white dark:bg-[#090b10] p-4'>
			<div className='flex items-center gap-2 mb-4 text-primary font-bold'>
				<ActivityIcon size={18} />
				<span>Execution Plan</span>
			</div>

			{!planData ?
				<div className='flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded border border-amber-200 dark:border-amber-500/20'>
					<AlertCircleIcon
						size={20}
						className='shrink-0'
					/>
					<div>
						<p className='font-bold mb-1'>
							No Query Plan Available
						</p>
						<p className='text-xs'>
							Query Plan is only automatically generated for{' '}
							<strong>SELECT</strong> statements to ensure
							database safety.
						</p>
					</div>
				</div>
			:	<div className='bg-slate-50 dark:bg-[#161a27] border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-inner overflow-x-auto'>
					<JsonViewer
						data={planData}
						initiallyExpanded={true}
					/>
				</div>
			}
		</div>
	)
}

export default QueryPlan
