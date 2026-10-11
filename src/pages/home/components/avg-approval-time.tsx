import type { RequestTypeCode } from "../mock";

import { theme } from "antd";
import { useTranslation } from "react-i18next";

import { getRequestTypeColors } from "../constants";
import { DashboardCard } from "./dashboard-card";
import { RequestTypeIcon } from "./request-type-icon";

interface AvgApprovalTimeProps {
	avgDays: number
	/** So với kỳ trước — âm là nhanh hơn */
	deltaDays: number
	byType: { type: RequestTypeCode, days: number }[]
}

export function AvgApprovalTime({ avgDays, deltaDays, byType }: AvgApprovalTimeProps) {
	const { t, i18n } = useTranslation();
	const { token } = theme.useToken();
	const numberFormat = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 });
	const max = Math.max(...byType.map(item => item.days), 1);
	const faster = deltaDays <= 0;

	return (
		<DashboardCard title={t("home.avgTime.title")} className="flex-1">
			<div className="flex flex-col gap-3">
				<div className="flex items-baseline gap-1.5">
					<span className="text-[30px] font-bold leading-none text-colorText">{numberFormat.format(avgDays)}</span>
					<span className="text-sm text-colorTextTertiary">{t("home.avgTime.unit")}</span>
					<span className="ml-auto text-xs" style={{ color: faster ? token.colorSuccess : token.colorError }}>
						{t(faster ? "home.avgTime.faster" : "home.avgTime.slower", { days: numberFormat.format(Math.abs(deltaDays)) })}
					</span>
				</div>
				{byType.map(item => (
					<div key={item.type} className="flex items-center gap-2.5 text-[13px]">
						<RequestTypeIcon type={item.type} size={24} />
						<span className="w-[72px] shrink-0 text-colorTextSecondary">{t(`home.requestType.${item.type}`)}</span>
						<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-colorFillSecondary">
							<div className="h-full rounded-full" style={{ width: `${(item.days / max) * 100}%`, background: getRequestTypeColors(token, item.type).color }} />
						</div>
						<span className="w-[56px] shrink-0 text-right text-colorText">
							{t("home.avgTime.days", { days: numberFormat.format(item.days) })}
						</span>
					</div>
				))}
			</div>
		</DashboardCard>
	);
}
