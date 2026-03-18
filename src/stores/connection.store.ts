import { create } from 'zustand'

import { IConnection } from '@/interfaces'

interface ConnectionStore {
	connections: IConnection[]
	setConnections: (connections: IConnection[]) => void

	statuses: Record<string, boolean> // dataSourceId -> boolean
	updateStatus: (id: string, status: boolean) => void
	setBulkStatuses: (statuses: Record<string, boolean>) => void
	clearStatus: (id: string) => void
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
	connections: [],
	setConnections: (connections) => set({ connections }),

	statuses: {},
	updateStatus: (id, status) =>
		set((state) => ({
			statuses: { ...state.statuses, [id]: status },
		})),
	setBulkStatuses: (statuses) => set({ statuses }),
	clearStatus: (id) =>
		set((state) => {
			const nextStatuses = { ...state.statuses }
			delete nextStatuses[id]
			return { statuses: nextStatuses }
		}),
}))
