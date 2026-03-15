import Editor from '@monaco-editor/react'
import clsx from 'clsx'
import { AlertCircle, Check, LockIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { IColumn } from '@/interfaces'
import { getSafeDisplayValue, getTypeInfo } from '@/utils'

interface EditableCellProps {
	initialValue: unknown
	column: IColumn
	onSave: (colName: string, newValue: unknown) => void
	isChanged: boolean
	isNewRow: boolean
	isDeleted?: boolean
}

const EditableCell = ({
	initialValue,
	column,
	onSave,
	isChanged,
	isNewRow,
	isDeleted = false,
}: EditableCellProps) => {
	const { column_name, data_type, is_primary, is_nullable, column_default } =
		column

	const isLocked =
		isDeleted || (is_primary && (!isNewRow || column_default !== null))

	const safeInitialValue = getSafeDisplayValue(initialValue, data_type)
	const { color: typeColor } = getTypeInfo(data_type)

	const [isSpecialEditing, setIsSpecialEditing] = useState(false)
	const [localValue, setLocalValue] = useState(
		safeInitialValue === null ? '' : safeInitialValue,
	)
	const [jsonError, setJsonError] = useState<string | null>(null)
	const inputRef = useRef<HTMLTextAreaElement>(null)
	const hasAutoFilled = useRef(false)

	const typeLower = data_type.toLowerCase()
	const isBoolean =
		typeLower.includes('bool') ||
		typeLower.includes('bit') ||
		typeLower.includes('tinyint(1)')
	const isJson =
		typeLower.includes('json') ||
		safeInitialValue?.startsWith('{') ||
		safeInitialValue?.startsWith('[')
	const isEnum = typeLower.includes('enum')
	const isNumber =
		['int', 'float', 'double', 'decimal', 'numeric', 'real'].some((t) =>
			typeLower.includes(t),
		) && !isBoolean

	const parsedEnums =
		isEnum ?
			typeLower
				.replace('enum(', '')
				.replace(')', '')
				.replaceAll("'", '')
				.split(',')
		:	[]

	useEffect(() => {
		if (
			isNewRow &&
			initialValue === undefined &&
			column_default !== null &&
			!hasAutoFilled.current
		) {
			hasAutoFilled.current = true

			const defStr = String(column_default)
			const defUpper = defStr.toUpperCase()

			if (
				!defUpper.includes('CURRENT_TIMESTAMP') &&
				!defUpper.includes('NOW()')
			) {
				let cleanDefault = defStr
				if (
					cleanDefault.startsWith("'") &&
					cleanDefault.endsWith("'")
				) {
					cleanDefault = cleanDefault.slice(1, -1)
				}

				let finalDefault: any = cleanDefault
				if (isNumber && !isNaN(Number(cleanDefault))) {
					finalDefault = Number(cleanDefault)
				} else if (isBoolean) {
					finalDefault =
						cleanDefault === '1' || defUpper === 'TRUE' ? 1 : 0
				}

				onSave(column_name, finalDefault)
			}
		}
	}, [
		isNewRow,
		initialValue,
		column_default,
		column_name,
		isNumber,
		isBoolean,
		onSave,
	])

	useEffect(() => {
		setLocalValue(safeInitialValue === null ? '' : safeInitialValue)
	}, [safeInitialValue])

	useEffect(() => {
		if (isJson && isSpecialEditing) {
			try {
				if (localValue.trim() !== '') JSON.parse(localValue)
				setJsonError(null)
			} catch (e: any) {
				setJsonError(e.message)
			}
		}
	}, [localValue, isJson, isSpecialEditing])

	const handleFinalSave = (valToSave: string) => {
		if (isLocked) return

		const trimmed = valToSave.trim()
		let finalValue: any = trimmed === '' ? null : trimmed

		if (
			!is_nullable &&
			finalValue === null &&
			!isBoolean &&
			!isEnum &&
			!isJson
		) {
			finalValue = ''
		}

		if (
			String(finalValue) ===
			(safeInitialValue === null ? '' : safeInitialValue)
		)
			return
		onSave(column_name, finalValue)
	}

	const displayLocalStr = getSafeDisplayValue(localValue, data_type)
	const deletedTextStyle =
		isDeleted ?
			'line-through text-red-600 dark:text-red-400 font-semibold'
		:	''

	return (
		<div
			className={clsx(
				'relative w-full h-full min-h-[44px] flex items-center transition-colors font-mono',
				isChanged && !isDeleted ?
					'bg-amber-500 text-white'
				:	'bg-transparent',
				is_primary &&
					!isChanged &&
					!isDeleted &&
					'bg-blue-50/10 dark:bg-blue-900/10',
				isDeleted && 'pointer-events-none',
			)}
			onDoubleClick={(e) => {
				e.stopPropagation()
				if (!isLocked && !isDeleted && isJson) setIsSpecialEditing(true)
			}}>
			{isBoolean || isEnum ?
				<Select
					disabled={isLocked}
					value={
						localValue === '' || localValue === null ?
							is_nullable ?
								'null-value'
							:	undefined
						:	String(localValue)
					}
					onValueChange={(v) => {
						const finalV =
							v === 'null-value' ? null
							: isBoolean ?
								v === 'true' ?
									1
								:	0
							:	v
						onSave(column_name, finalV)
					}}>
					<SelectTrigger
						className={clsx(
							'w-full h-full min-h-[44px] px-3 py-2.5 border-none outline-none shadow-none focus:ring-0 bg-transparent rounded-none flex items-center justify-between',
							isChanged && !isDeleted ?
								'text-white focus:bg-amber-600'
							:	`focus:bg-white dark:focus:bg-neutral-800 ${typeColor}`,
							isDeleted && 'opacity-100 disabled:opacity-100',
						)}>
						<div
							className={clsx(
								'flex-1 text-left truncate',
								deletedTextStyle,
							)}>
							{displayLocalStr === null ?
								<span
									className={clsx(
										'italic',
										isChanged && !isDeleted ?
											'text-amber-100'
										:	'text-neutral-400',
									)}>
									[NULL]
								</span>
							: isBoolean ?
								<span
									className={clsx(
										'px-2 py-0.5 rounded font-medium uppercase tracking-wider',
										isChanged && !isDeleted ?
											'bg-white/20 text-white'
										:	'',
										(
											!isDeleted &&
												displayLocalStr === 'true'
										) ?
											'text-green-600 bg-green-500/10'
										:	'',
										(
											!isDeleted &&
												displayLocalStr === 'false'
										) ?
											'text-red-600 bg-red-500/10'
										:	'',
									)}>
									{displayLocalStr}
								</span>
							:	<span>{displayLocalStr}</span>}
						</div>
						<span className='hidden'>
							<SelectValue />
						</span>
						{isLocked && !isDeleted && (
							<LockIcon
								size={14}
								className={clsx(
									isChanged ? 'text-white' : 'text-primary',
									'opacity-40 ml-2 shrink-0',
								)}
							/>
						)}
					</SelectTrigger>

					<SelectContent
						position='popper'
						sideOffset={2}
						className='z-[10000] w-[var(--radix-select-trigger-width)] max-h-[300px]'>
						{is_nullable && (
							<SelectItem
								value='null-value'
								className='italic text-muted-foreground'>
								[NULL]
							</SelectItem>
						)}

						{(isBoolean ? ['true', 'false'] : parsedEnums).map(
							(opt) => (
								<SelectItem
									key={opt}
									value={opt}>
									{isBoolean ?
										<span
											className={clsx(
												'px-2 py-0.5 rounded font-medium uppercase tracking-wider',
												opt === 'true' ?
													'text-green-600 bg-green-500/10'
												:	'text-red-600 bg-red-500/10',
											)}>
											{opt}
										</span>
									:	opt}
								</SelectItem>
							),
						)}
					</SelectContent>
				</Select>
			: isJson || (isLocked && !isDeleted) ?
				<div
					className={clsx(
						'px-3 py-2.5 w-full flex items-center justify-between group',
						!isLocked && 'cursor-pointer',
					)}>
					<div
						className={clsx(
							'truncate',
							isChanged && !isDeleted ? 'text-white' : typeColor,
							deletedTextStyle,
						)}>
						{safeInitialValue === null ?
							<span
								className={clsx(
									'italic',
									isChanged && !isDeleted ? 'text-amber-100'
									:	'text-neutral-400',
								)}>
								[NULL]
							</span>
						:	<span
								className={clsx(
									isChanged && !isDeleted ? 'font-semibold'
									:	'',
								)}>
								{safeInitialValue}
							</span>
						}
					</div>
					{isLocked && !isDeleted && (
						<LockIcon
							size={14}
							className={clsx(
								isChanged ? 'text-white' : 'text-primary',
								'opacity-40 group-hover:opacity-100 transition-opacity ml-2 shrink-0',
							)}
						/>
					)}
				</div>
			:	<textarea
					ref={inputRef}
					readOnly={isLocked}
					className={clsx(
						'w-full h-full min-h-[44px] px-3 py-2.5 outline-none border-none resize-none overflow-hidden whitespace-nowrap transition-colors bg-transparent',
						isChanged && !isDeleted ?
							'text-white placeholder:text-amber-100 focus:bg-amber-600 focus:ring-1 focus:ring-white font-medium'
						:	`focus:bg-white dark:focus:bg-neutral-800 focus:ring-1 focus:ring-primary/40 ${typeColor}`,
						deletedTextStyle,
						isDeleted && 'cursor-not-allowed',
					)}
					value={localValue}
					spellCheck={false}
					onChange={(e) => {
						const val = e.target.value
						if (isNumber) {
							if (val === '' || /^-?\d*\.?\d*$/.test(val))
								setLocalValue(val)
						} else {
							setLocalValue(val)
						}
					}}
					onBlur={() => handleFinalSave(localValue)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault()
							inputRef.current?.blur()
						}
						if (e.key === 'Escape') {
							setLocalValue(
								safeInitialValue === null ? '' : (
									safeInitialValue
								),
							)
							inputRef.current?.blur()
						}
					}}
					rows={1}
				/>
			}

			{isSpecialEditing && isJson && !isDeleted && (
				<div
					className='fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'
					onClick={(e) => {
						e.stopPropagation()
						setIsSpecialEditing(false)
					}}>
					<div
						className='w-full max-w-2xl h-[500px] bg-white dark:bg-[#1e2333] border rounded-xl shadow-2xl flex flex-col overflow-hidden text-foreground'
						onClick={(e) => e.stopPropagation()}>
						<div className='flex items-center justify-between px-4 py-3 border-b bg-muted/30'>
							<span className='font-bold uppercase flex items-center gap-2'>
								{jsonError ?
									<AlertCircle
										size={16}
										className='text-red-500'
									/>
								:	<Check
										size={16}
										className='text-green-500'
									/>
								}
								JSON Editor: {column_name}
							</span>
							<div className='flex gap-2'>
								<Button
									size='sm'
									variant='ghost'
									onClick={() => setIsSpecialEditing(false)}>
									Cancel
								</Button>
								<Button
									size='sm'
									onClick={() => {
										try {
											onSave(
												column_name,
												JSON.parse(localValue),
											)
											setIsSpecialEditing(false)
										} catch (e) {}
									}}
									disabled={!!jsonError}>
									Apply
								</Button>
							</div>
						</div>
						<div className='flex-1'>
							<Editor
								height='100%'
								defaultLanguage='json'
								theme='vs-dark'
								value={localValue}
								onChange={(v) => setLocalValue(v || '')}
								options={{
									minimap: { enabled: false },
									fontSize: 14,
									lineNumbers: 'off',
									automaticLayout: true,
									formatOnPaste: true,
									padding: { top: 12 },
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default EditableCell
