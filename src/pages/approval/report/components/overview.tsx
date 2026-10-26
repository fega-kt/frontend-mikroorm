import type { ReportOverview, ReportRangeParams } from "#src/api/approval-report";
import type { ReportFilterState } from "../use-report-filters";
import { approvalReportService } from "#src/api/approval-report";
import { Button, Table, theme, Tooltip } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { formatDuration, formatNumber, STATUS_COLORS, toDays } from "../lib";
import { useReportData } from "../use-report-filters";
import { ReportState } from "./report-state";
import { Delta, HBarList, Kpi, Legend, Panel, PercentBar } from "./ui";

const STACK: (keyof typeof STATUS_COLORS)[] = ["approved", "pending", "returned", "rejected", "cancelled"];
const CHART_HEIGHT = 200;

const fetchOverview = (params: ReportRangeParams) => approvalReportService.fetchOverview(params);

const pctChange = (current: number, previous: number) => (previous ? ((current - previous) / previous) * 100 : null);
const diff = (current: number | null, previous: number | null) => (current === null || previous === null ? null : current - previous);

export function OverviewReport({ query, onPick }: { query: ReportRangeParams, onPick: (patch: Partial<ReportFilterState>) => void }) {
	const { t } = useTranslation();
	const { data, loading, error } = useReportData(fetchOverview, query);

	return (
		<ReportState loading={loading} error={error} hasData={!!data}>
			{data && (
				<div className="flex flex-col gap-4">
					<OverviewKpis data={data} />
					<div className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
						<Panel title={t("approval.report.overview.weeklyTitle")} hint={t("approval.report.overview.weeklyHint")}>
							<WeeklyChart weeks={data.weekly} />
						</Panel>
						<Panel title={t("approval.report.overview.typesTitle")} hint={t("approval.report.overview.typesHint")}>
							<HBarList
								empty={t("approval.report.empty")}
								items={data.topRequestTypes.map(type => ({
									key: type.id,
									label: type.name,
									value: type.sent,
									tooltip: t("approval.report.overview.typeTooltip", { name: type.name, count: type.sent }),
									onClick: () => onPick({ requestTypeId: type.id }),
								}))}
							/>
						</Panel>
					</div>
					<Panel title={t("approval.report.overview.departmentsTitle")} hint={t("approval.report.overview.departmentsHint")}>
						<Table
							size="small"
							rowKey="id"
							pagination={false}
							scroll={{ x: 720 }}
							dataSource={data.departments}
							locale={{ emptyText: t("approval.report.empty") }}
							columns={[
								{
									title: t("approval.report.col.department"),
									dataIndex: "name",
									render: (name: string, row) => <Button type="link" className="h-auto p-0" onClick={() => onPick({ department: { id: row.id, name } })}>{name}</Button>,
								},
								{ title: t("approval.report.col.sent"), dataIndex: "sent", align: "right" },
								{ title: t("approval.report.col.pending"), dataIndex: "pending", align: "right" },
								{ title: t("approval.report.col.approvalRate"), dataIndex: "approvalRate", render: (v: number | null) => <PercentBar value={v} /> },
								{ title: t("approval.report.col.rejected"), dataIndex: "rejected", align: "right" },
								{ title: t("approval.report.col.avgCycle"), dataIndex: "avgCycleSeconds", align: "right", render: (v: number | null) => formatDuration(v, t) },
							]}
						/>
					</Panel>
				</div>
			)}
		</ReportState>
	);
}

function OverviewKpis({ data }: { data: ReportOverview }) {
	const { t } = useTranslation();
	const { current, previous, now } = data;
	const cycleDays = toDays(current.avgCycleSeconds);
	return (
		<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
			<Kpi
				label={t("approval.report.overview.sent")}
				value={formatNumber(current.sent, 0)}
				note={(
					<>
						<Delta value={pctChange(current.sent, previous.sent)} suffix="%" />
						{" "}
						{t("approval.report.overview.sentNote")}
					</>
				)}
			/>
			<Kpi
				label={t("approval.report.overview.pending")}
				value={formatNumber(now.pending, 0)}
				note={t("approval.report.overview.pendingNote", { overdue: now.overdue, returned: now.returned })}
			/>
			<Kpi
				label={t("approval.report.overview.approvalRate")}
				value={current.approvalRate === null ? "—" : formatNumber(current.approvalRate)}
				unit={current.approvalRate === null ? undefined : "%"}
				note={(
					<>
						<Delta value={diff(current.approvalRate, previous.approvalRate)} suffix={` ${t("approval.report.unit.points")}`} />
						{" "}
						{t("approval.report.overview.approvalRateNote")}
					</>
				)}
			/>
			<Kpi
				label={t("approval.report.overview.avgCycle")}
				value={cycleDays === null ? "—" : formatNumber(cycleDays)}
				unit={cycleDays === null ? undefined : t("approval.report.unit.day")}
				note={(
					<>
						<Delta value={diff(cycleDays, toDays(previous.avgCycleSeconds))} suffix={` ${t("approval.report.unit.day")}`} good="down" />
						{" "}
						{t("approval.report.overview.avgCycleNote")}
					</>
				)}
			/>
			<Kpi
				label={t("approval.report.overview.resubmit")}
				value={current.resubmitRate === null ? "—" : formatNumber(current.resubmitRate)}
				unit={current.resubmitRate === null ? undefined : "%"}
				note={t("approval.report.overview.resubmitNote", { count: current.resubmitted })}
			/>
		</div>
	);
}

/** Cột chồng theo tuần gửi lần đầu, chia theo trạng thái hiện tại */
function WeeklyChart({ weeks }: { weeks: ReportOverview["weekly"] }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	if (!weeks.length)
		return <div className="py-10 text-center text-[13px]" style={{ color: token.colorTextTertiary }}>{t("approval.report.empty")}</div>;

	const totals = weeks.map(week => STACK.reduce((sum, key) => sum + week[key], 0));
	const max = Math.max(...totals, 1);
	const legend = STACK.map(key => ({ label: t(`approval.report.status.${key}`), color: STATUS_COLORS[key] }));

	return (
		<div className="flex flex-col gap-3">
			<Legend items={legend} />
			<div className="flex items-end gap-2 overflow-x-auto pt-5" style={{ height: CHART_HEIGHT + 44 }}>
				{weeks.map((week, index) => {
					const label = dayjs(week.weekStart).format("DD/MM");
					return (
						<Tooltip
							key={week.weekStart}
							title={(
								<div className="text-xs leading-relaxed">
									<b>{t("approval.report.overview.weekOf", { date: label, count: totals[index] })}</b>
									{STACK.map(key => <div key={key}>{`${t(`approval.report.status.${key}`)}: ${week[key]}`}</div>)}
								</div>
							)}
						>
							<div className="flex min-w-9 flex-1 flex-col items-center gap-1">
								<span className="text-[11px] tabular-nums" style={{ color: token.colorTextSecondary }}>{totals[index]}</span>
								{/* Đã duyệt nằm dưới cùng; khe 2px giữa các phần */}
								<div className="flex w-full max-w-10 flex-col-reverse gap-0.5 overflow-hidden rounded-t">
									{STACK.filter(key => week[key] > 0).map(key => (
										<div key={key} style={{ height: Math.max((week[key] / max) * CHART_HEIGHT - 2, 1), background: STATUS_COLORS[key] }} />
									))}
								</div>
								<span className="text-[11px]" style={{ color: token.colorTextTertiary }}>{label}</span>
							</div>
						</Tooltip>
					);
				})}
			</div>
		</div>
	);
}
