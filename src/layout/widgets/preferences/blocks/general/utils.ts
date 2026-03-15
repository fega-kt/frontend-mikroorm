// import type { TFunction } from "i18next";

import { LanguageType } from "#src/locales/helper";

export const getLanguageItems: () => any = (
	// t: TFunction<"translation", undefined>,
) => {
	return [
		{
			label: "VietNamese",
			// Menu
			key: LanguageType.vi,
			// Select
			value: LanguageType.vi,
		},
		{
			label: "简体中文",
			// Menu
			key: LanguageType.zh,
			// Select
			value: LanguageType.zh,
		},
		{
			label: "English",
			// Menu
			key: LanguageType.en,
			// Select
			value: LanguageType.en,
		},
	];
};
