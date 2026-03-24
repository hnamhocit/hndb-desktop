import { create } from 'zustand'

import { IColumn, IRelationship } from '@/interfaces'

type Schema = Record<string, IColumn[]>

// database <dataSourceId, string[]>
// tables <dataSourceId-databaseId, string[]>
// schema <dataSourceId-databaseId, <table, columns[]>>
// relationships <dataSourceId-databaseId-table, IRelationship[]>

interface MetadataStore {
	databases: Record<string, string[]>
	setDatabases: (dataSourceId: string, databases: string[]) => void

	tables: Record<string, string[]>
	setTables: (id: string, tables: string[]) => void

	schema: Record<string, Schema>
	setSchema: (id: string, schema: Schema) => void

	relationships: Record<string, IRelationship[]>
	setRelationships: (id: string, relationships: IRelationship[]) => void
	clearConnectionMetadata: (connectionId: string) => void

	refreshTick: number
	triggerRefresh: () => void
}

export const useMetadataStore = create<MetadataStore>((set) => ({
	databases: {},
	setDatabases: (dataSourceId, databases) =>
		set((state) => ({
			databases: {
				...state.databases,
				[dataSourceId]: databases,
			},
		})),

	tables: {},
	setTables: (id, tables) =>
		set((state) => ({
			tables: {
				...state.tables,
				[id]: tables,
			},
		})),

	schema: {},
	setSchema: (id, schema) =>
		set((state) => ({
			schema: {
				...state.schema,
				[id]: schema,
			},
		})),

	relationships: {},
	setRelationships: (id, relationships) =>
		set((state) => ({
			relationships: {
				...state.relationships,
				[id]: relationships,
			},
		})),

	clearConnectionMetadata: (connectionId) =>
		set((state) => {
			const nextDatabases = { ...state.databases }
			delete nextDatabases[connectionId]

			const cachePrefix = `${connectionId}-`
			const nextTables = Object.fromEntries(
				Object.entries(state.tables).filter(
					([key]) => !key.startsWith(cachePrefix),
				),
			)
			const nextSchema = Object.fromEntries(
				Object.entries(state.schema).filter(
					([key]) => !key.startsWith(cachePrefix),
				),
			)
			const nextRelationships = Object.fromEntries(
				Object.entries(state.relationships).filter(
					([key]) => !key.startsWith(cachePrefix),
				),
			)

			return {
				databases: nextDatabases,
				tables: nextTables,
				schema: nextSchema,
				relationships: nextRelationships,
			}
		}),

	refreshTick: 0,
	triggerRefresh: () =>
		set((state) => ({ refreshTick: state.refreshTick + 1 })),
}))
