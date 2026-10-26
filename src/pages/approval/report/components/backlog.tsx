import type { ReportBacklogItem, ReportScopeParams } from "#src/api/approval-report";
import { approvalReportService } from "#src/api/approval-report";
import { approvalRequestPath } from "#src/router/extra-info";
import { Segmented, Table, Tag, theme } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { formatDuration, formatNumber, STATUS_COLORS } from "../lib";
import { useReportData } from "../use-report-filters";
import { ReportState } from "./report-state";
import { HBarList, Kpi, Panel } from "./ui";

type ListFilter = "all" | "overdue" | "gt3d";

const THREE_DAYS = 3 * 24 * 3600;

const fetchBacklog = (params: ReportScopeParams) => approvalReportService.fetchBacklog(params);

export function BacklogReport({ query }: { query: ReportScopeParams }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { data, loading, error } = useReportData(fetchBacklog, query);
	const [listFilter, setListFilter] = useState<ListFilter>("all");

	const items = (data?.items ?? []).filter(item =>
		listFilter === "overdue" ? item.overdue : listFilter === "gt3d" ? item.waitSeconds > THREE_DAYS : true,
	);

	return (
		<ReportState loading={loading} error={error} hasData={!!data}>
			{data && (
				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
						<Kpi label={t("approval.report.backlog.pending")} value={formatNumber(data.pendingRequests, 0)} note={t("approval.report.backlog.pendingNote")} />
						<Kpi
							label={t("approval.report.backlog.overdue")}
							value={formatNumber(data.overdueRequests, 0)}
							danger={data.overdueRequests > 0}
							note={t("approval.report.backlog.overdueNote")}
						/>
						<Kpi
							label={t("approval.report.backlog.oldest")}
							value={data.oldest ? formatDuration(data.oldest.waitSeconds, t) : "—"}
							note={data.oldest ? [data.oldest.code, data.oldest.step].filter(Boolean).join(" · ") : undefined}
						/>
						<Kpi label={t("approval.report.backlog.returned")} value={formatNumber(data.returnedRequests, 0)} note={t("approval.report.backlog.returnedNote")} />
					</div>

					<div className="grid gap-3 lg:grid-cols-2">
						<Panel title={t("approval.report.backlog.agingTitle")} hint={t("approval.report.backlog.agingHint")}>
							<HBarList
								labelWidth={110}
								empty={t("approval.report.empty")}
								items={data.aging.map(bucket => ({
									key: bucket.key,
									label: t(`approval.report.backlog.aging.${bucket.key}`),
									value: bucket.count,
									color: bucket.key === "gt7d" ? STATUS_COLORS.rejected : undefined,
									onClick: bucket.key === "3to7d" || bucket.key === "gt7d" ? () => setListFilter("gt3d") : undefined,
								}))}
							/>
						</Panel>
						<Panel title={t("approval.report.backlog.holdersTitle")} hint={t("approval.report.backlog.holdersHint")}>
							<HBarList
								empty={t("approval.report.empty")}
								items={data.holders.map(holder => ({
									key: holder.key,
									label: holder.isGroup ? `${holder.name} (${t("approval.report.group")})` : holder.name,
									value: holder.pending,
									display: (
										<span>
											{holder.pending}
											{holder.overdue > 0 && <span style={{ color: token.colorError }}>{` (${holder.overdue})`}</span>}
										</span>
									),
									tooltip: t("approval.report.backlog.holderTooltip", { pending: holder.pending, overdue: holder.overdue }),
								}))}
							/>
						</Panel>
					</div>

					<Panel
						title={t("approval.report.backlog.listTitle")}
						hint={t("approval.report.backlog.listHint", { shown: data.items.length, total: data.total })}
						extra={(
							<Segmented<ListFilter>
								value={listFilter}
								onChange={setListFilter}
								options={(["all", "overdue", "gt3d"] as const).map(value => ({ value, label: t(`approval.report.backlog.filter.${value}`) }))}
							/>
						)}
					>
						<Table<ReportBacklogItem>
							size="small"
							rowKey="taskId"
							pagination={items.length > 20 ? { pageSize: 20, size: "small" } : false}
							scroll={{ x: 1000 }}
							dataSource={items}
							locale={{ emptyText: t("approval.report.empty") }}
							columns={[
								{
									title: t("approval.report.col.code"),
									dataIndex: "code",
									width: 130,
									render: (code: string | null, row) => <Link to={approvalRequestPath.detail(row.requestId)}>{code ?? t("approval.report.noCode")}</Link>,
								},
								{ title: t("approval.report.col.title"), dataIndex: "title", ellipsis: true },
								{ title: t("approval.report.col.requester"), dataIndex: "requester" },
								{ title: t("approval.report.col.step"), dataIndex: "step", render: (v: string | null) => v ?? "—" },
								{
									title: t("approval.report.col.holder"),
									dataIndex: "holder",
									render: (holder: string, row) => (row.holderIsGroup ? `${holder} (${t("approval.report.group")})` : holder),
								},
								{ title: t("approval.report.col.waited"), dataIndex: "waitSeconds", align: "right", render: (v: number) => formatDuration(v, t) },
								{
									title: t("approval.report.col.due"),
									dataIndex: "dueAt",
									render: (dueAt: string | null, row) => <DueTag dueAt={dueAt} overdue={row.overdue} />,
								},
								{
									title: t("approval.report.col.system"),
									key: "system",
									render: (_, row) => (
										<span style={{ color: token.colorTextSecondary }}>
											{[
												row.reminds ? t("approval.report.backlog.reminded", { count: row.reminds }) : "",
												row.escalations ? t("approval.report.backlog.escalated", { count: row.escalations }) : "",
											].filter(Boolean).join(" · ") || "—"}
										</span>
									),
								},
							]}
						/>
					</Panel>
				</div>
			)}
		</ReportState>
	);
}

/** Hạn xử lý của bước: quá hạn (đỏ), còn dưới 1 ngày (vàng), còn lâu (xanh), bước không đặt hạn */
function DueTag({ dueAt, overdue }: { dueAt: string | null, overdue: boolean }) {
	const { t } = useTranslation();
	if (!dueAt)
		return <Tag variant="filled">{t("approval.report.backlog.noDue")}</Tag>;
	const seconds = Math.abs(dayjs(dueAt).diff(dayjs(), "second"));
	if (overdue)
		return <Tag color="red" variant="filled">{t("approval.report.backlog.overdueBy", { time: formatDuration(seconds, t) })}</Tag>;
	return (
		<Tag color={seconds < 24 * 3600 ? "gold" : "green"} variant="filled">
			{t("approval.report.backlog.dueIn", { time: formatDuration(seconds, t) })}
		</Tag>
	);
}
