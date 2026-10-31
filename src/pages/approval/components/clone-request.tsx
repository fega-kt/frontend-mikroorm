import type { ApprovalRequestDetail } from "#src/api/approval-request";
import { approvalRequestService } from "#src/api/approval-request";
import { approvalRequestPath } from "#src/router/extra-info";
import { Checkbox, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

/**
 * Nhân bản tờ trình thành bản nháp mới: hỏi lại (kèm lựa chọn sao chép tài liệu + vị trí ký, mặc định có;
 * phiếu không có tệp thì không hỏi), rồi sang bản nháp mới (nháp mở thẳng ở chế độ sửa).
 * Nhân bản lấy dữ liệu đã lưu — gọi từ màn sửa thì truyền unsaved để nhắc thay đổi chưa lưu không được sao chép.
 */
export function useCloneRequest() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const clone = async (id: string, files: boolean) => {
		try {
			const result = await approvalRequestService.fetchClone(id, files);
			window.$message?.success(t("approval.messages.cloned"));
			// Biểu mẫu đã đổi so với phiếu gốc: nhắc kiểm tra lại các trường
			if (result.formChanged)
				window.$message?.warning(t("approval.messages.cloneFormChanged"), 8);
			navigate(approvalRequestPath.detail(result.id));
		}
		catch {
			// lỗi đã được interceptor hiển thị
		}
	};

	return (detail: ApprovalRequestDetail, options: { unsaved?: boolean } = {}) => {
		const hasFiles = detail.documents.length + detail.attachments.length > 0;
		let withFiles = hasFiles;
		window.$modal?.confirm({
			title: t("approval.messages.confirmClone"),
			content: (hasFiles || options.unsaved) && (
				<div className="mt-2 flex flex-col gap-2">
					{options.unsaved && <Typography.Text type="secondary">{t("approval.messages.cloneUnsavedNote")}</Typography.Text>}
					{hasFiles && (
						<Checkbox defaultChecked onChange={(e) => { withFiles = e.target.checked; }}>
							{t("approval.messages.cloneWithFiles")}
						</Checkbox>
					)}
				</div>
			),
			okText: t("common.confirm"),
			cancelText: t("common.cancel"),
			onOk: () => clone(detail.id, withFiles),
		});
	};
}
