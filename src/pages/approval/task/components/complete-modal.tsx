import type { CompleteTaskDto } from "#src/api/approval/task";
import { approvalTaskService } from "#src/api/approval/task";
import { ModalForm, ProFormRadio, ProFormTextArea } from "@ant-design/pro-components";
import { Form } from "antd";
import { HTTPError } from "ky";
import * as React from "react";
import { useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface CompleteModalRef {
	show: (taskId: string, defaultDecision?: "APPROVE" | "REJECT") => Promise<{ isChange: boolean } | undefined>
}

interface CompleteModalProps {
	ref: React.Ref<CompleteModalRef>
	onSuccess?: () => void
}

let guard: (res?: { isChange: boolean }) => void;

export function CompleteModal({ ref, onSuccess }: CompleteModalProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<CompleteTaskDto>();
	const [open, setOpen] = useState(false);
	const [taskId, setTaskId] = useState("");
	const [loading, setLoading] = useState(false);

	const title = useMemo(() => t("approval.task.completeTitle"), [t]);

	useImperativeHandle(ref, () => ({
		show: async (id: string, defaultDecision: "APPROVE" | "REJECT" = "APPROVE") => {
			form.resetFields();
			form.setFieldValue("decision", defaultDecision);
			setTaskId(id);
			setOpen(true);
			return new Promise<{ isChange: boolean } | undefined>((resolve) => {
				guard = resolve;
			});
		},
	}));

	const onFinish = async (values: CompleteTaskDto) => {
		setLoading(true);
		try {
			await approvalTaskService.completeTask(taskId, values);
			const isApprove = values.decision === "APPROVE";
			window.$message?.success(isApprove ? t("approval.task.approveSuccess") : t("approval.task.rejectSuccess"));
			guard?.({ isChange: true });
			onSuccess?.();
			return true;
		}
		catch (err) {
			if (err instanceof HTTPError && err.response.status === 409) {
				guard?.();
				setOpen(false);
			}
			return false;
		}
		finally {
			setLoading(false);
		}
	};

	const onClose = () => {
		setOpen(false);
		form.resetFields();
		guard?.();
	};

	return (
		<ModalForm<CompleteTaskDto>
			title={title}
			open={open}
			onOpenChange={(visible) => {
				if (!visible) {
					onClose();
				}
			}}
			layout="vertical"
			form={form}
			loading={loading}
			modalProps={{
				destroyOnHidden: true,
				width: 480,
			}}
			onFinish={onFinish}
		>
			<ProFormRadio.Group
				name="decision"
				label={t("approval.task.decision")}
				rules={[{ required: true }]}
				options={[
					{ label: t("approval.task.decisionApprove"), value: "APPROVE" },
					{ label: t("approval.task.decisionReject"), value: "REJECT" },
				]}
			/>

			<ProFormTextArea
				name="comment"
				label={t("approval.task.comment")}
				placeholder={t("approval.task.commentPlaceholder")}
				fieldProps={{ rows: 3 }}
			/>
		</ModalForm>
	);
}
