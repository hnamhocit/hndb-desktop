export const getSafeDisplayValue = (val: unknown, dataType: string) => {
	if (val === null || val === undefined) return null
	let parsed = val

	if (typeof val === 'object' && val !== null) {
		if ('type' in val && (val as { type: string }).type === 'Buffer') {
			parsed = (val as unknown as { data: number[] }).data[0] ?? 0
		} else if (val instanceof Date) {
			parsed = val.toISOString() // Đề phòng object Date
		} else {
			return JSON.stringify(val, null, 2)
		}
	}

	const strVal = String(parsed)
	const typeLower = dataType.toLowerCase()

	if (
		typeLower.includes('bool') ||
		typeLower.includes('bit') ||
		typeLower.includes('tinyint(1)')
	) {
		return strVal === '1' || strVal.toLowerCase() === 'true' ?
				'true'
			:	'false'
	}

	if (typeLower === 'date') {
		return strVal.split('T')[0]
	}
	if (typeLower.includes('timestamp') || typeLower.includes('datetime')) {
		return strVal.replace('T', ' ').replace(/\.\d+/, '')
	}

	return strVal
}
