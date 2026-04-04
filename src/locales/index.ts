import type { InitOptions } from "i18next";

import enUS from "antd/locale/en_US";
import viVN from "antd/locale/vi_VN";
import zhCN from "antd/locale/zh_CN";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { getLanguage, LanguageType } from "./helper";

export * from "./t";

export const ANT_DESIGN_LOCALE = {
	[LanguageType.zh]: zhCN,
	[LanguageType.en]: enUS,
	[LanguageType.vi]: viVN,

};

export const i18nResources = {
	[LanguageType.zh]: {
		translation: getLanguage(LanguageType.zh),
	},
	[LanguageType.en]: {
		translation: getLanguage(LanguageType.en),
	},
	[LanguageType.vi]: {
		translation: getLanguage(LanguageType.vi),
	},
};

export const i18nInitOptions: InitOptions = {
	lng: LanguageType.vi,
	resources: i18nResources,
	saveMissing: import.meta.env.DEV,
	/**
	 * Suppress locize.com advertisement notice
	 * @see https://github.com/i18next/i18next/issues/2385
	 */
	showSupportNotice: false,
	missingKeyHandler: async (languages, namespace, translationKey) => {
		if (import.meta.env.PROD) {
			return;
		}
		const currentLanguage = i18next.language;
		if (!["404"].includes(translationKey) && import.meta.env.DEV) {
			/**
			 * @see https://www.i18next.com/overview/api#missingkeyhandler
			 * 消息的格式参考：https://github.com/intlify/vue-i18n/blob/v11.1.2/packages/shared/src/warn.ts
			 */
			console.warn(`[i18n] Not found '${translationKey}' key in '${currentLanguage}' locale messages.`);
		}
	},
};

export const i18n = i18next.use(initReactI18next);

export function setupI18n() {
	i18n.init(i18nInitOptions);
	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang
	 */
	i18next.on("languageChanged", (lng) => {
		document.documentElement.lang = lng;
	});
}
