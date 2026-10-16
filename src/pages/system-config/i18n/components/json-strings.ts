import type { I18nLanguage } from "#src/api/i18n";
import { I18N_LANGUAGES } from "#src/api/i18n";
import { i18nResources } from "#src/locales";
import { LanguageType } from "#src/locales/helper";

export type LanguageTexts = Record<I18nLanguage, string>;

/** Nguồn chuỗi: file JSON của giao diện (namespace `app`) hoặc các chuỗi của một biểu mẫu (`form.<formId>`) */
export type I18nSource = "app" | "form";

export const EMPTY_TEXTS: LanguageTexts = { vi: "", en: "", zh: "" };

const LANGUAGE_FILES: Record<I18nLanguage, LanguageType> = { vi: LanguageType.vi, en: LanguageType.en, zh: LanguageType.zh };

/** `{ common: { save: "…" } }` → `{ "common.save": "…" }`; mảng (dùng với returnObjects) không đè được nên bỏ qua */
function flatten(node: unknown, prefix = "", out: Record<string, string> = {}) {
	if (typeof node === "string") {
		out[prefix] = node;
	}
	else if (node && typeof node === "object" && !Array.isArray(node)) {
		for (const [key, value] of Object.entries(node))
			flatten(value, prefix ? `${prefix}.${key}` : key, out);
	}
	return out;
}

let cache: Map<string, LanguageTexts> | undefined;

/** Mọi chuỗi trong file JSON (mặc định): key → chuỗi của từng ngôn ngữ, sắp theo key */
export function getJsonStrings() {
	if (!cache) {
		const byLanguage = Object.fromEntries(
			I18N_LANGUAGES.map(lang => [lang, flatten(i18nResources[LANGUAGE_FILES[lang]].translation)]),
		) as Record<I18nLanguage, Record<string, string>>;
		const keys = new Set(I18N_LANGUAGES.flatMap(lang => Object.keys(byLanguage[lang])));
		cache = new Map([...keys].sort().map(key => [
			key,
			Object.fromEntries(I18N_LANGUAGES.map(lang => [lang, byLanguage[lang][key] ?? ""])) as LanguageTexts,
		]));
	}
	return cache;
}

/** Tên các biến `{{name}}` của chuỗi — bản đè phải giữ đúng các biến của chuỗi mặc định */
export function variablesOf(text: string) {
	return [...text.matchAll(/\{\{\s*([^\s},]+)\s*(?:,[^}]*)?\}\}/g)].map(match => match[1]).sort().join(",");
}

/** Có chứa từ khóa (không phân biệt hoa thường) ở key hoặc một trong các chuỗi */
export function matchesKeyword(keyword: string, key: string, ...texts: LanguageTexts[]) {
	const value = keyword.trim().toLowerCase();
	if (!value)
		return true;
	return [key, ...texts.flatMap(item => I18N_LANGUAGES.map(lang => item[lang]))].some(text => text.toLowerCase().includes(value));
}
