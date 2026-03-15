import { invoke } from '@tauri-apps/api/core'
import clsx from 'clsx'
import { PlugIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import DataSourceDialog from '@/components/DataSourceDialog'
import { supportDataSources } from '@/constants/supportDataSources'

interface SidebarProps {
	isMobileOpen?: boolean
	onCloseMobile?: () => void
}

interface SavedConnection {
	id: string
	name: string
	config: {
		driver: 'postgres' | 'mysql' | 'mariadb' | 'sqlite' | 'mssql'
	}
	created_at: string
}

const DRIVER_TO_SOURCE_ID = {
	postgres: 'postgresql',
	mysql: 'mysql',
	mariadb: 'maria-db',
	sqlite: 'sqlite',
	mssql: 'sql-server',
} as const

const Sidebar = ({ isMobileOpen = false, onCloseMobile }: SidebarProps) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [connections, setConnections] = useState<SavedConnection[]>([])

	useEffect(() => {
		;(async () => {
			try {
				const data = await invoke<SavedConnection[]>('list_connections')
				setConnections(data)
			} catch (error) {
				console.error('Failed to load saved connections:', error)
			}
		})()
	}, [isDialogOpen])

	return (
		<div className='flex'>
			<div className='shrink-0 w-20 border-r'>
				<DataSourceDialog
					open={isDialogOpen}
					onOpenChange={setIsDialogOpen}>
					<div className='border-b cursor-pointer h-20 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors duration-300'>
						<PlugIcon />
					</div>
				</DataSourceDialog>

				<div className='flex max-h-[calc(100vh-5rem)] flex-col overflow-y-auto'>
					{connections.map((connection) => {
						const sourceId =
							DRIVER_TO_SOURCE_ID[connection.config.driver]
						const supportDataSource = supportDataSources.find(
							(source) => source.id === sourceId,
						)

						return (
							<div
								key={connection.id}
								className='flex h-20 flex-col items-center justify-center gap-1 border-b p-2 hover:bg-primary hover:text-primary-foreground transition-colors duration-300 cursor-pointer'>
								<img
									src={
										supportDataSource?.photoURL ||
										'/logo.png'
									}
									alt={
										supportDataSource?.name ||
										connection.name
									}
									width={32}
									height={32}
									className='rounded-sm object-contain'
								/>

								<div
									className='max-w-full truncate select-none text-center text-xs font-medium'
									title={connection.name}>
									{connection.name}
								</div>
							</div>
						)
					})}
				</div>
			</div>

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
					'border-r overflow-y-auto',
					'fixed top-12 bottom-0 left-0 z-40 w-[86vw] max-w-92 transition-transform duration-200 md:static md:top-auto md:bottom-auto md:left-auto md:z-auto md:w-92 md:shrink-0 bg-muted/50',
					isMobileOpen ? 'translate-x-0' : '-translate-x-full',
					'md:translate-x-0',
				)}>
				{/* <DataSources /> */}
			</div>
		</div>
	)
}

export default Sidebar
