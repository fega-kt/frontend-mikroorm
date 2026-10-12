import dayjs from "dayjs";

/**
 * Dữ liệu giả cho dashboard phê duyệt — chưa có API thống kê.
 * TODO: thay bằng API của module phê duyệt (src/api/approval) khi BE sẵn sàng.
 */

export enum RequestStatus {
	Draft = "DRAFT",
	Pending = "PENDING",
	Approved = "APPROVED",
	Rejected = "REJECTED",
	Returned = "RETURNED",
	Cancelled = "CANCELLED",
}

export type RequestTypeCode = "leave" | "advance" | "purchase" | "trip" | "payment";

export interface PendingApproval {
	id: string
	type: RequestTypeCode
	title: string
	requesterId: string
	requesterName: string
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

export const MOCK_PENDING: PendingApproval[] = [
	{ id: "p1", type: "purchase", title: "Mua 5 màn hình cho phòng Thiết kế", requesterId: "u-ha", requesterName: "Lê Hoàng Hà", stepName: "Trưởng phòng duyệt", createdAt: ago(3, "day") },
	{ id: "p2", type: "advance", title: "Tạm ứng chi phí sự kiện tháng 10", requesterId: "u-long", requesterName: "Phạm Văn Long", stepName: "Kế toán duyệt", createdAt: ago(2, "day") },
	{ id: "p3", type: "trip", title: "Công tác Đà Nẵng gặp khách hàng", requesterId: "u-tuan", requesterName: "Trần Minh Tuấn", stepName: "Trưởng phòng duyệt", createdAt: ago(1, "day") },
	{ id: "p4", type: "leave", title: "Nghỉ phép 13/10 – 14/10", requesterId: "u-nhung", requesterName: "Nguyễn Thị Nhung", stepName: "Quản lý trực tiếp", createdAt: ago(5, "hour") },
	{ id: "p5", type: "payment", title: "Thanh toán hóa đơn hosting quý 4", requesterId: "u-quan", requesterName: "Đỗ Quân", stepName: "Giám đốc duyệt", createdAt: ago(2, "hour") },
];

export const MOCK_MY_REQUESTS: MyRequest[] = [
	{ id: "r1", type: "trip", title: "Công tác Hà Nội hội thảo DevOps", submittedAt: ago(3, "day"), status: RequestStatus.Pending, steps: [{ name: "Quản lý" }, { name: "Trưởng phòng" }, { name: "Giám đốc" }], currentStep: 2, note: "Đang chờ Giám đốc" },
	{ id: "r2", type: "purchase", title: "Mua license JetBrains cho team", submittedAt: ago(2, "day"), status: RequestStatus.Pending, steps: [{ name: "Trưởng phòng" }, { name: "Kế toán" }, { name: "Giám đốc" }], currentStep: 1, note: "Đang chờ Kế toán" },
	{ id: "r3", type: "leave", title: "Nghỉ phép 20/10", submittedAt: ago(3, "hour"), status: RequestStatus.Pending, steps: [{ name: "Quản lý" }, { name: "Nhân sự" }], currentStep: 0, note: "Đang chờ Quản lý" },
	{ id: "r4", type: "advance", title: "Tạm ứng mua thiết bị test", submittedAt: ago(5, "day"), status: RequestStatus.Returned, steps: [{ name: "Trưởng phòng" }, { name: "Kế toán" }], currentStep: 1, note: "Thiếu báo giá, cần bổ sung" },
	{ id: "r5", type: "leave", title: "Nghỉ phép 02/10", submittedAt: ago(13, "day"), status: RequestStatus.Approved, steps: [{ name: "Quản lý" }, { name: "Nhân sự" }], currentStep: 2, note: "Hoàn tất" },
	{ id: "r6", type: "payment", title: "Thanh toán khóa học AWS", submittedAt: ago(21, "day"), status: RequestStatus.Approved, steps: [{ name: "Trưởng phòng" }, { name: "Kế toán" }, { name: "Giám đốc" }], currentStep: 3, note: "Hoàn tất" },
	{ id: "r7", type: "purchase", title: "Mua ghế công thái học", submittedAt: ago(26, "day"), status: RequestStatus.Rejected, steps: [{ name: "Trưởng phòng" }, { name: "Kế toán" }, { name: "Giám đốc" }], currentStep: 2, note: "Từ chối bởi Giám đốc" },
];

export const MOCK_DELEGATION: { outgoing?: Delegation, incoming?: Delegation } = {
	outgoing: { userId: "u-nhung", fullName: "Nguyễn Thị Nhung", scope: "Nghỉ phép, Công tác", fromDate: ago(1, "day"), toDate: dayjs().add(6, "day").toISOString() },
	incoming: { userId: "u-tuan", fullName: "Trần Minh Tuấn", scope: "Tất cả loại yêu cầu", toDate: dayjs().add(9, "day").toISOString() },
};

export const MOCK_STATS = {
	approvedThisMonth: 42,
	approvedLastMonth: 34,
	approvalRate: 89,
	rejectedThisMonth: 5,
	returnedThisMonth: 3,
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
