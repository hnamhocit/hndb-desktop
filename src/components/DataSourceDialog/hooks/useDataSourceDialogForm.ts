import { zodResolver } from '@hookform/resolvers/zod'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useRef, useState } from 'react'
import { type SubmitHandler, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { supportDataSources } from '@/constants/supportDataSources'
import {
	type DataSourceFormData,
	type DataSourceFormValues,
	type DataSourceType,
	dataSourceSchema,
} from '@/schemas'
import { dataSourcesService } from '@/services'
import { useDataSourcesStore } from '@/stores'
import { notifyError } from '@/utils'

import { DEFAULT_FORM_VALUES } from '../constants'
import {
	type DbSetting,
	type TestConnectionProbeResult,
	buildConnectionConfig,
	mapDataSourceToFormData,
	removeDriverProperty,
	upsertDriverProperty,
} from '../utils'

interface UseDataSourceDialogFormParams {
	dataSourceId?: string | null
	isDialogOpen: boolean
	setDialogOpen: (open: boolean) => void
}

const CONNECTION_FIELDS = new Set([
	'type',
	'method',
	'host',
	'port',
	'database_name',
	'username',
	'password',
	'url',
])

const useDataSourceDialogForm = ({
	dataSourceId,
	isDialogOpen,
	setDialogOpen,
}: UseDataSourceDialogFormParams) => {
	const [step, setStep] = useState<1 | 2>(1)
	const [activeTab, setActiveTab] = useState<'general' | 'advanced'>(
		'general',
	)
	const [isTesting, setIsTesting] = useState(false)
	const [isTestSuccessful, setIsTestSuccessful] = useState(false)
	const [serverVersion, setServerVersion] = useState('')
	const [advancedSettings, setAdvancedSettings] = useState<DbSetting[]>([])

	const initializedForOpenRef = useRef(false)
	const wasDialogOpenRef = useRef(false)
	const closeResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	)

	const form = useForm<DataSourceFormValues, unknown, DataSourceFormData>({
		resolver: zodResolver(dataSourceSchema),
		defaultValues: DEFAULT_FORM_VALUES,
	})

	const { control, reset, setValue, getValues, trigger, watch } = form

	const { datasources, setDatasources } = useDataSourcesStore()

	const isEditMode = Boolean(dataSourceId)
	const method = useWatch({ control, name: 'method' })
	const dbType = useWatch({ control, name: 'type' })
	const driverProperties =
		useWatch({
			control,
			name: 'driverProperties',
		}) || []

	useEffect(() => {
		if (!isDialogOpen) {
			initializedForOpenRef.current = false
			return
		}

		if (closeResetTimeoutRef.current) {
			clearTimeout(closeResetTimeoutRef.current)
			closeResetTimeoutRef.current = null
		}

		if (initializedForOpenRef.current) {
			return
		}

		if (isEditMode) {
			const existingDataSource = datasources.find(
				(dataSource) => dataSource.id === dataSourceId,
			)

			if (!existingDataSource) {
				return
			}

			reset(mapDataSourceToFormData(existingDataSource))
			setStep(2)
		} else {
			reset(DEFAULT_FORM_VALUES)
			setStep(1)
		}

		setActiveTab('general')
		setAdvancedSettings([])
		setServerVersion('')
		setIsTestSuccessful(false)
		initializedForOpenRef.current = true
	}, [dataSourceId, datasources, isDialogOpen, isEditMode, reset])

	useEffect(() => {
		if (isEditMode) {
			return
		}

		if (dbType === 'postgresql') {
			setValue('port', 5432)
			setValue('username', 'postgres')
			return
		}

		if (dbType === 'mysql' || dbType === 'maria-db') {
			setValue('port', 3306)
			setValue('username', 'root')
			return
		}

		if (dbType === 'sql-server') {
			setValue('port', 1433)
			setValue('username', 'sa')
			return
		}

		if (dbType === 'sqlite') {
			setValue('port', undefined as never)
			setValue('username', undefined as never)
			setValue('method', 'host')
		}
	}, [dbType, isEditMode, setValue])

	useEffect(() => {
		const subscription = watch((_, { name }) => {
			const rootField = name?.split('.')[0]
			if (!rootField || !CONNECTION_FIELDS.has(rootField)) {
				return
			}

			setIsTestSuccessful(false)
			setActiveTab('general')
			setAdvancedSettings([])
			setServerVersion('')
		})

		return () => subscription.unsubscribe()
	}, [watch])

	useEffect(() => {
		if (isDialogOpen) {
			wasDialogOpenRef.current = true
			return
		}

		if (!wasDialogOpenRef.current) {
			return
		}

		closeResetTimeoutRef.current = setTimeout(() => {
			if (!isEditMode) {
				setStep(1)
			}

			setActiveTab('general')
			setAdvancedSettings([])
			setServerVersion('')
			reset(DEFAULT_FORM_VALUES)
			setIsTestSuccessful(false)
		}, 300)

		wasDialogOpenRef.current = false

		return () => {
			if (closeResetTimeoutRef.current) {
				clearTimeout(closeResetTimeoutRef.current)
				closeResetTimeoutRef.current = null
			}
		}
	}, [isDialogOpen, isEditMode, reset])

	useEffect(() => {
		return () => {
			if (closeResetTimeoutRef.current) {
				clearTimeout(closeResetTimeoutRef.current)
			}
		}
	}, [])

	const handleSelectDatabase = (type: DataSourceType) => {
		setValue('type', type)
		setActiveTab('general')
		setAdvancedSettings([])
		setServerVersion('')
		setIsTestSuccessful(false)
		setStep(2)
	}

	const handleTestConnection = async () => {
		const isValid = await trigger()
		if (!isValid) {
			return
		}

		setIsTesting(true)
		setIsTestSuccessful(false)

		try {
			const formData = dataSourceSchema.parse(getValues())
			const probeResult = await invoke<TestConnectionProbeResult>(
				'test_and_probe',
				{
					config: buildConnectionConfig(formData),
				},
			)

			if (!probeResult.success) {
				setAdvancedSettings([])
				setServerVersion('')
				toast.error(
					probeResult.error ||
						'Connection failed. Please check your config.',
					{
						position: 'top-center',
					},
				)
				return
			}

			setAdvancedSettings(probeResult.advanced_settings)
			setServerVersion(probeResult.server_version)
			setIsTestSuccessful(true)
			setActiveTab('advanced')
			toast.success('Connection successful!', { position: 'top-center' })
		} catch (error) {
			setAdvancedSettings([])
			setServerVersion('')
			notifyError(error, 'Connection failed. Please check your config.')
		} finally {
			setIsTesting(false)
		}
	}

	const handleAdvancedSettingChange = (
		settingName: string,
		nextValue: string,
		defaultValue: string,
	) => {
		const nextProperties =
			nextValue === defaultValue ?
				removeDriverProperty(driverProperties, settingName)
			:	upsertDriverProperty(driverProperties, settingName, nextValue)

		setValue('driverProperties', nextProperties, {
			shouldDirty: true,
			shouldTouch: true,
		})
	}

	const handleAdvancedSettingReset = (settingName: string) => {
		setValue(
			'driverProperties',
			removeDriverProperty(driverProperties, settingName),
			{
				shouldDirty: true,
				shouldTouch: true,
			},
		)
	}

	const onSubmit: SubmitHandler<DataSourceFormData> = async (formData) => {
		try {
			if (isEditMode && dataSourceId) {
				const { error } = await dataSourcesService.update(
					dataSourceId,
					formData,
				)

				if (error) {
					toast.error(error.message, { position: 'top-center' })
					return
				}

				setDatasources(
					datasources.map((dataSource) => {
						if (dataSource.id !== dataSourceId) {
							return dataSource
						}

						const { name, type, ...configData } = formData

						return {
							...dataSource,
							name,
							type,
							config: {
								...dataSource.config,
								...configData,
							},
						}
					}),
				)

				toast.success('Data source updated successfully!', {
					position: 'top-center',
				})
			} else {
				const overrides = Object.fromEntries(
					(formData.driverProperties || [])
						.filter(
							(property) =>
								property.key.trim() !== '' &&
								property.value.trim() !== '',
						)
						.map((property) => [property.key, property.value]),
				)

				await invoke<string>('save_and_connect', {
					connectionName: formData.name,
					config: buildConnectionConfig(formData),
					overrides,
				})

				toast.success('Connection saved successfully!', {
					position: 'top-center',
				})
			}

			setDialogOpen(false)
		} catch (error) {
			console.log({ error })
			notifyError(
				error,
				isEditMode ?
					'Failed to update data source.'
				:	'Failed to add data source.',
			)
		}
	}

	const selectedDbInfo = supportDataSources.find(
		(dataSource) => dataSource.id === dbType,
	)

	return {
		form,
		step,
		setStep,
		activeTab,
		setActiveTab,
		isEditMode,
		dbType,
		method,
		isRemoteDatabase: dbType !== 'sqlite',
		isTesting,
		isTestSuccessful,
		serverVersion,
		advancedSettings,
		driverProperties,
		selectedDbInfo,
		handleSelectDatabase,
		handleTestConnection,
		handleAdvancedSettingChange,
		handleAdvancedSettingReset,
		onSubmit,
	}
}

export default useDataSourceDialogForm
