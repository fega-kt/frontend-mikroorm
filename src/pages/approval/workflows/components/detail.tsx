import type { RequestTypeEntity } from "#src/api/setting/request-type";
import { approvalWorkflowService } from "#src/api/approval-workflow";
import { requestTypeService } from "#src/api/setting/request-type";
import { ProFormApiSelect } from "#src/components/api-select";
import { ProFormDepartmentPicker } from "#src/components/department-picker";
import { ModalForm, ProFormDigit, ProFormSwitch, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Form } from "antd";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

export interface DetailRef {
	/** Mở form tạo/sửa thông tin quy trình; trả về id khi lưu */
	show: (id?: string) => Promise<{ isChange: boolean, id?: string } | undefined>
}

interface FormValues {
	name: string
	description?: string
	requestType?: Pick<RequestTypeEntity, "id" | "name">
	/** DepartmentPicker luôn trả về { id, name } */
	department?: { id: string, name?: string } | null
	priority: number
	isActive: boolean
}

let guard: ((res?: { isChange: boolean, id?: string }) => void) | undefined;

export function Detail({ ref }: { ref: React.Ref<DetailRef> }) {
	const { t } = useTranslation();
	const [form] = Form.useForm<FormValues>();
	const [open, setOpen] = useState(false);
	const [editingId, setEditingId] = useState<string>();

	useImperativeHandle(ref, () => ({
		show: async (id) => {
			form.resetFields();
			setEditingId(id);
			setOpen(true);
			if (id) {
				const detail = await approvalWorkflowService.fetchDetail(id);
				form.setFieldsValue({
					name: detail.name,
					description: detail.description,
					requestType: detail.requestType,
					department: detail.department,
					priority: detail.priority,
					isActive: detail.isActive,
				});
			}
			return new Promise((resolve) => {
				guard = resolve;
			});
		},
	}));

	const close = (res?: { isChange: boolean, id?: string }) => {
		setOpen(false);
		guard?.(res);
		guard = undefined;
	};

	return (
		<ModalForm<FormValues>
			form={form}
			open={open}
			width={560}
			title={t(editingId ? "approval.workflow.edit" : "approval.workflow.add")}
			initialValues={{ priority: 0, isActive: true }}
			modalProps={{ destroyOnHidden: true, onCancel: () => close() }}
			onFinish={async (values) => {
				const payload = {
					name: values.name,
					description: values.description || null,
					requestType: values.requestType!.id,
					department: values.department?.id ?? null,
					priority: values.priority ?? 0,
					isActive: values.isActive,
				};
				const res = editingId
					? await approvalWorkflowService.fetchUpdate(editingId, payload)
					: await approvalWorkflowService.fetchCreate(payload);
				window.$message?.success(t(editingId ? "common.updateSuccess" : "common.addSuccess"));
				close({ isChange: true, id: res.id });
				return true;
			}}
		>
			<ProFormText name="name" label={t("approval.workflow.name")} rules={[{ required: true }]} fieldProps={{ maxLength: 255 }} />
			<ProFormApiSelect<RequestTypeEntity>
				name="requestType"
				label={t("approval.workflow.requestType")}
				rules={[{ required: true }]}
				fetcher={async (keyword) => {
					const res = await requestTypeService.fetchRequestTypeList({ limit: 50, keyword });
					return res.data ?? [];
				}}
				fieldProps={{ placeholder: t("common.pleaseSelect") }}
			/>
			<ProFormDepartmentPicker
				name="department"
				label={t("approval.workflow.department")}
				fieldProps={{ allowClear: true, placeholder: t("approval.workflow.allDepartments") }}
			/>
			<div className="grid grid-cols-2 gap-x-4">
				<ProFormDigit name="priority" label={t("approval.workflow.priority")} tooltip={t("approval.workflow.priorityTip")} min={0} max={1000} fieldProps={{ precision: 0 }} />
				<ProFormSwitch name="isActive" label={t("approval.workflow.isActive")} />
			</div>
			<ProFormTextArea name="description" label={t("approval.workflow.description")} fieldProps={{ maxLength: 1000, rows: 3 }} />
		</ModalForm>
	);
}
