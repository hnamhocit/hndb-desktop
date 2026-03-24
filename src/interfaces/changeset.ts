export interface IRecordChangeset {
	inserts: Record<string, unknown>[]
	updates: {
		id: string | number
		changes: Record<string, unknown>
	}[]
	deletes: (string | number)[]
}
