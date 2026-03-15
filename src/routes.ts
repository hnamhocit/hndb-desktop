import { createElement } from 'react'
import { type RouteObject } from 'react-router'

import DefaultLayout from './layouts/DefaultLayout'
import BlogDetailPage from './pages/blog/[slug]'
import BlogPage from './pages/blog'
import DonatePage from './pages/donate'
import EnterPage from './pages/enter'
import Home from './pages/home'
import MeSettingsPage from './pages/me/settings'
import NotificationsPage from './pages/notifications'
import ProblemDetailPage from './pages/problems/[problem_id]'
import ProblemsPage from './pages/problems'
import UserProfilePage from './pages/users/[user_id]'

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
				path: 'blog',
				element: createElement(BlogPage),
			},
			{
				path: 'blog/:slug',
				element: createElement(BlogDetailPage),
			},
			{
				path: 'problems',
				element: createElement(ProblemsPage),
			},
			{
				path: 'problems/:problem_id',
				element: createElement(ProblemDetailPage),
			},
			{
				path: 'notifications',
				element: createElement(NotificationsPage),
			},
			{
				path: 'donate',
				element: createElement(DonatePage),
			},
			{
				path: 'me/settings',
				element: createElement(MeSettingsPage),
			},
			{
				path: 'users/:user_id',
				element: createElement(UserProfilePage),
			},
			{
				path: '*',
				element: createElement(Home),
			},
		],
	},
]
