export type TabType = 'query' | 'table'

export interface ITab {
	id: string
	type: TabType
	title: string

	dataSourceId: string | null
	database: string | null
	table: string | null
}
