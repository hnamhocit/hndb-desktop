export const escapeCsvValue = (value: unknown, separator = ','): string => {
	if (value === null || value === undefined) return ''

	const stringValue =
		typeof value === 'string' ? value
		: value instanceof Date ? value.toISOString()
		: typeof value === 'bigint' ? value.toString()
		: Array.isArray(value) || typeof value === 'object' ?
			JSON.stringify(value, (_, nestedValue) =>
				typeof nestedValue === 'bigint' ?
					nestedValue.toString()
				:	nestedValue,
			)
		:	String(value)

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
	columns?: string[],
	separator = ',',
): string => {
	if ((!rows || rows.length === 0) && (!columns || columns.length === 0)) {
		return ''
	}

	const keys =
		columns?.filter(Boolean) ??
		Array.from(
			new Set(rows.flatMap((row) => Object.keys(row))),
		)

	if (keys.length === 0) return ''

	const header = keys.map((key) => escapeCsvValue(key, separator)).join(separator)
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
	columns?: string[],
): void => {
	if (!rows || rows.length === 0) {
		console.warn('Không có dữ liệu để xuất CSV')
		return
	}

	const csvContent = buildCsvContent(rows, columns)
	const blob = new Blob(['\ufeff' + csvContent], {
		type: 'text/csv;charset=utf-8;',
	})

	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.setAttribute(
		'download',
		filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`,
	)
	link.style.display = 'none'
	document.body.appendChild(link)
	link.click()

	window.setTimeout(() => {
		document.body.removeChild(link)
		URL.revokeObjectURL(url)
	}, 1000)
}
