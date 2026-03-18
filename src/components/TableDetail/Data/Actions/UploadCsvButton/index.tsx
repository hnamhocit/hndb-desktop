import { FileUpIcon } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useActiveTab } from '@/hooks'
import { ITab } from '@/interfaces'
import { useActiveStore, useTabsStore } from '@/stores'
import { generateInsertSqlFromCsv, getTabConnectionId } from '@/utils'

const UploadCsvButton = () => {
	const ref = useRef<HTMLInputElement>(null)
	const { setTabs, tabs, commitContent } = useTabsStore()
	const { setActiveTabId } = useActiveStore()
	const activeTab = useActiveTab()
	const connectionId = getTabConnectionId(activeTab)

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
					<p>Import CSV</p>
				</TooltipContent>
			</Tooltip>

			<input
				ref={ref}
				type='file'
				hidden
				accept='.csv, text/csv'
				onChange={(e) => {
					const file = e.target.files?.[0]
					if (file) {
						generateInsertSqlFromCsv(
							file,
							activeTab!.table!,
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
							},
						)
					}
				}}
			/>
		</>
	)
}

export default UploadCsvButton
