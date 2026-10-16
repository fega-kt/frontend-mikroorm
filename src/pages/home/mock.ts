import { ApprovalRequestStatus as RequestStatus } from "#src/api/approval-request/types";

/**
 * Dữ liệu giả cho dashboard phê duyệt — chưa có API thống kê.
 * Đơn chờ duyệt / đơn của tôi / ủy quyền đã lấy từ API (use-approval-dashboard.ts).
 * Số đã duyệt / tỷ lệ duyệt trong tháng đã lấy từ API (use-approval-dashboard.ts).
 * TODO: thời gian duyệt trung bình và hoạt động gần đây — chưa có API.
 */

import dayjs from "dayjs";

export { RequestStatus };

export type RequestTypeCode = "leave" | "advance" | "purchase" | "trip" | "payment" | "other";

export interface PendingApproval {
	id: string
	type: RequestTypeCode
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

export type ActivityKind = "approved" | "rejected" | "returned" | "submitted" | "delegated";

export interface ApprovalActivity {
	id: string
	kind: ActivityKind
	actor: string
	target: string
	createdAt: string
}

const ago = (value: number, unit: dayjs.ManipulateType) => dayjs().subtract(value, unit).toISOString();

export const MOCK_STATS = {
	avgDaysPerStep: 1.6,
	avgDaysDelta: -0.4,
	avgByType: [
		{ type: "leave" as RequestTypeCode, days: 0.6 },
		{ type: "trip" as RequestTypeCode, days: 1.2 },
		{ type: "advance" as RequestTypeCode, days: 2.1 },
		{ type: "purchase" as RequestTypeCode, days: 3.4 },
	],
};

export const MOCK_ACTIVITIES: ApprovalActivity[] = [
	{ id: "a1", kind: "approved", actor: "Giám đốc", target: "Thanh toán khóa học AWS", createdAt: ago(10, "minute") },
	{ id: "a2", kind: "returned", actor: "Kế toán", target: "Tạm ứng mua thiết bị test", createdAt: ago(1, "hour") },
	{ id: "a3", kind: "submitted", actor: "Lê Hoàng Hà", target: "Mua 5 màn hình", createdAt: ago(3, "hour") },
	{ id: "a4", kind: "delegated", actor: "Bạn", target: "Nguyễn Thị Nhung", createdAt: ago(1, "day") },
	{ id: "a5", kind: "rejected", actor: "Giám đốc", target: "Mua ghế công thái học", createdAt: ago(2, "day") },
];
