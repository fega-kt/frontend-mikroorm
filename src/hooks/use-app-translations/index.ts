import type { I18nLanguage } from "#src/api/i18n";
import { I18N_LANGUAGES, i18nService } from "#src/api/i18n";
import { LanguageType } from "#src/locales/helper";
import { APP_I18N_NAMESPACE, applyOverrides } from "#src/locales/overrides";

/** Ngôn ngữ của bảng bản dịch → ngôn ngữ giao diện (i18next) */
const LANGUAGE_TYPES: Record<I18nLanguage, LanguageType> = { vi: LanguageType.vi, en: LanguageType.en, zh: LanguageType.zh };

/**
 * Tải bản dịch giao diện từ database cho cả ba ngôn ngữ một lần rồi đè lên file JSON của từng ngôn ngữ.
 * Giống app setting: gọi trong AuthGuard (lúc load + làm mới định kỳ), đổi ngôn ngữ dùng luôn bản đã nạp, không gọi lại.
 */
export async function loadAppTranslations() {
	const dictionaries = await i18nService.fetchDictionaries(APP_I18N_NAMESPACE);
	for (const lang of I18N_LANGUAGES)
		applyOverrides(LANGUAGE_TYPES[lang], dictionaries[lang] ?? {});
}
