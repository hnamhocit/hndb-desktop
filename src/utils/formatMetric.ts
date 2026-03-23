const COMPACT_COUNT_FORMATTER = new Intl.NumberFormat('en-US', {
	notation: 'compact',
	compactDisplay: 'short',
	maximumFractionDigits: 1,
})

const normalizeNumericInput = (value: number | null | undefined) =>
	typeof value === 'number' && Number.isFinite(value) ? value : 0

export const formatCompactCount = (value: number | null | undefined) => {
	const safeValue = Math.round(normalizeNumericInput(value))

	if (Math.abs(safeValue) < 1000) {
		return `${safeValue}`
	}

	return COMPACT_COUNT_FORMATTER.format(safeValue).toLowerCase()
}

export const formatDurationMs = (durationMs?: number | null) => {
	const safeDuration = normalizeNumericInput(durationMs)

	if (safeDuration <= 0) return '0ms'
	if (safeDuration >= 1000) return `${(safeDuration / 1000).toFixed(1)}s`
	if (safeDuration >= 100) return `${Math.round(safeDuration)}ms`
	return `${safeDuration.toFixed(1)}ms`
}
