import type { ButtonProps } from "antd";

import { BasicButton } from "#src/components/basic-button";
import { usePreferences } from "#src/hooks/use-preferences";
import { RiMoonIcon, RiSunIcon } from "#src/icons";
import { useEffect } from "react";
import { flushSync } from "react-dom";

const isBrowser = typeof window !== "undefined";
const TO_DARK_CLASS = "theme-switch-to-dark";
const TO_LIGHT_CLASS = "theme-switch-to-light";
const DURATION = 500;
function injectViewTransitionStyles() {
	if (isBrowser) {
		const styleId = "theme-switch-view-transition-styles";
		if (!document.getElementById(styleId)) {
			const style = document.createElement("style");
			style.id = styleId;
			style.textContent = `
        html.stop-transition * {
          transition: none !important;
        }
        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation: none;
          mix-blend-mode: normal;
        }
        /*
         * Animation chạy bằng CSS (không dùng element.animate sau transition.ready)
         * để clip-path được áp ngay từ frame đầu, tránh nháy full màn hình theme mới.
         * Thứ tự lớp dựa vào class hướng chuyển, không phụ thuộc class .dark (gắn trong useEffect).
         */
        html.${TO_DARK_CLASS}::view-transition-new(root),
        html.${TO_LIGHT_CLASS}::view-transition-old(root) {
          z-index: 999999999;
        }
        html.${TO_DARK_CLASS}::view-transition-old(root),
        html.${TO_LIGHT_CLASS}::view-transition-new(root) {
          z-index: 1;
        }
        html.${TO_DARK_CLASS}::view-transition-new(root) {
          animation: theme-switch-reveal ${DURATION}ms ease-in forwards;
        }
        html.${TO_LIGHT_CLASS}::view-transition-old(root) {
          animation: theme-switch-hide ${DURATION}ms ease-in forwards;
        }
        @keyframes theme-switch-hide {
          from { clip-path: circle(var(--theme-switch-r) at var(--theme-switch-x) var(--theme-switch-y)); }
          to { clip-path: circle(0px at var(--theme-switch-x) var(--theme-switch-y)); }
        }
        @keyframes theme-switch-reveal {
          from { clip-path: circle(0px at var(--theme-switch-x) var(--theme-switch-y)); }
          to { clip-path: circle(var(--theme-switch-r) at var(--theme-switch-x) var(--theme-switch-y)); }
        }
      `;

			document.head.appendChild(style);
		}
	}
}

/**
 * @zh 主题切换组件
 * 允许用户通过按钮切换网站的亮色和暗色主题
 *
 * @en Theme Button Component
 * Allows users to toggle between light and dark themes of the website via a button
 */
export function ThemeButton({ ...restProps }: ButtonProps) {
	const { isDark, changeSiteTheme } = usePreferences();

	useEffect(() => {
		injectViewTransitionStyles();
	}, []);

	function toggleTheme(event: React.PointerEvent<HTMLElement>) {
		const isAppearanceTransition = !!document.startViewTransition;
		if (!isAppearanceTransition || !event) {
			changeSiteTheme(isDark ? "light" : "dark");
			return;
		}
		const x = event.clientX;
		const y = event.clientY;
		const endRadius = Math.hypot(
			Math.max(x, innerWidth - x),
			Math.max(y, innerHeight - y),
		);
		const root = document.documentElement;
		const directionClass = isDark ? TO_LIGHT_CLASS : TO_DARK_CLASS;
		root.style.setProperty("--theme-switch-x", `${x}px`);
		root.style.setProperty("--theme-switch-y", `${y}px`);
		root.style.setProperty("--theme-switch-r", `${endRadius}px`);
		root.classList.add(directionClass);

		const transition = document.startViewTransition(() => {
			// eslint-disable-next-line react-dom/no-flush-sync
			flushSync(() => {
				changeSiteTheme(isDark ? "light" : "dark");
			});
			// Đồng bộ class .dark ngay trong snapshot mới (layout-root cũng gắn lại trong useEffect)
			root.classList.toggle("dark", !isDark);
			root.style.colorScheme = isDark ? "light" : "dark";
		});
		transition.finished.finally(() => {
			root.classList.remove(directionClass);
		});
	}

	return (
		<BasicButton
			type="text"
			{...restProps}
			icon={isDark ? <RiSunIcon /> : <RiMoonIcon />}
			onPointerDown={(e) => {
				restProps?.onPointerDown?.(e);
				toggleTheme(e);
			}}
		/>
	);
}
