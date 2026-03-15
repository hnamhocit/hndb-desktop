'use client'

import { zodResolver } from '@hookform/resolvers/zod'
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
import { useDatabases } from '@/hooks'
import { dataSourcesService } from '@/services'
import { useContextMenuStore } from '@/stores'
import { notifyError, renderToken, resolveQueryByDialect } from '@/utils'

interface CreateDatabaseDialogProps {
	dataSourceId: string
}

const formSchema = z.object({
	databaseName: z
		.string()
		.min(1, 'Database name is required')
		.regex(
			/^[a-zA-Z0-9_.-]+$/,
			'Only letters, numbers, dashes, underscores, and dots are allowed',
		),
})

type FormData = z.infer<typeof formSchema>

const CreateDatabaseDialog = ({ dataSourceId }: CreateDatabaseDialogProps) => {
	const { actionType, target, closeAction } = useContextMenuStore()
	const isOpen =
		dataSourceId === target?.dataSourceId &&
		actionType === 'create-database' &&
		target.database === null
	const { reload } = useDatabases(dataSourceId, { autoFetch: false })

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
			toast.error(
				'Invalid database name. Only letters, numbers, and underscores are allowed.',
				{
					position: 'top-center',
				},
			)
			return
		}

		try {
			const sql = resolveQueryByDialect(
				dataSourceId,
				{
					postgresql: ({ databaseName }, dialect) =>
						`CREATE DATABASE ${renderToken(databaseName, dialect)}`,
					mysql: ({ databaseName }, dialect) =>
						`CREATE DATABASE ${renderToken(databaseName, dialect)}`,
					'maria-db': ({ databaseName }, dialect) =>
						`CREATE DATABASE ${renderToken(databaseName, dialect)}`,
					'sql-server': ({ databaseName }, dialect) =>
						`CREATE DATABASE ${renderToken(databaseName, dialect)}`,
				},
				{
					databaseName: id(data.databaseName),
				},
			)

			if (!sql) {
				toast.error(
					'Creating databases is not supported for this data source type.',
				)
				return
			}

			await dataSourcesService.runQuery(dataSourceId, null, sql, true)

			toast.success('Created successfully')

			closeAction()
			reload()
		} catch (error) {
			notifyError(error, 'Failed to create database.')
		}
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={closeAction}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Database</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className='py-4'>
						<Input
							{...register('databaseName')}
							placeholder='Enter new database name'
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
							Cancel
						</Button>

						<Button
							type='submit'
							disabled={isSubmitting}>
							{isSubmitting ? 'Creating...' : 'Create'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default CreateDatabaseDialog
