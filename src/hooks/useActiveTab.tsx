import { useActiveStore, useTabsStore } from '@/stores'

export const useActiveTab = () => {
	const tabs = useTabsStore((state) => state.tabs)
	const activeTabId = useActiveStore((state) => state.activeTabId)

	return tabs.find((tab) => tab.id === activeTabId) ?? null
}
