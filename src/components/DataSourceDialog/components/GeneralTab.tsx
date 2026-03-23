import {
	Controller,
	type FieldErrors,
	type UseFormReturn,
} from 'react-hook-form'

import { Checkbox } from '@/components/ui/checkbox'
import {
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
	FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { TabsContent } from '@/components/ui/tabs'
import { useI18n } from '@/hooks'
import type {
	DataSourceFormData,
	DataSourceFormValues,
	DataSourceType,
} from '@/schemas'

interface GeneralTabProps {
	form: UseFormReturn<DataSourceFormValues, unknown, DataSourceFormData>
	dbType: DataSourceType
	method: DataSourceFormValues['method']
	isRemoteDatabase: boolean
}

const GeneralTab = ({
	form,
	dbType,
	method,
	isRemoteDatabase,
}: GeneralTabProps) => {
	const { t } = useI18n()
	const {
		control,
		formState: { errors },
	} = form

	const hostErrors = errors as FieldErrors<{
		host: string
		port: string
		database_name: string
	}>
	const urlErrors = errors as FieldErrors<{ url: string }>

	return (
		<TabsContent
			value='general'
			className='space-y-6'>
			<FieldSet className='gap-6'>
				<section className='space-y-4'>
					<FieldGroup className='gap-5'>
						{isRemoteDatabase && (
							<FieldSeparator>{t('dataSource.form.server')}</FieldSeparator>
						)}

						{isRemoteDatabase && (
							<div className='space-y-3'>
								<FieldLabel>{t('dataSource.form.connectedBy')}</FieldLabel>
								<Controller
									control={control}
									name='method'
									render={({ field: { value, onChange } }) => (
										<RadioGroup
											value={value}
											onValueChange={onChange}
											className='flex flex-wrap gap-5'>
											<div className='flex items-center gap-3'>
												<RadioGroupItem
													value='host'
													id='host'
												/>
												<Label htmlFor='host'>{t('dataSource.form.host')}</Label>
											</div>

											<div className='flex items-center gap-3'>
												<RadioGroupItem
													value='url'
													id='url'
												/>
												<Label htmlFor='url'>{t('dataSource.form.url')}</Label>
											</div>
										</RadioGroup>
									)}
								/>
							</div>
						)}

						{method === 'url' && isRemoteDatabase && (
							<div className='space-y-2'>
								<FieldLabel>{t('dataSource.form.url')}</FieldLabel>
								<Controller
									control={control}
									name='url'
									render={({ field }) => (
										<Input
											{...field}
											type='text'
											placeholder={t('dataSource.form.urlPlaceholder')}
											value={field.value || ''}
										/>
									)}
								/>
								{urlErrors.url && (
									<FieldError>
										{urlErrors.url.message}
									</FieldError>
								)}
							</div>
						)}

						{method === 'host' && (
							<>
								{isRemoteDatabase && (
									<div className='grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]'>
										<div className='space-y-2'>
											<FieldLabel>{t('dataSource.form.host')}</FieldLabel>
											<Controller
												control={control}
												name='host'
												render={({ field }) => (
													<Input
														{...field}
														type='text'
														placeholder={t('dataSource.form.hostPlaceholder')}
														value={field.value || ''}
													/>
												)}
											/>
											{hostErrors.host && (
												<FieldError>
													{hostErrors.host.message}
												</FieldError>
											)}
										</div>

										<div className='space-y-2'>
											<FieldLabel>{t('dataSource.form.port')}</FieldLabel>
											<Controller
												control={control}
												name='port'
												render={({ field }) => (
													<Input
														{...field}
														type='number'
														placeholder={t('dataSource.form.portPlaceholder')}
														className='[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
														value={
															typeof field.value === 'number' &&
															Number.isNaN(field.value) ?
																''
															:	(field.value ?? '')
														}
														onChange={(event) => {
															const nextValue =
																event.target.value
															if (nextValue === '') {
																field.onChange(NaN)
																return
															}

															const parsed =
																Number.parseInt(
																	nextValue,
																	10,
																)

															field.onChange(
																Number.isNaN(parsed) ?
																	NaN
																:	parsed,
															)
														}}
													/>
												)}
											/>
											{hostErrors.port && (
												<FieldError>
													{hostErrors.port.message}
												</FieldError>
											)}
										</div>
									</div>
								)}

								<div className='space-y-2'>
									<FieldLabel>
										{dbType === 'sqlite' ?
											t('dataSource.form.filePath')
										:	t('dataSource.form.database')}
									</FieldLabel>
									<Controller
										control={control}
										name='database_name'
										render={({ field }) => (
											<Input
												{...field}
												type='text'
												placeholder={
													dbType === 'sqlite' ?
														t('dataSource.form.sqlitePathPlaceholder')
													:	t('dataSource.form.databasePlaceholder')
												}
												value={field.value || ''}
											/>
										)}
									/>
									{hostErrors.database_name && (
										<FieldError>
											{hostErrors.database_name.message}
										</FieldError>
									)}
								</div>

								{isRemoteDatabase && (
									<>
										<FieldSeparator>
											{t('dataSource.form.authentication')}
										</FieldSeparator>

										<div className='grid gap-4 sm:grid-cols-2'>
											<div className='space-y-2'>
												<FieldLabel>{t('dataSource.form.username')}</FieldLabel>
												<Controller
													control={control}
													name='username'
													render={({ field }) => (
														<Input
															{...field}
															type='text'
															placeholder={t('dataSource.form.usernamePlaceholder')}
															value={field.value || ''}
														/>
													)}
												/>
												{errors.username && (
													<FieldError>
														{errors.username.message}
													</FieldError>
												)}
											</div>

											<div className='space-y-2'>
												<FieldLabel>{t('dataSource.form.password')}</FieldLabel>
												<Controller
													control={control}
													name='password'
													render={({ field }) => (
														<PasswordInput
															{...field}
															placeholder={t('dataSource.form.passwordPlaceholder')}
															value={field.value || ''}
														/>
													)}
												/>
												{errors.password && (
													<FieldError>
														{errors.password.message}
													</FieldError>
												)}
											</div>
										</div>

										<div className='flex flex-wrap items-center gap-4'>
											<Controller
												control={control}
												name='showAllDatabases'
												render={({ field }) => (
													<div className='flex items-center gap-2'>
														<Checkbox
															id='show-all-databases'
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
														<Label
															htmlFor='show-all-databases'
															className='cursor-pointer text-sm'>
															{t('dataSource.form.showAllDatabases')}
														</Label>
													</div>
												)}
											/>

											<Controller
												control={control}
												name='savePassword'
												render={({ field }) => (
													<div className='flex items-center gap-2'>
														<Checkbox
															id='save-password'
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
														<Label
															htmlFor='save-password'
															className='cursor-pointer text-sm'>
															{t('dataSource.form.savePassword')}
														</Label>
													</div>
												)}
											/>
										</div>
									</>
								)}
							</>
						)}
					</FieldGroup>
				</section>
			</FieldSet>
		</TabsContent>
	)
}

export default GeneralTab
