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
import { useTabsStore } from '@/stores'
import { generateInsertSqlFromCsv } from '@/utils'

const UploadCsvButton = () => {
	const ref = useRef<HTMLInputElement>(null)
	const { setTabs, tabs, commitContent, setActiveTabId } = useTabsStore()
	const activeTab = useActiveTab()

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
									dataSourceId: activeTab!.dataSourceId,
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
