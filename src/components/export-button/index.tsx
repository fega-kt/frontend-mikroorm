import type { ExportColumnRequest, ExportResource } from "#src/api/export";
import type { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import { EXPORT_BACKGROUND_THRESHOLD, exportService } from "#src/api/export";
import { useAccess } from "#src/hooks/use-access";
import { exportHistoryPath } from "#src/router/extra-info";
import { formatNumber } from "#src/utils/format-number";
import { CheckCircleFilled, FileExcelOutlined } from "@ant-design/icons";
import { App, Button, Checkbox, Modal, theme, Tooltip, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toExportLanguage } from "./columns";

/** Điều kiện của lần tải danh sách gần nhất: đúng thứ bảng đã gửi lên API (đã gồm bộ lọc ngầm như nhóm trạng thái) */
export interface ExportQuery {
	filter: Record<string, unknown>
	/** Tổng số dòng của lần tải đó — bằng 0 thì khỏi gọi backend; từ ngưỡng trở lên thì hỏi gửi email vì sẽ chạy nền */
	total?: number
}

interface ExportButtonProps {
	resource: ExportResource
	/** Cần có tất cả các quyền này mới thấy nút */
	permissions: PermissionType[]
	/** Lấy điều kiện lần tải gần nhất; chưa tải xong thì trả undefined */
	getQuery: () => ExportQuery | undefined
	/** Cột đang hiển thị; bỏ trống = mọi cột */
	getColumns?: () => ExportColumnRequest[]
}

/**
 * Nút "Xuất Excel" của các màn danh sách: xuất đúng bộ lọc và cột đang xem, server dựng file.
 * Ít dòng thì trình duyệt tải ngay; nhiều dòng thì chạy nền — hỏi trước có gửi email không, rồi báo qua thông báo khi xong.
 */
export function ExportButton({ resource, permissions, getQuery, getColumns }: ExportButtonProps) {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const { canAccess } = useAccess();
	const { token } = theme.useToken();
	// Trong component dùng hook của App (đúng theme / ngôn ngữ), không cần window.$message / window.$modal
	const { message, modal } = App.useApp();
	const [loading, setLoading] = useState(false);
	// Hộp hỏi gửi email của lượt xuất nền: lưu điều kiện đã chốt lúc bấm để không đổi nếu người dùng lọc tiếp
	const [pending, setPending] = useState<{ query: ExportQuery, columns: ExportColumnRequest[] | undefined } | null>(null);
	const [sendEmail, setSendEmail] = useState(false);

	if (!permissions.every(permission => canAccess(permission)))
		return null;

	const run = async (query: ExportQuery, columns: ExportColumnRequest[] | undefined, email: boolean) => {
		setLoading(true);
		try {
			const result = await exportService.start(resource, {
				filter: query.filter,
				columns,
				lang: toExportLanguage(i18n.language),
				sendEmail: email,
			});
			// Số dòng theo định dạng của ngôn ngữ đang dùng (78.005), không dùng `count` vì i18next hiểu đó là số nhiều
			const rows = formatNumber(result.count, i18n.language);
			if (result.mode === "download") {
				message.success(t("common.exportStarted", { rows }));
			}
			else {
				// Chỉ một thông báo: hộp thoại có sẵn nút sang trang lịch sử
				modal.confirm({
					icon: <CheckCircleFilled style={{ color: token.colorSuccess }} />,
					title: t("export.history.title"),
					content: t("export.queued", { rows }),
					okText: t("export.viewHistory"),
					cancelText: t("common.close"),
					onOk: () => navigate(exportHistoryPath),
				});
			}
		}
		catch {
			// lỗi đã được interceptor hiển thị
		}
		finally {
			setLoading(false);
		}
	};

	const handleClick = () => {
		const query = getQuery();
		if (!query)
			return;
		if (query.total === 0) {
			message.warning(t("common.exportEmpty"));
			return;
		}
		const columns = getColumns?.();
		if ((query.total ?? 0) >= EXPORT_BACKGROUND_THRESHOLD) {
			setSendEmail(false);
			setPending({ query, columns });
			return;
		}
		void run(query, columns, false);
	};

	return (
		<>
			{/* Chỉ có biểu tượng, cùng kiểu với nhóm công cụ của bảng (làm mới, mật độ, cột, toàn màn hình); chữ hiện khi rê chuột */}
			<Tooltip title={t("common.exportExcel")}>
				<Button
					type="text"
					shape="circle"
					aria-label={t("common.exportExcel")}
					loading={loading}
					icon={<FileExcelOutlined style={{ color: token.colorSuccess, fontSize: 18 }} />}
					onClick={handleClick}
				/>
			</Tooltip>
			<Modal
				open={!!pending}
				title={t("export.dialog.title")}
				okText={t("export.dialog.confirm")}
				cancelText={t("common.cancel")}
				onCancel={() => setPending(null)}
				onOk={() => {
					const current = pending;
					setPending(null);
					if (current)
						void run(current.query, current.columns, sendEmail);
				}}
			>
				<Typography.Paragraph>
					{t("export.dialog.message", { rows: formatNumber(pending?.query.total, i18n.language) })}
				</Typography.Paragraph>
				<Checkbox checked={sendEmail} onChange={event => setSendEmail(event.target.checked)}>
					{t("export.dialog.sendEmail")}
				</Checkbox>
			</Modal>
		</>
	);
}
