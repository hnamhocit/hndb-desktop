import { useTabsStore } from '@/stores'

export const useActiveTab = () =>
	useTabsStore(
		(state) =>
			state.tabs.find((tab) => tab.id === state.activeTabId) ?? null,
	)
