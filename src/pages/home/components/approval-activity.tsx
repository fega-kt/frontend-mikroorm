import type { ReactNode } from "react";
import type { ActivityKind, ApprovalActivity } from "../mock";

import { CheckOutlined, CloseOutlined, RollbackOutlined, SendOutlined, UserSwitchOutlined } from "@ant-design/icons";
import { theme } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { DashboardCard } from "./dashboard-card";

export function ApprovalActivityCard({ items }: { items: ApprovalActivity[] }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	const KIND_STYLE: Record<ActivityKind, { icon: ReactNode, color: string, bg: string }> = {
		approved: { icon: <CheckOutlined />, color: token.colorSuccess, bg: token.colorSuccessBg },
		rejected: { icon: <CloseOutlined />, color: token.colorError, bg: token.colorErrorBg },
		returned: { icon: <RollbackOutlined />, color: token.colorWarning, bg: token.colorWarningBg },
		submitted: { icon: <SendOutlined />, color: token.colorPrimary, bg: token.colorPrimaryBg },
		delegated: { icon: <UserSwitchOutlined />, color: token.purple, bg: token.colorFillTertiary },
	};

	return (
		<DashboardCard title={t("home.activity.title")} className="h-full">
			<div className="flex flex-col">
				{items.map((item) => {
					const style = KIND_STYLE[item.kind];
					return (
						<div key={item.id} className="flex gap-3 py-2">
							<span className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs" style={{ color: style.color, background: style.bg }}>
								{style.icon}
							</span>
							<div className="flex min-w-0 flex-col gap-0.5">
								<span className="text-[13px] leading-normal text-colorTextSecondary">
									<strong className="font-semibold text-colorText">{item.actor}</strong>
									{" "}
									{t(`home.activity.kind.${item.kind}`)}
									{" "}
									<span style={{ color: token.colorPrimary }}>{item.target}</span>
								</span>
								<span className="text-xs text-colorTextTertiary">{dayjs(item.createdAt).fromNow()}</span>
							</div>
						</div>
					);
				})}
			</div>
		</DashboardCard>
	);
}
