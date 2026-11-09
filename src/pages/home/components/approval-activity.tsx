import type { ApprovalActivityItem, ApprovalActivityKind } from "#src/api/approval-task";
import type { ReactNode } from "react";

import { approvalRequestPath } from "#src/router/extra-info";
import { useUserStore } from "#src/store/user";
import { CheckOutlined, CloseOutlined, RollbackOutlined, SendOutlined, UserSwitchOutlined } from "@ant-design/icons";
import { theme } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { DashboardCard } from "./dashboard-card";

/** Hoạt động gần đây của các tờ trình liên quan tới tôi (tôi gửi hoặc tôi tham gia duyệt) */
export function ApprovalActivityCard({ items }: { items: ApprovalActivityItem[] }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { id: currentUserId } = useUserStore();

	const KIND_STYLE: Record<ApprovalActivityKind, { icon: ReactNode, color: string, bg: string }> = {
		approved: { icon: <CheckOutlined />, color: token.colorSuccess, bg: token.colorSuccessBg },
		rejected: { icon: <CloseOutlined />, color: token.colorError, bg: token.colorErrorBg },
		returned: { icon: <RollbackOutlined />, color: token.colorWarning, bg: token.colorWarningBg },
		submitted: { icon: <SendOutlined />, color: token.colorPrimary, bg: token.colorPrimaryBg },
		reassigned: { icon: <UserSwitchOutlined />, color: token.purple, bg: token.colorFillTertiary },
	};

	const actorName = (item: ApprovalActivityItem) => {
		if (!item.actor)
			return t("home.activity.system");
		return item.actor.id === currentUserId ? t("home.activity.you") : item.actor.fullName;
	};

	return (
		<DashboardCard title={t("home.activity.title")} className="h-full">
			{items.length === 0
				? <span className="text-[13px] text-colorTextTertiary">{t("home.activity.empty")}</span>
				: (
					<div className="relative min-h-[280px] lg:h-full">
						<div className="flex flex-col lg:absolute lg:inset-0 lg:overflow-y-auto">
							{items.map((item) => {
								const style = KIND_STYLE[item.kind];
								return (
									<div key={item.id} className="flex gap-3 py-2">
										<span className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs" style={{ color: style.color, background: style.bg }}>
											{style.icon}
										</span>
										<div className="flex min-w-0 flex-col gap-0.5">
											<span className="text-[13px] leading-normal text-colorTextSecondary">
												<strong className="font-semibold text-colorText">{actorName(item)}</strong>
												{" "}
												{t(`home.activity.kind.${item.kind}`)}
												{" "}
												<Link to={approvalRequestPath.detail(item.requestId)} style={{ color: token.colorPrimary }}>{item.title}</Link>
												{item.kind === "reassigned" && item.target && (
													<>
														{" "}
														{t("home.activity.to")}
														{" "}
														<strong className="font-semibold text-colorText">{item.target.id === currentUserId ? t("home.activity.you") : item.target.fullName}</strong>
													</>
												)}
											</span>
											<span className="text-xs text-colorTextTertiary">{dayjs(item.createdAt).fromNow()}</span>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
		</DashboardCard>
	);
}
