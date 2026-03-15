import { useTabsStore } from '@/stores'

export const useActiveTablePath = (suffix?: string) => {
	return useTabsStore((state) => {
		const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId)

		if (!activeTab) return ''

		const { database, dataSourceId, table } = activeTab

		let tablePath = `/data_sources/${dataSourceId}/databases/${database}/tables/${table}`

		if (suffix) {
			tablePath += `/${suffix}`
		}

		return tablePath
	})
}
