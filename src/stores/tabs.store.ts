import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { ITab } from '@/interfaces'
import { getTabConnectionId } from '@/utils'
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
	removeTabsByConnection: (connectionId: string) => void
}

const syncActiveSelection = (tabs: ITab[], activeTabId: string | null) => {
	const nextActiveTab =
		(activeTabId ? tabs.find((tab) => tab.id === activeTabId) : null) ?? null

	useActiveStore.setState({
		activeTabId,
		connectionId: getTabConnectionId(nextActiveTab),
		database: nextActiveTab?.database ?? null,
		table: nextActiveTab?.table ?? null,
	})
}

export const useTabsStore = create<TabsState>()(
	persist(
		(set) => ({
			tabs: [],

			setTabs: (tabs) =>
				set(() => {
					if (tabs.length === 0) {
						syncActiveSelection([], null)
						return { tabs: [] }
					}

					const currentActiveTabId = useActiveStore.getState().activeTabId
					if (
						currentActiveTabId &&
						!tabs.some((tab) => tab.id === currentActiveTabId)
					) {
						syncActiveSelection(
							tabs,
							tabs[tabs.length - 1]?.id ?? null,
						)
					}

					return { tabs }
				}),

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

					syncActiveSelection(newTabs, newActiveTabId)

					return {
						tabs: newTabs,
						contentById: nextContentById,
					}
				}),

			removeTabsByConnection: (connectionId) =>
				set((state) => {
					const tabIdsToRemove = new Set(
						state.tabs
							.filter(
								(tab) => getTabConnectionId(tab) === connectionId,
							)
							.map((tab) => tab.id),
					)

					if (tabIdsToRemove.size === 0) {
						return {}
					}

					const nextTabs = state.tabs.filter(
						(tab) => !tabIdsToRemove.has(tab.id),
					)
					const nextContentById = Object.fromEntries(
						Object.entries(state.contentById).filter(
							([tabId]) => !tabIdsToRemove.has(tabId),
						),
					)

					const currentActiveTabId = useActiveStore.getState().activeTabId
					const nextActiveTabId =
						currentActiveTabId &&
						!tabIdsToRemove.has(currentActiveTabId) &&
						nextTabs.some((tab) => tab.id === currentActiveTabId) ?
							currentActiveTabId
						:	(nextTabs[nextTabs.length - 1]?.id ?? null)

					syncActiveSelection(nextTabs, nextActiveTabId)

					return {
						tabs: nextTabs,
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
