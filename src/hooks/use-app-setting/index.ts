import type { AppSettingDescriptor } from "#src/api/system-config/app-setting/keys";
import type { AppSettingValue } from "#src/api/system-config/app-setting/types";
import { useAppSettingStore } from "#src/store/app-setting";

/** Đọc một app setting; chỉ re-render khi chính key đó đổi. Sai kiểu/thiếu thì trả default của descriptor. */
export function useAppSetting<T extends AppSettingValue>(setting: AppSettingDescriptor<T>): T {
	const value = useAppSettingStore(state => state.settings[setting.key]);
	if (value === undefined || value === null || typeof value !== typeof setting.default || Array.isArray(value) !== Array.isArray(setting.default))
		return setting.default;
	return value as T;
}
