import type { ApprovalPriority, ApprovalRequestStatus, ApprovalTaskStatus, UserBrief } from "#src/api/approval-request";
import type { SearchParamsBase } from "#src/api/service-base";
import type { FormField } from "#src/api/setting/request-type";
import type { PrincipalType } from "#src/api/system/principal";

export interface InboxSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	tab?: "pending" | "done" | "all"
	requestTypeId?: string
	search?: string
}

export interface InboxItem {
	id: string
	status: ApprovalTaskStatus
	nodeId: string
	nodeName?: string
	dueAt?: string
	actedAt?: string
	comment?: string
	createdAt: string
	/** Người / nhóm duyệt theo quy trình */
	originApprover: { id: string, type: PrincipalType, name: string }
	/** Người / nhóm đang giữ task */
	approver: { id: string, type: PrincipalType, name: string }
	/** Task của người khác mà tôi xử lý / được xử lý thay theo ủy quyền */
	onBehalfOf: { id: string, fullName: string } | null
	request: {
		id: string
		code?: string
		title: string
		status: ApprovalRequestStatus
		priority: ApprovalPriority
		payload: Record<string, unknown>
		submittedAt?: string
		requestType: { id: string, name: string, formId: string, formSchema: FormField[] }
		requester: UserBrief
		department: { id: string, name: string }
		/** Nhóm tờ trình (icon = URL ảnh, có thể trống) */
		category: { id: string, name: string, icon?: string | null }
	}
}

export interface BulkApproveResult {
	results: { id: string, success: boolean, message?: string }[]
	succeeded: number
}

/** Thẻ "Tôi đã duyệt tháng này" */
export interface ApprovedStats {
	thisMonth: number
	lastMonth: number
}

/** Ô "Thời gian duyệt trung bình" (các lượt tôi đã xử lý): null khi tháng chưa có dữ liệu để so */
export interface AvgApprovalTimeStats {
	/** Số ngày / bước, tháng này */
	avgDays: number | null
	/** Tháng này − tháng trước (âm = nhanh hơn) */
	deltaDays: number | null
	byType: { requestTypeId: string, code: string, name: string, days: number, count: number }[]
}

export type ApprovalActivityKind = "approved" | "rejected" | "returned" | "submitted" | "reassigned";

/** Một dòng ở khối "Hoạt động phê duyệt" */
export interface ApprovalActivityItem {
	id: string
	kind: ApprovalActivityKind
	/** null = hệ thống (quá hạn tự duyệt / từ chối) */
	actor: { id: string, fullName: string } | null
	requestId: string
	title: string
	/** Người nhận khi kind = reassigned */
	target: { id: string, fullName: string } | null
	createdAt: string
}

/** Thẻ "Tỷ lệ duyệt": rate là % (0–100) của các tờ trình tôi đã xử lý tháng này */
export interface ApprovalRateStats {
	approved: number
	rejected: number
	returned: number
	rate: number
}
