import type { MyRequest } from "../mock";

import { Segmented, Tag, theme } from "antd";

import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { REQUEST_TYPE_COLOR } from "../constants";

import { RequestStatus } from "../mock";
import { DashboardCard } from "./dashboard-card";
import { RequestTypeIcon } from "./request-type-icon";

type FilterKey = "inProgress" | "returned" | "done";

const FILTER_STATUSES: Record<FilterKey, RequestStatus[]> = {
	inProgress: [RequestStatus.Pending],
	returned: [RequestStatus.Returned],
	done: [RequestStatus.Approved, RequestStatus.Rejected, RequestStatus.Cancelled],
};

const STATUS_TAG: Partial<Record<RequestStatus, string>> = {
	// "blue" cố định thay vì "processing" (theo màu chủ đạo) — để không trùng màu xanh lá của bước đã duyệt khi đổi theme
	[RequestStatus.Pending]: "blue",
	[RequestStatus.Returned]: "warning",
	[RequestStatus.Approved]: "success",
	[RequestStatus.Rejected]: "error",
	[RequestStatus.Cancelled]: "magenta",
};

export function MyRequests({ items }: { items: MyRequest[] }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [filter, setFilter] = useState<FilterKey>("inProgress");

	const counts = useMemo(() => {
		const countBy = (key: FilterKey) => items.filter(item => FILTER_STATUSES[key].includes(item.status)).length;
		return { inProgress: countBy("inProgress"), returned: countBy("returned"), done: countBy("done") };
	}, [items]);

	const visible = items.filter(item => FILTER_STATUSES[filter].includes(item.status));

	// Màu từng bước: đã qua = success, bước hiện tại = blue (trả lại/từ chối = warning), chưa tới = viền
	const getStepColor = (item: MyRequest, index: number) => {
		if (index < item.currentStep)
			return token.colorSuccess;
		if (index === item.currentStep) {
			const failed = item.status === RequestStatus.Returned || item.status === RequestStatus.Rejected;
			return failed ? token.colorWarning : token.blue6;
		}
		return token.colorFillSecondary;
	};

	const filterLabel = (key: FilterKey) => (
		<span className="flex items-center gap-1.5">
			{t(`home.myRequests.filter.${key}`)}
			<span className="rounded-full bg-colorFillSecondary px-1.5 text-[11px] leading-4">{counts[key]}</span>
		</span>
	);

	return (
		<DashboardCard
			flush
			className="h-full"
			title={t("home.myRequests.title")}
			extra={(
				<Segmented<FilterKey>
					shape="round"
					size="small"
					value={filter}
					onChange={setFilter}
					options={(["inProgress", "returned", "done"] as FilterKey[]).map(key => ({ value: key, label: filterLabel(key) }))}
				/>
			)}
			footerLink={{ to: "/approval/my/all", label: t("home.myRequests.viewAll") }}
		>
			{visible.map(item => (
				<div key={item.id} className="flex flex-wrap items-center gap-3.5 border-0 border-b border-solid border-colorBorderSecondary px-5 py-3.5">
					<RequestTypeIcon type={item.type} />
					<div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
						<div className="flex min-w-0 items-center gap-2">
							<Tag bordered={false} color={REQUEST_TYPE_COLOR[item.type]} className="m-0 shrink-0">
								{t(`home.requestType.${item.type}`)}
							</Tag>
							<span className="truncate text-sm text-colorText">{item.title}</span>
						</div>
						<span className="text-xs text-colorTextTertiary">
							{t("home.myRequests.submitted", { time: dayjs(item.submittedAt).fromNow() })}
							{" · "}
							{item.note}
						</span>
					</div>
					<div className="flex flex-[1_1_220px] items-center gap-1" aria-label={t("home.myRequests.progress")}>
						{item.steps.map((step, index) => (
							<div key={step.name} className="flex min-w-0 flex-1 flex-col gap-1">
								<div className="h-1 rounded-full" style={{ background: getStepColor(item, index) }} />
								<span
									className={`truncate text-xs ${
										index === item.currentStep
											? "font-medium text-colorText"
											: index < item.currentStep ? "text-colorTextSecondary" : "text-colorTextTertiary"
									}`}
								>
									{step.name}
								</span>
							</div>
						))}
					</div>
					<Tag bordered={false} color={STATUS_TAG[item.status]} className="m-0 w-[88px] shrink-0 text-center">
						{t(`home.myRequests.status.${item.status}`)}
					</Tag>
				</div>
			))}
			{!visible.length && (
				<div className="py-10 text-center text-sm text-colorTextTertiary">{t("home.myRequests.empty")}</div>
			)}
		</DashboardCard>
	);
}
