import { ApprovalPriority, ApprovalRequestStatus, ApprovalTaskStatus } from "#src/api/approval-request/types";

export const REQUEST_STATUS_COLOR: Record<ApprovalRequestStatus, string> = {
	[ApprovalRequestStatus.Draft]: "default",
	[ApprovalRequestStatus.Pending]: "processing",
	[ApprovalRequestStatus.Approved]: "success",
	[ApprovalRequestStatus.Rejected]: "error",
	[ApprovalRequestStatus.Returned]: "warning",
	[ApprovalRequestStatus.Cancelled]: "default",
};

export const TASK_STATUS_COLOR: Record<ApprovalTaskStatus, string> = {
	[ApprovalTaskStatus.Pending]: "processing",
	[ApprovalTaskStatus.Approved]: "success",
	[ApprovalTaskStatus.Rejected]: "error",
	[ApprovalTaskStatus.Returned]: "warning",
	[ApprovalTaskStatus.Skipped]: "default",
};

/** Màu chấm + tag theo độ ưu tiên (thấp → khẩn) */
export const PRIORITY_META: Record<ApprovalPriority, { dot: string, tag: string }> = {
	[ApprovalPriority.Low]: { dot: "#9ca3af", tag: "default" },
	[ApprovalPriority.Normal]: { dot: "#1458d6", tag: "blue" },
	[ApprovalPriority.High]: { dot: "#d97706", tag: "orange" },
	[ApprovalPriority.Urgent]: { dot: "#c62828", tag: "red" },
};

export const PRIORITIES = [ApprovalPriority.Low, ApprovalPriority.Normal, ApprovalPriority.High, ApprovalPriority.Urgent];
