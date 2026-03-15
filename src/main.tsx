import './globals.css'

import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { Toaster } from 'sonner'

import BetaAnnouncementModal from './components/BetaAnnouncementModal'
import Providers from './components/Providers'
import { TooltipProvider } from './components/ui/tooltip'
import { appRoutes } from './routes'

const router = createBrowserRouter(appRoutes)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<>
		<Providers>
			<TooltipProvider>
				<RouterProvider router={router} />
				<BetaAnnouncementModal />
			</TooltipProvider>
		</Providers>

		<Toaster />
	</>,
)
