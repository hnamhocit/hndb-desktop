import { SettingsIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'

const SettingsButton = () => {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					size='icon'
					variant='ghost'>
					<SettingsIcon />
				</Button>
			</TooltipTrigger>

			<TooltipContent>
				<p>More actions coming soon...</p>
			</TooltipContent>
		</Tooltip>
	)
}

export default SettingsButton
