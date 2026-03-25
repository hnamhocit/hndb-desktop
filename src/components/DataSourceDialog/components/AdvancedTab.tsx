import { RotateCcwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldDescription, FieldSeparator } from '@/components/ui/field'
import { useI18n } from '@/hooks'
import type { TranslationKey } from '@/i18n/messages'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { TabsContent } from '@/components/ui/tabs'
import type { DriverProperty } from '@/schemas'
import type { DbSetting } from '../utils'

interface AdvancedTabProps {
	advancedSettings: DbSetting[]
	driverProperties: DriverProperty[]
	serverVersion: string
	isReady: boolean
	isLoading: boolean
	isEditMode: boolean
	onSettingChange: (
		settingName: string,
		nextValue: string,
		defaultValue: string,
	) => void
	onSettingReset: (settingName: string) => void
}

const EMPTY_SELECT_SENTINEL = '__HNDB_EMPTY_OPTION__'

const AdvancedTab = ({
	advancedSettings,
	driverProperties,
	serverVersion,
	isReady,
	isLoading,
	isEditMode,
	onSettingChange,
	onSettingReset,
}: AdvancedTabProps) => {
	const { t } = useI18n()
	const overrideMap = new Map(
		driverProperties.map((property) => [property.key, property.value]),
	)
	const groupedSettings = advancedSettings.reduce<Record<string, DbSetting[]>>(
		(groups, setting) => {
			const category = setting.category || 'General'
			if (!groups[category]) {
				groups[category] = []
			}

			groups[category].push(setting)
			return groups
		},
		{},
	)

	return (
		<TabsContent
			value='advanced'
			className='space-y-4'>
			{!isReady && (
				<div className='rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground'>
					{isLoading ?
						t('dataSource.advanced.loadingCurrent')
					: isEditMode ?
						t('dataSource.advanced.testToRefresh')
					:	t('dataSource.advanced.testFirst')}
				</div>
			)}

			{isReady && (
				<>
					<div className='rounded-xl border border-border/60 bg-muted/20 px-4 py-3'>
						<p className='text-sm font-medium text-foreground'>
							{t('dataSource.advanced.loaded')}
						</p>
						<p className='mt-1 text-sm text-muted-foreground'>
							{serverVersion || t('dataSource.advanced.serverVersionUnavailable')}
						</p>
						<p className='mt-2 text-xs text-muted-foreground'>
							{t('dataSource.advanced.onlyChangedSaved')}
						</p>
					</div>

					{advancedSettings.length === 0 && (
						<div className='rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground'>
							{t('dataSource.advanced.noSettings')}
						</div>
					)}

					<div className='space-y-5'>
						{Object.entries(groupedSettings).map(
							([category, settings]) => (
								<section
									key={category}
									className='space-y-2'>
									<FieldSeparator>{category}</FieldSeparator>

									<div className='space-y-2'>
										{settings.map((setting) => {
											const currentValue =
												overrideMap.get(setting.name) ??
												setting.value
											const hasOverride = overrideMap.has(
												setting.name,
											)

											return (
												<div
													key={setting.name}
													className='space-y-1.5'>
													<div className='flex items-center gap-3'>
														<div className='min-w-0 flex-1 text-sm font-medium text-foreground'>
															<div className='truncate'>
																{setting.name}
															</div>
														</div>

														<div className='flex min-w-0 flex-[1.4] items-center gap-2'>
															<div className='min-w-0 flex-1'>
																{renderSettingInput({
																	setting,
																	currentValue,
																	t,
																	onChange:
																		onSettingChange,
																})}
															</div>

															{hasOverride &&
																setting.is_editable && (
																	<Button
																		type='button'
																		variant='ghost'
																		size='sm'
																		className='shrink-0'
																		onClick={() =>
																			onSettingReset(
																				setting.name,
																			)
																		}>
																		<RotateCcwIcon
																			size={14}
																		/>
																	</Button>
																)}
														</div>
													</div>

													{(setting.description ||
														setting.min_val ||
														setting.max_val ||
														!setting.is_editable) && (
															<div className='pl-0 text-xs text-muted-foreground'>
																{setting.description && (
																	<FieldDescription className='text-xs'>
																		{
																			setting.description
																		}
																	</FieldDescription>
																)}

																<p>
																	{!setting.is_editable &&
																		t('dataSource.advanced.readOnly')}
																	{!setting.is_editable &&
																		(setting.min_val ||
																			setting.max_val) &&
																		' • '}
																	{(setting.min_val ||
																		setting.max_val) &&
																		t('dataSource.advanced.range', {
																			min: setting.min_val || 'min',
																			max: setting.max_val || 'max',
																		})}
																</p>
															</div>
														)}
												</div>
											)
										})}
									</div>
								</section>
							),
						)}
					</div>
				</>
			)}
		</TabsContent>
	)
}

const isTruthy = (value: string) => {
	return ['1', 'true', 'on', 'yes', 'enabled'].includes(
		value.trim().toLowerCase(),
	)
}

const toBooleanString = (checked: boolean, sourceValue: string) => {
	const normalized = sourceValue.trim().toLowerCase()

	if (normalized === '1' || normalized === '0') {
		return checked ? '1' : '0'
	}

	if (normalized === 'on' || normalized === 'off') {
		return checked ? 'on' : 'off'
	}

	if (normalized === 'yes' || normalized === 'no') {
		return checked ? 'yes' : 'no'
	}

	if (normalized === 'enabled' || normalized === 'disabled') {
		return checked ? 'enabled' : 'disabled'
	}

	return checked ? 'true' : 'false'
}

const renderSettingInput = ({
	setting,
	currentValue,
	t,
	onChange,
}: {
	setting: DbSetting
	currentValue: string
	t: (key: TranslationKey, params?: Record<string, string | number>) => string
	onChange: (
		settingName: string,
		nextValue: string,
		defaultValue: string,
	) => void
}) => {
	if (setting.setting_type === 'enum' && setting.enum_values?.length) {
		const normalizedOptions = setting.enum_values.map((option) => ({
			label: option === '' ? t('dataSource.advanced.emptyOption') : option,
			rawValue: option,
			value: option === '' ? EMPTY_SELECT_SENTINEL : option,
		}))
		const hasEmptyOption = setting.enum_values.includes('')
		const normalizedCurrentValue =
			currentValue === '' && hasEmptyOption ?
				EMPTY_SELECT_SENTINEL
			:	currentValue

		return (
			<Select
				value={normalizedCurrentValue}
				onValueChange={(nextValue) =>
					onChange(
						setting.name,
						nextValue === EMPTY_SELECT_SENTINEL ? '' : nextValue,
						setting.value,
					)
				}
				disabled={!setting.is_editable}>
				<SelectTrigger className='w-full'>
					<SelectValue placeholder={t('dataSource.advanced.selectValue')} />
				</SelectTrigger>
				<SelectContent>
					{normalizedOptions.map((option) => (
						<SelectItem
							key={`${setting.name}-${option.value}`}
							value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		)
	}

	if (setting.setting_type === 'bool') {
		return (
			<label className='flex items-center gap-3 text-sm'>
				<Checkbox
					checked={isTruthy(currentValue)}
					disabled={!setting.is_editable}
					onCheckedChange={(checked) =>
						onChange(
							setting.name,
							toBooleanString(Boolean(checked), currentValue),
							setting.value,
						)
					}
				/>
				<span>{currentValue}</span>
			</label>
		)
	}

	if (
		setting.setting_type === 'integer' ||
		setting.setting_type === 'real'
	) {
		return (
			<Input
				type='number'
				value={currentValue}
				disabled={!setting.is_editable}
				// PostgreSQL exposes some numeric settings with special sentinel
				// values like -1 even when pg_settings reports a non-negative range.
				// Let backend validation be the source of truth instead of browser
				// min/max validation so valid sentinel values are not blocked.
				step={setting.setting_type === 'integer' ? '1' : 'any'}
				onChange={(event) =>
					onChange(setting.name, event.target.value, setting.value)
				}
			/>
		)
	}

	return (
		<Input
			type='text'
			value={currentValue}
			disabled={!setting.is_editable}
			onChange={(event) =>
				onChange(setting.name, event.target.value, setting.value)
			}
		/>
	)
}

export default AdvancedTab
