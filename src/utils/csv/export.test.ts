import { describe, expect, it } from 'vitest'

import { buildCsvContent, escapeCsvValue } from './export'

describe('csv/export', () => {
	it('escapes values that contain separator, newline, or quotes', () => {
		expect(escapeCsvValue('Alice,Bob')).toBe('"Alice,Bob"')
		expect(escapeCsvValue('line1\nline2')).toBe('"line1\nline2"')
		expect(escapeCsvValue('He said "hello"')).toBe('"He said ""hello"""')
	})

	it('builds csv from rows using the first row keys', () => {
		expect(
			buildCsvContent([
				{ id: 1, name: 'Alice' },
				{ id: 2, name: 'Bob' },
			]),
		).toBe('id,name\n1,Alice\n2,Bob')
	})

	it('renders nullish values as empty cells', () => {
		expect(buildCsvContent([{ id: 1, name: null, email: undefined }])).toBe(
			'id,name,email\n1,,',
		)
	})
})
