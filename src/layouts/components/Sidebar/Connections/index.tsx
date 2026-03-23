import clsx from 'clsx'
import { PlugIcon } from 'lucide-react'
import { useState } from 'react'

import DataSourceDialog from '@/components/DataSourceDialog'
import { supportConnections } from '@/constants'
import { useI18n } from '@/hooks'
import { useActiveStore, useConnectionStore } from '@/stores'
import ConnectionContextMenu from '../ConnectionContextMenu'

interface ConnectionsProps {
	onSelectConnection: (connectionId: string) => Promise<void> | void
	connectingId?: string | null
}

const Connections = ({
	onSelectConnection,
	connectingId = null,
}: ConnectionsProps) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const { t } = useI18n()
	const { connections, statuses } = useConnectionStore()
	const { connectionId } = useActiveStore()

	return (
		<div
			tabIndex={-1}
			data-sidebar-focus-target
			className='shrink-0 w-20 border-r outline-none'>
			<DataSourceDialog
				open={isDialogOpen}
				onOpenChange={setIsDialogOpen}>
				<div
					data-sidebar-connection-item
					tabIndex={0}
					role='button'
					onKeyDown={(event) => {
						if (event.key === 'Enter' || event.key === ' ') {
							event.preventDefault()
							setIsDialogOpen(true)
						}
					}}
					className='border-b cursor-pointer h-20 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary'>
					<PlugIcon />
				</div>
			</DataSourceDialog>

			<div className='flex max-h-[calc(100vh-5rem)] flex-col overflow-y-auto'>
				{connections.map((connection) => {
					const supportConnection = supportConnections.find(
						(source) => source.id === connection.config.driver,
					)
					const isActive = connectionId === connection.id
					const isConnected = statuses[connection.id] ?? false
					const isConnecting = connectingId === connection.id

					return (
						<ConnectionContextMenu
							ds={connection}
							key={connection.id}>
								<div
									data-sidebar-connection-item
									tabIndex={0}
									onClick={() =>
										void onSelectConnection(connection.id)
									}
									onKeyDown={(event) => {
										if (
											event.key === 'Enter' ||
											event.key === ' '
										) {
											event.preventDefault()
											void onSelectConnection(connection.id)
										}
									}}
									className={clsx(
										'relative flex h-20 cursor-pointer items-center justify-center border-b p-2 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary',
										isConnecting && 'pointer-events-none',
										isActive ?
											'bg-muted/40'
									:	'hover:bg-muted/50',
								)}>
								{isActive && (
									<div className='absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-primary' />
								)}

								<div
									className={clsx(
										'relative flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl border px-2 text-center transition-all duration-300',
										isActive ?
											'border-primary/25 bg-background text-primary shadow-sm'
										:	'border-transparent text-muted-foreground hover:border-border/70 hover:bg-background/80 hover:text-foreground',
									)}>
									<span
										className={clsx(
											'absolute right-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-background',
											isConnecting ?
												'animate-pulse bg-primary'
											: isConnected ?
												'bg-emerald-500'
											:	'bg-zinc-300 dark:bg-zinc-600',
										)}
										title={
											isConnecting ?
												t('sidebar.connectionConnecting')
											: isConnected ?
												t('sidebar.connectionActive')
											:	t('sidebar.connectionDisconnected')
										}
									/>

									<img
										src={
											supportConnection?.photoURL ||
											'/logo.png'
										}
										alt={
											supportConnection?.name ||
											connection.name
										}
										width={32}
										height={32}
										className={clsx(
											'rounded-sm object-contain transition-transform duration-300',
											isActive && 'scale-105',
										)}
									/>

									<div
										className={clsx(
											'max-w-full truncate select-none text-center text-xs font-medium',
											isActive && 'font-semibold',
										)}
										title={connection.name}>
										{connection.name}
									</div>

								</div>
							</div>
							</ConnectionContextMenu>
					)
				})}
			</div>
		</div>
	)
}

export default Connections
