import type { AppLanguage } from '@/services/preferences.service'

export const messages = {
	'common.login': { en: 'Login', vi: 'Đăng nhập' },
	'common.logout': { en: 'Logout', vi: 'Đăng xuất' },
	'common.loggingOut': { en: 'Logging out...', vi: 'Đang đăng xuất...' },
	'common.profile': { en: 'Profile', vi: 'Hồ sơ' },
	'common.settings': { en: 'Settings', vi: 'Cài đặt' },
	'common.user': { en: 'User', vi: 'Người dùng' },
	'common.save': { en: 'Save', vi: 'Lưu' },
	'common.back': { en: 'Back', vi: 'Quay lại' },
	'common.email': { en: 'Email', vi: 'Email' },
	'common.password': { en: 'Password', vi: 'Mật khẩu' },
	'common.name': { en: 'Name', vi: 'Tên' },
	'common.language': { en: 'Language', vi: 'Ngôn ngữ' },
	'common.fontSize': { en: 'Font size', vi: 'Cỡ chữ' },
	'common.theme': { en: 'Theme', vi: 'Giao diện' },
	'common.light': { en: 'Light', vi: 'Sáng' },
	'common.dark': { en: 'Dark', vi: 'Tối' },
	'common.english': { en: 'English', vi: 'Tiếng Anh' },
	'common.vietnamese': { en: 'Vietnamese', vi: 'Tiếng Việt' },
	'common.small': { en: 'Small', vi: 'Nhỏ' },
	'common.medium': { en: 'Medium', vi: 'Vừa' },
	'common.large': { en: 'Large', vi: 'Lớn' },
	'common.cancel': { en: 'Cancel', vi: 'Hủy' },
	'common.close': { en: 'Close', vi: 'Đóng' },
	'common.confirm': { en: 'Confirm', vi: 'Xác nhận' },
	'common.create': { en: 'Create', vi: 'Tạo' },
	'common.delete': { en: 'Delete', vi: 'Xóa' },
	'common.rename': { en: 'Rename', vi: 'Đổi tên' },
	'common.refresh': { en: 'Refresh', vi: 'Làm mới' },
	'common.connect': { en: 'Connect', vi: 'Kết nối' },
	'common.disconnect': { en: 'Disconnect', vi: 'Ngắt kết nối' },
	'common.database': { en: 'Database', vi: 'Cơ sở dữ liệu' },
	'common.unknownError': { en: 'Unknown error.', vi: 'Lỗi không xác định.' },

	'toast.logoutSuccess': {
		en: 'Logged out successfully',
		vi: 'Đăng xuất thành công',
	},
	'toast.logoutFailed': { en: 'Failed to logout', vi: 'Đăng xuất thất bại' },

	'enter.backToHome': { en: 'Back to home', vi: 'Về trang chủ' },
	'enter.account': { en: 'HNDB Account', vi: 'Tài khoản HNDB' },
	'enter.welcomeBack': { en: 'Welcome Back', vi: 'Chào mừng trở lại' },
	'enter.subtitle': {
		en: 'Sign in or create an account to continue',
		vi: 'Đăng nhập hoặc tạo tài khoản để tiếp tục',
	},
	'enter.orContinueWith': {
		en: 'Or continue with',
		vi: 'Hoặc tiếp tục với',
	},
	'enter.loginTab': { en: 'Login', vi: 'Đăng nhập' },
	'enter.registerTab': { en: 'Register', vi: 'Đăng ký' },

	'auth.loginButton': { en: 'Login', vi: 'Đăng nhập' },
	'auth.registerButton': { en: 'Register', vi: 'Đăng ký' },
	'auth.emailPlaceholder': { en: 'name@example.com', vi: 'ten@example.com' },
	'auth.namePlaceholder': { en: 'John Doe', vi: 'Nguyễn Văn A' },
	'auth.passwordPlaceholder': { en: '••••••••', vi: '••••••••' },
	'auth.loginFailed': {
		en: 'Login failed: {{message}}',
		vi: 'Đăng nhập thất bại: {{message}}',
	},
	'auth.loginUnexpectedError': {
		en: 'An unexpected error occurred during login.',
		vi: 'Đã xảy ra lỗi không mong muốn khi đăng nhập.',
	},
	'auth.registerFailed': {
		en: 'Register failed: {{message}}',
		vi: 'Đăng ký thất bại: {{message}}',
	},
	'auth.registerUnexpectedError': {
		en: 'An unexpected error occurred during registration.',
		vi: 'Đã xảy ra lỗi không mong muốn khi đăng ký.',
	},
	'auth.oauthUrlMissing': { en: 'No OAuth URL', vi: 'Không có URL OAuth' },
	'auth.providerLoginFailed': {
		en: '{{provider}} login failed',
		vi: 'Đăng nhập {{provider}} thất bại',
	},
	'auth.providerSignInFailed': {
		en: 'Failed to complete provider sign in.',
		vi: 'Không thể hoàn tất đăng nhập bằng nhà cung cấp.',
	},
	'auth.callbackMissingPayload': {
		en: 'Authentication callback is missing code/token payload.',
		vi: 'Callback xác thực thiếu mã hoặc token.',
	},
	'auth.error.passwordRule': {
		en: 'At least 8 characters, including uppercase, lowercase, number, and special character.',
		vi: 'Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
	},
	'auth.error.invalidEmail': {
		en: 'Invalid email address.',
		vi: 'Địa chỉ email không hợp lệ.',
	},
	'auth.error.nameMin': {
		en: 'Name must be at least 2 characters long.',
		vi: 'Tên phải có ít nhất 2 ký tự.',
	},
	'auth.error.nameMax': {
		en: 'Name must be at most 35 characters long.',
		vi: 'Tên tối đa 35 ký tự.',
	},

	'settings.title': { en: 'Settings', vi: 'Cài đặt' },
	'settings.subtitle': {
		en: 'Account controls and local preferences.',
		vi: 'Quản lý tài khoản và tùy chỉnh cục bộ.',
	},
	'settings.account': { en: 'Account', vi: 'Tài khoản' },
	'settings.security': { en: 'Security', vi: 'Bảo mật' },
	'settings.preferences': { en: 'Preferences', vi: 'Tùy chỉnh' },
	'settings.displayName': { en: 'Display name', vi: 'Tên hiển thị' },
	'settings.displayNamePlaceholder': {
		en: 'Your display name',
		vi: 'Tên hiển thị của bạn',
	},
	'settings.emailPlaceholder': {
		en: 'you@example.com',
		vi: 'ban@example.com',
	},
	'settings.saveAccountChanges': {
		en: 'Save account changes',
		vi: 'Lưu thay đổi tài khoản',
	},
	'settings.darkMode': { en: 'Dark mode', vi: 'Chế độ tối' },
	'settings.toggleAppearance': {
		en: 'Toggle UI appearance.',
		vi: 'Chuyển đổi giao diện.',
	},
	'settings.typography': { en: 'Typography', vi: 'Typography' },
	'settings.typographyHint': {
		en: 'Customize font size, normal font, and mono font in one place.',
		vi: 'Tùy chỉnh cỡ chữ, font thường và font mono tại một chỗ.',
	},
	'settings.fontSizeRange': {
		en: 'Allowed range: {{min}}-{{max}} px.',
		vi: 'Khoảng cho phép: {{min}}-{{max}} px.',
	},
	'settings.fontSizePreview': {
		en: 'Current: {{size}} px',
		vi: 'Hiện tại: {{size}} px',
	},
	'settings.fontSizeInvalid': {
		en: 'Invalid font size. Please enter a number.',
		vi: 'Cỡ chữ không hợp lệ. Vui lòng nhập số.',
	},
	'settings.monacoTheme': {
		en: 'Editor theme',
		vi: 'Theme editor',
	},
	'settings.monacoThemeHint': {
		en: 'Choose one Monaco theme for SQL editor, query plan, and JSON editors across the app.',
		vi: 'Chọn một theme Monaco dùng chung cho SQL editor, kế hoạch truy vấn và các JSON editor trong toàn app.',
	},
	'settings.selectMonacoTheme': {
		en: 'Select an editor theme',
		vi: 'Chọn theme editor',
	},
	'settings.shortcuts.tab': {
		en: 'Shortcuts',
		vi: 'Phím tắt',
	},
	'settings.shortcuts.title': {
		en: 'Keyboard shortcuts',
		vi: 'Phím tắt bàn phím',
	},
	'settings.shortcuts.hint': {
		en: 'Click Change, press a shortcut, and it will be saved instantly.',
		vi: 'Bấm Change, gõ tổ hợp phím, app sẽ lưu ngay lập tức.',
	},
	'settings.shortcuts.change': {
		en: 'Change',
		vi: 'Đổi',
	},
	'settings.shortcuts.reset': {
		en: 'Reset',
		vi: 'Đặt lại',
	},
	'settings.shortcuts.resetAll': {
		en: 'Reset all',
		vi: 'Đặt lại tất cả',
	},
	'settings.shortcuts.listening': {
		en: 'Listening...',
		vi: 'Đang nghe...',
	},
	'settings.shortcuts.listeningHint': {
		en: 'Press the new shortcut now. Press Esc to cancel.',
		vi: 'Hãy bấm tổ hợp phím mới ngay bây giờ. Bấm Esc để hủy.',
	},
	'settings.shortcuts.updated': {
		en: 'Shortcut updated: {{shortcut}}',
		vi: 'Đã cập nhật phím tắt: {{shortcut}}',
	},
	'settings.shortcuts.conflict': {
		en: 'This shortcut is already used by {{action}}.',
		vi: 'Phím tắt này đã được dùng cho {{action}}.',
	},
	'settings.shortcuts.runQuery': {
		en: 'Run query',
		vi: 'Chạy truy vấn',
	},
	'settings.shortcuts.runQueryDescription': {
		en: 'Execute the current SQL query in the active query tab.',
		vi: 'Thực thi câu SQL hiện tại trong tab truy vấn đang mở.',
	},
	'settings.shortcuts.newQuery': {
		en: 'New query tab',
		vi: 'Tab truy vấn mới',
	},
	'settings.shortcuts.newQueryDescription': {
		en: 'Create a new query tab.',
		vi: 'Tạo một tab truy vấn mới.',
	},
	'settings.shortcuts.quickSearch': {
		en: 'Quick search',
		vi: 'Tìm nhanh',
	},
	'settings.shortcuts.quickSearchDescription': {
		en: 'Focus the global data source search input.',
		vi: 'Focus vào ô tìm kiếm nguồn dữ liệu toàn cục.',
	},
	'settings.shortcuts.openSettingsJson': {
		en: 'Open settings JSON',
		vi: 'Mở settings JSON',
	},
	'settings.shortcuts.openSettingsJsonDescription': {
		en: 'Jump directly to the Config JSON tab in settings.',
		vi: 'Đi thẳng tới tab Config JSON trong settings.',
	},
	'settings.shortcuts.previousTab': {
		en: 'Previous tab',
		vi: 'Tab trước',
	},
	'settings.shortcuts.previousTabDescription': {
		en: 'Switch to the previous workspace tab.',
		vi: 'Chuyển sang tab làm việc trước đó.',
	},
	'settings.shortcuts.nextTab': {
		en: 'Next tab',
		vi: 'Tab tiếp theo',
	},
	'settings.shortcuts.nextTabDescription': {
		en: 'Switch to the next workspace tab.',
		vi: 'Chuyển sang tab làm việc tiếp theo.',
	},
	'settings.normalFont': { en: 'Normal font', vi: 'Font thường' },
	'settings.monoFont': { en: 'Monospace font', vi: 'Font mono' },
	'settings.selectFont': { en: 'Select a font', vi: 'Chọn font' },
	'settings.selectMonoFont': {
		en: 'Select a mono font',
		vi: 'Chọn font mono',
	},
	'settings.uploadFontFile': {
		en: 'Upload normal font',
		vi: 'Tải lên font thường',
	},
	'settings.replaceFontFile': {
		en: 'Replace normal font',
		vi: 'Thay font thường',
	},
	'settings.removeUploadedFont': {
		en: 'Remove uploaded normal font',
		vi: 'Xóa font thường đã tải lên',
	},
	'settings.uploadedFontActive': {
		en: 'Uploaded normal font: {{name}}',
		vi: 'Font thường đã tải lên: {{name}}',
	},
	'settings.noUploadedFont': {
		en: 'No uploaded normal font yet.',
		vi: 'Chưa có font thường tải lên.',
	},
	'settings.uploadMonoFontFile': {
		en: 'Upload mono font',
		vi: 'Tải lên font mono',
	},
	'settings.replaceMonoFontFile': {
		en: 'Replace mono font',
		vi: 'Thay font mono',
	},
	'settings.removeUploadedMonoFont': {
		en: 'Remove uploaded mono font',
		vi: 'Xóa font mono đã tải lên',
	},
	'settings.uploadedMonoFontActive': {
		en: 'Uploaded mono font: {{name}}',
		vi: 'Font mono đã tải lên: {{name}}',
	},
	'settings.noUploadedMonoFont': {
		en: 'No uploaded mono font yet.',
		vi: 'Chưa có font mono tải lên.',
	},
	'settings.uploadFontLimitNote': {
		en: 'Supported formats: TTF, OTF, WOFF, WOFF2. Maximum file size: {{max}} MB.',
		vi: 'Định dạng hỗ trợ: TTF, OTF, WOFF, WOFF2. Kích thước tối đa: {{max}} MB.',
	},
	'settings.fontUploadUnsupportedFormat': {
		en: 'Unsupported font format. Use TTF, OTF, WOFF, or WOFF2.',
		vi: 'Định dạng font không hỗ trợ. Hãy dùng TTF, OTF, WOFF hoặc WOFF2.',
	},
	'settings.fontUploadTooLarge': {
		en: 'Font file is too large. Maximum size is {{max}} MB.',
		vi: 'Tệp font quá lớn. Kích thước tối đa là {{max}} MB.',
	},
	'settings.fontUploadSuccess': {
		en: 'Uploaded normal font: {{name}}',
		vi: 'Đã tải lên font thường: {{name}}',
	},
	'settings.monoFontUploadSuccess': {
		en: 'Uploaded mono font: {{name}}',
		vi: 'Đã tải lên font mono: {{name}}',
	},
	'settings.fontUploadFailed': {
		en: 'Failed to upload font file.',
		vi: 'Không thể tải lên tệp font.',
	},
	'settings.configTab': {
		en: 'Config JSON',
		vi: 'Config JSON',
	},
	'settings.aboutTab': {
		en: 'About',
		vi: 'About',
	},
	'settings.openConfigEditor': {
		en: 'Open JSON editor',
		vi: 'Mở JSON editor',
	},
	'settings.aboutTitle': {
		en: 'About this app',
		vi: 'Thông tin ứng dụng',
	},
	'settings.aboutHint': {
		en: 'Version details, release metadata, repository links, and update status.',
		vi: 'Chi tiết phiên bản, metadata release, liên kết repository và trạng thái cập nhật.',
	},
	'settings.aboutVersion': {
		en: 'Installed version',
		vi: 'Phiên bản đang dùng',
	},
	'settings.aboutReleaseDate': {
		en: 'Release date',
		vi: 'Ngày phát hành',
	},
	'settings.aboutReleaseDateUnknown': {
		en: 'Release date unavailable',
		vi: 'Chưa có ngày phát hành',
	},
	'settings.aboutLatestRelease': {
		en: 'Latest release',
		vi: 'Bản phát hành mới nhất',
	},
	'settings.aboutLatestReleaseHint': {
		en: 'Check updates to load the newest GitHub release metadata.',
		vi: 'Bấm kiểm tra cập nhật để tải metadata release mới nhất từ GitHub.',
	},
	'settings.aboutUpdateStatus': {
		en: 'Update status',
		vi: 'Trạng thái cập nhật',
	},
	'settings.aboutCheckedAt': {
		en: 'Last checked on {{date}}.',
		vi: 'Kiểm tra lần cuối vào {{date}}.',
	},
	'settings.aboutNotCheckedYet': {
		en: 'Update check has not run yet.',
		vi: 'Chưa kiểm tra cập nhật.',
	},
	'settings.aboutOpenRepository': {
		en: 'Open repository',
		vi: 'Mở repository',
	},
	'settings.aboutOpenReleases': {
		en: 'Open releases',
		vi: 'Mở releases',
	},
	'settings.aboutTechStack': {
		en: 'Technology stack',
		vi: 'Công nghệ sử dụng',
	},
	'settings.aboutTechStackHint': {
		en: 'A quick overview of the main technologies behind HNDB.',
		vi: 'Tổng quan nhanh các công nghệ chính đang chạy HNDB.',
	},
	'settings.configEditorTitle': {
		en: 'Preferences JSON Editor',
		vi: 'Trình chỉnh sửa Preferences JSON',
	},
	'settings.configEditorHint': {
		en: 'Edit raw preferences in JSON format (Monaco editor), then apply or download.',
		vi: 'Chỉnh sửa preferences dạng JSON (Monaco editor), sau đó áp dụng hoặc tải xuống.',
	},
	'settings.configEditorFormat': {
		en: 'Format JSON',
		vi: 'Format JSON',
	},
	'settings.configEditorApply': {
		en: 'Apply JSON',
		vi: 'Áp dụng JSON',
	},
	'settings.configEditorResetAction': {
		en: 'Reset Draft',
		vi: 'Đặt lại bản nháp',
	},
	'settings.configEditorDownload': {
		en: 'Download Config',
		vi: 'Tải config',
	},
	'settings.configEditorInvalidRoot': {
		en: 'JSON root must be an object.',
		vi: 'JSON gốc phải là một object.',
	},
	'settings.configEditorInvalidJson': {
		en: 'Invalid JSON: {{detail}}',
		vi: 'JSON không hợp lệ: {{detail}}',
	},
	'settings.configEditorFormatted': {
		en: 'JSON formatted.',
		vi: 'Đã format JSON.',
	},
	'settings.configEditorApplied': {
		en: 'Preferences applied from JSON.',
		vi: 'Đã áp dụng preferences từ JSON.',
	},
	'settings.configEditorReset': {
		en: 'Draft reset to current preferences.',
		vi: 'Bản nháp đã được đặt lại theo preferences hiện tại.',
	},
	'settings.configEditorDownloaded': {
		en: 'Config file downloaded.',
		vi: 'Đã tải xuống file config.',
	},
	'settings.fontFamilyOption.inter': {
		en: 'Inter',
		vi: 'Inter',
	},
	'settings.fontFamilyOption.manrope': {
		en: 'Manrope',
		vi: 'Manrope',
	},
	'settings.fontFamilyOption.dmSans': {
		en: 'DM Sans',
		vi: 'DM Sans',
	},
	'settings.fontFamilyOption.geist': {
		en: 'Geist (default)',
		vi: 'Geist (mặc định)',
	},
	'settings.fontFamilyOption.system': {
		en: 'System Sans',
		vi: 'System Sans',
	},
	'settings.fontFamilyOption.serif': {
		en: 'Serif',
		vi: 'Serif',
	},
	'settings.fontFamilyOption.uploaded': {
		en: 'Uploaded: {{name}}',
		vi: 'Đã tải lên: {{name}}',
	},
	'settings.monoFontOption.geistMono': {
		en: 'Geist Mono (default)',
		vi: 'Geist Mono (mặc định)',
	},
	'settings.monoFontOption.uiMono': {
		en: 'UI Monospace',
		vi: 'UI Monospace',
	},
	'settings.monoFontOption.jetbrainsMono': {
		en: 'JetBrains Mono',
		vi: 'JetBrains Mono',
	},
	'settings.monoFontOption.firaCode': {
		en: 'Fira Code',
		vi: 'Fira Code',
	},
	'settings.monoFontOption.courier': {
		en: 'Courier',
		vi: 'Courier',
	},
	'settings.monoFontOption.uploaded': {
		en: 'Uploaded: {{name}}',
		vi: 'Đã tải lên: {{name}}',
	},
	'settings.monacoThemeOption.githubLight': {
		en: 'GitHub Light',
		vi: 'GitHub Light',
	},
	'settings.monacoThemeOption.oneDark': {
		en: 'One Dark',
		vi: 'One Dark',
	},
	'settings.monacoThemeOption.tokyoNight': {
		en: 'Tokyo Night',
		vi: 'Tokyo Night',
	},
	'settings.monacoThemeOption.gruvboxDark': {
		en: 'Gruvbox Dark',
		vi: 'Gruvbox Dark',
	},
	'settings.monacoThemeOption.nord': {
		en: 'Nord',
		vi: 'Nord',
	},
	'settings.monacoThemeOption.catppuccinMocha': {
		en: 'Catppuccin Mocha',
		vi: 'Catppuccin Mocha',
	},
	'settings.forgotPassword': { en: 'Forgot password', vi: 'Quên mật khẩu' },
	'settings.sendResetLink': {
		en: 'Send reset link',
		vi: 'Gửi liên kết đặt lại',
	},
	'settings.sendResetLinkHint': {
		en: 'Send reset link to your email.',
		vi: 'Gửi liên kết đặt lại qua email.',
	},
	'settings.dangerZone': { en: 'Danger zone', vi: 'Vùng nguy hiểm' },
	'settings.deleteHint': {
		en: 'Type `DELETE` to enable account deletion button. This is UI only for now.',
		vi: 'Nhập `DELETE` để bật nút xóa tài khoản. Hiện tại chỉ là giao diện.',
	},
	'settings.typeDelete': { en: 'Type DELETE', vi: 'Nhập DELETE' },
	'settings.deleteAccount': { en: 'Delete account', vi: 'Xóa tài khoản' },
	'settings.toastSavePending': {
		en: 'UI only: Save settings API will be connected later.',
		vi: 'Mới chỉ có giao diện: API lưu cài đặt sẽ được kết nối sau.',
	},
	'settings.toastResetPending': {
		en: 'UI only: Reset password flow will be connected later.',
		vi: 'Mới chỉ có giao diện: luồng đặt lại mật khẩu sẽ được kết nối sau.',
	},
	'settings.toastDeletePending': {
		en: 'UI only: Delete account flow will be connected later.',
		vi: 'Mới chỉ có giao diện: luồng xóa tài khoản sẽ được kết nối sau.',
	},
	'updates.checkButton': {
		en: 'Check update',
		vi: 'Kiểm tra cập nhật',
	},
	'updates.availableLabel': {
		en: 'Update available: v{{version}}',
		vi: 'Có bản mới: v{{version}}',
	},
	'updates.noUpdateLabel': {
		en: 'You are on the latest version.',
		vi: 'Bạn đang ở bản mới nhất.',
	},
	'updates.downloadButton': {
		en: 'Download v{{version}}',
		vi: 'Tải v{{version}}',
	},
	'updates.upToDate': {
		en: 'You are already on the latest version (v{{version}}).',
		vi: 'Bạn đang dùng bản mới nhất (v{{version}}).',
	},
	'updates.checkFailed': {
		en: 'Failed to check updates.',
		vi: 'Không thể kiểm tra cập nhật.',
	},
	'updates.openReleaseFailed': {
		en: 'Failed to open the release page.',
		vi: 'Không thể mở trang release.',
	},
	'updates.toastAvailable': {
		en: 'A newer version v{{version}} is available. Published on {{date}}.',
		vi: 'Có phiên bản mới v{{version}}. Phát hành ngày {{date}}.',
	},

	'home.greetingMorning': { en: 'Good morning', vi: 'Chào buổi sáng' },
	'home.greetingAfternoon': { en: 'Good afternoon', vi: 'Chào buổi chiều' },
	'home.greetingEvening': { en: 'Good evening', vi: 'Chào buổi tối' },
	'home.subtitleMorning': {
		en: 'Ease into the day with a fresh query.',
		vi: 'Bắt đầu ngày mới nhẹ nhàng với một truy vấn mới.',
	},
	'home.subtitleAfternoon': {
		en: 'Pick up where you left off with a new query.',
		vi: 'Tiếp tục công việc còn dở với một truy vấn mới.',
	},
	'home.subtitleEvening': {
		en: 'One more clean query before calling it a day.',
		vi: 'Thêm một truy vấn gọn gàng trước khi kết thúc ngày.',
	},
	'home.quickActions': { en: 'Quick actions', vi: 'Tác vụ nhanh' },
	'home.actionNewQuery': { en: 'New query', vi: 'Truy vấn mới' },
	'home.actionSwitchTab': { en: 'Switch tab', vi: 'Chuyển tab' },
	'home.actionRunQuery': { en: 'Run query', vi: 'Chạy truy vấn' },
	'home.actionQuickSearch': { en: 'Quick search', vi: 'Tìm nhanh' },
	'home.unknownTabType': {
		en: 'Unknown tab type',
		vi: 'Loại tab không xác định',
	},

	'header.searchDataSources': {
		en: 'Search data sources...',
		vi: 'Tìm nguồn dữ liệu...',
	},
	'header.noDataSourceFound': {
		en: 'No data source found.',
		vi: 'Không tìm thấy nguồn dữ liệu.',
	},

	'tabs.close': { en: 'Close', vi: 'Đóng' },
	'tabs.closeOthers': { en: 'Close others', vi: 'Đóng các tab khác' },
	'tabs.closeRight': {
		en: 'Close to the right',
		vi: 'Đóng các tab bên phải',
	},
	'tabs.closeLeft': { en: 'Close to the left', vi: 'Đóng các tab bên trái' },
	'tabs.closeAll': { en: 'Close all', vi: 'Đóng tất cả' },
	'tabs.newQueryTitle': { en: 'Query {{index}}', vi: 'Truy vấn {{index}}' },

	'sidebar.selectConnection': {
		en: 'Select a connection to load databases.',
		vi: 'Chọn kết nối để tải danh sách cơ sở dữ liệu.',
	},
	'sidebar.loadingDatabases': {
		en: 'Loading databases...',
		vi: 'Đang tải cơ sở dữ liệu...',
	},
	'sidebar.connectToLoadDatabases': {
		en: 'Connect this data source to load databases.',
		vi: 'Hãy kết nối nguồn dữ liệu này để tải cơ sở dữ liệu.',
	},
	'sidebar.noDatabasesFound': {
		en: 'No databases found.',
		vi: 'Không tìm thấy cơ sở dữ liệu.',
	},
	'sidebar.loadingTables': {
		en: 'Loading tables...',
		vi: 'Đang tải bảng...',
	},
	'sidebar.connectToLoadTables': {
		en: 'Connect this data source to load tables.',
		vi: 'Hãy kết nối nguồn dữ liệu này để tải bảng.',
	},
	'sidebar.noTablesFound': {
		en: 'No tables found.',
		vi: 'Không tìm thấy bảng.',
	},
	'sidebar.connectionConnecting': {
		en: 'Connecting...',
		vi: 'Đang kết nối...',
	},
	'sidebar.connectionActive': {
		en: 'Connection is active',
		vi: 'Kết nối đang hoạt động',
	},
	'sidebar.connectionDisconnected': {
		en: 'Connection is disconnected',
		vi: 'Kết nối đã ngắt',
	},

	'connection.menu.createDatabase': {
		en: 'Create database',
		vi: 'Tạo cơ sở dữ liệu',
	},
	'connection.menu.editConnection': {
		en: 'Edit connection',
		vi: 'Sửa kết nối',
	},
	'connection.menu.invalidateReconnect': {
		en: 'Invalidate/Reconnect',
		vi: 'Vô hiệu hóa/Kết nối lại',
	},
	'connection.menu.connect': { en: 'Connect', vi: 'Kết nối' },
	'connection.menu.disconnect': { en: 'Disconnect', vi: 'Ngắt kết nối' },
	'connection.menu.delete': { en: 'Delete', vi: 'Xóa' },
	'connection.menu.rename': { en: 'Rename', vi: 'Đổi tên' },
	'connection.menu.refresh': { en: 'Refresh', vi: 'Làm mới' },
	'connection.toast.reconnected': {
		en: 'Connection invalidated and reconnected.',
		vi: 'Đã vô hiệu hóa và kết nối lại thành công.',
	},
	'connection.toast.connected': {
		en: 'Connection established successfully.',
		vi: 'Kết nối thành công.',
	},
	'connection.toast.closed': {
		en: 'Connection closed successfully.',
		vi: 'Đã đóng kết nối thành công.',
	},
	'connection.toast.deleted': {
		en: 'Deleted successfully',
		vi: 'Đã xóa thành công',
	},
	'connection.toast.created': {
		en: 'Created successfully',
		vi: 'Đã tạo thành công',
	},
	'connection.toast.renamed': {
		en: 'Renamed successfully',
		vi: 'Đã đổi tên thành công',
	},
	'connection.error.nameInvalid': {
		en: 'Invalid database name. Only letters, numbers, and underscores are allowed.',
		vi: 'Tên cơ sở dữ liệu không hợp lệ. Chỉ cho phép chữ cái, số và dấu gạch dưới.',
	},
	'connection.error.createDatabaseUnsupported': {
		en: 'Creating databases is not supported for this data source type.',
		vi: 'Loại nguồn dữ liệu này không hỗ trợ tạo cơ sở dữ liệu.',
	},
	'connection.error.renameDatabaseUnsupported': {
		en: 'Renaming database is not supported for this database type.',
		vi: 'Loại cơ sở dữ liệu này không hỗ trợ đổi tên cơ sở dữ liệu.',
	},
	'connection.error.dropDatabaseUnsupported': {
		en: 'Drop database is not supported for this database type.',
		vi: 'Loại cơ sở dữ liệu này không hỗ trợ xóa cơ sở dữ liệu.',
	},
	'connection.error.requireDatabaseName': {
		en: 'Database name is required',
		vi: 'Tên cơ sở dữ liệu là bắt buộc',
	},
	'connection.error.allowedDatabaseNameChars': {
		en: 'Only letters, numbers, dashes, underscores, and dots are allowed',
		vi: 'Chỉ cho phép chữ cái, số, dấu gạch ngang, gạch dưới và dấu chấm',
	},
	'connection.error.databaseNameRequiredStrict': {
		en: 'Database name is required.',
		vi: 'Tên cơ sở dữ liệu là bắt buộc.',
	},
	'connection.error.databaseNameTooLong': {
		en: 'Database name is too long.',
		vi: 'Tên cơ sở dữ liệu quá dài.',
	},
	'connection.error.databaseNameFormatStrict': {
		en: 'Only letters, numbers, underscore, and $ are allowed. Name must not start with a number.',
		vi: 'Chỉ cho phép chữ cái, số, dấu gạch dưới và $. Tên không được bắt đầu bằng số.',
	},

	'connection.dialog.createDatabase.title': {
		en: 'Create Database',
		vi: 'Tạo cơ sở dữ liệu',
	},
	'connection.dialog.createDatabase.placeholder': {
		en: 'Enter new database name',
		vi: 'Nhập tên cơ sở dữ liệu mới',
	},
	'connection.dialog.createDatabase.creating': {
		en: 'Creating...',
		vi: 'Đang tạo...',
	},
	'connection.dialog.renameDataSource.title': {
		en: 'Rename Data Source',
		vi: 'Đổi tên nguồn dữ liệu',
	},
	'connection.dialog.renameDataSource.placeholder': {
		en: 'Enter new data source name',
		vi: 'Nhập tên nguồn dữ liệu mới',
	},
	'connection.dialog.renameDataSource.saving': {
		en: 'Saving...',
		vi: 'Đang lưu...',
	},
	'connection.dialog.renameDatabase.title': {
		en: 'Rename database',
		vi: 'Đổi tên cơ sở dữ liệu',
	},
	'connection.dialog.renameDatabase.description': {
		en: 'Enter a new name for {{name}}.',
		vi: 'Nhập tên mới cho {{name}}.',
	},
	'connection.dialog.renameDatabase.label': {
		en: 'Database name',
		vi: 'Tên cơ sở dữ liệu',
	},
	'connection.dialog.renameDatabase.placeholder': {
		en: 'Enter database name',
		vi: 'Nhập tên cơ sở dữ liệu',
	},
	'connection.dialog.renameDatabase.helper': {
		en: 'Use a valid SQL identifier.',
		vi: 'Sử dụng định danh SQL hợp lệ.',
	},
	'connection.dialog.deleteDataSource.confirmTitle': {
		en: 'Are you sure you want to delete this data source?',
		vi: 'Bạn có chắc chắn muốn xóa nguồn dữ liệu này không?',
	},
	'connection.dialog.deleteDataSource.deleting': {
		en: 'Deleting...',
		vi: 'Đang xóa...',
	},

	'dataSource.dialog.selectTitle': {
		en: 'Select Data Source',
		vi: 'Chọn nguồn dữ liệu',
	},
	'dataSource.dialog.editTitle': {
		en: 'Edit {{name}}',
		vi: 'Chỉnh sửa {{name}}',
	},
	'dataSource.dialog.configureTitle': {
		en: 'Configure {{name}}',
		vi: 'Cấu hình {{name}}',
	},
	'dataSource.dialog.defaultConnectionName': {
		en: 'Connection',
		vi: 'Kết nối',
	},
	'dataSource.dialog.defaultDatabaseName': {
		en: 'Database',
		vi: 'Cơ sở dữ liệu',
	},
	'dataSource.dialog.goBack': { en: 'Go back', vi: 'Quay lại' },
	'dataSource.form.name': { en: 'Name', vi: 'Tên' },
	'dataSource.form.namePlaceholder': {
		en: 'e.g. My Production DB',
		vi: 'Ví dụ: CSDL Production',
	},
	'dataSource.form.tab.general': { en: 'General', vi: 'Chung' },
	'dataSource.form.tab.advanced': { en: 'Advanced', vi: 'Nâng cao' },
	'dataSource.form.server': { en: 'Server', vi: 'Máy chủ' },
	'dataSource.form.connectedBy': { en: 'Connected by', vi: 'Kết nối bằng' },
	'dataSource.form.host': { en: 'Host', vi: 'Host' },
	'dataSource.form.url': { en: 'URL', vi: 'URL' },
	'dataSource.form.urlPlaceholder': {
		en: 'e.g. postgres://user:pass@localhost:5432/db',
		vi: 'Ví dụ: postgres://user:pass@localhost:5432/db',
	},
	'dataSource.form.hostPlaceholder': {
		en: 'e.g. localhost',
		vi: 'Ví dụ: localhost',
	},
	'dataSource.form.port': { en: 'Port', vi: 'Cổng' },
	'dataSource.form.portPlaceholder': { en: 'e.g. 5432', vi: 'Ví dụ: 5432' },
	'dataSource.form.filePath': { en: 'File Path', vi: 'Đường dẫn tệp' },
	'dataSource.form.database': { en: 'Database', vi: 'Cơ sở dữ liệu' },
	'dataSource.form.databasePlaceholder': {
		en: 'e.g. my_database',
		vi: 'Ví dụ: my_database',
	},
	'dataSource.form.sqlitePathPlaceholder': {
		en: 'e.g. ./data.sqlite',
		vi: 'Ví dụ: ./data.sqlite',
	},
	'dataSource.form.authentication': { en: 'Authentication', vi: 'Xác thực' },
	'dataSource.form.username': { en: 'Username', vi: 'Tên người dùng' },
	'dataSource.form.usernamePlaceholder': {
		en: 'e.g. admin',
		vi: 'Ví dụ: admin',
	},
	'dataSource.form.password': { en: 'Password', vi: 'Mật khẩu' },
	'dataSource.form.passwordPlaceholder': {
		en: 'Enter your password',
		vi: 'Nhập mật khẩu của bạn',
	},
	'dataSource.form.showAllDatabases': {
		en: 'Show all databases',
		vi: 'Hiển thị tất cả cơ sở dữ liệu',
	},
	'dataSource.form.savePassword': { en: 'Save password', vi: 'Lưu mật khẩu' },
	'dataSource.form.testing': { en: 'Testing...', vi: 'Đang kiểm tra...' },
	'dataSource.form.validating': {
		en: 'Validating...',
		vi: 'Đang xác thực...',
	},
	'dataSource.form.validated': { en: 'Validated', vi: 'Đã xác thực' },
	'dataSource.form.validateSettings': {
		en: 'Validate settings',
		vi: 'Xác thực cài đặt',
	},
	'dataSource.form.testConnectionOptional': {
		en: 'Test connection (optional)',
		vi: 'Kiểm tra kết nối (tùy chọn)',
	},
	'dataSource.form.testConnection': {
		en: 'Test connection',
		vi: 'Kiểm tra kết nối',
	},
	'dataSource.form.saveConnection': {
		en: 'Save Connection',
		vi: 'Lưu kết nối',
	},
	'dataSource.form.connect': { en: 'Connect', vi: 'Kết nối' },
	'dataSource.advanced.loadingCurrent': {
		en: 'Loading advanced settings from the current connection...',
		vi: 'Đang tải cài đặt nâng cao từ kết nối hiện tại...',
	},
	'dataSource.advanced.testToRefresh': {
		en: 'Test connection to refresh advanced settings after you change the connection config.',
		vi: 'Hãy kiểm tra kết nối để làm mới cài đặt nâng cao sau khi đổi cấu hình.',
	},
	'dataSource.advanced.testFirst': {
		en: 'Test connection successfully first to load advanced settings.',
		vi: 'Hãy kiểm tra kết nối thành công trước để tải cài đặt nâng cao.',
	},
	'dataSource.advanced.loaded': {
		en: 'Advanced settings loaded',
		vi: 'Đã tải cài đặt nâng cao',
	},
	'dataSource.advanced.serverVersionUnavailable': {
		en: 'Server version unavailable',
		vi: 'Không có thông tin phiên bản máy chủ',
	},
	'dataSource.advanced.onlyChangedSaved': {
		en: 'Only changed settings are saved into driverProperties.',
		vi: 'Chỉ các cài đặt đã thay đổi mới được lưu vào driverProperties.',
	},
	'dataSource.advanced.noSettings': {
		en: 'Connected successfully, but this driver did not return any advanced settings.',
		vi: 'Kết nối thành công, nhưng driver này không trả về cài đặt nâng cao nào.',
	},
	'dataSource.advanced.readOnly': { en: 'Read only', vi: 'Chỉ đọc' },
	'dataSource.advanced.range': {
		en: 'Range: {{min}} - {{max}}',
		vi: 'Khoảng: {{min}} - {{max}}',
	},
	'dataSource.advanced.selectValue': {
		en: 'Select a value',
		vi: 'Chọn một giá trị',
	},
	'dataSource.advanced.emptyOption': { en: '(empty)', vi: '(trống)' },
	'dataSource.toast.connectionSuccess': {
		en: 'Connection successful!',
		vi: 'Kết nối thành công!',
	},
	'dataSource.toast.settingOverridesValidated': {
		en: 'Setting overrides validated successfully!',
		vi: 'Xác thực cấu hình ghi đè thành công!',
	},
	'dataSource.toast.requireValidateBeforeSaving': {
		en: 'Test connection and validate settings before saving.',
		vi: 'Hãy kiểm tra kết nối và xác thực cài đặt trước khi lưu.',
	},
	'dataSource.toast.requireValidateBeforeConnecting': {
		en: 'Validate setting overrides before connecting.',
		vi: 'Hãy xác thực cấu hình ghi đè trước khi kết nối.',
	},
	'dataSource.toast.updatedSuccess': {
		en: 'Data source updated successfully!',
		vi: 'Cập nhật nguồn dữ liệu thành công!',
	},
	'dataSource.toast.savedSuccess': {
		en: 'Connection saved successfully!',
		vi: 'Lưu kết nối thành công!',
	},

	'connection.schema.nameRequired': {
		en: 'Name is required',
		vi: 'Tên là bắt buộc',
	},
	'connection.schema.sqlitePathRequired': {
		en: 'SQLite requires a file path (Database)',
		vi: 'SQLite yêu cầu đường dẫn tệp (Database)',
	},
	'connection.schema.hostRequired': {
		en: 'Host is required',
		vi: 'Host là bắt buộc',
	},
	'connection.schema.portRequired': {
		en: 'Port is required',
		vi: 'Cổng là bắt buộc',
	},
	'connection.schema.usernameRequired': {
		en: 'Username is required',
		vi: 'Tên người dùng là bắt buộc',
	},
	'connection.schema.databaseNameRequiredWhenHidden': {
		en: 'Please specify a database name if you hide other databases',
		vi: 'Vui lòng nhập tên cơ sở dữ liệu nếu bạn ẩn các cơ sở dữ liệu khác',
	},
	'connection.schema.databaseNameRequiredByType': {
		en: '{{type}} requires a database name',
		vi: '{{type}} yêu cầu tên cơ sở dữ liệu',
	},
	'connection.schema.urlRequired': {
		en: 'URL is required',
		vi: 'URL là bắt buộc',
	},
	'connection.schema.urlInvalid': {
		en: 'Invalid database URL format',
		vi: 'Định dạng URL cơ sở dữ liệu không hợp lệ',
	},

	'table.actions.cancel': { en: 'Cancel', vi: 'Hủy' },
	'table.actions.save': { en: 'Save', vi: 'Lưu' },
	'table.actions.refreshData': { en: 'Refresh data', vi: 'Làm mới dữ liệu' },
	'table.actions.importCsv': { en: 'Import CSV', vi: 'Nhập CSV' },
	'table.actions.moreSoon': {
		en: 'More actions coming soon...',
		vi: 'Sắp có thêm tác vụ...',
	},
	'table.toast.savedChanges': {
		en: 'All changes saved successfully!',
		vi: 'Đã lưu tất cả thay đổi thành công!',
	},
	'table.csv.emptyFile': { en: 'CSV file is empty!', vi: 'Tệp CSV trống!' },
	'table.csv.parseFailed': {
		en: 'Failed to parse CSV file.',
		vi: 'Không thể đọc tệp CSV.',
	},
	'table.csv.importPrepared': {
		en: 'CSV parsed successfully. Generated INSERT SQL for {{fileName}}.',
		vi: 'Đọc CSV thành công. Đã tạo câu lệnh INSERT cho {{fileName}}.',
	},
	'table.csv.invalidColumns': {
		en: 'CSV contains unknown columns: {{columns}}',
		vi: 'CSV chứa cột không tồn tại: {{columns}}',
	},
	'table.csv.noUsableColumns': {
		en: 'CSV does not contain any valid columns for this table.',
		vi: 'CSV không chứa cột hợp lệ nào cho bảng này.',
	},
	'table.delete.tooltip': {
		en: 'Delete {{count}} selected rows',
		vi: 'Xóa {{count}} dòng đã chọn',
	},
	'table.delete.dialog.title': {
		en: 'Are you sure you want to delete?',
		vi: 'Bạn có chắc chắn muốn xóa?',
	},
	'table.delete.dialog.description': {
		en: 'This action cannot be undone. There will be {{count}} row(s) deleted and permanently removed from the database.',
		vi: 'Hành động này không thể hoàn tác. Sẽ có {{count}} dòng bị xóa vĩnh viễn khỏi cơ sở dữ liệu.',
	},
	'table.delete.dialog.deleting': { en: 'Deleting...', vi: 'Đang xóa...' },
	'table.states.disconnected': {
		en: 'Connection is disconnected. Connect again to load table data.',
		vi: 'Kết nối đã ngắt. Hãy kết nối lại để tải dữ liệu bảng.',
	},
	'table.states.loadingSchema': {
		en: 'Loading schema...',
		vi: 'Đang tải lược đồ...',
	},
	'table.states.loadingData': {
		en: 'Loading data...',
		vi: 'Đang tải dữ liệu...',
	},
	'table.structure.loading': {
		en: 'Loading structure...',
		vi: 'Đang tải cấu trúc...',
	},
	'table.structure.noMetadata': {
		en: 'No column metadata available for this table yet.',
		vi: 'Chưa có metadata cột cho bảng này.',
	},
	'table.structure.constraints': { en: 'Constraints', vi: 'Ràng buộc' },
	'table.structure.columnName': { en: 'Column Name', vi: 'Tên cột' },
	'table.structure.dataType': { en: 'Data Type', vi: 'Kiểu dữ liệu' },
	'table.structure.nullable': { en: 'Nullable', vi: 'Cho phép null' },
	'table.structure.default': { en: 'Default', vi: 'Mặc định' },
	'table.structure.actions': { en: 'Actions', vi: 'Thao tác' },
	'table.structure.notNull': { en: 'Not Null', vi: 'Không null' },
	'table.structure.actionTitle': { en: 'action', vi: 'thao tác' },
	'table.result.rowsAffectedIn': {
		en: 'rows affected in',
		vi: 'dòng bị ảnh hưởng trong',
	},
	'table.result.rows': { en: 'rows', vi: 'dòng' },
	'table.result.resultLimited': {
		en: 'Result is limited',
		vi: 'Kết quả bị giới hạn',
	},
	'table.result.memory': { en: 'Memory: {{size}}', vi: 'Bộ nhớ: {{size}}' },
	'table.result.encodingUtf8': { en: 'UTF8', vi: 'UTF8' },

	'query.execute': { en: 'Execute', vi: 'Thực thi' },
	'query.tab.results': { en: 'Results', vi: 'Kết quả' },
	'query.tab.executionLog': { en: 'Execution Log', vi: 'Nhật ký thực thi' },
	'query.tab.queryPlan': { en: 'Query Plan', vi: 'Kế hoạch truy vấn' },
	'query.noDataSourceSelected': {
		en: 'No data source selected',
		vi: 'Chưa chọn nguồn dữ liệu',
	},
	'query.connectionDisconnected': {
		en: 'Connection is disconnected. Please connect again.',
		vi: 'Kết nối đã ngắt. Vui lòng kết nối lại.',
	},
	'query.csv.exportSuccess': {
		en: 'CSV exported successfully: {{fileName}}',
		vi: 'Xuất CSV thành công: {{fileName}}',
	},
	'query.limitedResultSet': {
		en: 'Limited result set',
		vi: 'Tập kết quả bị giới hạn',
	},
	'query.exportCsv': { en: 'CSV', vi: 'CSV' },
	'query.header.saveTooltip': { en: 'Save SQL file', vi: 'Lưu file SQL' },
	'query.header.formatTooltip': { en: 'Format SQL', vi: 'Format SQL' },
	'query.header.historyTooltip': {
		en: 'Recent queries',
		vi: 'Truy vấn gần đây',
	},
	'query.header.historyDropdownTitle': {
		en: 'Recent queries',
		vi: 'Truy vấn gần đây',
	},
	'query.header.noQuery': {
		en: 'No SQL content to process.',
		vi: 'Không có nội dung SQL để xử lý.',
	},
	'query.header.saveSuccess': {
		en: 'SQL file saved: {{fileName}}',
		vi: 'Đã lưu file SQL: {{fileName}}',
	},
	'query.header.saveFailed': {
		en: 'Failed to save SQL file.',
		vi: 'Không thể lưu file SQL.',
	},
	'query.header.formatSuccess': {
		en: 'SQL formatted successfully.',
		vi: 'Đã format SQL thành công.',
	},
	'query.header.formatFailed': {
		en: 'Failed to format SQL.',
		vi: 'Không thể format SQL.',
	},
	'query.header.historyEmpty': {
		en: 'Query history is empty.',
		vi: 'Lịch sử truy vấn đang trống.',
	},
	'query.header.historyLoaded': {
		en: 'Query loaded from history.',
		vi: 'Đã nạp truy vấn từ lịch sử.',
	},
	'query.successTitle': {
		en: 'Query executed successfully',
		vi: 'Thực thi truy vấn thành công',
	},
	'query.log.consoleOutput': { en: 'Console Output', vi: 'Đầu ra Console' },
	'query.log.noQueryExecuted': {
		en: 'No query executed',
		vi: 'Chưa có truy vấn nào được chạy',
	},
	'query.log.executionSuccessful': {
		en: 'Execution successful',
		vi: 'Thực thi thành công',
	},
	'query.log.executionFailed': {
		en: 'Execution failed',
		vi: 'Thực thi thất bại',
	},
	'query.log.queryExecutedIn': {
		en: 'Query executed in',
		vi: 'Truy vấn thực thi trong',
	},
	'query.log.rowsAffectedReturned': {
		en: 'Rows affected / returned:',
		vi: 'Số dòng ảnh hưởng / trả về:',
	},
	'query.log.resultLimited': {
		en: 'Result is limited.',
		vi: 'Kết quả bị giới hạn.',
	},
	'query.resultPanel.show': { en: 'Show results', vi: 'Hiện kết quả' },
	'query.resultPanel.hide': { en: 'Hide results', vi: 'Ẩn kết quả' },
	'query.resultPanel.resize': {
		en: 'Resize results panel',
		vi: 'Thay đổi kích thước khung kết quả',
	},
	'query.monacoTheme.quickPicker': {
		en: 'Editor theme',
		vi: 'Theme editor',
	},
	'query.monacoTheme.quickHint': {
		en: 'Applies to all Monaco editors in the app.',
		vi: 'Áp dụng cho toàn bộ Monaco editor trong app.',
	},
	'query.plan.loading': {
		en: 'Loading Query Plan...',
		vi: 'Đang tải kế hoạch truy vấn...',
	},
	'query.plan.title': { en: 'Execution Plan', vi: 'Kế hoạch thực thi' },
	'query.plan.viewerTheme': { en: 'Viewer theme', vi: 'Theme hiển thị' },
	'query.plan.theme.light': { en: 'Light', vi: 'Sáng' },
	'query.plan.theme.dark': { en: 'Dark', vi: 'Tối' },
	'query.plan.theme.highContrastDark': {
		en: 'High Contrast Dark',
		vi: 'Tương phản cao tối',
	},
	'query.plan.theme.highContrastLight': {
		en: 'High Contrast Light',
		vi: 'Tương phản cao sáng',
	},
	'query.plan.errorTitle': {
		en: 'Unable to generate query plan',
		vi: 'Không thể tạo kế hoạch truy vấn',
	},
	'query.plan.noPlan': {
		en: 'No Query Plan Available',
		vi: 'Không có kế hoạch truy vấn',
	},
	'query.plan.noPlanDescription': {
		en: 'Query Plan is only automatically generated for SELECT statements to ensure database safety.',
		vi: 'Kế hoạch truy vấn chỉ tự động tạo cho câu lệnh SELECT để đảm bảo an toàn cơ sở dữ liệu.',
	},
	'query.confirmDanger.title': {
		en: 'Dangerous Operation Warning!',
		vi: 'Cảnh báo thao tác nguy hiểm!',
	},
	'query.confirmDanger.description': {
		en: 'High-risk query detected:',
		vi: 'Đã phát hiện truy vấn rủi ro cao:',
	},
	'query.confirmDanger.detail': {
		en: 'UPDATE/DELETE command without WHERE clause, or a DROP table command.',
		vi: 'Lệnh UPDATE/DELETE không có WHERE, hoặc lệnh DROP table.',
	},
	'query.confirmDanger.executeAnyway': {
		en: 'Execute Anyway',
		vi: 'Vẫn thực thi',
	},
	'query.context.dataSources': {
		en: '{data_sources}',
		vi: '{nguon_du_lieu}',
	},
	'query.context.loading': { en: '{loading...}', vi: '{dang_tai...}' },
	'query.context.database': { en: '{database}', vi: '{co_so_du_lieu}' },
	'query.context.unspecified': { en: 'Unspecified', vi: 'Không chỉ định' },

	'errors.failedFetchTables': {
		en: 'Failed to fetch tables.',
		vi: 'Không thể tải danh sách bảng.',
	},
	'errors.failedFetchDatabases': {
		en: 'Failed to fetch databases. The database server may be offline.',
		vi: 'Không thể tải cơ sở dữ liệu. Máy chủ cơ sở dữ liệu có thể đang ngoại tuyến.',
	},
	'errors.failedFetchDatabasesWithHint': {
		en: 'Failed to fetch databases. The database server may be offline (for example, your Docker container is not running).',
		vi: 'Không thể tải cơ sở dữ liệu. Máy chủ cơ sở dữ liệu có thể đang ngoại tuyến (ví dụ container Docker chưa chạy).',
	},
	'errors.unreachableConnection': {
		en: 'Cannot connect to the database server. It may be offline (for example, your Docker container is not running). Start it and reconnect.',
		vi: 'Không thể kết nối tới máy chủ cơ sở dữ liệu. Có thể máy chủ đang ngoại tuyến (ví dụ container Docker chưa chạy). Hãy khởi động và kết nối lại.',
	},
	'errors.unreachableConnectionLoadDatabases': {
		en: 'Cannot connect to the database server. It may be offline (for example, your Docker container is not running). Start it and reconnect to load databases.',
		vi: 'Không thể kết nối tới máy chủ cơ sở dữ liệu. Có thể máy chủ đang ngoại tuyến (ví dụ container Docker chưa chạy). Hãy khởi động và kết nối lại để tải cơ sở dữ liệu.',
	},
	'errors.failedFetchSchema': {
		en: 'Failed to fetch schema.',
		vi: 'Không thể tải lược đồ.',
	},
	'errors.failedFetchTablePreview': {
		en: 'Failed to fetch table preview.',
		vi: 'Không thể tải bản xem trước bảng.',
	},
	'errors.failedFetchQueryPlan': {
		en: 'Failed to fetch query plan.',
		vi: 'Không thể tải kế hoạch truy vấn.',
	},
	'errors.failedRunQuery': {
		en: 'Failed to run query',
		vi: 'Không thể chạy truy vấn',
	},
	'errors.failedSaveChanges': {
		en: 'Failed to save changes.',
		vi: 'Không thể lưu thay đổi.',
	},
	'errors.failedConnectDataSource': {
		en: 'Failed to connect data source.',
		vi: 'Không thể kết nối nguồn dữ liệu.',
	},
	'errors.failedReconnectDataSource': {
		en: 'Failed to reconnect data source.',
		vi: 'Không thể kết nối lại nguồn dữ liệu.',
	},
	'errors.failedDisconnectDataSource': {
		en: 'Failed to disconnect data source.',
		vi: 'Không thể ngắt kết nối nguồn dữ liệu.',
	},
	'errors.failedDeleteDataSource': {
		en: 'Failed to delete data source.',
		vi: 'Không thể xóa nguồn dữ liệu.',
	},
	'errors.failedRenameDataSource': {
		en: 'Failed to rename data source.',
		vi: 'Không thể đổi tên nguồn dữ liệu.',
	},
	'errors.failedCreateDatabase': {
		en: 'Failed to create database.',
		vi: 'Không thể tạo cơ sở dữ liệu.',
	},
	'errors.failedDropDatabase': {
		en: 'Failed to drop database.',
		vi: 'Không thể xóa cơ sở dữ liệu.',
	},
	'errors.failedRefreshTables': {
		en: 'Failed to refresh tables.',
		vi: 'Không thể làm mới danh sách bảng.',
	},
	'errors.failedRenameDatabase': {
		en: 'Failed to rename database.',
		vi: 'Không thể đổi tên cơ sở dữ liệu.',
	},
	'errors.connectionFailedCheckConfig': {
		en: 'Connection failed. Please check your config.',
		vi: 'Kết nối thất bại. Vui lòng kiểm tra cấu hình.',
	},
	'errors.failedValidateSettingOverrides': {
		en: 'Failed to validate setting overrides.',
		vi: 'Không thể xác thực cấu hình ghi đè.',
	},
	'errors.failedUpdateDataSource': {
		en: 'Failed to update data source.',
		vi: 'Không thể cập nhật nguồn dữ liệu.',
	},
	'errors.failedAddDataSource': {
		en: 'Failed to add data source.',
		vi: 'Không thể thêm nguồn dữ liệu.',
	},
	'errors.cannotConnectServer': {
		en: 'Cannot connect to the database server. It may not be started, or the host/port/socket is incorrect. Detail: {{detail}}',
		vi: 'Không thể kết nối tới máy chủ cơ sở dữ liệu. Có thể máy chủ chưa khởi động hoặc host/port/socket không đúng. Chi tiết: {{detail}}',
	},
	'errors.serverTimeout': {
		en: 'The database server did not respond in time. Check network access, host/port, and whether the server is overloaded. Detail: {{detail}}',
		vi: 'Máy chủ cơ sở dữ liệu phản hồi quá chậm. Hãy kiểm tra mạng, host/port và tải máy chủ. Chi tiết: {{detail}}',
	},
	'errors.authenticationFailed': {
		en: 'Database authentication failed. Check the username and password. Detail: {{detail}}',
		vi: 'Xác thực cơ sở dữ liệu thất bại. Hãy kiểm tra tên người dùng và mật khẩu. Chi tiết: {{detail}}',
	},
	'errors.databaseNotFound': {
		en: 'The target database was not found. Check the database name in the connection settings. Detail: {{detail}}',
		vi: 'Không tìm thấy cơ sở dữ liệu đích. Hãy kiểm tra tên cơ sở dữ liệu trong phần cấu hình kết nối. Chi tiết: {{detail}}',
	},
	'errors.userNotFound': {
		en: 'The database user was not found. Check the username or role. Detail: {{detail}}',
		vi: 'Không tìm thấy người dùng cơ sở dữ liệu. Hãy kiểm tra username hoặc role. Chi tiết: {{detail}}',
	},
	'errors.permissionDenied': {
		en: 'The database user does not have permission to perform this action. Detail: {{detail}}',
		vi: 'Người dùng cơ sở dữ liệu không có quyền thực hiện thao tác này. Chi tiết: {{detail}}',
	},
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
			acc.replace(
				new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'),
				String(value),
			),
		template,
	)
}
