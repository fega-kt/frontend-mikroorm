import { AntdApp } from "#src/components/antd-app";
import { JSSThemeProvider } from "#src/components/jss-theme-provider";
import { usePreferences } from "#src/hooks/use-preferences";
import { useScrollToHash } from "#src/hooks/use-scroll-to-hash";
import { AppVersionMonitor } from "#src/layout/widgets/version-monitor";
import { ANT_DESIGN_LOCALE } from "#src/locales";

import { StyleProvider } from "@ant-design/cssinjs";
import { enUSIntl, ProConfigProvider, viVNIntl, zhCNIntl } from "@ant-design/pro-components";
import { theme as antdTheme, ConfigProvider } from "antd";
import dayjs from "dayjs";
import { Suspense, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RouterProvider } from "react-router/dom";

import { router } from "./router";
import { customAntdDarkTheme, customAntdLightTheme } from "./styles/theme/antd/antd-theme";
import "dayjs/locale/zh-cn";
import "dayjs/locale/vi";

const customViVNIntl = {
	...viVNIntl,
	getMessage: (id: string, defaultMessage: string) => {
		if (id === "tableForm.inputPlaceholder")
			return "Nhập dữ liệu";
		return viVNIntl.getMessage(id, defaultMessage);
	},
};

const proIntlMap = { "vi-VN": customViVNIntl, "zh-CN": zhCNIntl, "en-US": enUSIntl };

export default function App() {
	const { i18n } = useTranslation();
	const {
		language,
		isDark,
		theme,
		themeColorPrimary,
		colorBlindMode,
		colorGrayMode,
		themeRadius,
		changeSiteTheme,

		enableCheckUpdates,
		checkUpdatesInterval,
		sideCollapsedWidth,
	} = usePreferences();

	useScrollToHash();

	/**
	 * ant design internationalization
	 * @link https://ant.design/docs/react/i18n
	 */
	const getAntdLocale = () => {
		return ANT_DESIGN_LOCALE[language as keyof typeof ANT_DESIGN_LOCALE];
	};

	const getProIntl = () => proIntlMap[language as keyof typeof proIntlMap] ?? customViVNIntl;

	/**
	 * day.js internationalization
	 * @link https://day.js.org/docs/en/installation/installation
	 */
	useEffect(() => {
		if (language === "en-US") {
			dayjs.locale("en");
		}
		else if (language === "zh-CN") {
			dayjs.locale("zh-cn");
		}
		else if (language === "vi-VN") {
			dayjs.locale("vi");
		}
	}, [language]);

	/**
	 * react-i18next internationalization
	 * @link https://www.i18next.com/overview/api#changelanguage
	 */
	useEffect(() => {
		i18n.changeLanguage(language);
	}, [language, i18n.changeLanguage, i18n]);

	/**
	 * Change theme when the system theme changes
	 */
	const setEmulateTheme = useCallback(
		// eslint-disable-next-line unused-imports/no-unused-vars
		(dark?: boolean) => {
			changeSiteTheme("auto");
		},
		[changeSiteTheme],
	);

	/**
	 * Watch system theme change
	 */
	useEffect(() => {
		if (theme === "auto") {
			// https://developer.chrome.com/docs/devtools/rendering/emulate-css/
			const darkModeMediaQuery = window.matchMedia(
				"(prefers-color-scheme: dark)",
			);

			function matchMode(e: MediaQueryListEvent) {
				setEmulateTheme(e.matches);
			}

			setEmulateTheme(darkModeMediaQuery.matches);
			darkModeMediaQuery.addEventListener("change", matchMode);
			return () => {
				darkModeMediaQuery.removeEventListener("change", matchMode);
			};
		}
	}, [theme, setEmulateTheme]);

	/**
	 * 更新页面颜色模式（灰色、色弱）
	 */
	const updateColorMode = useCallback(() => {
		const dom = document.documentElement;
		const COLOR_BLIND = "color-blind-mode";
		const COLOR_GRAY = "gray-mode";
		colorBlindMode
			? dom.classList.add(COLOR_BLIND)
			: dom.classList.remove(COLOR_BLIND);
		colorGrayMode
			? dom.classList.add(COLOR_GRAY)
			: dom.classList.remove(COLOR_GRAY);
	}, [colorBlindMode, colorGrayMode]);

	useEffect(() => {
		updateColorMode();
	}, [colorBlindMode, colorGrayMode, updateColorMode]);

	return (
		<StyleProvider layer>
			<ProConfigProvider intl={getProIntl()}>
				<ConfigProvider
					input={{ autoComplete: "off" }}
					locale={getAntdLocale()}
					theme={{
						cssVar: {},
						hashed: false,
						algorithm:
						isDark
							? antdTheme.darkAlgorithm
							: antdTheme.defaultAlgorithm,
						...(isDark ? customAntdDarkTheme : customAntdLightTheme),
						token: {
							...(isDark ? customAntdDarkTheme.token : customAntdLightTheme.token),
							borderRadius: themeRadius,
							colorPrimary: themeColorPrimary,
						},
						components: {
							...(isDark ? customAntdDarkTheme.components : customAntdLightTheme.components),
							Menu: {
								darkItemBg: "#141414",
								itemBg: "#fff",
								...(isDark
									? customAntdDarkTheme.components?.Menu
									: customAntdLightTheme.components?.Menu),
								collapsedWidth: sideCollapsedWidth,
							},
						},
					}}
				>
					<AntdApp>
						<JSSThemeProvider>
							<Suspense fallback={null}>
								{enableCheckUpdates ? <AppVersionMonitor checkUpdatesInterval={checkUpdatesInterval} /> : null}
								<RouterProvider router={router} />
							</Suspense>
						</JSSThemeProvider>
					</AntdApp>
				</ConfigProvider>
			</ProConfigProvider>
		</StyleProvider>
	);
}
