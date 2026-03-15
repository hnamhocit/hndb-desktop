import Papa from 'papaparse'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { generateInsertSqlFromCsv } from './fromCsv'

vi.mock('papaparse', () => ({
	default: {
		parse: vi.fn(),
	},
}))

describe('generateInsertSqlFromCsv', () => {
	beforeEach(() => {
		vi.restoreAllMocks()
	})

	it('alerts when parsed csv is empty', () => {
		const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
		const onSuccess = vi.fn()
		const file = new File([''], 'users.csv', { type: 'text/csv' })

		vi.mocked(Papa.parse).mockImplementation((_file, config) => {
			config.complete?.({
				data: [],
				errors: [],
				meta: {},
			} as never)
		})

		generateInsertSqlFromCsv(file, 'users', onSuccess)

		expect(alertSpy).toHaveBeenCalledWith('File CSV trống!')
		expect(onSuccess).not.toHaveBeenCalled()
	})

	it('calls onSuccess with generated insert sql when csv has data', () => {
		const onSuccess = vi.fn()
		const file = new File(['id,name\n1,Alice'], 'users.csv', {
			type: 'text/csv',
		})

		vi.mocked(Papa.parse).mockImplementation((_file, config) => {
			config.complete?.({
				data: [{ id: '1', name: 'Alice' }],
				errors: [],
				meta: {},
			} as never)
		})

		generateInsertSqlFromCsv(file, 'users', onSuccess)

		expect(onSuccess).toHaveBeenCalledTimes(1)
		expect(onSuccess).toHaveBeenCalledWith(
			"INSERT INTO `users` (`id`, `name`) VALUES\n(1, 'Alice');",
		)
	})

	it('logs parse error when Papa.parse fails', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
		const onSuccess = vi.fn()
		const file = new File(['bad'], 'bad.csv', { type: 'text/csv' })
		const parseError = new Error('Parse failed')

		vi.mocked(Papa.parse).mockImplementation((_file, config) => {
			config.error?.(parseError, file)
		})

		generateInsertSqlFromCsv(file, 'users', onSuccess)

		expect(errorSpy).toHaveBeenCalledWith('Parse CSV failed:', parseError)
		expect(onSuccess).not.toHaveBeenCalled()
	})
})
