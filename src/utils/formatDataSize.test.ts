import { describe, expect, it } from 'vitest'

import { formatDataSize } from './formatDataSize'

describe('formatDataSize', () => {
	it('returns 0 B for zero bytes', () => {
		expect(formatDataSize(0)).toBe('0 B')
	})

	it('formats bytes smaller than 1024 as B', () => {
		expect(formatDataSize(1)).toBe('1 B')
		expect(formatDataSize(512)).toBe('512 B')
		expect(formatDataSize(1023)).toBe('1023 B')
	})

	it('formats 1024 bytes as 1 KB', () => {
		expect(formatDataSize(1024)).toBe('1 KB')
	})

	it('formats megabytes correctly', () => {
		expect(formatDataSize(1024 * 1024)).toBe('1 MB')
		expect(formatDataSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
	})

	it('formats gigabytes correctly', () => {
		expect(formatDataSize(1024 ** 3)).toBe('1 GB')
		expect(formatDataSize(2.25 * 1024 ** 3)).toBe('2.25 GB')
	})

	it('rounds to 2 decimal places', () => {
		expect(formatDataSize(1536)).toBe('1.5 KB')
		expect(formatDataSize(1555)).toBe('1.52 KB')
	})

	it('removes trailing zeroes after rounding', () => {
		expect(formatDataSize(2048)).toBe('2 KB')
		expect(formatDataSize(10 * 1024)).toBe('10 KB')
	})

	it('formats terabytes correctly', () => {
		expect(formatDataSize(1024 ** 4)).toBe('1 TB')
	})
})
