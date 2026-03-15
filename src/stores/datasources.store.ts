import { create } from 'zustand'

import { IColumn, IDataSource, IRelationship } from '@/interfaces'

type Schema = Record<string, IColumn[]>

export type ConnectionStatus = 'connected' | 'disconnected'

// database <dataSourceId, string[]>
// schema <dataSourceId-databaseId, <table, columns[]>>
// relationships <dataSourceId-databaseId-table, IRelationship[]>

interface DataSourcesStore {
	// 1. Trả Data Source về nguyên bản
	datasources: IDataSource[]
	setDatasources: (datasources: IDataSource[]) => void

	// 2. Tách riêng bảng trạng thái (Hash Map)
	connectionStatuses: Record<string, boolean>
	updateDataSourceStatus: (id: string, status: boolean) => void
	setBulkConnectionStatuses: (statuses: Record<string, boolean>) => void

	dataSourceId: string | null
	setDataSourceId: (id: string | null) => void

	cachedDatabases: Record<string, string[]>
	setCachedDatabases: (dataSourceId: string, databases: string[]) => void

	cachedSchema: Record<string, Schema>
	setCachedSchema: (id: string, schema: Schema) => void

	database: string | null
	setDatabase: (db: string | null) => void

	table: string | null
	setTable: (table: string | null) => void

	cachedRelationships: Record<string, IRelationship[]>
	setCachedRelationships: (id: string, relationships: IRelationship[]) => void
}

export const useDataSourcesStore = create<DataSourcesStore>((set) => ({
	datasources: [],
	setDatasources: (datasources) => set({ datasources }),

	// Khởi tạo bảng trạng thái rỗng
	connectionStatuses: {},

	// Cập nhật 1 trạng thái (Dành cho SSE Realtime) -> O(1) Cực nhanh!
	updateDataSourceStatus: (id, status) =>
		set((state) => ({
			connectionStatuses: {
				...state.connectionStatuses,
				[id]: status,
			},
		})),

	// Nạp nhiều trạng thái cùng lúc (Dành cho lúc gọi API getBulkStatus ban đầu)
	setBulkConnectionStatuses: (statuses) =>
		set({ connectionStatuses: statuses }),

	dataSourceId: null,
	setDataSourceId: (dataSourceId) => set({ dataSourceId }),

	cachedDatabases: {},
	setCachedDatabases: (dataSourceId, databases) =>
		set((state) => ({
			cachedDatabases: {
				...state.cachedDatabases,
				[dataSourceId]: databases,
			},
		})),

	cachedSchema: {},
	setCachedSchema: (id, schema) =>
		set((state) => ({
			cachedSchema: {
				...state.cachedSchema,
				[id]: schema,
			},
		})),

	database: null,
	setDatabase: (database) => set({ database }),

	table: null,
	setTable: (table) => set({ table }),

	cachedRelationships: {},
	setCachedRelationships: (id, relationships) =>
		set((state) => ({
			cachedRelationships: {
				...state.cachedRelationships,
				[id]: relationships,
			},
		})),
}))
