import type { Delegation } from "../mock";

import { UserAvatar } from "#src/components/user-avatar";

import { theme } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { DashboardCard } from "./dashboard-card";

interface DelegationCardProps {
	outgoing?: Delegation
	incoming?: Delegation
}

export function DelegationCard({ outgoing, incoming }: DelegationCardProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	const formatRange = (item: Delegation) => item.fromDate
		? `${dayjs(item.fromDate).format("DD/MM")} – ${dayjs(item.toDate).format("DD/MM")}`
		: t("home.delegation.until", { date: dayjs(item.toDate).format("DD/MM") });

	const renderItem = (item: Delegation, label: string, highlight: boolean) => (
		<div
			className="flex flex-col gap-1.5 p-3"
			style={{
				borderRadius: token.borderRadiusLG,
				background: highlight ? token.colorPrimaryBg : token.colorFillQuaternary,
				border: `1px solid ${highlight ? token.colorPrimaryBorder : "transparent"}`,
			}}
		>
			<span className="text-xs font-semibold uppercase" style={{ color: highlight ? token.colorPrimary : token.colorTextSecondary }}>
				{label}
			</span>
			<div className="flex items-center gap-2.5">
				<UserAvatar size={28} user={{ id: item.userId, fullName: item.fullName, avatar: item.avatar }} />
				<div className="flex min-w-0 flex-col">
					<span className="text-sm text-colorText">{item.fullName}</span>
					<span className="text-xs text-colorTextSecondary">
						{item.scope}
						{" · "}
						{formatRange(item)}
					</span>
				</div>
			</div>
		</div>
	);

	return (
		<DashboardCard title={t("home.delegation.title")}>
			<div className="flex flex-col gap-3">
				{outgoing && renderItem(outgoing, t("home.delegation.outgoing"), true)}
				{incoming && renderItem(incoming, t("home.delegation.incoming"), false)}
				{!outgoing && !incoming && (
					<span className="py-4 text-center text-sm text-colorTextTertiary">{t("home.delegation.empty")}</span>
				)}
			</div>
		</DashboardCard>
	);
}
