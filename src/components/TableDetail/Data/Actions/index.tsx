import { CheckIcon, CopyPlusIcon, PenIcon, PlusIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useActiveTab, useActiveTablePath } from '@/hooks'
import { dataSourcesService } from '@/services'
import { useDataEditorStore, useDataSourcesStore } from '@/stores'
import { generateSqlStatements, notifyError } from '@/utils'
import DeleteButton from './DeleteButton'
import RefreshButton from './RefreshButton'
import SettingsButton from './SettingsButton'
import UploadCsvButton from './UploadCsvButton'

interface ActionsProps {
	refreshData: () => Promise<void>
	primaryColumnName: string
}

const Actions = ({ refreshData, primaryColumnName }: ActionsProps) => {
	const [isSaving, setIsSaving] = useState(false)

	const activeTab = useActiveTab()
	const { dataSourceId, database } = useDataSourcesStore()
	const {
		addEmptyRow,
		tablesState,
		discardTableChanges,
		markSelectedRowsAsDeleted,
	} = useDataEditorStore()

	const tablePath = useActiveTablePath()
	const tableState = tablesState[tablePath]

	const canSave =
		Object.keys(tableState?.insertChangeset || {}).length > 0 ||
		Object.keys(tableState?.updateChangeset || {}).length > 0 ||
		Object.keys(tableState?.deleteChangeset || {}).length > 0

	const handleDeleteClick = () => {
		if (!tableState) return
		markSelectedRowsAsDeleted(tablePath)
	}

	const handleSave = async () => {
		if (!tableState || !activeTab) return

		const sqlQueries = generateSqlStatements(primaryColumnName, tablePath)
		if (sqlQueries.length === 0) return

		setIsSaving(true)

		try {
			await dataSourcesService.runQuery(
				dataSourceId!,
				database!,
				sqlQueries.join('\n'),
				true, // forced execution to allow multiple statements
			)

			await refreshData()

			toast.success('All changes saved successfully!')
		} catch (error) {
			notifyError(error, 'Failed to save changes.')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className='border-b'>
			<div className='overflow-x-auto px-2 sm:px-4'>
				<div className='flex w-max min-w-full items-center gap-1.5 sm:gap-3 py-2'>
				<Button
					onClick={() => addEmptyRow(tablePath)}
					size='icon'
					variant='ghost'>
					<PlusIcon />
				</Button>

				<Button
					size='icon'
					variant='ghost'>
					<PenIcon />
				</Button>

				<Button
					size='icon'
					variant='ghost'>
					<CopyPlusIcon />
				</Button>

				<DeleteButton
					disabled={isSaving}
					keysLength={
						Object.keys(tableState?.selectedRows || {}).length
					}
					onClick={handleDeleteClick}
				/>

				{canSave && (
					<>
						<div className='w-0.5 h-8 bg-neutral-200 dark:bg-neutral-400'></div>

						<Button
							onClick={() => discardTableChanges(tablePath)}
							variant='ghost'
							className='text-red-500 whitespace-nowrap'>
							<XIcon />
							Cancel
						</Button>

						<Button
							disabled={isSaving}
							onClick={handleSave}
							variant='ghost'
							className='text-green-500 whitespace-nowrap'>
							<CheckIcon />
							Save
						</Button>
					</>
				)}

				<div className='w-0.5 h-8 bg-neutral-200 dark:bg-neutral-400'></div>

				<RefreshButton onClick={refreshData} />

				<UploadCsvButton />

				<SettingsButton />
				</div>
			</div>
		</div>
	)
}

export default Actions
