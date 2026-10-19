import { ApprovalRequestStatus } from "#src/api/approval-request";

/** Màn danh sách tờ trình: của tôi hay tất cả (quản trị) */
export enum RequestTableMode {
	Mine = "mine",
	All = "all",
}

/** Nhóm trạng thái của menu "Tờ trình của tôi"; giá trị cũng là đoạn cuối của đường dẫn /approval/my/{scope} */
export enum RequestScope {
	Draft = "draft",
	Pending = "pending",
	Completed = "completed",
	All = "all",
}

/** Các trạng thái thuộc từng nhóm (undefined = toàn bộ) */
export const SCOPE_STATUSES: Record<RequestScope, ApprovalRequestStatus[] | undefined> = {
	[RequestScope.Draft]: [ApprovalRequestStatus.Draft, ApprovalRequestStatus.Returned],
	[RequestScope.Pending]: [ApprovalRequestStatus.Pending],
	[RequestScope.Completed]: [ApprovalRequestStatus.Approved, ApprovalRequestStatus.Rejected, ApprovalRequestStatus.Cancelled],
	[RequestScope.All]: undefined,
};

/** Khóa i18n tiêu đề của từng nhóm */
export const SCOPE_TITLE: Record<RequestScope, string> = {
	[RequestScope.Draft]: "common.menu.approvalMyDraft",
	[RequestScope.Pending]: "common.menu.approvalMyPending",
	[RequestScope.Completed]: "common.menu.approvalMyCompleted",
	[RequestScope.All]: "common.menu.approvalMy",
};
