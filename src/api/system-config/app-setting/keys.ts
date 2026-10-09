import type { AppSettingValue } from "./types";

/** Must stay in sync with `AppSettingType` in backend `app-setting.entity.ts`. */
export enum APP_SETTING_KEYS {
	ContentFocusOutlineEnabled = "content_focus_outline_enabled",
}

export interface AppSettingDescriptor<T extends AppSettingValue = AppSettingValue> {
	key: APP_SETTING_KEYS
	/** Giá trị dùng khi server chưa cấu hình, chưa tải xong hoặc giá trị sai kiểu. */
	default: T
}

/** Các setting client đọc được; thêm key mới ở đây (và ở backend `APP_SETTING_META` với `clientVisible: true`). */
export const APP_SETTINGS = {
	contentFocusOutline: { key: APP_SETTING_KEYS.ContentFocusOutlineEnabled, default: false as boolean },
} satisfies Record<string, AppSettingDescriptor>;
