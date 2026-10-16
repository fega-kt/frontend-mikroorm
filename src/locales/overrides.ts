import type { TranslationDictionary } from "#src/api/i18n/types";
import i18next from "i18next";

/**
 * Namespace i18next chứa bản dịch lấy từ database; được tra trước, thiếu thì mới xuống `translation` (file JSON).
 * Giống app setting: cố ý không persist, mỗi lần load lấy lại từ server (chỉ nằm trong bộ nhớ của i18next).
 */
export const OVERRIDE_NS = "override";

/** Namespace trong bảng bản dịch của backend cho chuỗi giao diện; key = key i18n của file JSON */
export const APP_I18N_NAMESPACE = "app";

/** `{ "common.save": "…" }` → `{ common: { save: "…" } }`; key trùng với một nhánh đã có thì bỏ qua */
export function unflatten(dictionary: TranslationDictionary) {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(dictionary)) {
		const parts = key.split(".");
		let node = result;
		let valid = true;
		for (const part of parts.slice(0, -1)) {
			const next = node[part] ?? (node[part] = {});
			if (typeof next !== "object") {
				valid = false;
				break;
			}
			node = next as Record<string, unknown>;
		}
		const leaf = parts[parts.length - 1];
		if (valid && typeof node[leaf] !== "object")
			node[leaf] = value;
	}
	return result;
}

/** Thay toàn bộ bản đè của một ngôn ngữ (key đã bỏ khỏi database thì quay về JSON ngay) */
export function applyOverrides(language: string, dictionary: TranslationDictionary) {
	i18next.removeResourceBundle(language, OVERRIDE_NS);
	i18next.addResourceBundle(language, OVERRIDE_NS, unflatten(dictionary), false, true);
}
