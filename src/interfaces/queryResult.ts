export interface IQueryResult {
	rows: Record<string, unknown>[]
	durationMs: number
	isLimited: boolean
	affectedRows: number | null
	command: string | null
	sizeBytes?: number
}
