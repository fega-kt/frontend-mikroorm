import { TanstackQuery } from "#src/components/tanstack-query";
import { setupI18n } from "#src/locales";
import { setupLoading } from "#src/plugins/loading";
import { isPreloadingPages } from "#src/router/utils/generate-routes-from-backend";

// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./app";
import "./styles/index.css";

async function setupApp() {
	/**
	 * @zh 初始化国际化，必须放在第一位，loading 中引用了国际化
	 * @en Initialize internationalization, must be placed first. Loading refer to internationalization
	 */
	setupI18n();

	// App Loading
	setupLoading();

	const rootElement = document.getElementById("root");
	if (!rootElement)
		return;
	const root = createRoot(
		rootElement,
	);

	root.render(
		// <StrictMode>
		<TanstackQuery>
			<App />
		</TanstackQuery>,
		// </StrictMode>,
	);
}

setupApp();

/**
 * Sau khi deploy, chunk cũ bị xóa: tự tải lại 1 lần. Cờ chỉ xóa khi app đã chạy ổn một lúc —
 * xóa ngay lúc khởi động thì chunk lỗi mãi (cache index.html cũ…) sẽ reload vô hạn.
 */
const CHUNK_RELOAD_KEY = "chunk_reload";
setTimeout(() => sessionStorage.removeItem(CHUNK_RELOAD_KEY), 10_000);

window.addEventListener("vite:preloadError", (event) => {
	// Tải sẵn chạy nền lỗi thì để lỗi trôi về chỗ tải sẵn (nó tự dừng), không reload giữa lúc người dùng đang thao tác
	if (isPreloadingPages())
		return;
	// Đã reload một lần mà vẫn lỗi: để lỗi hiện ra (trang lỗi có nút tải lại) thay vì nuốt lỗi
	if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
		event.preventDefault();
		sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
		window.location.reload();
	}
});
