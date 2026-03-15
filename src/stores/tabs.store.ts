import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { ITab } from '@/interfaces'

type ContentById = Record<string, string>

type TabsState = {
	tabs: ITab[]
	activeTabId: string | null

	setTabs: (tabs: ITab[]) => void
	setActiveTabId: (id: string | null) => void

	addTab: (tab: ITab) => void
	updateTab: (id: string, patch: Partial<ITab>) => void

	contentById: ContentById
	commitContent: (id: string, content: string) => void

	removeTab: (id: string) => void
}

export const useTabsStore = create<TabsState>()(
	persist(
		(set) => ({
			tabs: [],
			activeTabId: null,

			setTabs: (tabs) => set({ tabs }),
			setActiveTabId: (id) => set({ activeTabId: id }),

			addTab: (tab) =>
				set((state) => ({
					tabs: [...state.tabs, tab],
				})),

			updateTab: (id, patch) =>
				set((state) => ({
					tabs: state.tabs.map((tab) =>
						tab.id === id ? { ...tab, ...patch } : tab,
					),
				})),

			contentById: {},
			commitContent: (id, content) =>
				set((state) => ({
					contentById: {
						...state.contentById,
						[id]: content,
					},
				})),

			removeTab: (id) =>
				set((state) => {
					const closedTabIndex = state.tabs.findIndex(
						(tab) => tab.id === id,
					)

					const newTabs = state.tabs.filter((tab) => tab.id !== id)

					let newActiveTabId = state.activeTabId

					if (state.activeTabId === id) {
						if (newTabs.length === 0) {
							newActiveTabId = null
						} else {
							const nextIndex =
								closedTabIndex >= newTabs.length ?
									newTabs.length - 1
								:	closedTabIndex

							newActiveTabId = newTabs[nextIndex]?.id ?? null
						}
					}

					return {
						tabs: newTabs,
						activeTabId: newActiveTabId,
					}
				}),
		}),
		{
			name: 'tabs-store',
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				tabs: state.tabs,
				activeTabId: state.activeTabId,
				contentById: state.contentById,
			}),
		},
	),
)
