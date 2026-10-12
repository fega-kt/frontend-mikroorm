import type { ApprovalWorkflowDetail } from "#src/api/approval-workflow/types";
import { approvalWorkflowService } from "#src/api/approval-workflow";
import { DepartmentPicker } from "#src/components/department-picker";
import { Button, Form, InputNumber, Switch, theme, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ApplyToCardProps {
	detail: ApprovalWorkflowDetail
	disabled: boolean
	onSaved: () => void
}

interface ApplyToValues {
	department?: { id: string, name: string } | null
	priority?: number | null
	isActive?: boolean
}

/** "Áp dụng cho": loại đơn (chỉ đọc), phòng ban, ưu tiên, kích hoạt — lưu bằng fetchUpdate */
export function ApplyToCard({ detail, disabled, onSaved }: ApplyToCardProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm<ApplyToValues>();
	const [changed, setChanged] = useState(false);
	const [saving, setSaving] = useState(false);

	const initialValues: ApplyToValues = {
		department: detail.department,
		priority: detail.priority,
		isActive: detail.isActive,
	};

	const onFinish = async (values: ApplyToValues) => {
		setSaving(true);
		try {
			await approvalWorkflowService.fetchUpdate(detail.id, {
				department: values.department?.id ?? null,
				priority: values.priority ?? 0,
				isActive: !!values.isActive,
			});
			window.$message?.success(t("workflowDesigner.messages.settingsSaved"));
			setChanged(false);
			onSaved();
		}
		finally {
			setSaving(false);
		}
	};

	return (
		<section>
			<Typography.Text strong className="mb-2 block text-[13px]">{t("workflowDesigner.applyTo.title")}</Typography.Text>
			<Form
				// Khởi tạo lại form khi dữ liệu máy chủ thay đổi
				key={`${detail.id}-${detail.updatedAt}`}
				form={form}
				layout="vertical"
				size="small"
				disabled={disabled}
				initialValues={initialValues}
				onValuesChange={() => setChanged(true)}
				onFinish={onFinish}
				className="rounded-lg p-3"
				style={{ border: `1px solid ${token.colorBorderSecondary}`, background: token.colorBgContainer }}
			>
				<Form.Item label={t("workflowDesigner.applyTo.requestType")} className="mb-2.5">
					<Typography.Text strong>{detail.requestType?.name}</Typography.Text>
				</Form.Item>
				<Form.Item name="department" label={t("workflowDesigner.applyTo.department")} className="mb-2.5">
					<DepartmentPicker placeholder={t("workflowDesigner.applyTo.allDepartments")} />
				</Form.Item>
				<Form.Item name="priority" label={t("workflowDesigner.applyTo.priority")} tooltip={t("workflowDesigner.applyTo.priorityHint")} className="mb-2.5">
					<InputNumber min={0} max={1000} precision={0} className="w-full" />
				</Form.Item>
				<div className="flex items-center justify-between">
					<span className="text-[13px]">{t("workflowDesigner.applyTo.active")}</span>
					<Form.Item name="isActive" valuePropName="checked" noStyle>
						<Switch size="small" />
					</Form.Item>
				</div>
				{changed && !disabled && (
					<Button type="primary" htmlType="submit" block loading={saving} className="mt-3">
						{t("workflowDesigner.actions.save")}
					</Button>
				)}
			</Form>
		</section>
	);
}
