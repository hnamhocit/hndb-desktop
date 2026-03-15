import type { AppLanguage } from '@/services/preferences.service'

export const messages = {
	'common.blog': { en: 'Blog', vi: 'Bai viet' },
	'common.problems': { en: 'Problems', vi: 'Bai tap' },
	'common.donate': { en: 'Donate', vi: 'Ung ho' },
	'common.login': { en: 'Login', vi: 'Dang nhap' },
	'common.logout': { en: 'Logout', vi: 'Dang xuat' },
	'common.loggingOut': { en: 'Logging out...', vi: 'Dang dang xuat...' },
	'common.profile': { en: 'Profile', vi: 'Ho so' },
	'common.settings': { en: 'Settings', vi: 'Cai dat' },
	'common.user': { en: 'User', vi: 'Nguoi dung' },
	'common.save': { en: 'Save', vi: 'Luu' },
	'common.back': { en: 'Back', vi: 'Quay lai' },
	'common.email': { en: 'Email', vi: 'Email' },
	'common.password': { en: 'Password', vi: 'Mat khau' },
	'common.name': { en: 'Name', vi: 'Ten' },
	'common.language': { en: 'Language', vi: 'Ngon ngu' },
	'common.fontSize': { en: 'Font size', vi: 'Co chu' },
	'common.theme': { en: 'Theme', vi: 'Giao dien' },
	'common.light': { en: 'Light', vi: 'Sang' },
	'common.dark': { en: 'Dark', vi: 'Toi' },
	'common.english': { en: 'English', vi: 'Tieng Anh' },
	'common.vietnamese': { en: 'Vietnamese', vi: 'Tieng Viet' },
	'common.small': { en: 'Small', vi: 'Nho' },
	'common.medium': { en: 'Medium', vi: 'Vua' },
	'common.large': { en: 'Large', vi: 'Lon' },

	'toast.logoutSuccess': {
		en: 'Logged out successfully',
		vi: 'Dang xuat thanh cong',
	},
	'toast.logoutFailed': { en: 'Failed to logout', vi: 'Dang xuat that bai' },

	'enter.backToHome': { en: 'Back to home', vi: 'Ve trang chu' },
	'enter.account': { en: 'HNDB Account', vi: 'Tai khoan HNDB' },
	'enter.welcomeBack': { en: 'Welcome Back', vi: 'Chao mung tro lai' },
	'enter.subtitle': {
		en: 'Sign in or create an account to continue',
		vi: 'Dang nhap hoac tao tai khoan de tiep tuc',
	},
	'enter.orContinueWith': {
		en: 'Or continue with',
		vi: 'Hoac tiep tuc voi',
	},
	'enter.loginTab': { en: 'Login', vi: 'Dang nhap' },
	'enter.registerTab': { en: 'Register', vi: 'Dang ky' },

	'auth.loginButton': { en: 'Login', vi: 'Dang nhap' },
	'auth.registerButton': { en: 'Register', vi: 'Dang ky' },
	'auth.emailPlaceholder': { en: 'name@example.com', vi: 'ten@example.com' },
	'auth.namePlaceholder': { en: 'John Doe', vi: 'Nguyen Van A' },
	'auth.passwordPlaceholder': { en: '••••••••', vi: '••••••••' },

	'settings.title': { en: 'Settings', vi: 'Cai dat' },
	'settings.subtitle': {
		en: 'Account controls and local preferences.',
		vi: 'Quan ly tai khoan va tuy chinh cuc bo.',
	},
	'settings.account': { en: 'Account', vi: 'Tai khoan' },
	'settings.security': { en: 'Security', vi: 'Bao mat' },
	'settings.preferences': { en: 'Preferences', vi: 'Tuy chinh' },
	'settings.displayName': { en: 'Display name', vi: 'Ten hien thi' },
	'settings.displayNamePlaceholder': {
		en: 'Your display name',
		vi: 'Ten hien thi cua ban',
	},
	'settings.emailPlaceholder': { en: 'you@example.com', vi: 'ban@example.com' },
	'settings.saveAccountChanges': {
		en: 'Save account changes',
		vi: 'Luu thay doi tai khoan',
	},
	'settings.darkMode': { en: 'Dark mode', vi: 'Che do toi' },
	'settings.toggleAppearance': {
		en: 'Toggle UI appearance.',
		vi: 'Chuyen doi giao dien.',
	},
	'settings.forgotPassword': { en: 'Forgot password', vi: 'Quen mat khau' },
	'settings.sendResetLink': { en: 'Send reset link', vi: 'Gui link dat lai' },
	'settings.sendResetLinkHint': {
		en: 'Send reset link to your email.',
		vi: 'Gui link dat lai qua email.',
	},
	'settings.dangerZone': { en: 'Danger zone', vi: 'Khu vuc nguy hiem' },
	'settings.deleteHint': {
		en: 'Type `DELETE` to enable account deletion button. This is UI only for now.',
		vi: 'Nhap `DELETE` de bat nut xoa tai khoan. Hien tai chi la UI.',
	},
	'settings.typeDelete': { en: 'Type DELETE', vi: 'Nhap DELETE' },
	'settings.deleteAccount': { en: 'Delete account', vi: 'Xoa tai khoan' },
} as const

export type TranslationKey = keyof typeof messages

type TranslationParams = Record<string, string | number>

export const translate = (
	language: AppLanguage,
	key: TranslationKey,
	params?: TranslationParams,
): string => {
	const template: string = messages[key][language]
	if (!params) return template

	return Object.entries(params).reduce(
		(acc, [paramKey, value]) =>
			acc.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(value)),
		template,
	)
}
