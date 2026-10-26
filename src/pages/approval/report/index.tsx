import type { ReportFilters } from "#src/api/approval-report";
import { approvalReportService } from "#src/api/approval-report";
import { BasicContent } from "#src/components/basic-content";
import { theme } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { BacklogReport } from "./components/backlog";
import { ReportFilterBar } from "./components/filters";
import { OverviewReport } from "./components/overview";
import { PerformanceReport } from "./components/performance";
import { RequestTypesReport } from "./components/request-types";
import { useReportFilters } from "./use-report-filters";

type View = "overview" | "performance" | "backlog" | "request-types";

const VIEWS: Record<View, { title: string, description: string }> = {
	"overview": { title: "approval.report.overview.title", description: "approval.report.overview.description" },
	"performance": { title: "approval.report.performance.title", description: "approval.report.performance.description" },
	"backlog": { title: "approval.report.backlog.title", description: "approval.report.backlog.description" },
	"request-types": { title: "approval.report.types.title", description: "approval.report.types.description" },
};

/** Báo cáo tờ trình cho cấp quản lý; bốn menu con dùng chung trang, phân biệt theo đoạn cuối của đường dẫn */
export default function ApprovalReport() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	// /approval/report/{overview|performance|backlog|request-types}
	const segment = useLocation().pathname.split("/").filter(Boolean).pop() as View;
	const view: View = segment in VIEWS ? segment : "overview";
	const { state, update, query } = useReportFilters();
	const [filters, setFilters] = useState<ReportFilters>();

	useEffect(() => {
		approvalReportService.fetchFilters().then(setFilters).catch(() => undefined);
	}, []);

	const scope = { departmentId: query.departmentId, requestTypeId: query.requestTypeId };

	return (
		<BasicContent>
			<div className="flex flex-col gap-4">
				<div>
					<h1 className="m-0 text-xl font-semibold">{t(VIEWS[view].title)}</h1>
					<div className="mt-1 text-[13px]" style={{ color: token.colorTextSecondary }}>{t(VIEWS[view].description)}</div>
				</div>
				<ReportFilterBar filters={filters} value={state} onChange={update} showRange={view !== "backlog"} />
				{view === "overview" && <OverviewReport query={query} onPick={update} />}
				{view === "performance" && <PerformanceReport query={query} />}
				{view === "backlog" && <BacklogReport query={scope} />}
				{view === "request-types" && <RequestTypesReport query={query} onPick={update} />}
			</div>
		</BasicContent>
	);
}
