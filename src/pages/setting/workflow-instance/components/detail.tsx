import type { RequestTypeEntity } from "#src/api/setting/request-type";
import type { WorkflowSettingEntity } from "#src/api/setting/workflow-setting";
import type { WorkflowInstanceEntity } from "#src/api/workflow-instance";
import { requestTypeService } from "#src/api/setting/request-type";
import { workflowSettingService, WorkflowSettingStatus } from "#src/api/setting/workflow-setting";
import { workflowInstanceService } from "#src/api/workflow-instance";
import { ProFormApiSelect } from "#src/components/api-select";
import { ModalForm, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Form } from "antd";
import * as React from "react";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

export interface DetailRef {
	show: () => Promise<{ isChange: boolean } | undefined>
}

interface DetailProps {
	ref: React.Ref<DetailRef>
}

let guard: (res?: { isChange: boolean }) => void;

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<WorkflowInstanceEntity>();
	const [open, setOpen] = useState(false);

	useImperativeHandle(ref, () => ({
		show: async () => {
			form.resetFields();
			setOpen(true);
			return new Promise<{ isChange: boolean } | undefined>((resolve) => {
				guard = resolve;
			});
		},
	}));

	const onFinish = async (values: WorkflowInstanceEntity) => {
		await workflowInstanceService.fetchAddWorkflowInstance(values);
		window.$message?.success(t("common.addSuccess"));
		guard?.({ isChange: true });
		return true;
	};

	const onClose = () => {
		setOpen(false);
		form.resetFields();
		guard?.();
	};

	return (
		<ModalForm<WorkflowInstanceEntity>
			title={t("setting.workflowInstance.addWorkflowInstance")}
			open={open}
			onOpenChange={(visible) => {
				if (!visible)
					onClose();
			}}
			layout="vertical"
			form={form}
			autoFocusFirstInput
			modalProps={{ destroyOnHidden: true, width: 520 }}
			onFinish={onFinish}
		>
			<ProFormApiSelect<WorkflowSettingEntity>
				name="workflowSetting"
				label={t("setting.workflowInstance.workflowSetting")}
				rules={[{ required: true }]}
				fetcher={async (keyword) => {
					const res = await workflowSettingService.fetchWorkflowSettingList({ limit: 50, search: keyword, status: WorkflowSettingStatus.Published });
					return res.data ?? [];
				}}
				fieldProps={{ placeholder: t("common.pleaseSelect") }}
			/>

			<ProFormApiSelect<RequestTypeEntity>
				name="requestType"
				label={t("setting.workflowInstance.requestType")}
				fetcher={async (keyword) => {
					const res = await requestTypeService.fetchRequestTypeList({ limit: 50, keyword });
					return res.data ?? [];
				}}
				fieldProps={{ placeholder: t("common.pleaseSelect") }}
			/>

			<ProFormText
				name="title"
				label={t("setting.workflowInstance.title")}
				placeholder={t("common.pleaseInput")}
				rules={[{ required: true }, { max: 255 }]}
			/>

			<ProFormTextArea
				name="content"
				label={t("setting.workflowInstance.content")}
				placeholder={t("common.pleaseInput")}
				fieldProps={{ rows: 4 }}
			/>
		</ModalForm>
	);
}
