import { useState } from 'react'
import clsx from 'clsx'

import { useActiveTab, useI18n } from '@/hooks'
import { connectionService } from '@/services'
import {
	useActiveStore,
	useConnectionStore,
	useTabsStore,
} from '@/stores'
import { notifyError } from '@/utils'
import Connections from './Connections'
import Databases from './Databases'

interface SidebarProps {
	isMobileOpen?: boolean
	onCloseMobile?: () => void
}

const Sidebar = ({ isMobileOpen = false, onCloseMobile }: SidebarProps) => {
	const [connectingId, setConnectingId] = useState<string | null>(null)
	const { t } = useI18n()
	const activeTab = useActiveTab()
	const { updateTab } = useTabsStore()
	const statuses = useConnectionStore((state) => state.statuses)
	const updateStatus = useConnectionStore((state) => state.updateStatus)
	const { connectionId, setConnectionId, setDatabase, setTable } =
		useActiveStore()

	const handleSelectConnection = async (nextConnectionId: string) => {
		setConnectionId(nextConnectionId)
		setDatabase(null)
		setTable(null)

		if (activeTab?.type === 'query') {
			updateTab(activeTab.id, {
				workspaceId: nextConnectionId,
				connectionId: nextConnectionId,
				dataSourceId: nextConnectionId,
				database: null,
				table: null,
			})
		}

		if (statuses[nextConnectionId] !== false || connectingId === nextConnectionId) {
			return
		}

		setConnectingId(nextConnectionId)

		try {
			await connectionService.connect(nextConnectionId)
			updateStatus(nextConnectionId, true)
		} catch (error) {
			updateStatus(nextConnectionId, false)
			notifyError(error, t('errors.failedConnectDataSource'))
		} finally {
			setConnectingId((currentId) =>
				currentId === nextConnectionId ? null : currentId,
			)
		}
	}

	return (
		<div className='flex'>
			<Connections
				onSelectConnection={handleSelectConnection}
				connectingId={connectingId}
			/>

			<div
				className={clsx(
					'fixed inset-0 z-30 bg-black/45 backdrop-blur-[1px] transition-opacity md:hidden',
					isMobileOpen ?
						'opacity-100 pointer-events-auto'
					:	'opacity-0 pointer-events-none',
				)}
				onClick={onCloseMobile}
			/>

			<div
				className={clsx(
					'border-r overflow-y-auto bg-muted/40',
					'fixed top-12 bottom-0 left-0 z-40 w-[86vw] max-w-92 transition-transform duration-200 md:static md:top-auto md:bottom-auto md:left-auto md:z-auto md:w-92 md:shrink-0',
					isMobileOpen ? 'translate-x-0' : '-translate-x-full',
				'md:translate-x-0',
				)}>
				{connectionId ?
					<Databases dataSourceId={connectionId} />
				:	<div className='px-4 py-6 text-sm text-muted-foreground'>
						{t('sidebar.selectConnection')}
					</div>
				}
			</div>
		</div>
	)
}

export default Sidebar
