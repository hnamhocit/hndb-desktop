import { createElement } from 'react'
import { Navigate, type RouteObject } from 'react-router'

import DefaultLayout from './layouts/DefaultLayout'
import AboutPage from './pages/about'
import EnterPage from './pages/enter'
import Home from './pages/home'
import MeSettingsPage from './pages/me/settings'
import { useUserStore } from './stores'

const GuestRoute = () => {
	const user = useUserStore((state) => state.user)

	return user ?
			createElement(Navigate, {
				to: '/',
				replace: true,
			})
		:	createElement(EnterPage)
}

export const appRoutes: RouteObject[] = [
	{
		path: '/enter',
		element: createElement(GuestRoute),
	},
	{
		element: createElement(DefaultLayout),
		children: [
			{
				index: true,
				element: createElement(Home),
			},
			{
				path: 'about',
				element: createElement(AboutPage),
			},
			{
				path: 'me/settings',
				element: createElement(MeSettingsPage),
			},
			{
				path: '*',
				element: createElement(Home),
			},
		],
	},
]
