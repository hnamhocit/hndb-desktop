import Papa from 'papaparse'

import { IColumn } from '@/interfaces'
import { DataSourceType } from '@/schemas'

import { buildInsertSqlFromRows } from './index'

const PAPAPARSE_EXTRA_COLUMN = '__parsed_extra'

const normalizeHeader = (value: string) => value.replace(/^\uFEFF/, '').trim()

const looksLikeJson = (value: string) =>
	(value.startsWith('{') && value.endsWith('}')) ||
	(value.startsWith('[') && value.endsWith(']'))

const isBooleanType = (type: string | null | undefined) =>
	Boolean(type && /\b(bool|boolean|bit)\b/i.test(type))

const isJsonType = (type: string | null | undefined) =>
	Boolean(type && /\b(json|jsonb)\b/i.test(type))

const isIntegerType = (type: string | null | undefined) =>
	Boolean(
		type &&
			/\b(smallint|integer|int|bigint|serial|bigserial|tinyint|mediumint)\b/i.test(
				type,
			),
	)

const isNumericType = (type: string | null | undefined) =>
	Boolean(
		type &&
			/\b(numeric|decimal|float|double|real|money)\b/i.test(type),
	) || isIntegerType(type)

const parseBooleanValue = (value: string) => {
	const normalized = value.toLowerCase()

	if (['1', 'true', 't', 'yes', 'y'].includes(normalized)) return true
	if (['0', 'false', 'f', 'no', 'n'].includes(normalized)) return false

	return value
}

const parseIntegerValue = (value: string) => {
	if (!/^-?\d+$/.test(value)) return value

	try {
		const bigintValue = BigInt(value)
		if (
			bigintValue <= BigInt(Number.MAX_SAFE_INTEGER) &&
			bigintValue >= BigInt(Number.MIN_SAFE_INTEGER)
		) {
			return Number(value)
		}

		return bigintValue
	} catch {
		return value
	}
}

const parseNumericValue = (value: string) => {
	if (!/^-?(?:\d+|\d*\.\d+)$/.test(value)) return value

	const numericValue = Number(value)
	return Number.isFinite(numericValue) ? numericValue : value
}

const parseJsonValue = (value: string) => {
	if (!looksLikeJson(value)) return value

	try {
		return JSON.parse(value) as unknown
	} catch {
		return value
	}
}

const parseCellValue = (
	rawValue: unknown,
	columnType?: string | null,
): unknown => {
	if (rawValue === null || rawValue === undefined) return null
	if (typeof rawValue !== 'string') return rawValue

	const value = rawValue.replace(/^\uFEFF/, '')
	const trimmed = value.trim()

	if (!trimmed) return null

	if (isJsonType(columnType)) {
		const parsedJsonValue = parseJsonValue(trimmed)
		return parsedJsonValue === trimmed ? value : parsedJsonValue
	}

	if (isBooleanType(columnType)) {
		const parsedBooleanValue = parseBooleanValue(trimmed)
		return parsedBooleanValue === trimmed ? value : parsedBooleanValue
	}

	if (isIntegerType(columnType)) {
		const parsedIntegerValue = parseIntegerValue(trimmed)
		return parsedIntegerValue === trimmed ? value : parsedIntegerValue
	}

	if (isNumericType(columnType)) {
		const parsedNumericValue = parseNumericValue(trimmed)
		return parsedNumericValue === trimmed ? value : parsedNumericValue
	}

	if (trimmed.toLowerCase() === 'null') return null

	const booleanValue = parseBooleanValue(trimmed)
	if (typeof booleanValue === 'boolean') return booleanValue

	const integerValue = parseIntegerValue(trimmed)
	if (typeof integerValue === 'number' || typeof integerValue === 'bigint') {
		return integerValue
	}

	const numericValue = parseNumericValue(trimmed)
	if (typeof numericValue === 'number') return numericValue

	const jsonValue = parseJsonValue(trimmed)
	return jsonValue === trimmed ? value : jsonValue
}

const buildColumnLookup = (columns: IColumn[] = []) => {
	const exact = new Map<string, IColumn>()
	const insensitive = new Map<string, IColumn>()

	for (const column of columns) {
		const normalized = normalizeHeader(column.column_name)
		if (!normalized) continue

		exact.set(normalized, column)

		const lower = normalized.toLowerCase()
		if (!insensitive.has(lower)) {
			insensitive.set(lower, column)
		}
	}

	return { exact, insensitive }
}

const sanitizeCsvRows = (
	rows: Record<string, unknown>[],
	columns: IColumn[] = [],
) => {
	const { exact, insensitive } = buildColumnLookup(columns)
	const invalidColumns = new Set<string>()

	const sanitizedRows = rows
		.map((row) => {
			const sanitizedRow: Record<string, unknown> = {}

			for (const [rawHeader, rawValue] of Object.entries(row)) {
				if (rawHeader === PAPAPARSE_EXTRA_COLUMN) {
					continue
				}

				const normalizedHeader = normalizeHeader(rawHeader)
				if (!normalizedHeader) continue

				const matchedColumn =
					exact.get(normalizedHeader) ??
					insensitive.get(normalizedHeader.toLowerCase()) ??
					null

				if (columns.length > 0 && !matchedColumn) {
					invalidColumns.add(normalizedHeader)
					continue
				}

				const targetColumnName =
					matchedColumn?.column_name ?? normalizedHeader
				const targetColumnType = matchedColumn?.data_type

				sanitizedRow[targetColumnName] = parseCellValue(
					rawValue,
					targetColumnType,
				)
			}

			return sanitizedRow
		})
		.filter((row) => Object.keys(row).length > 0)

	const resolvedColumns =
		columns.length > 0 ?
			columns
				.map((column) => column.column_name)
				.filter((columnName) =>
					sanitizedRows.some((row) => columnName in row),
				)
		:	Array.from(
				new Set(
					sanitizedRows.flatMap((row) => Object.keys(row)),
				),
			)

	return {
		rows: sanitizedRows,
		columns: resolvedColumns,
		invalidColumns: Array.from(invalidColumns),
	}
}

export type CsvImportErrorCode =
	| 'EMPTY_CSV'
	| 'PARSE_FAILED'
	| 'INVALID_COLUMNS'
	| 'NO_USABLE_COLUMNS'

export interface CsvImportError {
	code: CsvImportErrorCode
	invalidColumns?: string[]
}

interface GenerateInsertSqlFromCsvOptions {
	tableName: string
	dialect: DataSourceType
	columns?: IColumn[]
}

export const generateInsertSqlFromCsv = (
	file: File,
	{ tableName, dialect, columns = [] }: GenerateInsertSqlFromCsvOptions,
	onSuccess: (sql: string) => void,
	onError?: (error: CsvImportError) => void,
): void => {
	Papa.parse(file, {
		header: true,
		skipEmptyLines: true,
		complete: (results: Papa.ParseResult<Record<string, unknown>>) => {
			if (results.errors.length > 0) {
				onError?.({ code: 'PARSE_FAILED' })
				return
			}

			const data = results.data as Record<string, unknown>[]

			if (!data.length) {
				onError?.({ code: 'EMPTY_CSV' })
				return
			}

			const sanitized = sanitizeCsvRows(data, columns)

			if (sanitized.invalidColumns.length > 0) {
				onError?.({
					code: 'INVALID_COLUMNS',
					invalidColumns: sanitized.invalidColumns,
				})
				return
			}

			if (!sanitized.rows.length) {
				onError?.({ code: 'EMPTY_CSV' })
				return
			}

			if (!sanitized.columns.length) {
				onError?.({ code: 'NO_USABLE_COLUMNS' })
				return
			}

			const sql = buildInsertSqlFromRows({
				tableName,
				rows: sanitized.rows,
				columns: sanitized.columns,
				dialect,
			})

			if (!sql.trim()) {
				onError?.({ code: 'NO_USABLE_COLUMNS' })
				return
			}

			onSuccess(sql)
		},
		error: (err: Error) => {
			console.error('Parse CSV failed:', err)
			onError?.({ code: 'PARSE_FAILED' })
		},
	})
}
