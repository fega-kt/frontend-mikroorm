import type { NotificationType } from "#src/api/notifications";

/** Trạng thái một email trong hàng đợi gửi mail — đồng bộ backend ActivityLogQueueStatus */
export enum ActivityLogQueueStatus {
	Draft = "draft",
	InProgress = "in_progress",
	Completed = "completed",
	Failed = "failed",
	/** Không gửi (thiếu email người nhận, chưa cấu hình dịch vụ mail…) */
	Skipped = "skipped",
}

/** Một email cho một người nhận */
export interface ActivityLogQueueItem {
	id: string
	userId: string
	user: { id: string, fullName?: string, loginName?: string } | null
	type: NotificationType
	status: ActivityLogQueueStatus
	/** Đối tượng liên quan, vd: approval_requests + id tờ trình */
	refType: string | null
	refId: string | null
	recipient: string | null
	subject: string | null
	attempts: number
	error: string | null
	lastAttemptAt: string | null
	createdAt: string
}

export interface ActivityLogQueueSearchParams {
	page?: number
	limit?: number
	status?: ActivityLogQueueStatus
	type?: NotificationType
	refId?: string
	keyword?: string
}
