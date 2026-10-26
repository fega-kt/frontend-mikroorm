import type { ReportRangeParams, ReportRequestTypes } from "#src/api/approval-report";
import type { ReportFilterState } from "../use-report-filters";
import { approvalReportService } from "#src/api/approval-report";
import { Button, Table, theme, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { formatDuration, formatNumber, STATUS_COLORS } from "../lib";
import { useReportData } from "../use-report-filters";
import { ReportState } from "./report-state";
import { HBarList, Legend, Panel, PercentBar } from "./ui";

type TypeRow = ReportRequestTypes["types"][number];

const fetchRequestTypes = (params: ReportRangeParams) => approvalReportService.fetchRequestTypes(params);

export function RequestTypesReport({ query, onPick }: { query: ReportRangeParams, onPick: (patch: Partial<ReportFilterState>) => void }) {
	const { t } = useTranslation();
	const { data, loading, error } = useReportData(fetchRequestTypes, query);

	return (
		<ReportState loading={loading} error={error} hasData={!!data}>
			{data && (
				<div className="flex flex-col gap-4">
					<Panel title={t("approval.report.types.tableTitle")} hint={t("approval.report.types.tableHint")}>
						<Table<TypeRow>
							size="small"
							rowKey="id"
							pagination={false}
							scroll={{ x: 960 }}
							dataSource={data.types}
							locale={{ emptyText: t("approval.report.empty") }}
							columns={[
								{
									title: t("approval.report.col.requestType"),
									dataIndex: "name",
									render: (name: string, row) => <Button type="link" className="h-auto p-0" onClick={() => onPick({ requestTypeId: row.id })}>{name}</Button>,
								},
								{ title: t("approval.report.col.category"), dataIndex: "category", render: (v: string | null) => v ?? "—" },
								{ title: t("approval.report.col.sent"), dataIndex: "sent", align: "right" },
								{ title: t("approval.report.col.approvalRate"), dataIndex: "approvalRate", render: (v: number | null) => <PercentBar value={v} /> },
								{
									title: t("approval.report.col.resubmit"),
									dataIndex: "resubmitRate",
									align: "right",
									render: (v: number | null) => (v === null ? "—" : `${formatNumber(v)}%`),
								},
								{ title: t("approval.report.col.avgRounds"), dataIndex: "avgRounds", align: "right", render: (v: number | null) => (v === null ? "—" : formatNumber(v)) },
								{ title: t("approval.report.col.avgCycle"), dataIndex: "avgCycleSeconds", align: "right", render: (v: number | null) => formatDuration(v, t) },
								{
									title: t("approval.report.col.topReturnStep"),
									dataIndex: "topReturnStep",
									render: (v: TypeRow["topReturnStep"]) => (v ? t("approval.report.types.stepTimes", { name: v.name, count: v.times }) : "—"),
								},
							]}
						/>
					</Panel>

					<div className="grid gap-3 lg:grid-cols-2">
						<Panel title={t("approval.report.types.outcomeTitle")} hint={t("approval.report.types.outcomeHint")}>
							<OutcomeBars types={data.types} />
						</Panel>
						<Panel title={t("approval.report.types.roundsTitle")} hint={t("approval.report.types.roundsHint")}>
							<RoundsPanel data={data} />
						</Panel>
					</div>
				</div>
			)}
		</ReportState>
	);
}

/** Mỗi loại một thanh 100%: duyệt / từ chối / hủy trên tờ trình đã kết thúc */
function OutcomeBars({ types }: { types: TypeRow[] }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const rows = types.filter(type => type.approvalRate !== null);
	const parts = [
		{ key: "approved", rate: (row: TypeRow) => row.approvalRate },
		{ key: "rejected", rate: (row: TypeRow) => row.rejectRate },
		{ key: "cancelled", rate: (row: TypeRow) => row.cancelRate },
	] as const;

	if (!rows.length)
		return <div className="py-6 text-center text-[13px]" style={{ color: token.colorTextTertiary }}>{t("approval.report.empty")}</div>;
	return (
		<div className="flex flex-col gap-3">
			<Legend items={parts.map(part => ({ label: t(`approval.report.status.${part.key}`), color: STATUS_COLORS[part.key] }))} />
			{rows.map(row => (
				<Tooltip
					key={row.id}
					title={parts.map(part => `${t(`approval.report.status.${part.key}`)}: ${formatNumber(part.rate(row) ?? 0)}%`).join(" · ")}
				>
					<div className="grid items-center gap-2.5" style={{ gridTemplateColumns: "150px minmax(0, 1fr)" }}>
						<span className="truncate text-[13px]">{row.name}</span>
						<span className="flex h-3.5 gap-0.5 overflow-hidden rounded">
							{parts.map(part => (part.rate(row) ?? 0) > 0 && (
								<span key={part.key} style={{ width: `${part.rate(row)}%`, background: STATUS_COLORS[part.key] }} />
							))}
						</span>
					</div>
				</Tooltip>
			))}
		</div>
	);
}

function RoundsPanel({ data }: { data: ReportRequestTypes }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { one, two, more } = data.rounds;
	const total = one + two + more;
	const share = (value: number) => (total ? `${formatNumber((value / total) * 100, 0)}%` : "");
	return (
		<div className="flex flex-col gap-3">
			<HBarList
				labelWidth={120}
				empty={t("approval.report.empty")}
				items={total
					? [
						{ key: "one", label: t("approval.report.types.rounds.one"), value: one },
						{ key: "two", label: t("approval.report.types.rounds.two"), value: two },
						{ key: "more", label: t("approval.report.types.rounds.more"), value: more },
					].map(item => ({ ...item, display: `${item.value} · ${share(item.value)}` }))
					: []}
			/>
			{data.topReturnSteps.length > 0 && (
				<div className="text-xs" style={{ color: token.colorTextSecondary }}>
					{t("approval.report.types.topSteps")}
					{" "}
					{data.topReturnSteps.map(step => t("approval.report.types.stepTimes", { name: step.name, count: step.times })).join(" · ")}
				</div>
			)}
		</div>
	);
}
