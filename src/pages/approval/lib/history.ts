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

/** Nhãn hành động của một dòng lịch sử (một số hành động tách nhãn theo data.reason) */
export function historyLabel(item: ApprovalHistoryItem, t: TFunction) {
	if (isAutoDelegation(item))
		return t("approval.history.delegation");
	// Hệ thống chia lại task nhóm khi người được chia rời nhóm / bị khóa
	if (item.action === ApprovalHistoryAction.Delegate && item.data?.reason === "regroup")
		return t("approval.history.regroup");
	// Duyệt kèm suất mà người bấm là người duy nhất xử lý được (khác tự duyệt do quá hạn)
	if (item.action === ApprovalHistoryAction.AutoApprove && item.data?.reason === "same_approver")
		return t("approval.history.sameApprover");
	return t(`approval.history.${item.action}`);
}

/**
 * Ý kiến hệ thống tự ghi khi xử lý quá hạn: backend lưu nguyên câu tiếng Việt (email dùng nguyên văn) —
 * khớp đúng câu trong approval-engine.service.ts (backend), đổi câu bên đó thì sửa cả ở đây.
 */
const SYSTEM_COMMENTS: Record<string, string> = {
	"Từ chối do quá hạn xử lý": "approval.history.systemComment.overdueReject",
	"Tự động duyệt do quá hạn": "approval.history.systemComment.overdueApprove",
};

/**
 * Ý kiến hiển thị: câu hệ thống tự ghi được dịch theo ngôn ngữ người xem; ý kiến của người giữ nguyên.
 * `bySystem`: không có người thực hiện (dòng lịch sử actor = null, task actedBy = null) — chỉ khi đó mới dịch,
 * để người tự gõ đúng câu đó vẫn thấy nguyên văn.
 */
export function displayComment(comment: string | null | undefined, t: TFunction, bySystem: boolean) {
	if (!comment || !bySystem)
		return comment ?? undefined;
	const key = SYSTEM_COMMENTS[comment.trim()];
	return key ? t(key) : comment;
}

/**
 * Người thực hiện hiển thị: ủy quyền tự động được ghi theo người vừa kích hoạt bước (vd: người gửi lại)
 * nên không phải ai bấm chuyển — coi như hệ thống thực hiện.
 */
export function historyActor(item: ApprovalHistoryItem) {
	return isAutoDelegation(item) ? null : item.actor;
}
