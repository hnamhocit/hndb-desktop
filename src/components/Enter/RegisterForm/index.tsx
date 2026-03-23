import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { useI18n } from '@/hooks'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { createRegisterSchema, RegisterSchema } from '@/schemas'
import { authService } from '@/services/auth.service'

const RegisterForm = () => {
	const { t } = useI18n()
	const registerSchema = useMemo(() => createRegisterSchema(t), [t])

	const {
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<RegisterSchema>({
		resolver: zodResolver(registerSchema),
		defaultValues: { name: '', email: '', password: '' },
	})

	const onSubmit = async (values: RegisterSchema) => {
		try {
			const { error } = await authService.register(values)
			if (error) {
				toast.error(
					t('auth.registerFailed', {
						message: error.message,
					}),
					{
					position: 'top-center',
					},
				)
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (error) {
			toast.error(t('auth.registerUnexpectedError'), {
				position: 'top-center',
			})
		}
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='space-y-4'>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('common.name')}</FieldLabel>

					<Controller
						control={control}
						name='name'
						render={({ field }) => (
							<Input
								placeholder={t('auth.namePlaceholder')}
								{...field}
							/>
						)}
					/>

					{errors.name && (
						<FieldError>{errors.name.message}</FieldError>
					)}
				</Field>

				<Field>
					<FieldLabel>{t('common.email')}</FieldLabel>

					<Controller
						control={control}
						name='email'
						render={({ field }) => (
							<Input
								placeholder={t('auth.emailPlaceholder')}
								{...field}
							/>
						)}
					/>

					{errors.email && (
						<FieldError>{errors.email.message}</FieldError>
					)}
				</Field>

				<Field>
					<FieldLabel>{t('common.password')}</FieldLabel>

					<Controller
						control={control}
						name='password'
						render={({ field }) => (
							<PasswordInput
								placeholder={t('auth.passwordPlaceholder')}
								{...field}
							/>
						)}
					/>

					{errors.password && (
						<FieldError>{errors.password.message}</FieldError>
					)}
				</Field>

				<Button
					disabled={isSubmitting}
					type='submit'
					className='w-full mt-2'>
					{t('auth.registerButton')}
				</Button>
			</FieldGroup>
		</form>
	)
}

export default RegisterForm
