import { FileUpIcon } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useActiveTab, useI18n } from '@/hooks'
import { IColumn, ITab } from '@/interfaces'
import { useActiveStore, useConnectionStore, useTabsStore } from '@/stores'
import { generateInsertSqlFromCsv, getTabConnectionId } from '@/utils'

interface UploadCsvButtonProps {
	columns: IColumn[]
}

const UploadCsvButton = ({ columns }: UploadCsvButtonProps) => {
	const { t } = useI18n()
	const ref = useRef<HTMLInputElement>(null)
	const { setTabs, tabs, commitContent } = useTabsStore()
	const { setActiveTabId } = useActiveStore()
	const activeTab = useActiveTab()
	const connectionId = getTabConnectionId(activeTab)
	const driver = useConnectionStore((state) =>
		connectionId ?
			state.connections.find((connection) => connection.id === connectionId)
				?.config.driver
		:	undefined,
	)

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						onClick={() => ref.current?.click()}
						size='icon'
						variant='ghost'>
						<FileUpIcon />
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>{t('table.actions.importCsv')}</p>
				</TooltipContent>
			</Tooltip>

			<input
				ref={ref}
				type='file'
				hidden
				accept='.csv, text/csv'
				onChange={(e) => {
					const file = e.target.files?.[0]
					e.target.value = ''

					if (!activeTab?.table || !driver) {
						toast.error(t('table.csv.parseFailed'))
						return
					}

					if (file) {
						generateInsertSqlFromCsv(
							file,
							{
								tableName: activeTab.table,
								dialect: driver,
								columns,
							},
							(sql) => {
								const id = Date.now().toString()
								const newTab: ITab = {
									id,
									type: 'query',
									title: file.name,
									workspaceId:
										activeTab!.workspaceId ??
										connectionId,
									connectionId,
									dataSourceId: connectionId,
									database: activeTab!.database,
									table: activeTab!.table,
								}

								setTabs([...tabs, newTab])
								setActiveTabId(id)
								commitContent(id, sql)
								toast.success(
									t('table.csv.importPrepared', {
										fileName: file.name,
									}),
								)
							},
							(error) => {
								if (error.code === 'EMPTY_CSV') {
									toast.error(t('table.csv.emptyFile'))
									return
								}

								if (error.code === 'INVALID_COLUMNS') {
									toast.error(
										t('table.csv.invalidColumns', {
											columns:
												error.invalidColumns?.join(', ') ??
												'',
										}),
									)
									return
								}

								if (error.code === 'NO_USABLE_COLUMNS') {
									toast.error(t('table.csv.noUsableColumns'))
									return
								}

								toast.error(t('table.csv.parseFailed'))
							},
						)
					}
				}}
			/>
		</>
	)
}

export default UploadCsvButton
