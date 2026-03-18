export type TabType = 'query' | 'table'

export interface ITab {
	id: string
	type: TabType
	title: string

	workspaceId?: string | null
	connectionId?: string | null
	dataSourceId?: string | null
	database: string | null
	table: string | null
}
