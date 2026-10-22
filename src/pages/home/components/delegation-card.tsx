import type { Delegation } from "../mock";

import { PeoplePicker } from "#src/components/people-picker";

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
			<PeoplePicker
				readonly
				user={{ id: item.userId, fullName: item.fullName, avatar: item.avatar }}
				avatarSize={28}
				description={`${item.scope} · ${formatRange(item)}`}
			/>
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
