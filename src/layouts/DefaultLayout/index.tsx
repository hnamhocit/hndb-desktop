'use client'

import { useEffect, useState } from 'react'

import { Outlet, useNavigate } from 'react-router'
import { useActiveStore, useTabsStore } from '@/stores'
import { getTabConnectionId } from '@/utils'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Tabs from '../components/Tabs'

const isEditableTarget = (target: EventTarget | null) => {
	if (!(target instanceof HTMLElement)) {
		return false
	}

	const tagName = target.tagName.toLowerCase()

	if (
		tagName === 'input' ||
		tagName === 'textarea' ||
		tagName === 'select' ||
		target.isContentEditable
	) {
		return true
	}

	return (
		Boolean(target.closest('[contenteditable=\"true\"]')) ||
		Boolean(target.closest('[role=\"textbox\"]'))
	)
}

const DefaultLayout = () => {
	const navigate = useNavigate()
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

	useEffect(() => {
		const triggerNewQueryShortcut = () => {
			const newQueryAction = document.querySelector<HTMLElement>(
				'[data-hotkey-new-query]',
			)
			newQueryAction?.click()
		}

		const triggerRunQueryShortcut = () => {
			const runQueryButton = document.querySelector<HTMLButtonElement>(
				'[data-hotkey-run-query]',
			)
			runQueryButton?.click()
		}

		const switchActiveTab = (direction: 1 | -1) => {
			const { tabs } = useTabsStore.getState()
			if (tabs.length === 0) return

			const activeState = useActiveStore.getState()
			const currentIndex = tabs.findIndex(
				(tab) => tab.id === activeState.activeTabId,
			)
			const baseIndex = currentIndex >= 0 ? currentIndex : 0
			const nextIndex = (baseIndex + direction + tabs.length) % tabs.length
			const nextTab = tabs[nextIndex]

			if (!nextTab) return

			activeState.setConnectionId(getTabConnectionId(nextTab))
			activeState.setDatabase(nextTab.database ?? null)
			activeState.setTable(nextTab.table ?? null)
			activeState.setActiveTabId(nextTab.id)
			navigate('/')
		}

		const triggerQuickSearchShortcut = () => {
			const searchInputs = document.querySelectorAll<HTMLInputElement>(
				'[data-hotkey-quick-search]',
			)

			const visibleInput = Array.from(searchInputs).find(
				(input) =>
					!input.disabled &&
					input.getAttribute('aria-hidden') !== 'true' &&
					input.offsetParent !== null,
			)

			if (!visibleInput) return

			visibleInput.focus()
			visibleInput.select()
		}

		const handleGlobalKeydown = (event: KeyboardEvent) => {
			if (event.defaultPrevented || event.isComposing) return

			const hasCtrlOrMeta = event.ctrlKey || event.metaKey
			const editableTarget = isEditableTarget(event.target)

			if (
				hasCtrlOrMeta &&
				!event.altKey &&
				!event.shiftKey &&
				event.key === 'Enter'
			) {
				event.preventDefault()
				triggerRunQueryShortcut()
				return
			}

			if (
				hasCtrlOrMeta &&
				!event.altKey &&
				!event.shiftKey &&
				event.key.toLowerCase() === 'k'
			) {
				event.preventDefault()
				triggerQuickSearchShortcut()
				return
			}

			if (
				event.altKey &&
				!hasCtrlOrMeta &&
				(event.key === '[' || event.code === 'BracketLeft')
			) {
				event.preventDefault()
				switchActiveTab(-1)
				return
			}

			if (
				event.altKey &&
				!hasCtrlOrMeta &&
				(event.key === ']' || event.code === 'BracketRight')
			) {
				event.preventDefault()
				switchActiveTab(1)
				return
			}

			if (
				!editableTarget &&
				!hasCtrlOrMeta &&
				!event.altKey &&
				event.key === '+'
			) {
				event.preventDefault()
				triggerNewQueryShortcut()
			}
		}

		window.addEventListener('keydown', handleGlobalKeydown)
		return () => window.removeEventListener('keydown', handleGlobalKeydown)
	}, [navigate])

	return (
		<div className='h-screen overflow-hidden'>
			<Header onToggleSidebar={() => setIsMobileSidebarOpen((v) => !v)} />

			<div className='flex h-[calc(100vh-3rem)] xl:h-[calc(100vh-3.5rem)]'>
				<Sidebar
					isMobileOpen={isMobileSidebarOpen}
					onCloseMobile={() => setIsMobileSidebarOpen(false)}
				/>

				<div className='flex-1 min-w-0 min-h-0 flex flex-col'>
					<Tabs />

					<div className='flex-1 min-h-0 relative'>
						<Outlet />
					</div>
				</div>
			</div>
		</div>
	)
}

export default DefaultLayout
