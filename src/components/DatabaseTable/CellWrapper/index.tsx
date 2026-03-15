import { clsx } from 'clsx'

import { IColumn } from '@/interfaces/column'
import { useDataEditorStore } from '@/stores'
import EditableCell from '../EditableCell'

interface CellWrapperProps {
	rowId: string
	column: IColumn
	initialValue: unknown
	tablePath: string
	color: string
	isNewRow: boolean
}

const CellWrapper = ({
	rowId,
	column,
	initialValue,
	tablePath,
	color,
	isNewRow,
}: CellWrapperProps) => {
	const isChanged = useDataEditorStore((state) => {
		const table = state.tablesState[tablePath]
		if (!table) return false
		const rowChanges =
			table.updateChangeset[rowId] || table.insertChangeset[rowId]
		return !!(
			rowChanges &&
			Object.prototype.hasOwnProperty.call(rowChanges, column.column_name)
		)
	})

	const isDeleted = useDataEditorStore(
		(state) => !!state.tablesState[tablePath]?.deleteChangeset?.[rowId],
	)

	const trackUpdate = useDataEditorStore((state) => state.trackUpdate)

	return (
		<div className={clsx('w-full h-full', color)}>
			<EditableCell
				initialValue={initialValue}
				column={column}
				isChanged={isChanged}
				isNewRow={isNewRow}
				isDeleted={isDeleted}
				onSave={(cName, nVal) =>
					trackUpdate(tablePath, rowId, cName, nVal)
				}
			/>
		</div>
	)
}

export default CellWrapper
