import { describe, expect, it } from 'vitest'

import {
	buildInsertSqlFromRows,
	escapeSqlIdentifier,
	formatSqlCsvImportValue,
} from './index'

describe('escapeSqlIdentifier', () => {
	it('wraps identifier with backticks', () => {
		expect(escapeSqlIdentifier('users')).toBe('`users`')
	})

	it('escapes backticks inside identifier', () => {
		expect(escapeSqlIdentifier('user`name')).toBe('`user``name`')
	})
})

describe('formatSqlCsvImportValue', () => {
	it('returns NULL for nullish and empty values', () => {
		expect(formatSqlCsvImportValue(null)).toBe('NULL')
		expect(formatSqlCsvImportValue(undefined)).toBe('NULL')
		expect(formatSqlCsvImportValue('')).toBe('NULL')
		expect(formatSqlCsvImportValue('   ')).toBe('NULL')
	})

	it('returns numbers as-is', () => {
		expect(formatSqlCsvImportValue(123)).toBe('123')
		expect(formatSqlCsvImportValue(12.5)).toBe('12.5')
	})

	it('returns NULL for non-finite numbers', () => {
		expect(formatSqlCsvImportValue(NaN)).toBe('NULL')
		expect(formatSqlCsvImportValue(Infinity)).toBe('NULL')
	})

	it('formats booleans as 1 or 0', () => {
		expect(formatSqlCsvImportValue(true)).toBe('1')
		expect(formatSqlCsvImportValue(false)).toBe('0')
	})

	it('converts boolean-like strings to 1 or 0', () => {
		expect(formatSqlCsvImportValue('true')).toBe('1')
		expect(formatSqlCsvImportValue('false')).toBe('0')
		expect(formatSqlCsvImportValue('1')).toBe('1')
		expect(formatSqlCsvImportValue('0')).toBe('0')
	})

	it('quotes normal strings', () => {
		expect(formatSqlCsvImportValue('Alice')).toBe("'Alice'")
	})

	it('trims string values before formatting', () => {
		expect(formatSqlCsvImportValue('  Alice  ')).toBe("'Alice'")
	})

	it('escapes single quotes in strings', () => {
		expect(formatSqlCsvImportValue("O'Brien")).toBe("'O''Brien'")
	})
})

describe('buildInsertSqlFromRows', () => {
	it('returns empty string for empty rows', () => {
		expect(
			buildInsertSqlFromRows({
				tableName: 'users',
				rows: [],
			}),
		).toBe('')
	})

	it('builds a single INSERT statement for one row', () => {
		const sql = buildInsertSqlFromRows({
			tableName: 'users',
			rows: [{ id: 1, name: 'Alice', active: true }],
		})

		expect(sql).toBe(
			"INSERT INTO `users` (`id`, `name`, `active`) VALUES\n(1, 'Alice', 1);",
		)
	})

	it('builds INSERT statement for multiple rows', () => {
		const sql = buildInsertSqlFromRows({
			tableName: 'users',
			rows: [
				{ id: 1, name: 'Alice' },
				{ id: 2, name: 'Bob' },
			],
		})

		expect(sql).toBe(
			"INSERT INTO `users` (`id`, `name`) VALUES\n(1, 'Alice'),\n(2, 'Bob');",
		)
	})

	it('uses NULL for missing values based on first row columns', () => {
		const sql = buildInsertSqlFromRows({
			tableName: 'users',
			rows: [
				{ id: 1, name: 'Alice', age: 20 },
				{ id: 2, name: 'Bob' },
			],
		})

		expect(sql).toBe(
			"INSERT INTO `users` (`id`, `name`, `age`) VALUES\n(1, 'Alice', 20),\n(2, 'Bob', NULL);",
		)
	})

	it('splits INSERT statements by chunk size', () => {
		const sql = buildInsertSqlFromRows({
			tableName: 'users',
			rows: [
				{ id: 1, name: 'Alice' },
				{ id: 2, name: 'Bob' },
				{ id: 3, name: 'Charlie' },
			],
			chunkSize: 2,
		})

		expect(sql).toBe(
			"INSERT INTO `users` (`id`, `name`) VALUES\n(1, 'Alice'),\n(2, 'Bob');\n\nINSERT INTO `users` (`id`, `name`) VALUES\n(3, 'Charlie');",
		)
	})

	it('escapes table and column identifiers', () => {
		const sql = buildInsertSqlFromRows({
			tableName: 'user`table',
			rows: [{ 'first`name': 'Alice' }],
		})

		expect(sql).toBe(
			"INSERT INTO `user``table` (`first``name`) VALUES\n('Alice');",
		)
	})
})
