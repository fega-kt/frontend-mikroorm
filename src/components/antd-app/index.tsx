import type { ReactNode } from "react";

import { StaticAntd } from "#src/utils/static-antd";

import { theme as antdTheme, App } from "antd";
import { useLayoutEffect } from "react";

import { setupAntdThemeTokensToHtml } from "./setup-antd-theme";

export interface AntdAppProps {
	children: ReactNode
}

export function AntdApp({ children }: AntdAppProps) {
	const { token: antdTokens } = antdTheme.useToken();

	// useLayoutEffect: ghi biến màu cho Tailwind ngay trong lần commit đổi theme (trước khi trình duyệt vẽ /
	// view transition chụp ảnh "giao diện mới"). Dùng useEffect thì các vùng class Tailwind trễ một nhịp → nháy màu
	useLayoutEffect(() => {
		/* 打印查看支持的 token */
		// console.log("antdTokens", antdTokens);
		setupAntdThemeTokensToHtml(antdTokens);
	}, [antdTokens]);

	return (
		<App className="h-full">
			<StaticAntd />
			{children}
		</App>
	);
}
