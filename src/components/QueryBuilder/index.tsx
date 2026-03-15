import clsx from 'clsx'
import {
	ArrowDownToLineIcon,
	DatabaseIcon,
	HistoryIcon,
	PlayIcon,
	SaveIcon,
	TimerIcon,
	WandSparklesIcon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useActiveTab } from '@/hooks'
import { IQueryResult } from '@/interfaces'
import { dataSourcesService } from '@/services'
import { useTabsStore } from '@/stores'
import { exportToCsv, notifyError } from '@/utils'
import { AxiosError } from 'axios'
import { Button } from '../ui/button'
import ConfirmQueryDialog from './ConfirmQueryDialog'
import SqlContextSelector from './SqlContextSelector'
import SqlEditor from './SqlEditor'
import TabContent from './TabContent'

const tabs = [
	{
		id: 'results',
		title: 'Results',
	},
	{
		id: 'execution-log',
		title: 'Execution Log',
	},
	{
		id: 'query-plan',
		title: 'Query Plan',
	},
] as const

export type TabId = (typeof tabs)[number]['id']

const QueryBuilder = () => {
	const [currentTab, setCurrentTab] = useState<TabId>('results')
	const [isLoading, setIsLoading] = useState(false)
	const [result, setResult] = useState<IQueryResult | null>(null)
	const [isOpen, setIsOpen] = useState(false)

	const { contentById } = useTabsStore()
	const activeTab = useActiveTab()

	const toggleIsOpen = () => setIsOpen((prev) => !prev)

	const handleRunQuery = async (forced: boolean = false) => {
		if (!activeTab) {
			return
		}

		if (!activeTab.dataSourceId) {
			toast.error('No data source selected', {
				position: 'top-center',
			})
			return
		}

		setIsLoading(true)

		try {
			const query = contentById[activeTab.id]
			const { data } = await dataSourcesService.runQuery(
				activeTab.dataSourceId,
				activeTab.database,
				query,
				forced,
			)

			setResult(data.data)

			if (data.data.rows.length === 0) {
				setCurrentTab('execution-log')
			}
		} catch (error) {
			if (error instanceof AxiosError) {
				const errorMsg = error.response?.data?.message || ''
				const errorCode = error.response?.data?.error || ''

				if (
					error.response?.status === 403 &&
					(errorMsg.includes('DANGEROUS') ||
						errorCode.includes('DANGEROUS'))
				) {
					setIsOpen(true)
					return
				}
			}

			notifyError(error, 'Failed to run query')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='flex flex-col h-full min-h-0'>
			<div className='border-b p-2 sm:p-4 space-y-2'>
				<div className='overflow-x-auto'>
					<div className='flex w-max min-w-full items-center gap-2 sm:gap-4'>
						<Button
							onClick={() => handleRunQuery()}
							disabled={isLoading}
							size='sm'>
							<PlayIcon />
							Execute
						</Button>

						<div className='w-px h-5 sm:h-6 bg-neutral-300 dark:bg-neutral-700' />

						<Button
							size='icon'
							variant='ghost'>
							<SaveIcon />
						</Button>

						<Button
							size='icon'
							variant='ghost'>
							<WandSparklesIcon />
						</Button>

						<Button
							size='icon'
							variant='ghost'>
							<HistoryIcon />
						</Button>
					</div>
				</div>

				<div className='overflow-x-auto'>
					<SqlContextSelector />
				</div>
			</div>

			<SqlEditor />

			{result && (
				<>
					{/* Thanh Tabs & Stats (Đã thêm border-b để tách biệt với nội dung bên dưới) */}
					<div className='pt-2 px-2 sm:px-4 shrink-0 border-b dark:border-slate-800 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between'>
						<div className='flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0'>
							{tabs.map((tab) => (
								<div
									key={tab.id}
									className={clsx(
										'py-2 px-3 sm:px-4 cursor-pointer transition-colors whitespace-nowrap shrink-0',
										{
											'border-b-2 border-primary text-primary font-bold':
												currentTab === tab.id,
											'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 font-semibold':
												currentTab !== tab.id,
										},
									)}
									onClick={() => setCurrentTab(tab.id)}>
									{tab.title}
								</div>
							))}
						</div>

						{/* Stats chỉ hiện ở tab Results */}
						{currentTab === 'results' && (
							<div className='flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 text-neutral-700 dark:text-neutral-400 font-mono font-medium text-xs sm:text-sm whitespace-nowrap'>
								<div className='flex items-center gap-1.5 sm:gap-2 shrink-0'>
									<TimerIcon size={16} />
									<div>
										{result.durationMs?.toFixed(2) || 0}ms
									</div>
								</div>

								<div className='flex items-center gap-1.5 sm:gap-2 shrink-0'>
									<DatabaseIcon size={16} />
									<div>
										{result.rows.length ||
											result.affectedRows ||
											0}{' '}
										rows
									</div>
								</div>

								{result?.rows.length > 0 && (
									<>
										<div className='w-px h-4 bg-neutral-300 dark:bg-neutral-700 shrink-0'></div>

										<div
											className='flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:text-primary transition-colors shrink-0'
											onClick={() => {
												const timestamp = new Date()
													.toISOString()
													.replace(/[:.]/g, '-')
												exportToCsv(
													`query-result-${timestamp}`,
													result.rows as Record<
														string,
														unknown
													>[],
												)
											}}>
											<ArrowDownToLineIcon size={16} />
											<div>CSV</div>
										</div>
									</>
								)}
							</div>
						)}
					</div>

					<TabContent
						currentTab={currentTab}
						result={result}
					/>
				</>
			)}

			<ConfirmQueryDialog
				isOpen={isOpen}
				onOpenChange={toggleIsOpen}
				onRunQuery={handleRunQuery}
			/>
		</div>
	)
}

export default QueryBuilder
