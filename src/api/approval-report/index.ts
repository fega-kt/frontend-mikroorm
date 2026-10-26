import type { ReportBacklog, ReportFilters, ReportOverview, ReportPerformance, ReportRangeParams, ReportRequestTypes, ReportScopeParams } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

/** Báo cáo tờ trình (menu Báo cáo); phạm vi phòng ban do backend giới hạn theo quyền */
export class ApprovalReportService extends CrudServiceBase {
	constructor() {
		super({ endpoint: "approval-report", service: ApiService.App });
	}

	fetchFilters() {
		return this.get<ReportFilters>("filters", { ignoreLoading: true });
	}

	fetchOverview(params: ReportRangeParams) {
		return this.get<ReportOverview>("overview", { searchParams: clean(params), ignoreLoading: true });
	}

	fetchPerformance(params: ReportRangeParams) {
		return this.get<ReportPerformance>("performance", { searchParams: clean(params), ignoreLoading: true });
	}

	fetchBacklog(params: ReportScopeParams) {
		return this.get<ReportBacklog>("backlog", { searchParams: clean(params), ignoreLoading: true });
	}

	fetchRequestTypes(params: ReportRangeParams) {
		return this.get<ReportRequestTypes>("request-types", { searchParams: clean(params), ignoreLoading: true });
	}
}

/** Bỏ tham số rỗng để không gửi "undefined" lên query string */
function clean<T extends object>(params: T) {
	return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")) as Record<string, string>;
}

export const approvalReportService = new ApprovalReportService();
