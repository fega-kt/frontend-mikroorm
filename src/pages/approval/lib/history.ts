import type { ApprovalHistoryItem } from "#src/api/approval-request/types";
import type { TFunction } from "i18next";
import { ApprovalHistoryAction } from "#src/api/approval-request/types";

/**
 * Dòng "delegate" do hệ thống tự giao theo ủy quyền duyệt (data.reason = "delegation"),
 * khác với gán lại người duyệt bằng tay (reason = "reassign") — đồng bộ backend.
 */
export function isAutoDelegation(item: ApprovalHistoryItem) {
	return item.action === ApprovalHistoryAction.Delegate && item.data?.reason === "delegation";
}

/** Nhãn hành động của một dòng lịch sử */
export function historyLabel(item: ApprovalHistoryItem, t: TFunction) {
	return isAutoDelegation(item) ? t("approval.history.delegation") : t(`approval.history.${item.action}`);
}

/**
 * Người thực hiện hiển thị: ủy quyền tự động được ghi theo người vừa kích hoạt bước (vd: người gửi lại)
 * nên không phải ai bấm chuyển — coi như hệ thống thực hiện.
 */
export function historyActor(item: ApprovalHistoryItem) {
	return isAutoDelegation(item) ? null : item.actor;
}
