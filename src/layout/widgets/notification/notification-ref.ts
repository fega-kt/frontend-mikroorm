import { approvalRequestPath, exportHistoryPath } from "#src/router/extra-info";

/**
 * refType (tên bảng BE) → trang chi tiết của bản ghi `refId`, mở khi bấm vào noti.
 * Noti không có ref (vd: nhắc lâu không đăng nhập) → không chuyển trang, chỉ đánh dấu đã đọc.
 * Thêm bảng vào đây khi có noti trỏ tới bản ghi của bảng đó.
 */
const ROUTE_BY_TABLE: Record<string, (refId: string) => string> = {
	approval_requests: refId => approvalRequestPath.detail(refId),
	// Xuất Excel chạy nền: mở lịch sử xuất để tải file (hoặc xem lý do lỗi)
	export_jobs: () => exportHistoryPath,
};

export function getNotificationRoute(refType?: string | null, refId?: string | null): string | undefined {
	if (!refType || !refId)
		return undefined;
	return ROUTE_BY_TABLE[refType]?.(refId);
}
