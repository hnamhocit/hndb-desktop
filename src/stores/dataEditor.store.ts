import { produce } from 'immer'
import { create } from 'zustand'

export interface TableChangeset {
	originalData: Record<string, unknown>[]
	updateChangeset: Record<string, Record<string, unknown>> // { rowId: { col: val } }
	insertChangeset: Record<string, Record<string, unknown>> // { tempId: { col: val } }
	newRowIds: (string | number)[]
	deleteChangeset: Record<string | number, boolean>
	selectedRows: Record<string | number, boolean> // Thêm state quản lý checkbox
}

interface GlobalDataEditorState {
	tablesState: Record<string, TableChangeset>

	initializeTable: (
		tablePath: string,
		data: Record<string, unknown>[],
	) => void
	trackUpdate: (
		tablePath: string,
		rowId: string | number,
		colName: string,
		value: unknown,
	) => void
	addEmptyRow: (tablePath: string) => void
	discardTableChanges: (tablePath: string) => void

	toggleDeleteChangeset: (tablePath: string, id: string | number) => void
	toggleRowSelection: (tablePath: string, id: string | number) => void
	markSelectedRowsAsDeleted: (tablePath: string) => void
}

const createEmptyChangeset = (): TableChangeset => ({
	originalData: [],
	updateChangeset: {},
	insertChangeset: {},
	newRowIds: [],
	deleteChangeset: {},
	selectedRows: {},
})

export const useDataEditorStore = create<GlobalDataEditorState>((set) => ({
	tablesState: {},

	initializeTable: (tablePath, data) =>
		set(
			produce((state: GlobalDataEditorState) => {
				if (!state.tablesState[tablePath]) {
					state.tablesState[tablePath] = {
						...createEmptyChangeset(),
						originalData: data,
					}
					return
				}

				state.tablesState[tablePath].originalData = data
			}),
		),

	trackUpdate: (tablePath, rowId, colName, value) =>
		set(
			produce((state: GlobalDataEditorState) => {
				const table = state.tablesState[tablePath]
				if (!table) return

				const isNewRow = table.newRowIds.includes(rowId)

				if (isNewRow) {
					if (!table.insertChangeset[rowId])
						table.insertChangeset[rowId] = {}
					table.insertChangeset[rowId][colName] = value
				} else {
					if (!table.updateChangeset[rowId])
						table.updateChangeset[rowId] = {}
					table.updateChangeset[rowId][colName] = value
				}
			}),
		),

	addEmptyRow: (tablePath) =>
		set(
			produce((state: GlobalDataEditorState) => {
				const table = state.tablesState[tablePath]
				if (!table) return

				const tempId = `NEW_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

				table.insertChangeset[tempId] = {}
				table.newRowIds.unshift(tempId)
			}),
		),

	toggleDeleteChangeset: (tablePath, id) =>
		set(
			produce((state: GlobalDataEditorState) => {
				const table = state.tablesState[tablePath]
				if (!table) return

				if (table.newRowIds.includes(id)) {
					delete table.insertChangeset[id]
					table.newRowIds = table.newRowIds.filter(
						(rowId) => rowId !== id,
					)
				} else {
					if (table.deleteChangeset[id]) {
						delete table.deleteChangeset[id]
					} else {
						table.deleteChangeset[id] = true
						if (table.updateChangeset[id]) {
							delete table.updateChangeset[id]
						}
					}
				}
			}),
		),

	toggleRowSelection: (tablePath, id) =>
		set(
			produce((state: GlobalDataEditorState) => {
				const table = state.tablesState[tablePath]
				if (!table) return

				// Bật/tắt trạng thái chọn của 1 row
				if (table.selectedRows[id]) {
					delete table.selectedRows[id]
				} else {
					table.selectedRows[id] = true
				}
			}),
		),

	markSelectedRowsAsDeleted: (tablePath) =>
		set(
			produce((state: GlobalDataEditorState) => {
				const table = state.tablesState[tablePath]
				if (!table) return

				// Lấy tất cả ID đang được tick checkbox
				const selectedIds = Object.keys(table.selectedRows)

				selectedIds.forEach((id) => {
					// Nếu là dòng mới thêm -> Xóa sổ luôn
					if (table.newRowIds.includes(id)) {
						delete table.insertChangeset[id]
						// Chú ý ép kiểu String để filter chính xác
						table.newRowIds = table.newRowIds.filter(
							(rowId) => String(rowId) !== id,
						)
					} else {
						// Dòng cũ -> Đưa vào danh sách chờ xóa
						table.deleteChangeset[id] = true
						if (table.updateChangeset[id])
							delete table.updateChangeset[id]
					}
				})

				// Reset trạng thái Checkbox
				table.selectedRows = {}
			}),
		),

	discardTableChanges: (tablePath) =>
		set(
			produce((state: GlobalDataEditorState) => {
				const table = state.tablesState[tablePath]
				if (table) {
					const original = table.originalData
					state.tablesState[tablePath] = {
						...createEmptyChangeset(),
						originalData: original,
					}
				}
			}),
		),
}))
