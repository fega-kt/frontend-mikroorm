import type { ModalProps } from "antd";
import { Button, Modal } from "antd";
import { useTranslation } from "react-i18next";

export interface FormModalProps extends Omit<ModalProps, "onOk" | "okText" | "confirmLoading"> {
	/** Đang lưu: khoá nút Lưu và hiện loading */
	saving?: boolean
	onSave?: () => void
	/** Bỏ nút Lưu (chế độ chỉ xem) */
	readOnly?: boolean
}

/**
 * Modal cho form chi tiết: header và footer cố định, chỉ phần thân cuộn (một thanh cuộn duy nhất).
 * Chiều cao theo viewport nên không phải ước lượng chiều cao header/footer.
 * Mặc định footer là Hủy/Lưu; truyền `footer` để thay bằng nút riêng (vd: Đóng/Khôi phục).
 * Cột phụ cần dính theo màn hình thì dùng `sticky top-0` trong thân modal.
 */
export function FormModal({ saving, onSave, readOnly, onCancel, children, styles, ...rest }: FormModalProps) {
	const { t } = useTranslation();
	const userStyles = typeof styles === "function" ? undefined : styles;

	return (
		<Modal
			destroyOnHidden
			style={{ top: 24 }}
			onCancel={onCancel}
			footer={[
				<Button key="cancel" onClick={onCancel}>{t("common.cancel")}</Button>,
				!readOnly && <Button key="save" type="primary" loading={saving} onClick={onSave}>{t("common.save")}</Button>,
			]}
			{...rest}
			styles={{
				...userStyles,
				container: { display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 48px)", ...userStyles?.container },
				body: { flex: 1, minHeight: 0, overflowY: "auto", ...userStyles?.body },
			}}
		>
			{children}
		</Modal>
	);
}
