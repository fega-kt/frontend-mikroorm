import type { PrincipalEntity } from "#src/api/system/principal";
import { approvalRequestService } from "#src/api/approval-request";
import { PrincipalPicker } from "#src/components/principal-picker";
import { Alert, Checkbox, Form, Input, Modal } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface FormValues {
	principals?: PrincipalEntity[]
	message?: string
	channels: ("email" | "notification")[]
}

interface ShareModalProps {
	requestId: string
	open: boolean
	onClose: (changed?: boolean) => void
}

/** Hộp chia sẻ tờ trình (chỉ xem) cho người / nhóm, kèm gửi mail và thông báo */
export function ShareModal({ requestId, open, onClose }: ShareModalProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<FormValues>();
	const [saving, setSaving] = useState(false);

	const submit = async () => {
		const values = await form.validateFields();
		setSaving(true);
		try {
			await approvalRequestService.fetchShare(requestId, {
				principals: (values.principals ?? []).map(item => item.id),
				message: values.message?.trim() || undefined,
				sendEmail: values.channels.includes("email"),
				sendNotification: values.channels.includes("notification"),
			});
			window.$message?.success(t("approval.messages.shared"));
			onClose(true);
		}
		catch {
			// lỗi đã được interceptor hiển thị
		}
		finally {
			setSaving(false);
		}
	};

	return (
		<Modal
			open={open}
			title={t("approval.share.title")}
			okText={t("approval.actions.share")}
			cancelText={t("common.cancel")}
			confirmLoading={saving}
			destroyOnHidden
			afterOpenChange={visible => visible || form.resetFields()}
			onCancel={() => onClose()}
			onOk={submit}
		>
			<Form form={form} layout="vertical" preserve={false} initialValues={{ channels: ["email", "notification"] }}>
				<Alert type="info" showIcon className="mb-4" message={t("approval.share.hint")} />
				<Form.Item
					name="principals"
					label={t("approval.share.principals")}
					rules={[{ required: true, type: "array", min: 1 }]}
				>
					<PrincipalPicker
						mode="multiple"
						placeholder={t("approval.share.principalsPlaceholder")}
						disabled={saving}
					/>
				</Form.Item>
				<Form.Item name="message" label={t("approval.share.message")}>
					<Input.TextArea rows={3} maxLength={1000} showCount placeholder={t("approval.share.messagePlaceholder")} />
				</Form.Item>
				<Form.Item name="channels" label={t("approval.share.notify")} className="mb-0">
					<Checkbox.Group
						options={[
							{ value: "email", label: t("approval.share.sendEmail") },
							{ value: "notification", label: t("approval.share.sendNotification") },
						]}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
}
