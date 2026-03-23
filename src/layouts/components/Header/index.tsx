'use client'

import {
	LogOutIcon,
	MoonIcon,
	PanelLeftIcon,
	SettingsIcon,
	SunIcon,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/hooks'
import { authService } from '@/services'
import {
	useActiveStore,
	useConnectionStore,
	useDataEditorStore,
	useMetadataStore,
	usePreferencesStore,
	useTabsStore,
	useUserStore,
} from '@/stores'
import DataSourceSearch from './DataSourceSearch'

interface HeaderProps {
	onToggleSidebar?: () => void
}

// Custom class cho các nút icon trên Titlebar (không viền, nhỏ gọn)
const toolbarButtonClass =
	'inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'

const Header = ({ onToggleSidebar }: HeaderProps) => {
	const { user, setUser } = useUserStore()
	const theme = usePreferencesStore((state) => state.theme)
	const toggleTheme = usePreferencesStore((state) => state.toggleTheme)
	const language = usePreferencesStore((state) => state.language)
	const toggleLanguage = usePreferencesStore((state) => state.toggleLanguage)
	const { t } = useI18n()
	const [isLoggingOut, setIsLoggingOut] = useState(false)
	const isDarkMode = theme === 'dark'

	const handleLogout = async () => {
		setIsLoggingOut(true)
		try {
			await authService.logout()
			setUser(null)

			useTabsStore.setState({
				tabs: [],
				contentById: {},
			})
			useTabsStore.persist.clearStorage()
			useActiveStore.setState({
				activeTabId: null,
				connectionId: null,
				database: null,
				table: null,
			})
			useConnectionStore.setState({
				connections: [],
			})

			useMetadataStore.setState({
				databases: {},
				schema: {},
				relationships: {},
			})

			useDataEditorStore.setState({ tablesState: {} })
			toast.success(t('toast.logoutSuccess'))
		} catch (error) {
			console.error('Logout failed:', error)
			toast.error(t('toast.logoutFailed'))
		} finally {
			setIsLoggingOut(false)
		}
	}

	return (
		<motion.header
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: 'easeOut' }}
			// Giảm height xuống h-11, bỏ select text để giống app native
			className='h-12 xl:h-14 shrink-0 border-b border-border bg-background flex items-center justify-between px-2.5 xl:px-3 select-none'>
			{/* 1. TRÁI: Logo & Tên App (Chiếm 1/3) */}
			<div className='flex min-w-0 flex-1 items-center gap-2'>
				<motion.button
					whileTap={{ scale: 0.95 }}
					onClick={onToggleSidebar}
					className={`${toolbarButtonClass} md:hidden mr-1`}>
					<PanelLeftIcon className='w-4 h-4' />
				</motion.button>

				<motion.div whileHover={{ scale: 1.05 }}>
					<Link
						to='/'
						className='flex items-center gap-2.5 xl:gap-3'>
						<img
							src='/logo.png'
							alt='Logo'
							width={30}
							height={30}
							className='h-7 w-7 xl:h-8 xl:w-8 object-fit rounded-sm'
						/>

						<div>
							<span className='text-[13px] xl:text-sm font-bold tracking-widest text-foreground'>
								HNDB
							</span>
							<div className='text-[10px] xl:text-xs font-medium text-yellow-500'>
								Community edition
							</div>
						</div>
					</Link>
				</motion.div>
			</div>

			{/* 2. GIỮA: Command Palette / Search (Chiếm 1/3, căn giữa tuyệt đối) */}
			<div className='hidden lg:flex justify-center flex-1 px-3 max-w-xl'>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.35, delay: 0.1 }}
					className='w-full'>
					{/* Giả định DataSourceSearch của bạn sẽ render một thanh input.
					    Bạn có thể cần vào trong component đó để chỉnh h-7, text-xs để nó mỏng lại nhé */}
					<DataSourceSearch />
				</motion.div>
			</div>

			{/* 3. PHẢI: Các công cụ & User (Chiếm 1/3, căn phải) */}
			<div className='flex min-w-0 flex-1 items-center justify-end gap-1 xl:gap-1.5'>
				<motion.div whileTap={{ scale: 0.95 }}>
					<button
						onClick={() => void toggleTheme()}
						className={toolbarButtonClass}>
						{isDarkMode ?
							<MoonIcon className='w-4 h-4' />
							: <SunIcon className='w-4 h-4' />}
					</button>
				</motion.div>

				<motion.div whileTap={{ scale: 0.95 }}>
					<button
						onClick={() => void toggleLanguage()}
						className='inline-flex h-6 xl:h-7 items-center justify-center rounded-md px-2 text-[10px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'>
						{language.toUpperCase()}
					</button>
				</motion.div>

				{user ?
					<>
						{/* Divider nhỏ phân cách tool và avatar */}
						<div className='h-4 w-px bg-border mx-1 hidden sm:block'></div>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<motion.button
									whileHover={{ scale: 1.05 }}
									className='ml-1 outline-none rounded-full ring-offset-background focus-visible:ring-2 focus-visible:ring-ring'>
									<Avatar className='h-5 w-5 xl:h-6 xl:w-6 border border-border/50 shadow-sm'>
										<AvatarImage
											src={
												user.photo_url ||
												'/resources/default-user.jpg'
											}
										/>
										<AvatarFallback className='text-[10px] font-semibold bg-primary/10 text-primary'>
											{user.name
												?.substring(0, 2)
												.toUpperCase() || 'U'}
										</AvatarFallback>
									</Avatar>
								</motion.button>
							</DropdownMenuTrigger>

							<DropdownMenuContent
								align='end'
								className='w-56'>
								<DropdownMenuLabel className='max-w-60 truncate font-mono text-xs'>
									{user.name || t('common.user')}
								</DropdownMenuLabel>
								<DropdownMenuSeparator />

								<DropdownMenuItem asChild>
									<Link
										to='/me/settings'
										className='text-xs cursor-pointer'>
										<SettingsIcon className='w-4 h-4 mr-2 text-muted-foreground' />
										{t('common.settings')}
									</Link>
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								<DropdownMenuItem
									variant='destructive'
									disabled={isLoggingOut}
									onSelect={handleLogout}
									className='text-xs cursor-pointer'>
									<LogOutIcon className='w-4 h-4 mr-2' />
									{isLoggingOut ?
										t('common.loggingOut')
										: t('common.logout')}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</>
					: null}
			</div>
		</motion.header>
	)
}

export default Header
