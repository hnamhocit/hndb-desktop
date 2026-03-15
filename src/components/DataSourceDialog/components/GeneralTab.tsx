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
							<FieldSeparator>Server</FieldSeparator>
						)}

						{isRemoteDatabase && (
							<div className='space-y-3'>
								<FieldLabel>Connected by</FieldLabel>
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
												<Label htmlFor='host'>Host</Label>
											</div>

											<div className='flex items-center gap-3'>
												<RadioGroupItem
													value='url'
													id='url'
												/>
												<Label htmlFor='url'>URL</Label>
											</div>
										</RadioGroup>
									)}
								/>
							</div>
						)}

						{method === 'url' && isRemoteDatabase && (
							<div className='space-y-2'>
								<FieldLabel>URL</FieldLabel>
								<Controller
									control={control}
									name='url'
									render={({ field }) => (
										<Input
											{...field}
											type='text'
											placeholder='e.g. postgres://user:pass@localhost:5432/db'
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
											<FieldLabel>Host</FieldLabel>
											<Controller
												control={control}
												name='host'
												render={({ field }) => (
													<Input
														{...field}
														type='text'
														placeholder='e.g. localhost'
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
											<FieldLabel>Port</FieldLabel>
											<Controller
												control={control}
												name='port'
												render={({ field }) => (
													<Input
														{...field}
														type='number'
														placeholder='e.g. 5432'
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
										{dbType === 'sqlite' ? 'File Path' : 'Database'}
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
														'e.g. ./data.sqlite'
													:	'e.g. my_database'
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
											Authentication
										</FieldSeparator>

										<div className='grid gap-4 sm:grid-cols-2'>
											<div className='space-y-2'>
												<FieldLabel>Username</FieldLabel>
												<Controller
													control={control}
													name='username'
													render={({ field }) => (
														<Input
															{...field}
															type='text'
															placeholder='e.g. admin'
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
												<FieldLabel>Password</FieldLabel>
												<Controller
													control={control}
													name='password'
													render={({ field }) => (
														<PasswordInput
															{...field}
															placeholder='Enter your password'
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
															Show all databases
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
															Save password
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
