/** Ngôn ngữ lưu trong bảng bản dịch (mỗi ngôn ngữ một cột); `vi` là tiếng Việt, ngôn ngữ gốc của dữ liệu */
export const I18N_LANGUAGES = ["vi", "en", "zh"] as const;
export type I18nLanguage = (typeof I18N_LANGUAGES)[number];

/** Ngôn ngữ giao diện (vd: en-US) → ngôn ngữ của bảng bản dịch (en) */
export function toI18nLanguage(language: string): I18nLanguage | undefined {
	const short = language.split("-")[0];
	return (I18N_LANGUAGES as readonly string[]).includes(short) ? (short as I18nLanguage) : undefined;
}

/** key (đã bỏ namespace) → bản dịch của một ngôn ngữ (không gồm key mà ngôn ngữ đó để trống) */
export type TranslationDictionary = Record<string, string>;

/** key (đã bỏ namespace) → bản dịch cả ba ngôn ngữ; chuỗi rỗng = ngôn ngữ đó không có bản dịch */
export type TranslationTable = Record<string, Record<I18nLanguage, string>>;

/** Một mục thiết lập cả ba ngôn ngữ cùng lúc; để trống = không có bản dịch (cần ít nhất một ngôn ngữ) */
export interface TranslationItem {
	key: string
	vi: string
	en: string
	zh: string
}

/** Một dòng trong danh sách bản dịch: namespace (`app`, `form.<formId>`) + key đã bỏ namespace */
export interface TranslationRow extends TranslationItem {
	namespace: string
}
