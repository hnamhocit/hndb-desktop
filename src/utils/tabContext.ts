import { ITab } from '@/interfaces'

type MaybeTab = Partial<ITab> | null | undefined

export const getTabConnectionId = (tab: MaybeTab) =>
	tab?.connectionId ?? tab?.dataSourceId ?? tab?.workspaceId ?? null

export const buildDatabaseCacheKey = (
	connectionId: string | null | undefined,
	database: string | null | undefined,
) => {
	if (!connectionId || !database) return ''
	return `${connectionId}-${database}`
}

export const buildRelationshipCacheKey = (
	connectionId: string | null | undefined,
	database: string | null | undefined,
	table: string | null | undefined,
) => {
	if (!connectionId || !database || !table) return ''
	return `${connectionId}-${database}-${table}`
}

export const buildTablePath = (
	connectionId: string | null | undefined,
	database: string | null | undefined,
	table: string | null | undefined,
	suffix?: string,
) => {
	if (!connectionId || !database || !table) return ''

	let tablePath = `/data_sources/${connectionId}/databases/${database}/tables/${table}`

	if (suffix) {
		tablePath += `/${suffix}`
	}

	return tablePath
}
