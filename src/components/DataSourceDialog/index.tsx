'use client'

import { ChevronLeftIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import DatabaseTypeStep from '@/components/DataSourceDialog/components/DatabaseTypeStep'
import DataSourceDialogForm from '@/components/DataSourceDialog/components/DataSourceDialogForm'
import useDataSourceDialogForm from '@/components/DataSourceDialog/hooks/useDataSourceDialogForm'
import { getDialogTitle } from '@/components/DataSourceDialog/utils'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'

interface DataSourceDialogProps {
	children?: ReactNode
	dataSourceId?: string | null
	open?: boolean
	onOpenChange?: (open: boolean) => void
}

const DataSourceDialog = ({
	children,
	dataSourceId,
	open,
	onOpenChange,
}: DataSourceDialogProps) => {
	const [internalIsOpen, setInternalIsOpen] = useState(false)
	const isDialogOpen = open !== undefined ? open : internalIsOpen

	const setDialogOpen = (nextOpen: boolean) => {
		onOpenChange?.(nextOpen)
		setInternalIsOpen(nextOpen)
	}

	const {
		form,
		step,
		setStep,
		activeTab,
		setActiveTab,
		isEditMode,
		dbType,
		method,
		isRemoteDatabase,
		isTesting,
		isValidatingOverrides,
		isTestSuccessful,
		isOverridesValidated,
		requiresValidationBeforeSubmit,
		serverVersion,
		advancedSettings,
		driverProperties,
		selectedDbInfo,
		handleSelectDatabase,
		handleTestConnection,
		handleValidateSettingOverrides,
		handleAdvancedSettingChange,
		handleAdvancedSettingReset,
		onSubmit,
	} = useDataSourceDialogForm({
		dataSourceId,
		isDialogOpen,
		setDialogOpen,
	})

	const dialogTitle = getDialogTitle({
		step,
		isEditMode,
		selectedName: selectedDbInfo?.name,
	})

	return (
		<Dialog
			open={isDialogOpen}
			onOpenChange={setDialogOpen}>
			{children && <DialogTrigger asChild>{children}</DialogTrigger>}

			<DialogContent className='max-w-2xl overflow-hidden border-border/60 bg-background p-0 shadow-2xl'>
				<DialogHeader className='border-b border-border/60 px-6 py-5'>
					<DialogTitle className='flex items-center gap-3 pr-8 text-xl'>
						{step === 2 && !isEditMode && (
							<button
								title='go back'
								type='button'
								onClick={() => setStep(1)}
								className='inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-background/80 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'>
								<ChevronLeftIcon size={20} />
							</button>
						)}
						<span>{dialogTitle}</span>
					</DialogTitle>
				</DialogHeader>

				{step === 1 && !isEditMode && (
					<DatabaseTypeStep onSelectDatabase={handleSelectDatabase} />
				)}

				{step === 2 && (
					<DataSourceDialogForm
						form={form}
						dbType={dbType}
						method={method}
						isRemoteDatabase={isRemoteDatabase}
						isEditMode={isEditMode}
						isTesting={isTesting}
						isValidatingOverrides={isValidatingOverrides}
						isTestSuccessful={isTestSuccessful}
						isOverridesValidated={isOverridesValidated}
						requiresValidationBeforeSubmit={
							requiresValidationBeforeSubmit
						}
						activeTab={activeTab}
						setActiveTab={setActiveTab}
						serverVersion={serverVersion}
						advancedSettings={advancedSettings}
						driverProperties={driverProperties}
						onAdvancedSettingChange={handleAdvancedSettingChange}
						onAdvancedSettingReset={handleAdvancedSettingReset}
						onSubmit={onSubmit}
						onTestConnection={handleTestConnection}
						onValidateSettingOverrides={
							handleValidateSettingOverrides
						}
					/>
				)}
			</DialogContent>
		</Dialog>
	)
}

export default DataSourceDialog
