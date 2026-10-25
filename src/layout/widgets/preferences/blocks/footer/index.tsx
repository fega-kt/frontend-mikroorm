import { usePreferencesStore } from "#src/store/preferences";

import { useTranslation } from "react-i18next";

import { SwitchItem } from "../../switch-item";

export function PreferencesFooter() {
	const { t } = useTranslation();
	const {
		enableFooter,
		fixedFooter,
		setPreferences,
	} = usePreferencesStore();

	return (
		<>
			<SwitchItem
				name="enableFooter"
				checked={enableFooter}
				onChange={(name, value) => setPreferences(name, value)}
			>
				{t("preferences.footer.showFooter")}
			</SwitchItem>

			<SwitchItem
				name="fixedFooter"
				checked={fixedFooter}
				onChange={(name, value) => setPreferences(name, value)}
			>
				{t("preferences.footer.fixedFooter")}
			</SwitchItem>
		</>
	);
}
