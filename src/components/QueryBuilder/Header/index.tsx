import {
	HistoryIcon,
	PaletteIcon,
	PlayIcon,
	SaveIcon,
	WandSparklesIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useI18n } from '@/hooks'
import {
	APP_EDITOR_THEME_OPTIONS,
	type AppEditorTheme,
} from '@/lib/editor-theme'
import { formatShortcutForDisplay } from '@/lib/keybindings'
import SqlContextSelector from './SqlContextSelector'

type HeaderProps = {
	onRunQuery: () => void
	onSaveQuery: () => void
	onFormatQuery: () => void
	onSelectHistoryQuery: (query: string) => void
	isLoading: boolean
	isDisconnected: boolean
	hasQuery: boolean
	recentQueries: Array<{ query: string; savedAt: string }>
	editorTheme: AppEditorTheme
	onChangeEditorTheme: (theme: AppEditorTheme) => void
	openSettingsShortcut: string
}

const Header = ({
	onRunQuery,
	onSaveQuery,
	onFormatQuery,
	onSelectHistoryQuery,
	isLoading,
	isDisconnected,
	hasQuery,
	recentQueries,
	editorTheme,
	onChangeEditorTheme,
	openSettingsShortcut,
}: HeaderProps) => {
	const { t } = useI18n()

	const editorThemeOptions = APP_EDITOR_THEME_OPTIONS.map((option) => ({
		value: option.value,
		label: t(option.labelKey),
	}))

	const activeMonacoThemeLabel =
		editorThemeOptions.find((option) => option.value === editorTheme)
			?.label ?? t('query.monacoTheme.quickPicker')

	return (
		<div className='flex items-center justify-between border-b p-2 sm:p-4 space-y-2'>
			<div className='overflow-x-auto'>
				<div className='flex w-max min-w-full items-center gap-2 sm:gap-4'>
					<Button
						data-hotkey-run-query
						onClick={onRunQuery}
						disabled={isLoading || isDisconnected}
						size='sm'>
						<PlayIcon />
						{t('query.execute')}
					</Button>

					<div className='w-px h-5 sm:h-6 bg-neutral-300 dark:bg-neutral-700' />

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size='icon'
								variant='ghost'
								onClick={onSaveQuery}
								disabled={!hasQuery}
								aria-label={t('query.header.saveTooltip')}>
								<SaveIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>{t('query.header.saveTooltip')}</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size='icon'
								variant='ghost'
								onClick={onFormatQuery}
								disabled={!hasQuery}
								aria-label={t('query.header.formatTooltip')}>
								<WandSparklesIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>{t('query.header.formatTooltip')}</p>
						</TooltipContent>
					</Tooltip>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								size='icon'
								variant='ghost'
								disabled={recentQueries.length === 0}
								aria-label={t('query.header.historyTooltip')}>
								<HistoryIcon />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent
							align='start'
							className='w-105 max-w-[90vw]'>
							<DropdownMenuLabel>
								{t('query.header.historyDropdownTitle')}
							</DropdownMenuLabel>
							<DropdownMenuSeparator />

							{recentQueries.length === 0 ?
								<DropdownMenuItem disabled>
									{t('query.header.historyEmpty')}
								</DropdownMenuItem>
							:	recentQueries.map((historyItem) => (
									<DropdownMenuItem
										key={historyItem.savedAt}
										onSelect={() =>
											onSelectHistoryQuery(
												historyItem.query,
											)
										}
										className='flex flex-col items-start gap-0.5 py-2'>
										<span className='w-full truncate font-mono text-xs'>
											{historyItem.query.replace(
												/\s+/g,
												' ',
											)}
										</span>
										<span className='text-[11px] text-muted-foreground'>
											{new Date(
												historyItem.savedAt,
											).toLocaleString()}
										</span>
									</DropdownMenuItem>
								))
							}
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								size='icon'
								variant='outline'
								className='shrink-0'
								aria-label={`${t('query.monacoTheme.quickPicker')}: ${activeMonacoThemeLabel}`}>
								<PaletteIcon />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent
							align='start'
							className='w-72'>
							<DropdownMenuLabel>
								{t('query.monacoTheme.quickPicker')}
							</DropdownMenuLabel>
							<div className='px-2 pb-2 text-xs text-muted-foreground'>
								{activeMonacoThemeLabel}
							</div>
							<DropdownMenuSeparator />
							<DropdownMenuRadioGroup
								value={editorTheme}
								onValueChange={(value) =>
									onChangeEditorTheme(value as AppEditorTheme)
								}>
								{editorThemeOptions.map((option) => (
									<DropdownMenuRadioItem
										key={option.value}
										value={option.value}>
										{option.label}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
							<DropdownMenuSeparator />
							<div className='px-2 py-1 text-xs text-muted-foreground'>
								{t('query.monacoTheme.quickHint')}
							</div>
							<DropdownMenuShortcut className='px-2 pb-1 text-[11px] tracking-normal'>
								{formatShortcutForDisplay(openSettingsShortcut)}
							</DropdownMenuShortcut>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className='overflow-x-auto'>
				<SqlContextSelector />
			</div>
		</div>
	)
}

export default Header
