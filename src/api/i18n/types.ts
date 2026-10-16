/** Ngôn ngữ lưu trong bảng bản dịch (mỗi ngôn ngữ một cột); `vi` là tiếng Việt, ngôn ngữ gốc của dữ liệu */
export const I18N_LANGUAGES = ["vi", "en", "zh"] as const;
export type I18nLanguage = (typeof I18N_LANGUAGES)[number];

/** Ngôn ngữ cần dịch (không gồm tiếng Việt) */
export const TRANSLATION_TARGETS = ["en", "zh"] as const;
export type TranslationTarget = (typeof TRANSLATION_TARGETS)[number];

/** key (đã bỏ namespace) → bản dịch của một ngôn ngữ */
export type TranslationDictionary = Record<string, string>;

/** key (đã bỏ namespace) → bản dịch đủ cả ba ngôn ngữ */
export type TranslationTable = Record<string, Record<I18nLanguage, string>>;

/** Một mục thiết lập đủ cả ba ngôn ngữ cùng lúc (cả ba đều bắt buộc) */
export interface TranslationItem {
	key: string
	vi: string
	en: string
	zh: string
}
