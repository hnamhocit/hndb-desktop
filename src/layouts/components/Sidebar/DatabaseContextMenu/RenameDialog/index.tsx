'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { id } from '@/helpers'
import { dataSourcesService } from '@/services'
import { useContextMenuStore, useDataSourcesStore } from '@/stores'
import { notifyError, renderToken, resolveQueryByDialect } from '@/utils'

const formSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Database name is required.')
		.max(64, 'Database name is too long.')
		.regex(
			/^[A-Za-z_][A-Za-z0-9_$]*$/,
			'Only letters, numbers, underscore, and $ are allowed. Name must not start with a number.',
		),
})

type FormValues = z.infer<typeof formSchema>

interface RenameDatabaseDialogProps {
	dataSourceId: string
	database: string
}

const RenameDialog = ({
	dataSourceId,
	database,
}: RenameDatabaseDialogProps) => {
	const { target, actionType, isSubmitting, setIsSubmitting, closeAction } =
		useContextMenuStore()

	const { cachedDatabases, setCachedDatabases, setCachedSchema } =
		useDataSourcesStore()

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
					postgresql: ({ oldName, newName }, dialect) =>
						`ALTER DATABASE ${renderToken(oldName, dialect)} RENAME TO ${renderToken(newName, dialect)};`,

					'sql-server': ({ oldName, newName }, dialect) =>
						`ALTER DATABASE ${renderToken(oldName, dialect)} MODIFY NAME = ${renderToken(newName, dialect)};`,
				},
				{
					oldName: id(database),
					newName: id(name),
				},
			)

			if (!query) {
				toast.error(
					'Renaming database is not supported for this database type.',
					{ position: 'top-center' },
				)
				return
			}

			await dataSourcesService.runQuery(
				dataSourceId,
				database,
				query,
				true,
			)

			const current = cachedDatabases[dataSourceId] ?? []
			setCachedDatabases(
				dataSourceId,
				current.map((db) => (db === database ? name : db)),
			)

			const oldSchemaKey = `${dataSourceId}-${database}`
			const newSchemaKey = `${dataSourceId}-${name}`

			const oldSchema =
				useDataSourcesStore.getState().cachedSchema[oldSchemaKey]

			if (oldSchema) {
				setCachedSchema(newSchemaKey, oldSchema)
				setCachedSchema(oldSchemaKey, {})
			}

			closeAction()
		} catch (error) {
			notifyError(error, 'Failed to rename database.')
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
					<DialogTitle>Rename database</DialogTitle>
					<DialogDescription>
						Enter a new name for <strong>{database}</strong>.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={handleSubmit(onSubmit)}
					className='space-y-4'>
					<div className='space-y-2'>
						<label
							htmlFor='database-name'
							className='text-sm font-medium'>
							Database name
						</label>

						<Input
							id='database-name'
							autoFocus
							placeholder='Enter database name'
							{...register('name')}
							className={clsx(
								errors.name &&
									'border-destructive focus-visible:ring-destructive/30',
							)}
						/>

						<p className='text-xs text-muted-foreground'>
							Use a valid SQL identifier.
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
							Cancel
						</Button>

						<Button
							type='submit'
							disabled={isSubmitting}>
							Save
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default RenameDialog
