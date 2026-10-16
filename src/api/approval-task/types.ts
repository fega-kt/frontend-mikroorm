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

/** Thẻ "Tỷ lệ duyệt": rate là % (0–100) của các tờ trình tôi đã xử lý tháng này */
export interface ApprovalRateStats {
	approved: number
	rejected: number
	returned: number
	rate: number
}
