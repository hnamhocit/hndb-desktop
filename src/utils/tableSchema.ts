import { IColumn, IRelationship } from '@/interfaces'

type TableSchema = Record<string, IColumn[]>

const unquoteSegment = (value: string) =>
	value.trim().replace(/^[`"'\[]+/, '').replace(/[`"'\]]+$/, '')

const buildTableAliases = (tableName: string) => {
	const trimmed = tableName.trim()
	if (!trimmed) return []

	const segments = trimmed.split('.').map(unquoteSegment).filter(Boolean)
	const normalizedFull = segments.join('.')
	const leaf = segments[segments.length - 1] || normalizedFull

	return Array.from(
		new Set(
			[
				trimmed,
				unquoteSegment(trimmed),
				normalizedFull,
				leaf,
				trimmed.toLowerCase(),
				unquoteSegment(trimmed).toLowerCase(),
				normalizedFull.toLowerCase(),
				leaf.toLowerCase(),
			].filter(Boolean),
		),
	)
}

const parseForeignKeyTarget = (value: string) => {
	const segments = value.split('.').map(unquoteSegment).filter(Boolean)
	if (segments.length < 2) return null

	const targetColumn = segments.pop() || ''
	const targetTable = segments.pop() || ''

	if (!targetTable || !targetColumn) return null

	return {
		targetTable,
		targetColumn,
	}
}

const inferDataType = (values: unknown[]) => {
	for (const value of values) {
		if (value === null || value === undefined) continue

		if (Array.isArray(value)) return 'json'
		if (typeof value === 'boolean') return 'boolean'
		if (typeof value === 'number') {
			return Number.isInteger(value) ? 'integer' : 'numeric'
		}
		if (typeof value === 'object') return 'json'
		return 'text'
	}

	return 'unknown'
}

export const normalizeSchemaRecord = (value: unknown): TableSchema => {
	if (!value || Array.isArray(value) || typeof value !== 'object') {
		return {}
	}

	const normalized: TableSchema = {}

	for (const [tableName, columns] of Object.entries(
		value as Record<string, unknown>,
	)) {
		if (!Array.isArray(columns)) continue

		const safeColumns = columns
			.filter(
				(column): column is Partial<IColumn> =>
					!!column && typeof column === 'object',
			)
			.map((column) => ({
				column_name:
					typeof column.column_name === 'string' ?
						column.column_name
					:	'',
				data_type:
					typeof column.data_type === 'string' ?
						column.data_type
					:	'unknown',
				is_nullable: Boolean(column.is_nullable),
				column_default:
					column.column_default == null ?
						null
					:	String(column.column_default),
				is_primary: Boolean(column.is_primary),
				is_foreign_key: Boolean(column.is_foreign_key),
				is_unique: Boolean(column.is_unique),
				is_indexed: Boolean(column.is_indexed),
				foreign_key_target:
					column.foreign_key_target == null ?
						null
					:	String(column.foreign_key_target),
			}))
			.filter((column) => column.column_name)

		if (safeColumns.length > 0) {
			normalized[tableName] = safeColumns
		}
	}

	return normalized
}

export const resolveSchemaColumns = (
	schema: TableSchema | null | undefined,
	tableName: string | null | undefined,
) => {
	if (!schema || !tableName) return []

	const resolvedTableName = resolveSchemaTableName(schema, tableName)
	if (!resolvedTableName) return []

	return schema[resolvedTableName] || []
}

export const tableNamesMatch = (
	left: string | null | undefined,
	right: string | null | undefined,
) => {
	if (!left || !right) return false

	const leftAliases = buildTableAliases(left)
	const rightAliasSet = new Set(buildTableAliases(right))

	return leftAliases.some((alias) => rightAliasSet.has(alias))
}

export const resolveSchemaTableName = (
	schema: TableSchema | null | undefined,
	tableName: string | null | undefined,
) => {
	if (!schema || !tableName) return null

	if (Array.isArray(schema[tableName])) {
		return tableName
	}

	const targetAliases = new Set(buildTableAliases(tableName))

	for (const [schemaKey, columns] of Object.entries(schema)) {
		if (!Array.isArray(columns) || columns.length === 0) continue

		const schemaAliases = buildTableAliases(schemaKey)
		if (schemaAliases.some((alias) => targetAliases.has(alias))) {
			return schemaKey
		}
	}

	return null
}

export const buildRelationshipsFromSchema = (
	schema: TableSchema | null | undefined,
) => {
	if (!schema) return []

	const relationships: IRelationship[] = []
	const seen = new Set<string>()

	for (const [sourceTable, columns] of Object.entries(schema)) {
		for (const column of columns) {
			if (!column.is_foreign_key || !column.foreign_key_target) {
				continue
			}

			const parsedTarget = parseForeignKeyTarget(column.foreign_key_target)
			if (!parsedTarget) {
				continue
			}

			const targetTable =
				resolveSchemaTableName(schema, parsedTarget.targetTable) ??
				parsedTarget.targetTable

			const relationship: IRelationship = {
				source_table: sourceTable,
				source_column: column.column_name,
				target_table: targetTable,
				target_column: parsedTarget.targetColumn,
			}

			const relationshipKey = `${relationship.source_table}.${relationship.source_column}->${relationship.target_table}.${relationship.target_column}`
			if (seen.has(relationshipKey)) {
				continue
			}

			seen.add(relationshipKey)
			relationships.push(relationship)
		}
	}

	return relationships
}

export const buildColumnsFromRows = (rows: Record<string, unknown>[]) => {
	const keys: string[] = []

	for (const row of rows.slice(0, 25)) {
		for (const key of Object.keys(row)) {
			if (!keys.includes(key)) {
				keys.push(key)
			}
		}
	}

	return keys.map<IColumn>((key) => ({
		column_name: key,
		data_type: inferDataType(rows.map((row) => row[key])),
		is_nullable: rows.some((row) => row[key] == null),
		column_default: null,
		is_primary: false,
		is_foreign_key: false,
		is_unique: false,
		is_indexed: false,
		foreign_key_target: null,
	}))
}
