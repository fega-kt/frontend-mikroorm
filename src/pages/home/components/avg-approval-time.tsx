import type { AvgApprovalTimeStats } from "#src/api/approval-task";

import { theme } from "antd";
import { useTranslation } from "react-i18next";

import { getRequestTypeColors } from "../constants";
import { guessRequestTypeCode } from "../use-approval-dashboard";
import { DashboardCard } from "./dashboard-card";
import { RequestTypeIcon } from "./request-type-icon";

/** Thời gian duyệt trung bình các lượt tôi đã xử lý tháng này, theo loại tờ trình, so với tháng trước */
export function AvgApprovalTime({ avgDays, deltaDays, byType }: AvgApprovalTimeStats) {
	const { t, i18n } = useTranslation();
	const { token } = theme.useToken();
	const numberFormat = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 });
	const max = Math.max(...byType.map(item => item.days), 1);
	const faster = (deltaDays ?? 0) <= 0;

	return (
		<DashboardCard title={t("home.avgTime.title")} className="flex-1">
			{avgDays === null
				? <span className="text-[13px] text-colorTextTertiary">{t("home.avgTime.empty")}</span>
				: (
					<div className="flex flex-col gap-3">
						<div className="flex items-baseline gap-1.5">
							<span className="text-[30px] font-bold leading-none text-colorText">{numberFormat.format(avgDays)}</span>
							<span className="text-sm text-colorTextTertiary">{t("home.avgTime.unit")}</span>
							{deltaDays !== null && (
								<span className="ml-auto text-xs" style={{ color: faster ? token.colorSuccess : token.colorError }}>
									{t(faster ? "home.avgTime.faster" : "home.avgTime.slower", { days: numberFormat.format(Math.abs(deltaDays)) })}
								</span>
							)}
						</div>
						{byType.map((item) => {
							// Loại tờ trình do admin tự đặt: chỉ đoán nhóm icon / màu từ tên, nhãn luôn là tên thật
							const type = guessRequestTypeCode(item.name, item.code);
							return (
								<div key={item.requestTypeId} className="flex items-center gap-2.5 text-[13px]">
									<RequestTypeIcon type={type} size={24} />
									<span className="w-[96px] shrink-0 truncate text-colorTextSecondary" title={item.name}>{item.name}</span>
									<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-colorFillSecondary">
										<div className="h-full rounded-full" style={{ width: `${(item.days / max) * 100}%`, background: getRequestTypeColors(token, type).color }} />
									</div>
									<span className="w-[56px] shrink-0 text-right text-colorText">
										{t("home.avgTime.days", { days: numberFormat.format(item.days) })}
									</span>
								</div>
							);
						})}
					</div>
				)}
		</DashboardCard>
	);
}
