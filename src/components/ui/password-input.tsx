'use client'

import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { type ComponentProps, useState } from 'react'

import { cn } from '@/lib/utils'
import { Input } from './input'

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'> & {
	containerClassName?: string
}

function PasswordInput({
	className,
	containerClassName,
	disabled,
	...props
}: PasswordInputProps) {
	const [isVisible, setIsVisible] = useState(false)

	return (
		<div className={cn('relative', containerClassName)}>
			<Input
				{...props}
				type={isVisible ? 'text' : 'password'}
				disabled={disabled}
				className={cn('pr-10', className)}
			/>

			<button
				type='button'
				disabled={disabled}
				title={isVisible ? 'Hide password' : 'Show password'}
				aria-label={isVisible ? 'Hide password' : 'Show password'}
				onClick={() => setIsVisible((prev) => !prev)}
				className='absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50'>
				{isVisible ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
			</button>
		</div>
	)
}

export { PasswordInput }
