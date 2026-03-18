import { createElement } from 'react'
import { type RouteObject } from 'react-router'

import DefaultLayout from './layouts/DefaultLayout'
import EnterPage from './pages/enter'
import Home from './pages/home'
import MeSettingsPage from './pages/me/settings'

export const appRoutes: RouteObject[] = [
	{
		path: '/enter',
		element: createElement(EnterPage),
	},
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
]
