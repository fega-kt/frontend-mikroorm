import type { ApprovalActionType } from "#src/api/approval-task";
import { Form, Input, Modal } from "antd";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

export type CommentAction = ApprovalActionType | "cancel";

export interface ActionModalRef {
	/** Mở hộp nhập ý kiến; trả về ý kiến khi bấm OK, undefined khi hủy */
	open: (action: CommentAction, options?: { requireComment?: boolean }) => Promise<{ comment?: string } | undefined>
}

const TITLE_KEY: Record<CommentAction, string> = {
	approve: "approval.detail.approveTitle",
	reject: "approval.detail.rejectTitle",
	return: "approval.detail.returnTitle",
	cancel: "approval.detail.cancelTitle",
};

const PLACEHOLDER_KEY: Record<CommentAction, string> = {
	approve: "approval.detail.commentPlaceholder",
	reject: "approval.detail.rejectPlaceholder",
	return: "approval.detail.returnPlaceholder",
	cancel: "approval.detail.cancelPlaceholder",
};

let resolver: ((value: { comment?: string } | undefined) => void) | undefined;

/** Hộp nhập ý kiến cho duyệt / từ chối / trả lại / hủy */
export function ActionModal({ ref }: { ref: React.Ref<ActionModalRef> }) {
	const { t } = useTranslation();
	const [form] = Form.useForm<{ comment?: string }>();
	const [state, setState] = useState<{ action: CommentAction, requireComment: boolean } | null>(null);

	useImperativeHandle(ref, () => ({
		open: (action, options) => {
			form.resetFields();
			setState({ action, requireComment: options?.requireComment ?? false });
			return new Promise((resolve) => {
				resolver = resolve;
			});
		},
	}));

	const close = (value?: { comment?: string }) => {
		setState(null);
		resolver?.(value);
		resolver = undefined;
	};

	const requiredMessage = state?.action === "return" ? t("approval.messages.returnReasonRequired") : t("approval.messages.rejectReasonRequired");

	return (
		<Modal
			open={!!state}
			title={state ? t(TITLE_KEY[state.action]) : undefined}
			okText={state ? t(state.action === "cancel" ? "approval.actions.cancel" : `approval.actions.${state.action}`) : undefined}
			okButtonProps={{ danger: state?.action === "reject" || state?.action === "cancel" }}
			cancelText={t("common.cancel")}
			destroyOnHidden
			onCancel={() => close()}
			onOk={async () => {
				const values = await form.validateFields();
				close({ comment: values.comment?.trim() || undefined });
			}}
		>
			<Form form={form} layout="vertical" preserve={false}>
				<Form.Item
					name="comment"
					label={t("approval.fields.comment")}
					rules={state?.requireComment ? [{ required: true, whitespace: true, message: requiredMessage }] : undefined}
				>
					<Input.TextArea rows={4} maxLength={2000} showCount autoFocus placeholder={state ? t(PLACEHOLDER_KEY[state.action]) : undefined} />
				</Form.Item>
			</Form>
		</Modal>
	);
}
