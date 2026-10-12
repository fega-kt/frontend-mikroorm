import type { ApprovalPriority, ApprovalRequestStatus, ApprovalTaskStatus, UserBrief } from "#src/api/approval-request";
import type { SearchParamsBase } from "#src/api/service-base";
import type { FormField } from "#src/api/setting/request-type";

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
	originalApprover: { id: string, fullName: string } | null
	request: {
		id: string
		code?: string
		title: string
		status: ApprovalRequestStatus
		priority: ApprovalPriority
		payload: Record<string, unknown>
		submittedAt?: string
		requestType: { id: string, name: string, formSchema: FormField[] }
		requester: UserBrief
		department: { id: string, name: string }
	}
}

export interface BulkApproveResult {
	results: { id: string, success: boolean, message?: string }[]
	succeeded: number
}
