import { ActivityIcon, AlertCircleIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useActiveTab, useI18n } from '@/hooks'
import { connectionService } from '@/services'
import { usePreferencesStore } from '@/stores'
import { formatErrorMessage, getTabConnectionId, notifyError } from '@/utils'
import JsonViewer from './JsonViewer'

interface QueryPlanProps {
	query: string
	driver: 'postgres' | 'mysql' | 'mariadb' | 'sqlite' | 'mssql'
}

const QueryPlan = ({ query, driver }: QueryPlanProps) => {
	const { t } = useI18n()
	const editorTheme = usePreferencesStore((state) => state.editorTheme)
	const [planData, setPlanData] = useState<unknown | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const activeTab = useActiveTab()
	const connectionId = getTabConnectionId(activeTab)
	const activeDatabase = activeTab?.database ?? null
	const cacheRef = useRef(new Map<string, unknown | null>())
	const requestIdRef = useRef(0)

	const planCacheKey = useMemo(
		() =>
			[
				connectionId ?? '',
				activeDatabase ?? '',
				driver,
				query.trim(),
			].join('::'),
		[activeDatabase, connectionId, driver, query],
	)

	useEffect(() => {
		if (!connectionId || !query.trim()) {
			setPlanData(null)
			setErrorMessage(null)
			setIsLoading(false)
			return
		}

		const cachedPlan = cacheRef.current.get(planCacheKey)
		if (cachedPlan !== undefined) {
			setPlanData(cachedPlan)
			setErrorMessage(null)
			setIsLoading(false)
			return
		}

		const requestId = requestIdRef.current + 1
		requestIdRef.current = requestId
		setIsLoading(true)
		setErrorMessage(null)
		setPlanData(null)

		void (async () => {
			try {
				const { data } = await connectionService.queryPlan(
					connectionId,
					query,
					activeDatabase,
					driver,
				)

				if (requestIdRef.current !== requestId) return

				cacheRef.current.set(planCacheKey, data.data)
				setPlanData(data.data)
			} catch (error) {
				if (requestIdRef.current !== requestId) return

				const nextErrorMessage = formatErrorMessage(
					error,
					t('errors.failedFetchQueryPlan'),
				)
				setPlanData(null)
				setErrorMessage(nextErrorMessage)
				notifyError(error, t('errors.failedFetchQueryPlan'))
			} finally {
				if (requestIdRef.current === requestId) {
					setIsLoading(false)
				}
			}
		})()
	}, [activeDatabase, connectionId, driver, planCacheKey, query, t])

	if (isLoading) {
		return (
			<div className='w-full h-full flex items-center justify-center gap-2 text-primary'>
				<ActivityIcon
					size={18}
					className='animate-spin'
				/>
				<span>{t('query.plan.loading')}</span>
			</div>
		)
	}

	return (
		<div className='flex h-full min-h-0 w-full min-w-0 flex-col gap-4 overflow-hidden bg-background p-4'>
			<div className='flex items-center gap-2 text-primary font-bold'>
				<ActivityIcon size={18} />
				<span>{t('query.plan.title')}</span>
			</div>

			{errorMessage ?
				<div className='flex items-start gap-3 rounded border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'>
					<AlertCircleIcon
						size={20}
						className='mt-0.5 shrink-0'
					/>
					<div>
						<p className='font-bold mb-1'>
							{t('query.plan.errorTitle')}
						</p>
						<p className='text-xs leading-6'>{errorMessage}</p>
					</div>
				</div>
			: !planData ?
				<div className='flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded border border-amber-200 dark:border-amber-500/20'>
					<AlertCircleIcon
						size={20}
						className='shrink-0'
					/>
					<div>
						<p className='font-bold mb-1'>
							{t('query.plan.noPlan')}
						</p>
						<p className='text-xs'>
							{t('query.plan.noPlanDescription')}
						</p>
					</div>
				</div>
			:	<div className='min-h-0 flex-1 overflow-auto rounded-lg bg-muted/40 shadow-inner'>
					<div className='h-full min-h-[280px] min-w-[720px]'>
						<JsonViewer
							data={planData}
							theme={editorTheme}
						/>
					</div>
				</div>
			}
		</div>
	)
}

export default QueryPlan
