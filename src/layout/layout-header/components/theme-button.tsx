import type { ButtonProps } from "antd";

import { BasicButton } from "#src/components/basic-button";
import { usePreferences } from "#src/hooks/use-preferences";
import { RiMoonIcon, RiSunIcon } from "#src/icons";
import { useEffect } from "react";
import { flushSync } from "react-dom";

import { isThemeViewTransitionRunning, setThemeViewTransitionRunning } from "./theme-switch-state";

const isBrowser = typeof window !== "undefined";

const TO_DARK_CLASS = "theme-switch-to-dark";
const TO_LIGHT_CLASS = "theme-switch-to-light";
/** Gắn lên <html> suốt hiệu ứng + khoảng nghỉ để chặn chuột */
const SWITCHING_CLASS = "theme-switching";
const DURATION = 500;
/** Khoảng nghỉ sau hiệu ứng trước khi dọn class và nhận lần bấm tiếp (ms) */
const COOLDOWN = 100;
/**
 * Bấm lại trong khoảng này sau lần đổi trước thì đổi theme ngay, không chạy vòng tròn.
 * Chạy view transition liên tục (mỗi lần Chrome giữ 2 ảnh chụp toàn màn hình) thỉnh thoảng làm Chrome vẽ sai lớp vài frame → nháy;
 * người bấm liên tục cũng không xem hết hiệu ứng nên đổi tức thì là hợp lý
 */
const RAPID_CLICK_WINDOW = 1000;
/** Thời điểm lần đổi theme gần nhất xong (ms, performance.now) */
let lastSwitchAt = Number.NEGATIVE_INFINITY;

/**
 * Ghi keyframes vòng tròn với toạ độ / bán kính là số cụ thể cho lần bấm này
 * (không phụ thuộc biến CSS trên <html> khi trình duyệt tính lại style giữa chừng)
 */
function writeCircleKeyframes(x: number, y: number, radius: number) {
	const styleId = "theme-switch-keyframes";
	const style = document.getElementById(styleId) ?? document.head.appendChild(Object.assign(document.createElement("style"), { id: styleId }));
	const at = `at ${x}px ${y}px`;
	style.textContent = `
    @keyframes theme-switch-hide {
      from { clip-path: circle(${radius}px ${at}); }
      to { clip-path: circle(0px ${at}); }
    }
    @keyframes theme-switch-reveal {
      from { clip-path: circle(0px ${at}); }
      to { clip-path: circle(${radius}px ${at}); }
    }
  `;
}

function injectViewTransitionStyles() {
	if (isBrowser) {
		const styleId = "theme-switch-view-transition-styles";
		if (!document.getElementById(styleId)) {
			const style = document.createElement("style");
			style.id = styleId;
			style.textContent = `
        /* Chặn chuột suốt hiệu ứng + khoảng nghỉ: không cho bấm chồng làm huỷ ngang view transition */
        html.${SWITCHING_CLASS},
        html.${SWITCHING_CLASS} * {
          pointer-events: none !important;
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
		// Đang chạy hiệu ứng thì bỏ qua: bấm chồng sẽ huỷ ngang view transition cũ → ảnh chụp bị bỏ giữa chừng, lóe màu
		if (isThemeViewTransitionRunning())
			return;

		const isRapidClick = performance.now() - lastSwitchAt < RAPID_CLICK_WINDOW;
		if (!document.startViewTransition || !event || isRapidClick) {
			// Đổi tức thì (layout-root tự tắt transition trong lúc đổi màu)
			changeSiteTheme(isDark ? "light" : "dark");
			lastSwitchAt = performance.now();
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
		writeCircleKeyframes(x, y, endRadius);
		// stop-transition: tắt transition suốt hiệu ứng — ảnh "new" của view transition là ảnh sống,
		// transition màu còn đang chạy sẽ lộ ra thành mảng màu cũ (chỗ đen chỗ trắng) trong vòng tròn
		root.classList.add(directionClass, "stop-transition", SWITCHING_CLASS);

		setThemeViewTransitionRunning(true);
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
			lastSwitchAt = performance.now();
			setTimeout(() => {
				root.classList.remove(directionClass, "stop-transition", SWITCHING_CLASS);
				setThemeViewTransitionRunning(false);
			}, COOLDOWN);
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
