import { zodResolver } from '@hookform/resolvers/zod'
import { invoke } from '@tauri-apps/api/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	type SubmitHandler,
	useForm,
	useFormState,
	useWatch,
} from 'react-hook-form'
import { toast } from 'sonner'

import { supportConnections } from '@/constants'
import { useI18n } from '@/hooks'
import {
	type ConnectionFormData,
	type ConnectionFormValues,
	type ConnectionType,
	createConnectionSchema,
} from '@/schemas'
import { connectionService } from '@/services'
import {
	useActiveStore,
	useConnectionStore,
	useTabsStore,
} from '@/stores'
import { formatErrorMessage, notifyError } from '@/utils'

import { DEFAULT_FORM_VALUES } from '../constants'
import {
	type DbSetting,
	type TestConnectionProbeResult,
	buildConnectedDataSource,
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

const VALIDATION_RELEVANT_FIELDS = new Set([
	...CONNECTION_FIELDS,
	'driverProperties',
])

const hasDirtyMarker = (value: unknown): boolean => {
	if (value === true) return true

	if (Array.isArray(value)) {
		return value.some(hasDirtyMarker)
	}

	if (typeof value === 'object' && value !== null) {
		return Object.values(value).some(hasDirtyMarker)
	}

	return false
}

const hasValidationRelevantChanges = (dirtyFields: Record<string, unknown>) =>
	Object.entries(dirtyFields).some(
		([fieldName, value]) =>
			VALIDATION_RELEVANT_FIELDS.has(fieldName) && hasDirtyMarker(value),
	)

const useDataSourceDialogForm = ({
	dataSourceId,
	isDialogOpen,
	setDialogOpen,
}: UseDataSourceDialogFormParams) => {
	const { t } = useI18n()
	const [step, setStep] = useState<1 | 2>(1)
	const [activeTab, setActiveTab] = useState<'general' | 'advanced'>(
		'general',
	)
	const [isTesting, setIsTesting] = useState(false)
	const [isValidatingOverrides, setIsValidatingOverrides] = useState(false)
	const [isTestSuccessful, setIsTestSuccessful] = useState(false)
	const [isOverridesValidated, setIsOverridesValidated] = useState(false)
	const [serverVersion, setServerVersion] = useState('')
	const [advancedSettings, setAdvancedSettings] = useState<DbSetting[]>([])

	const initializedForOpenRef = useRef(false)
	const wasDialogOpenRef = useRef(false)
	const closeResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	)
	const autoProbeConnectionIdRef = useRef<string | null>(null)
	const probeCycleRef = useRef(0)
	const isResettingFormRef = useRef(false)
	const connectionSchema = useMemo(() => createConnectionSchema(t), [t])

	const form = useForm<ConnectionFormValues, unknown, ConnectionFormData>({
		resolver: zodResolver(connectionSchema),
		defaultValues: DEFAULT_FORM_VALUES,
	})

	const { control, reset, setValue, getValues, trigger, watch } = form
	const { dirtyFields } = useFormState({ control })

	const { connections, setConnections, updateStatus } = useConnectionStore()
	const { updateTab } = useTabsStore()
	const {
		activeTabId,
		setConnectionId,
		setDatabase,
		setTable,
	} = useActiveStore()

	const isEditMode = Boolean(dataSourceId)
	const method = useWatch({ control, name: 'method' })
	const dbType = useWatch({ control, name: 'type' })
	const driverProperties =
		useWatch({
			control,
			name: 'driverProperties',
		}) || []
	const requiresValidationBeforeSubmit =
		!isEditMode ||
		hasValidationRelevantChanges(dirtyFields as Record<string, unknown>)

	const buildOverrides = (properties = driverProperties) =>
		Object.fromEntries(
			(properties || [])
				.filter(
					(property) =>
						property.key.trim() !== '' && property.value.trim() !== '',
				)
				.map((property) => [property.key, property.value]),
		)

	const resetFormSafely = (values: ConnectionFormValues) => {
		isResettingFormRef.current = true
		reset(values)
		queueMicrotask(() => {
			isResettingFormRef.current = false
		})
	}

	const runConnectionProbe = useCallback(
		async (
			formData: ConnectionFormData,
			options?: {
				showSuccessToast?: boolean
				showErrorToast?: boolean
			},
		) => {
			const probeCycleId = probeCycleRef.current + 1
			probeCycleRef.current = probeCycleId

			setIsTesting(true)
			setIsValidatingOverrides(false)
			setIsTestSuccessful(false)
			setIsOverridesValidated(false)

			try {
				const probeResult = await invoke<TestConnectionProbeResult>(
					'test_and_probe',
					{
						config: buildConnectionConfig(formData),
					},
				)

				if (probeCycleId !== probeCycleRef.current) {
					return false
				}

				if (!probeResult.success) {
					setAdvancedSettings([])
					setServerVersion('')

					if (options?.showErrorToast !== false) {
						toast.error(
							formatErrorMessage(
								probeResult.error,
								t('errors.connectionFailedCheckConfig'),
							),
							{
								position: 'top-center',
							},
						)
					}

					return false
				}

				setAdvancedSettings(probeResult.advanced_settings)
				setServerVersion(probeResult.server_version)
				setIsTestSuccessful(true)
				setActiveTab('advanced')

				if (options?.showSuccessToast) {
					toast.success(t('dataSource.toast.connectionSuccess'), {
						position: 'top-center',
					})
				}

				return true
			} catch (error) {
				if (probeCycleId !== probeCycleRef.current) {
					return false
				}

				setAdvancedSettings([])
				setServerVersion('')

				if (options?.showErrorToast !== false) {
					notifyError(error, t('errors.connectionFailedCheckConfig'))
				}

				return false
			} finally {
				if (probeCycleId === probeCycleRef.current) {
					setIsTesting(false)
				}
			}
		},
		[t],
	)

	useEffect(() => {
		if (!isDialogOpen) {
			initializedForOpenRef.current = false
			autoProbeConnectionIdRef.current = null
			probeCycleRef.current += 1
			setIsTesting(false)
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
			const existingDataSource = connections.find(
				(dataSource) => dataSource.id === dataSourceId,
			)

			if (!existingDataSource) {
				return
			}

			resetFormSafely(mapDataSourceToFormData(existingDataSource))
			setStep(2)
			setActiveTab('advanced')
		} else {
			resetFormSafely(DEFAULT_FORM_VALUES)
			setStep(1)
			setActiveTab('general')
		}

		setAdvancedSettings([])
		setServerVersion('')
		setIsValidatingOverrides(false)
		setIsTestSuccessful(false)
		setIsOverridesValidated(false)
		initializedForOpenRef.current = true
	}, [connections, dataSourceId, isDialogOpen, isEditMode, reset])

	useEffect(() => {
		if (!isDialogOpen || !isEditMode || !dataSourceId) {
			return
		}

		if (autoProbeConnectionIdRef.current === dataSourceId) {
			return
		}

		const existingDataSource = connections.find(
			(dataSource) => dataSource.id === dataSourceId,
		)

		if (!existingDataSource) {
			return
		}

		autoProbeConnectionIdRef.current = dataSourceId

		try {
			void runConnectionProbe(
				connectionSchema.parse(mapDataSourceToFormData(existingDataSource)),
				{
					showErrorToast: false,
				},
			)
		} catch {
			setAdvancedSettings([])
			setServerVersion('')
			setIsTesting(false)
		}
	}, [connections, dataSourceId, isDialogOpen, isEditMode, runConnectionProbe])

	useEffect(() => {
		if (isEditMode) {
			return
		}

		if (dbType === 'postgres') {
			setValue('port', 5432)
			setValue('username', 'postgres')
			return
		}

		if (dbType === 'mysql' || dbType === 'mariadb') {
			setValue('port', 3306)
			setValue('username', 'root')
			return
		}

		if (dbType === 'mssql') {
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
			if (isResettingFormRef.current) {
				return
			}

			const rootField = name?.split('.')[0]
			if (!rootField || !CONNECTION_FIELDS.has(rootField)) {
				return
			}

			probeCycleRef.current += 1
			setIsTesting(false)
			setIsTestSuccessful(false)
			setIsValidatingOverrides(false)
			setIsOverridesValidated(false)
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
			probeCycleRef.current += 1
			setIsTesting(false)
			resetFormSafely(DEFAULT_FORM_VALUES)
			setIsValidatingOverrides(false)
			setIsTestSuccessful(false)
			setIsOverridesValidated(false)
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

	const handleSelectDatabase = (type: ConnectionType) => {
		setValue('type', type)
		setActiveTab('general')
		setAdvancedSettings([])
		setServerVersion('')
		setIsValidatingOverrides(false)
		setIsTestSuccessful(false)
		setIsOverridesValidated(false)
		setStep(2)
	}

	const handleTestConnection = async () => {
		const isValid = await trigger()
		if (!isValid) {
			return
		}

		setIsTesting(true)
		setIsValidatingOverrides(false)
		setIsTestSuccessful(false)
		setIsOverridesValidated(false)

		try {
			const formData = connectionSchema.parse(getValues())
			await runConnectionProbe(formData, {
				showSuccessToast: true,
			})
		} catch (error) {
			notifyError(error, t('errors.connectionFailedCheckConfig'))
		} finally {
			setIsTesting(false)
		}
	}

	const handleValidateSettingOverrides = async () => {
		const isValid = await trigger()
		if (!isValid || !isTestSuccessful) {
			return
		}

		setIsValidatingOverrides(true)
		setIsOverridesValidated(false)

		try {
			const formData = connectionSchema.parse(getValues())
			const warnings = await invoke<string[]>('validate_setting_overrides', {
				config: buildConnectionConfig(formData),
				overrides: buildOverrides(formData.driverProperties || []),
			})

			setIsOverridesValidated(true)

			if (warnings.length > 0) {
				toast.warning(warnings.join(' '), {
					position: 'top-center',
				})
				return
			}

				toast.success(t('dataSource.toast.settingOverridesValidated'), {
					position: 'top-center',
				})
		} catch (error) {
			notifyError(
				error,
				t('errors.failedValidateSettingOverrides'),
			)
		} finally {
			setIsValidatingOverrides(false)
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
		setIsOverridesValidated(false)
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
		setIsOverridesValidated(false)
	}

	const onSubmit: SubmitHandler<ConnectionFormData> = async (formData) => {
		if (
			requiresValidationBeforeSubmit &&
			(!isTestSuccessful || !isOverridesValidated)
		) {
			toast.error(
				isEditMode ?
					t('dataSource.toast.requireValidateBeforeSaving')
				:	t('dataSource.toast.requireValidateBeforeConnecting'),
				{ position: 'top-center' },
			)
			return
		}

		try {
			if (isEditMode && dataSourceId) {
				const overrides = buildOverrides(formData.driverProperties || [])

				const { error } = await connectionService.update(
					dataSourceId,
					{
						connectionName: formData.name,
						config: buildConnectionConfig(formData),
						overrides,
					},
				)

				if (error) {
					updateStatus(dataSourceId, false)
					toast.error(error.message, { position: 'top-center' })
					return
				}

				updateStatus(dataSourceId, true)

				setConnections(
					connections.map((dataSource) => {
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

				toast.success(t('dataSource.toast.updatedSuccess'), {
					position: 'top-center',
				})
			} else {
				const overrides = buildOverrides(formData.driverProperties || [])

				const connectionId = await invoke<string>('save_and_connect', {
					connectionName: formData.name,
					config: buildConnectionConfig(formData),
					overrides,
				})

				const nextDataSource = buildConnectedDataSource(
					connectionId,
					formData,
				)

				setConnections([
					...connections.filter(
						(dataSource) => dataSource.id !== connectionId,
					),
					nextDataSource,
				])
				updateStatus(connectionId, true)
				setConnectionId(connectionId)
				setDatabase(null)
				setTable(null)

				if (activeTabId) {
					updateTab(activeTabId, {
						workspaceId: connectionId,
						connectionId,
						dataSourceId: connectionId,
						database: null,
						table: null,
					})
				}

				toast.success(t('dataSource.toast.savedSuccess'), {
					position: 'top-center',
				})
			}

			setDialogOpen(false)
		} catch (error) {
			notifyError(
				error,
				isEditMode ?
					t('errors.failedUpdateDataSource')
				:	t('errors.failedAddDataSource'),
			)
		}
	}

	const selectedDbInfo = supportConnections.find(
		(connection) => connection.id === dbType,
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
	}
}

export default useDataSourceDialogForm
