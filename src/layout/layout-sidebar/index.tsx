import { Scrollbar } from "#src/components/scrollbar";
import { usePreferences } from "#src/hooks/use-preferences";

import { theme as antdTheme, ConfigProvider } from "antd";

import { headerHeight, siderTriggerHeight } from "../constants";
import { Logo } from "../widgets/logo";
import { SiderTrigger } from "../widgets/sider-trigger";

export interface LayoutSidebarProps {
	children?: React.ReactNode
	computedSidebarWidth: number
}

export default function LayoutSidebar({ children, computedSidebarWidth }: LayoutSidebarProps) {
	const { sidebarCollapsed, sidebarTheme, isDark } = usePreferences();
	const {
		token: { Menu },
	} = antdTheme.useToken();

	const isFixedDarkTheme = isDark || sidebarTheme === "dark";

	return (
		<ConfigProvider
			theme={{
				algorithm: isFixedDarkTheme
					? antdTheme.darkAlgorithm
					: antdTheme.defaultAlgorithm,
			}}
		>
			<aside
				style={
					{
						// 一个像素的 border
						width: computedSidebarWidth + 1,
						backgroundColor: isFixedDarkTheme ? Menu?.darkItemBg : Menu?.itemBg,
						boxShadow: "3px 0 5px 0 rgb(29, 35, 41, 0.05)",
					}
				}
				// select-none: bấm/kéo trên menu không bôi đen chữ (và không bật popup dịch của trình duyệt)
				className="fixed top-0 bottom-0 left-0 overflow-x-hidden overflow-y-auto transition-all border-r border-r-colorBorderSecondary select-none"
			>
				<Logo sidebarCollapsed={sidebarCollapsed} />
				<div className="overflow-hidden" style={{ height: `calc(100% - ${headerHeight}px - ${siderTriggerHeight}px)` }}>
					{/* global.css ép .simplebar-content cao 100% nên khi menu mở dài ra, SimpleBar không thấy content đổi kích thước → không bật cuộn. Ở sidebar để content tự giãn theo menu. */}
					<Scrollbar className="[&_.simplebar-content]:h-auto!">
						{children}
					</Scrollbar>
				</div>
				<SiderTrigger />
			</aside>
		</ConfigProvider>
	);
}
