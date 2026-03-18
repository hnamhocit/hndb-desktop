import { useActiveStore, useTabsStore } from '@/stores'
import { buildTablePath, getTabConnectionId } from '@/utils'

export const useActiveTablePath = (suffix?: string) => {
	const tabs = useTabsStore((state) => state.tabs)
	const {
		activeTabId,
		connectionId,
		database: activeDatabase,
		table: activeTable,
	} = useActiveStore()
	const activeTab = tabs.find((tab) => tab.id === activeTabId)

	return buildTablePath(
		getTabConnectionId(activeTab) ?? connectionId,
		activeTab?.database ?? activeDatabase,
		activeTab?.table ?? activeTable,
		suffix,
	)
}
