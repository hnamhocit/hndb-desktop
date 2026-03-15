import { RotateCcwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'

interface RefreshButtonProps {
	onClick: () => Promise<void>
}

const RefreshButton = ({ onClick }: RefreshButtonProps) => {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					onClick={onClick}
					size='icon'
					variant='ghost'>
					<RotateCcwIcon />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>Refresh data</p>
			</TooltipContent>
		</Tooltip>
	)
}

export default RefreshButton
