'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { useI18n } from '@/hooks'
import { Input } from '@/components/ui/input'
import { id } from '@/helpers'
import { connectionService } from '@/services'
import { useContextMenuStore, useMetadataStore } from '@/stores'
import { notifyError, renderToken, resolveQueryByDialect } from '@/utils'

interface FormValues {
	name: string
}

interface RenameDatabaseDialogProps {
	dataSourceId: string
	database: string
}

const RenameDialog = ({
	dataSourceId,
	database,
}: RenameDatabaseDialogProps) => {
	const { t } = useI18n()
	const { target, actionType, isSubmitting, setIsSubmitting, closeAction } =
		useContextMenuStore()

	const { databases, setDatabases, schema, setSchema } = useMetadataStore()
	const formSchema = useMemo(
		() =>
			z.object({
				name: z
					.string()
					.trim()
					.min(1, t('connection.error.databaseNameRequiredStrict'))
					.max(64, t('connection.error.databaseNameTooLong'))
					.regex(
						/^[A-Za-z_][A-Za-z0-9_$]*$/,
						t('connection.error.databaseNameFormatStrict'),
					),
			}),
		[t],
	)

	const isOpen =
		actionType === 'rename' &&
		target?.dataSourceId === dataSourceId &&
		target?.database === database

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: database,
		},
	})

	useEffect(() => {
		if (!isOpen) return

		reset({
			name: database,
		})
	}, [isOpen, database, reset])

	const onSubmit = async ({ name }: FormValues) => {
		if (name === database) {
			closeAction()
			return
		}

		setIsSubmitting(true)

		try {
			const query = resolveQueryByDialect(
				dataSourceId,
				{
					postgres: ({ oldName, newName }, dialect) =>
						`ALTER DATABASE ${renderToken(oldName, dialect)} RENAME TO ${renderToken(newName, dialect)};`,

					mssql: ({ oldName, newName }, dialect) =>
						`ALTER DATABASE ${renderToken(oldName, dialect)} MODIFY NAME = ${renderToken(newName, dialect)};`,
				},
				{
					oldName: id(database),
					newName: id(name),
				},
			)

			if (!query) {
				toast.error(t('connection.error.renameDatabaseUnsupported'), {
					position: 'top-center',
				})
				return
			}

			await connectionService.runQuery(
				dataSourceId,
				database,
				query,
				true,
			)

			const current = databases[dataSourceId] ?? []
			setDatabases(
				dataSourceId,
				current.map((db) => (db === database ? name : db)),
			)

			const oldSchemaKey = `${dataSourceId}-${database}`
			const newSchemaKey = `${dataSourceId}-${name}`

			const oldSchema = schema[oldSchemaKey]

			if (oldSchema) {
				setSchema(newSchemaKey, oldSchema)
				setSchema(oldSchemaKey, {})
			}

			closeAction()
		} catch (error) {
			notifyError(error, t('errors.failedRenameDatabase'))
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => !open && closeAction()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('connection.dialog.renameDatabase.title')}</DialogTitle>
					<DialogDescription>
						{t('connection.dialog.renameDatabase.description', {
							name: database,
						})}
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={handleSubmit(onSubmit)}
					className='space-y-4'>
					<div className='space-y-2'>
						<label
							htmlFor='database-name'
							className='text-sm font-medium'>
							{t('connection.dialog.renameDatabase.label')}
						</label>

						<Input
							id='database-name'
							autoFocus
							placeholder={t('connection.dialog.renameDatabase.placeholder')}
							{...register('name')}
							className={clsx(
								errors.name &&
									'border-destructive focus-visible:ring-destructive/30',
							)}
						/>

						<p className='text-xs text-muted-foreground'>
							{t('connection.dialog.renameDatabase.helper')}
						</p>

						{errors.name && (
							<p className='text-sm text-destructive'>
								{errors.name.message}
							</p>
						)}
					</div>

					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={closeAction}
							disabled={isSubmitting}>
							{t('common.cancel')}
						</Button>

						<Button
							type='submit'
							disabled={isSubmitting}>
							{t('common.save')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default RenameDialog
