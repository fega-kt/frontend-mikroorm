import { BasicButton } from "#src/components/basic-button";

import { usePreferences } from "#src/hooks/use-preferences";
import { cn } from "#src/utils/cn";

import { DoubleLeftOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import { siderTriggerHeight } from "../../constants";

interface SiderTriggerProps {
	className?: string
}

export function SiderTrigger({ className }: SiderTriggerProps) {
	const { t } = useTranslation();
	const { sidebarCollapsed, setPreferences } = usePreferences();

	return (
		<div
			style={{ height: siderTriggerHeight }}
			className={cn("flex items-center px-2 py-1", className)}
		>
			<Tooltip title={sidebarCollapsed ? t("widgets.sidebar.expand") : t("widgets.sidebar.collapse")} placement="right">
				<BasicButton
					type="text"
					icon={(
						<DoubleLeftOutlined
							className={cn("text-xs transition-transform duration-300", sidebarCollapsed && "rotate-180")}
						/>
					)}
					onClick={() => setPreferences("sidebarCollapsed", !sidebarCollapsed)}
					className="size-full rounded-lg bg-colorFillTertiary! text-colorTextSecondary! transition-all duration-300 hover:bg-primary/15! hover:text-primary!"
				/>
			</Tooltip>
		</div>
	);
}
