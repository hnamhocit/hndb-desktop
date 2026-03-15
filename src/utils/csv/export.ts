export const escapeCsvValue = (value: unknown, separator = ','): string => {
	if (value === null || value === undefined) return ''

	const stringValue = String(value)

	if (
		stringValue.includes(separator) ||
		stringValue.includes('\n') ||
		stringValue.includes('"')
	) {
		return `"${stringValue.replace(/"/g, '""')}"`
	}

	return stringValue
}

export const buildCsvContent = (
	rows: Record<string, unknown>[],
	separator = ',',
): string => {
	if (!rows || rows.length === 0) return ''

	const keys = Object.keys(rows[0])

	const header = keys.join(separator)
	const body = rows
		.map((row) =>
			keys
				.map((key) => escapeCsvValue(row[key], separator))
				.join(separator),
		)
		.join('\n')

	return `${header}\n${body}`
}

export const exportToCsv = (
	filename: string,
	rows: Record<string, unknown>[],
): void => {
	if (!rows || rows.length === 0) {
		console.warn('Không có dữ liệu để xuất CSV')
		return
	}

	const csvContent = buildCsvContent(rows)
	const blob = new Blob(['\ufeff' + csvContent], {
		type: 'text/csv;charset=utf-8;',
	})

	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.setAttribute('download', `${filename}.csv`)
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}
