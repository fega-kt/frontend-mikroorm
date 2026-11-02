import { ApprovalRequestStatus as RequestStatus } from "#src/api/approval-request/types";

/**
 * Kiểu dùng chung cho dashboard phê duyệt. Mọi số liệu đều lấy từ API (use-approval-dashboard.ts):
 * đơn chờ duyệt, đơn của tôi, ủy quyền, số đã duyệt / tỷ lệ duyệt, thời gian duyệt trung bình, hoạt động gần đây.
 */

export { RequestStatus };

export type RequestTypeCode = "leave" | "advance" | "purchase" | "trip" | "payment" | "other";

export interface PendingApproval {
	id: string
	type: RequestTypeCode
	/** Nhóm tờ trình (dữ liệu thật); dữ liệu mẫu không có */
	category?: { id: string, name: string, icon?: string | null }
	title: string
	requesterId: string
	requesterName: string
	requesterAvatar?: string
	stepName: string
	createdAt: string
}

export interface ApprovalStep {
	name: string
}

export interface MyRequest {
	id: string
	type: RequestTypeCode
	/** Nhóm tờ trình (dữ liệu thật); dữ liệu mẫu không có */
	category?: { id: string, name: string, icon?: string | null }
	title: string
	submittedAt: string
	status: RequestStatus
	steps: ApprovalStep[]
	/** Vị trí bước hiện tại (bằng steps.length khi đã hoàn tất) */
	currentStep: number
	note: string
}

export interface Delegation {
	userId: string
	fullName: string
	avatar?: string
	scope: string
	fromDate?: string
	toDate: string
}
