import { createElement } from 'react'
import { Navigate, Outlet, type RouteObject } from 'react-router'

import DefaultLayout from './layouts/DefaultLayout'
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

const ProtectedRoute = () => {
	const user = useUserStore((state) => state.user)

	return user ?
			createElement(Outlet)
		:	createElement(Navigate, {
				to: '/enter',
				replace: true,
			})
}

export const appRoutes: RouteObject[] = [
	{
		path: '/enter',
		element: createElement(GuestRoute),
	},
	{
		element: createElement(ProtectedRoute),
		children: [
			{
				path: '/',
				element: createElement(DefaultLayout),
				children: [
					{
						index: true,
						element: createElement(Home),
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
		],
	},
]
