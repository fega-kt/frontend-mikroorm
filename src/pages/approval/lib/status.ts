import { ApprovalRequestStatus, ApprovalTaskStatus } from "#src/api/approval-request/types";

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
