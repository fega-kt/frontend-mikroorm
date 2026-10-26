import type { ReportPerformance, ReportRangeParams } from "#src/api/approval-report";
import { approvalReportService } from "#src/api/approval-report";
import { Table, Tag, theme } from "antd";
import { useTranslation } from "react-i18next";
import { formatDuration, formatNumber, toHours } from "../lib";
import { useReportData } from "../use-report-filters";
import { ReportState } from "./report-state";
import { HBarList, Kpi, Panel, PercentBar } from "./ui";

/** Đúng hạn dưới mức này thì tô đỏ */
const ON_TIME_WARNING = 80;

const fetchPerformance = (params: ReportRangeParams) => approvalReportService.fetchPerformance(params);

export function PerformanceReport({ query }: { query: ReportRangeParams }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { data, loading, error } = useReportData(fetchPerformance, query);

	return (
		<ReportState loading={loading} error={error} hasData={!!data}>
			{data && (
				<div className="flex flex-col gap-4">
					<PerformanceKpis data={data} />
					<div className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
						<Panel title={t("approval.report.performance.approversTitle")} hint={t("approval.report.performance.approversHint")}>
							<Table
								size="small"
								bordered
								rowKey="key"
								pagination={data.approvers.length > 10 ? { pageSize: 10, size: "small" } : false}
								scroll={{ x: 720 }}
								dataSource={data.approvers}
								locale={{ emptyText: t("approval.report.empty") }}
								columns={[
									{
										title: t("approval.report.col.approver"),
										dataIndex: "name",
										render: (name: string, row) => (
											<span>
												{name}
												{row.isGroup && <Tag className="ml-1.5" variant="filled">{t("approval.report.group")}</Tag>}
											</span>
										),
									},
									// Lượt đã xử lý trong khoảng đã chọn; việc của cả nhóm không có người bấm nên để trống
									{
										title: t("approval.report.col.periodGroup"),
										children: [
											{ title: t("approval.report.col.done"), dataIndex: "done", align: "right", render: (v: number, row) => (row.isGroup ? "—" : v) },
											{
												title: t("approval.report.col.proxy"),
												dataIndex: "proxy",
												align: "right",
												render: (v: number, row) => <span style={{ color: token.colorTextSecondary }}>{row.isGroup ? "—" : v}</span>,
											},
											{ title: t("approval.report.col.avgResponse"), dataIndex: "avgResponseSeconds", align: "right", render: (v: number | null) => formatDuration(v, t) },
											{
												title: t("approval.report.col.onTime"),
												dataIndex: "onTimeRate",
												render: (v: number | null) => <PercentBar value={v} danger={v !== null && v < ON_TIME_WARNING} />,
											},
										],
									},
									// Việc còn đang chờ tại thời điểm xem, không phụ thuộc khoảng đã chọn
									{
										title: t("approval.report.col.nowGroup"),
										children: [
											{ title: t("approval.report.col.pending"), dataIndex: "pending", align: "right" },
											{
												title: t("approval.report.col.overdueNow"),
												dataIndex: "overdue",
												align: "right",
												render: (v: number) => (v ? <b style={{ color: token.colorError }}>{v}</b> : <span style={{ color: token.colorTextTertiary }}>0</span>),
											},
										],
									},
								]}
							/>
						</Panel>
						<Panel title={t("approval.report.performance.stepsTitle")} hint={t("approval.report.performance.stepsHint")}>
							<HBarList
								labelWidth={160}
								empty={t("approval.report.empty")}
								items={data.steps.map(step => ({
									key: step.name,
									label: step.name,
									value: toHours(step.avgResponseSeconds) ?? 0,
									display: formatDuration(step.avgResponseSeconds, t),
									tooltip: t("approval.report.performance.stepTooltip", { name: step.name, count: step.handled }),
								}))}
							/>
						</Panel>
					</div>
				</div>
			)}
		</ReportState>
	);
}

function PerformanceKpis({ data }: { data: ReportPerformance }) {
	const { t } = useTranslation();
	const dueShare = data.handled ? Math.round((data.withDue / data.handled) * 100) : 0;
	return (
		<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
			<Kpi
				label={t("approval.report.performance.handled")}
				value={formatNumber(data.handled, 0)}
				note={t("approval.report.performance.handledNote", { count: data.proxy })}
			/>
			<Kpi
				label={t("approval.report.performance.avgResponse")}
				value={formatDuration(data.avgResponseSeconds, t)}
				note={t("approval.report.performance.avgResponseNote")}
			/>
			<Kpi
				label={t("approval.report.performance.onTime")}
				value={data.onTimeRate === null ? "—" : formatNumber(data.onTimeRate)}
				unit={data.onTimeRate === null ? undefined : "%"}
				danger={data.onTimeRate !== null && data.onTimeRate < ON_TIME_WARNING}
				note={t("approval.report.performance.onTimeNote", { count: data.withDue, share: dueShare })}
			/>
			<Kpi
				label={t("approval.report.performance.reminds")}
				value={`${formatNumber(data.reminds, 0)} / ${formatNumber(data.escalations, 0)}`}
				note={t("approval.report.performance.remindsNote")}
			/>
			<Kpi
				label={t("approval.report.performance.auto")}
				value={formatNumber(data.autoApproved + data.autoRejected, 0)}
				note={t("approval.report.performance.autoNote", { approved: data.autoApproved, rejected: data.autoRejected })}
			/>
		</div>
	);
}
