import { useDataEditorStore, useTabsStore } from '@/stores'

const escapeIdentifier = (identifier: string) => {
	return `"${identifier.replace(/"/g, '""')}"`
}

const formatSqlValue = (val: unknown) => {
	if (val === null || val === undefined) return 'NULL'

	if (typeof val === 'string') {
		return `'${val.replace(/'/g, "''")}'`
	}

	if (typeof val === 'number') {
		return Number.isFinite(val) ? String(val) : 'NULL'
	}

	if (typeof val === 'boolean') {
		return val ? 'TRUE' : 'FALSE'
	}

	if (val instanceof Date) {
		return `'${val.toISOString().replace(/'/g, "''")}'`
	}

	if (typeof val === 'object') {
		return `'${JSON.stringify(val).replace(/'/g, "''")}'`
	}

	return `'${String(val).replace(/'/g, "''")}'`
}

export const generateSqlStatements = (
	primaryColumnName: string,
	tablePath: string,
) => {
	const statements: string[] = []

	const { tabs, activeTabId } = useTabsStore.getState()
	const activeTab = tabs.find((t) => t.id === activeTabId) || null

	if (!activeTab?.table) return statements

	const { tablesState } = useDataEditorStore.getState()

	const tableState = tablesState[tablePath]
	if (!tableState) return statements

	const {
		updateChangeset = {},
		insertChangeset = {},
		newRowIds = [],
		deleteChangeset = {},
	} = tableState

	const tableName = escapeIdentifier(activeTab.table)
	const primaryKey = escapeIdentifier(primaryColumnName)

	// UPDATE
	Object.entries(updateChangeset).forEach(([rowId, changes]) => {
		if (!changes || Object.keys(changes).length === 0) return

		const setClauses = Object.entries(changes)
			.filter(([col]) => col !== primaryColumnName)
			.map(
				([col, val]) =>
					`${escapeIdentifier(col)} = ${formatSqlValue(val)}`,
			)
			.join(', ')

		if (!setClauses) return

		statements.push(
			`UPDATE ${tableName} SET ${setClauses} WHERE ${primaryKey} = ${formatSqlValue(rowId)};`,
		)
	})

	// INSERT
	if (newRowIds.length > 0) {
		const allCols = new Set<string>()

		newRowIds.forEach((id) => {
			const row = insertChangeset[id] ?? {}
			Object.keys(row).forEach((col) => allCols.add(col))
		})

		const colsArray = Array.from(allCols)

		if (colsArray.length > 0) {
			const valuesClauses = newRowIds
				.map((id) => {
					const row = insertChangeset[id] ?? {}
					const vals = colsArray.map((col) =>
						formatSqlValue(row[col] ?? null),
					)
					return `(${vals.join(', ')})`
				})
				.join(', ')

			const escapedCols = colsArray.map(escapeIdentifier).join(', ')

			statements.push(
				`INSERT INTO ${tableName} (${escapedCols}) VALUES ${valuesClauses};`,
			)
		}
	}

	// DELETE
	const deleteIds = Object.entries(deleteChangeset)
		.filter(([, shouldDelete]) => Boolean(shouldDelete))
		.map(([id]) => id)

	if (deleteIds.length > 0) {
		const formattedDeleteIds = deleteIds
			.map((id) => formatSqlValue(id))
			.join(', ')

		statements.push(
			`DELETE FROM ${tableName} WHERE ${primaryKey} IN (${formattedDeleteIds});`,
		)
	}

	return statements
}
