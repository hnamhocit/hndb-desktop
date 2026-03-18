import { CheckCircle2Icon, Loader2Icon } from 'lucide-react'
import type {
	SubmitHandler,
	UseFormReturn,
} from 'react-hook-form'
import { Controller } from 'react-hook-form'

import AdvancedTab from '@/components/DataSourceDialog/components/AdvancedTab'
import GeneralTab from '@/components/DataSourceDialog/components/GeneralTab'
import { Button } from '@/components/ui/button'
import { FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type {
	DataSourceFormData,
	DataSourceFormValues,
	DataSourceType,
	DriverProperty,
} from '@/schemas'
import type { DbSetting } from '../utils'

interface DataSourceDialogFormProps {
	form: UseFormReturn<DataSourceFormValues, unknown, DataSourceFormData>
	dbType: DataSourceType
	method: DataSourceFormValues['method']
	isRemoteDatabase: boolean
	isEditMode: boolean
	isTesting: boolean
	isValidatingOverrides: boolean
	isTestSuccessful: boolean
	isOverridesValidated: boolean
	requiresValidationBeforeSubmit: boolean
	activeTab: 'general' | 'advanced'
	setActiveTab: (tab: 'general' | 'advanced') => void
	serverVersion: string
	advancedSettings: DbSetting[]
	driverProperties: DriverProperty[]
	onAdvancedSettingChange: (
		settingName: string,
		nextValue: string,
		defaultValue: string,
	) => void
	onAdvancedSettingReset: (settingName: string) => void
	onSubmit: SubmitHandler<DataSourceFormData>
	onTestConnection: () => Promise<void>
	onValidateSettingOverrides: () => Promise<void>
}

const DataSourceDialogForm = ({
	form,
	dbType,
	method,
	isRemoteDatabase,
	isEditMode,
	isTesting,
	isValidatingOverrides,
	isTestSuccessful,
	isOverridesValidated,
	requiresValidationBeforeSubmit,
	activeTab,
	setActiveTab,
	serverVersion,
	advancedSettings,
	driverProperties,
	onAdvancedSettingChange,
	onAdvancedSettingReset,
	onSubmit,
	onTestConnection,
	onValidateSettingOverrides,
}: DataSourceDialogFormProps) => {
	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = form

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='flex h-[72vh] flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300'>
			<div className='flex-1 space-y-5 overflow-y-auto px-6 py-5'>
				<section className='space-y-2'>
					<FieldLabel>Name</FieldLabel>
					<Controller
						control={control}
						name='name'
						render={({ field }) => (
							<Input
								{...field}
								type='text'
								placeholder='e.g. My Production DB'
								value={field.value || ''}
							/>
						)}
					/>
					{errors.name && (
						<FieldError>{errors.name.message as string}</FieldError>
					)}
				</section>

				<Tabs
					value={activeTab}
					onValueChange={(nextTab) => {
						if (
							nextTab === 'advanced' &&
							!isEditMode &&
							!isTestSuccessful
						) {
							return
						}

						setActiveTab(nextTab as 'general' | 'advanced')
					}}
					className='gap-4'>
					<TabsList className='w-fit'>
						<TabsTrigger value='general'>General</TabsTrigger>
						<TabsTrigger
							value='advanced'
							disabled={!isEditMode && !isTestSuccessful}>
							Advanced
						</TabsTrigger>
					</TabsList>

					<GeneralTab
						form={form}
						dbType={dbType}
						method={method}
						isRemoteDatabase={isRemoteDatabase}
					/>

					<AdvancedTab
						advancedSettings={advancedSettings}
						driverProperties={driverProperties}
						serverVersion={serverVersion}
						isReady={isTestSuccessful}
						isLoading={isTesting}
						isEditMode={isEditMode}
						onSettingChange={onAdvancedSettingChange}
						onSettingReset={onAdvancedSettingReset}
					/>
				</Tabs>
			</div>

			<div className='sticky bottom-0 border-t border-border/60 bg-background px-6 py-4'>
				<div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
					<div className='flex flex-col-reverse gap-3 sm:flex-row'>
						<Button
							variant='outline'
							type='button'
							onClick={() =>
								void (
									requiresValidationBeforeSubmit &&
									isTestSuccessful ?
										onValidateSettingOverrides()
									:	onTestConnection()
								)
							}
							disabled={isTesting || isValidatingOverrides}
							className={cn(
								isOverridesValidated &&
									'border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/30',
							)}>
							{isTesting ?
								<>
									<Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
									Testing...
								</>
							: isValidatingOverrides ?
								<>
									<Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
									Validating...
								</>
							: isOverridesValidated ?
								<>
									<CheckCircle2Icon className='mr-2 h-4 w-4' />
									Validated
								</>
							: requiresValidationBeforeSubmit && isTestSuccessful ?
								'Validate settings'
							: isEditMode ?
								'Test connection (optional)'
							:	'Test connection'}
						</Button>

						<Button
							type='submit'
							disabled={
								isSubmitting ||
								(requiresValidationBeforeSubmit &&
									(!isTestSuccessful || !isOverridesValidated))
							}>
							{isEditMode ? 'Save Connection' : 'Connect'}
						</Button>
					</div>
				</div>
			</div>
		</form>
	)
}

export default DataSourceDialogForm
