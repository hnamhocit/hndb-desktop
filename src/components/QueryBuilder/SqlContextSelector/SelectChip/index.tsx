import { CheckIcon, ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Option = {
	label: string
	value: string
}

interface SelectChipProps {
	value?: string | null
	placeholder: string
	options: Option[]
	onSelect: (value: string | null) => void
	disabled?: boolean
	nullableLabel?: string
}

export default function SelectChip({
	value,
	placeholder,
	options,
	onSelect,
	disabled,
	nullableLabel,
}: SelectChipProps) {
	const selectedLabel =
		value == null ?
			(nullableLabel ?? placeholder)
		:	(options.find((item) => item.value === value)?.label ?? placeholder)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				asChild
				disabled={disabled}>
				<Button
					variant='ghost'
					className='h-8 px-2 font-mono text-sm gap-1 max-w-40 sm:max-w-60 shrink-0'>
					<span
						className={`${!value ? 'text-muted-foreground' : ''} truncate`}>
						{selectedLabel}
					</span>

					<ChevronDownIcon className='h-4 w-4 opacity-70' />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align='start'
				className='min-w-56'>
				{nullableLabel && (
					<DropdownMenuItem
						onSelect={() => onSelect(null)}
						className='flex items-center justify-between gap-2'>
						<span>{nullableLabel}</span>

						{value == null && <CheckIcon className='h-4 w-4' />}
					</DropdownMenuItem>
				)}

				{options.map((item) => (
					<DropdownMenuItem
						key={item.value}
						onSelect={() => onSelect(item.value)}
						className='flex items-center justify-between gap-2'>
						<span>{item.label}</span>

						{value === item.value && (
							<CheckIcon className='h-4 w-4' />
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
