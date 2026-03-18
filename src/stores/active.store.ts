import { create } from 'zustand'

interface ActiveStore {
	activeTabId: string | null
	setActiveTabId: (id: string | null) => void

	connectionId: string | null
	setConnectionId: (id: string | null) => void

	database: string | null
	setDatabase: (database: string | null) => void

	table: string | null
	setTable: (table: string | null) => void
}

export const useActiveStore = create<ActiveStore>((set) => ({
	activeTabId: null,
	setActiveTabId: (id) => set({ activeTabId: id }),

	connectionId: null,
	setConnectionId: (id) => set({ connectionId: id }),

	database: null,
	setDatabase: (database) => set({ database: database }),

	table: null,
	setTable: (table) => set({ table: table }),
}))
