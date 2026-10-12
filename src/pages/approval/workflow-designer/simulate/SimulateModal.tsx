import type { SimulateResult, WorkflowDefinition } from "#src/api/approval-workflow/types";
import type { FormField } from "#src/api/setting/request-type/types";
import type { Dayjs } from "dayjs";
import { approvalWorkflowService } from "#src/api/approval-workflow";
import { FormFieldType } from "#src/api/setting/request-type/types";
import { PlayCircleOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Alert, Button, DatePicker, Divider, Drawer, Empty, Form, Input, InputNumber, Select, Switch, Tag, Timeline, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { UserPicker } from "../inspector/UserPicker";
import { useDesigner } from "../store/designer.store";

interface SimulateModalProps {
	open: boolean
	onClose: () => void
	workflowId: string
	fields: FormField[]
	/** Lấy định nghĩa hiện tại (kể cả chưa lưu) */
	getDefinition: () => WorkflowDefinition
}

/** Chuyển giá trị form (dayjs…) sang payload JSON gửi backend */
function toPayload(fields: FormField[], values: Record<string, unknown>): Record<string, unknown> {
	const payload: Record<string, unknown> = {};
	for (const f of fields) {
		const v = values[f.key];
		if (v === undefined || v === null || v === "")
			continue;
		if (f.type === FormFieldType.Date)
			payload[f.key] = (v as Dayjs).format("YYYY-MM-DD");
		else if (f.type === FormFieldType.DateRange)
			payload[f.key] = (v as [Dayjs, Dayjs]).map(d => d.format("YYYY-MM-DD"));
		else
			payload[f.key] = v;
	}
	return payload;
}

function FieldInput({ field }: { field: FormField }) {
	switch (field.type) {
		case FormFieldType.Textarea:
			return <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} placeholder={field.placeholder} />;
		case FormFieldType.Number:
			return <InputNumber className="w-full" min={field.min} max={field.max} placeholder={field.placeholder} />;
		case FormFieldType.Money:
			return (
				<InputNumber
					className="w-full"
					min={field.min ?? 0}
					max={field.max}
					formatter={v => `${v}`.replace(/\B(?=(?:\d{3})+(?!\d))/g, ",")}
					parser={v => Number((v ?? "").replace(/,/g, ""))}
				/>
			);
		case FormFieldType.Date:
			return <DatePicker className="w-full" format="DD/MM/YYYY" />;
		case FormFieldType.DateRange:
			return <DatePicker.RangePicker className="w-full" format="DD/MM/YYYY" />;
		case FormFieldType.Select:
			return <Select options={field.options ?? []} allowClear placeholder={field.placeholder} />;
		case FormFieldType.Switch:
			return <Switch />;
		default:
			return <Input placeholder={field.placeholder} />;
	}
}

/**
 * Chạy thử: nhập dữ liệu đơn mẫu → backend mô phỏng trên định nghĩa đang sửa.
 * Dùng Drawer không mask để vẫn nhìn thấy đường đi được tô trên canvas.
 */
export function SimulateModal({ open, onClose, workflowId, fields, getDefinition }: SimulateModalProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm();
	const setSimulationPath = useDesigner(s => s.setSimulationPath);

	const { data: result, loading, run, mutate } = useRequest(
		async (values: Record<string, unknown>): Promise<SimulateResult> => {
			const { __requester, ...rest } = values;
			return approvalWorkflowService.fetchSimulate(workflowId, {
				definition: getDefinition(),
				payload: toPayload(fields, rest),
				requesterId: (__requester as string | undefined) || undefined,
			});
		},
		{ manual: true, onSuccess: res => setSimulationPath(res.path) },
	);

	const close = () => {
		setSimulationPath(null);
		mutate(undefined);
		onClose();
	};

	const initialValues = Object.fromEntries(
		fields.filter(f => f.type === FormFieldType.Switch).map(f => [f.key, false]),
	);

	return (
		<Drawer
			open={open}
			onClose={close}
			mask={false}
			width={380}
			title={t("workflowDesigner.simulate.title")}
			destroyOnHidden
			footer={(
				<Button type="primary" block icon={<PlayCircleOutlined />} loading={loading} onClick={() => form.submit()}>
					{t("workflowDesigner.simulate.run")}
				</Button>
			)}
		>
			<Typography.Paragraph type="secondary" className="text-xs">{t("workflowDesigner.simulate.usesUnsaved")}</Typography.Paragraph>
			<Form form={form} layout="vertical" size="small" initialValues={initialValues} onFinish={run}>
				<Form.Item name="__requester" label={t("workflowDesigner.simulate.requester")} extra={t("workflowDesigner.simulate.requesterHint")}>
					<UserPicker />
				</Form.Item>
				<Divider className="my-3" plain>{t("workflowDesigner.simulate.payload")}</Divider>
				{!fields.length && <Alert type="info" showIcon className="mb-3" message={t("workflowDesigner.simulate.noFields")} />}
				{fields.map(f => (
					<Form.Item
						key={f.key}
						name={f.key}
						label={f.label}
						valuePropName={f.type === FormFieldType.Switch ? "checked" : "value"}
					>
						<FieldInput field={f} />
					</Form.Item>
				))}
			</Form>

			{result && (
				<>
					<Divider className="my-3" plain>{t("workflowDesigner.simulate.result")}</Divider>
					<Alert
						type={result.outcome === "approved" ? "success" : "error"}
						showIcon
						className="mb-4"
						message={result.outcome === "approved" ? t("workflowDesigner.simulate.approved") : t("workflowDesigner.simulate.blocked")}
					/>
					{!result.steps.length
						? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
						: (
							<Timeline
								items={result.steps.map(step => ({
									key: step.nodeId,
									color: step.error ? "red" : step.skipped ? "gray" : "blue",
									children: (
										<div className="flex flex-col gap-1">
											<div className="flex flex-wrap items-center gap-1.5">
												<Typography.Text strong className="text-[13px]">
													{step.name || t(`workflowDesigner.nodeTypes.${step.type}`, { defaultValue: step.type })}
												</Typography.Text>
												{step.skipped && <Tag className="m-0">{t("workflowDesigner.simulate.skipped")}</Tag>}
											</div>
											{step.approvers.length > 0 && (
												<Typography.Text type="secondary" className="text-xs">
													{step.approvers.map(a => a.fullName).join(", ")}
												</Typography.Text>
											)}
											{step.error && (
												<Typography.Text type="danger" className="text-xs">
													{t(`workflowDesigner.simulate.stepErrors.${step.error}`, { defaultValue: t("workflowDesigner.simulate.noApprover") })}
												</Typography.Text>
											)}
										</div>
									),
								}))}
							/>
						)}
				</>
			)}
		</Drawer>
	);
}
