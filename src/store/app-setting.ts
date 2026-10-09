import type { AppSettingValue } from "#src/api/system-config/app-setting";
import { appSettingService } from "#src/api/system-config/app-setting";

import { create } from "zustand";

/**
 * Cố ý KHÔNG persist (localStorage/IndexedDB): dữ liệu luôn lấy từ server mỗi lần load,
 * để không còn bản lưu lâu dài nào trên máy user có thể bị sửa.
 */
interface AppSettingState {
	settings: Readonly<Record<string, AppSettingValue>>
	loaded: boolean
}

interface AppSettingAction {
	fetchSettings: () => Promise<void>
	getSetting: <T extends AppSettingValue>(key: string, fallback: T) => T
	reset: () => void
};

const initialState: AppSettingState = {
	settings: {},
	loaded: false,
};

export const useAppSettingStore = create<AppSettingState & AppSettingAction>((set, get) => ({
	...initialState,

	fetchSettings: async () => {
		// Lỗi API không được chặn app: giữ giá trị hiện có, các nơi dùng sẽ rơi về fallback.
		try {
			const settings = await appSettingService.fetchClientSettings();
			// Thay hẳn object (không merge) để key không còn trên server bị loại bỏ.
			set({ settings: Object.freeze({ ...settings }), loaded: true });
		}
		catch {
			set({ loaded: true });
		}
	},

	getSetting: (key, fallback) => {
		const value = get().settings[key];
		// Sai kiểu so với fallback thì dùng fallback để tránh crash.
		if (value === undefined || value === null || typeof value !== typeof fallback || Array.isArray(value) !== Array.isArray(fallback))
			return fallback;
		return value as typeof fallback;
	},

	reset: () => set({ ...initialState }),
}));
