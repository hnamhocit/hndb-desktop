import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { ITab } from '@/interfaces'
import { useActiveStore } from './active.store'

type ContentById = Record<string, string>

type TabsState = {
	tabs: ITab[]
	setTabs: (tabs: ITab[]) => void

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

			setTabs: (tabs) => set({ tabs }),

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
					const { [id]: _removedContent, ...nextContentById } =
						state.contentById

					let newActiveTabId = useActiveStore.getState().activeTabId

					if (newActiveTabId === id) {
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

					useActiveStore.setState({ activeTabId: newActiveTabId })

					return {
						tabs: newTabs,
						contentById: nextContentById,
					}
				}),
		}),
		{
			name: 'tabs-store',
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				tabs: state.tabs,
				contentById: state.contentById,
			}),
		},
	),
)
