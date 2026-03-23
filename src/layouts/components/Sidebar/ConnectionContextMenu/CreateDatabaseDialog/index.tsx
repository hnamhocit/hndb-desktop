'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { id } from '@/helpers'
import { useDatabases, useI18n } from '@/hooks'
import { connectionService } from '@/services'
import { useContextMenuStore } from '@/stores'
import { notifyError, renderToken, resolveQueryByDialect } from '@/utils'

interface CreateDatabaseDialogProps {
	dataSourceId: string
}

interface FormData {
	databaseName: string
}

const CreateDatabaseDialog = ({ dataSourceId }: CreateDatabaseDialogProps) => {
	const { t } = useI18n()
	const { actionType, target, closeAction } = useContextMenuStore()
	const isOpen =
		dataSourceId === target?.dataSourceId &&
		actionType === 'create-database' &&
		target.database === null
	const { reload } = useDatabases(dataSourceId, { autoFetch: false })
	const formSchema = useMemo(
		() =>
			z.object({
				databaseName: z
					.string()
					.min(1, t('connection.error.requireDatabaseName'))
					.regex(
						/^[a-zA-Z0-9_.-]+$/,
						t('connection.error.allowedDatabaseNameChars'),
					),
			}),
		[t],
	)

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: { databaseName: '' },
	})

	const onSubmit = async (data: FormData) => {
		const isValidDatabaseName = (name: string) =>
			/^[A-Za-z0-9_]+$/.test(name)

		if (!isValidDatabaseName(data.databaseName)) {
			toast.error(t('connection.error.nameInvalid'), {
				position: 'top-center',
			})
			return
		}

		try {
			const sql = resolveQueryByDialect(
				dataSourceId,
				{
					postgres: ({ databaseName }, dialect) =>
						`CREATE DATABASE ${renderToken(databaseName, dialect)}`,
					mysql: ({ databaseName }, dialect) =>
						`CREATE DATABASE ${renderToken(databaseName, dialect)}`,
					mariadb: ({ databaseName }, dialect) =>
						`CREATE DATABASE ${renderToken(databaseName, dialect)}`,
					mssql: ({ databaseName }, dialect) =>
						`CREATE DATABASE ${renderToken(databaseName, dialect)}`,
				},
				{
					databaseName: id(data.databaseName),
				},
			)

			if (!sql) {
				toast.error(t('connection.error.createDatabaseUnsupported'))
				return
			}

			await connectionService.runQuery(dataSourceId, null, sql, true)

			toast.success(t('connection.toast.created'))

			closeAction()
			reload()
		} catch (error) {
			notifyError(error, t('errors.failedCreateDatabase'))
		}
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={closeAction}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('connection.dialog.createDatabase.title')}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className='py-4'>
						<Input
							{...register('databaseName')}
							placeholder={t('connection.dialog.createDatabase.placeholder')}
							autoFocus
						/>
						{errors.databaseName && (
							<p className='text-sm text-red-500 mt-2 font-medium'>
								{errors.databaseName.message}
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
							{isSubmitting ?
								t('connection.dialog.createDatabase.creating')
							:	t('common.create')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default CreateDatabaseDialog
