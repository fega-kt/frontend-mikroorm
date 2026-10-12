import type { ApprovalNode, NotifyNode, ParallelNode, StepOptions, WorkflowNode } from "#src/api/approval-workflow/types";
import type { ApproverFormItem } from "./approver-form";
import {
	ApproverType,
	DEFAULT_STEP_OPTIONS,
	NotifyChannel,
	OverdueAction,
	ParallelMode,
} from "#src/api/approval-workflow/types";
import { Checkbox, Form, Input, InputNumber, Radio, Select, Space, Switch, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useDesigner } from "../store/designer.store";
import { fromApproverForm, fromApproverFormItem, toApproverForm, useApproverTypeOptions } from "./approver-form";
import { ApproverListField } from "./ApproverListField";
import { PrincipalSelect } from "./PrincipalSelect";
import { UserPicker } from "./UserPicker";

interface PanelProps<T extends WorkflowNode> {
	node: T
	disabled: boolean
}

const OPTION_KEYS: (keyof StepOptions)[] = ["allowDelegation", "skipIfRequester", "skipIfNoApprover", "requireRejectReason", "allowReturn"];

/** Tên bước — dùng chung */
function NameField() {
	const { t } = useTranslation();
	return (
		<Form.Item name="name" label={t("workflowDesigner.inspector.name")}>
			<Input allowClear maxLength={120} />
		</Form.Item>
	);
}

/** Hạn xử lý + khi quá hạn + 4 tùy chọn của bước chờ duyệt */
function SlaFields() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	return (
		<>
			<div className="grid grid-cols-2 gap-3">
				<Form.Item name="slaHours" label={t("workflowDesigner.inspector.sla")}>
					<InputNumber min={1} max={24 * 90} precision={0} className="w-full" suffix={t("workflowDesigner.inspector.hours")} />
				</Form.Item>
				<Form.Item name="onOverdue" label={t("workflowDesigner.inspector.onOverdue")}>
					<Select
						popupMatchSelectWidth={false}
						options={[OverdueAction.RemindThenEscalate, OverdueAction.Remind, OverdueAction.AutoApprove].map(v => ({
							value: v,
							label: t(`workflowDesigner.overdue.${v}`),
						}))}
					/>
				</Form.Item>
			</div>
			<Typography.Text strong className="mb-2 block text-[13px]">{t("workflowDesigner.inspector.options")}</Typography.Text>
			<div className="flex flex-col">
				{OPTION_KEYS.map(key => (
					<div key={key} className="flex items-center justify-between gap-3 py-1.5" style={{ borderBottom: `1px solid ${token.colorSplit}` }}>
						<span className="text-[13px]">{t(`workflowDesigner.inspector.opt.${key}`)}</span>
						<Form.Item name={["options", key]} valuePropName="checked" noStyle>
							<Switch size="small" />
						</Form.Item>
					</div>
				))}
			</div>
		</>
	);
}

function slaValues(node: ApprovalNode | ParallelNode) {
	return {
		slaHours: node.slaHours,
		onOverdue: node.onOverdue,
		options: { ...DEFAULT_STEP_OPTIONS, ...node.options },
	};
}

interface SlaFormValues {
	slaHours?: number | null
	onOverdue?: OverdueAction
	options?: Partial<StepOptions>
}

function applySla<T extends ApprovalNode | ParallelNode>(node: T, v: SlaFormValues): T {
	return {
		...node,
		slaHours: v.slaHours ?? undefined,
		onOverdue: v.onOverdue ?? node.onOverdue,
		options: { ...node.options, ...v.options },
	};
}

const trimName = (name?: string) => (name?.trim() ? name : undefined);

export function ApprovalPanel({ node, disabled }: PanelProps<ApprovalNode>) {
	const { t } = useTranslation();
	const updateNode = useDesigner(s => s.updateNode);
	const [form] = Form.useForm();
	const approverType = Form.useWatch("approverType", form) as ApproverType | undefined;
	const typeOptions = useApproverTypeOptions(node.approver?.type === ApproverType.SpecificUser);
	const initialApprover = node.approver ? toApproverForm(node.approver) : {};

	return (
		<Form
			form={form}
			layout="vertical"
			disabled={disabled}
			initialValues={{
				name: node.name,
				approverType: initialApprover.type,
				userId: initialApprover.userId,
				principalId: initialApprover.principalId,
				...slaValues(node),
			}}
			onValuesChange={(_, all: SlaFormValues & ApproverFormItem & { name?: string, approverType?: ApproverType }) => {
				updateNode(node.id, (n) => {
					const approver = fromApproverFormItem({ type: all.approverType, userId: all.userId, principalId: all.principalId });
					return { ...applySla(n as ApprovalNode, all), name: trimName(all.name), approver } as ApprovalNode;
				});
			}}
		>
			<NameField />
			<Form.Item name="approverType" label={t("workflowDesigner.inspector.approver")} className={approverType === ApproverType.SpecificUser || approverType === ApproverType.Principal ? "mb-2" : undefined}>
				<Radio.Group>
					<Space direction="vertical" size={6}>
						{typeOptions.map(o => <Radio key={o.value} value={o.value}>{o.label}</Radio>)}
					</Space>
				</Radio.Group>
			</Form.Item>
			{approverType === ApproverType.Principal && (
				<Form.Item name="principalId" extra={t("workflowDesigner.inspector.principalHint")}>
					<PrincipalSelect disabled={disabled} placeholder={t("workflowDesigner.inspector.selectPrincipal")} />
				</Form.Item>
			)}
			{approverType === ApproverType.SpecificUser && (
				<Form.Item name="userId">
					<UserPicker disabled={disabled} placeholder={t("workflowDesigner.inspector.selectUser")} />
				</Form.Item>
			)}
			<SlaFields />
		</Form>
	);
}

export function ParallelPanel({ node, disabled }: PanelProps<ParallelNode>) {
	const { t } = useTranslation();
	const updateNode = useDesigner(s => s.updateNode);

	return (
		<Form
			layout="vertical"
			disabled={disabled}
			initialValues={{
				name: node.name,
				mode: node.mode,
				approvers: node.approvers.map(toApproverForm),
				...slaValues(node),
			}}
			onValuesChange={(_, all: SlaFormValues & { name?: string, mode?: ParallelMode, approvers?: ApproverFormItem[] }) => {
				updateNode(node.id, n => ({
					...applySla(n as ParallelNode, all),
					name: trimName(all.name),
					mode: all.mode ?? ParallelMode.All,
					approvers: fromApproverForm(all.approvers),
				}));
			}}
		>
			<NameField />
			<Form.Item name="mode" label={t("workflowDesigner.inspector.mode")}>
				<Radio.Group>
					<Space direction="vertical" size={6}>
						{[ParallelMode.All, ParallelMode.Any].map(m => (
							<Radio key={m} value={m}>
								<span>{t(`workflowDesigner.parallelMode.${m}`)}</span>
								<Typography.Text type="secondary" className="ml-1.5 text-xs">
									{t(`workflowDesigner.parallelModeDesc.${m}`)}
								</Typography.Text>
							</Radio>
						))}
					</Space>
				</Radio.Group>
			</Form.Item>
			<Form.Item label={t("workflowDesigner.inspector.approvers")} required>
				<ApproverListField name="approvers" addText={t("workflowDesigner.actions.addApprover")} disabled={disabled} />
			</Form.Item>
			<SlaFields />
		</Form>
	);
}

export function NotifyPanel({ node, disabled }: PanelProps<NotifyNode>) {
	const { t } = useTranslation();
	const updateNode = useDesigner(s => s.updateNode);

	return (
		<Form
			layout="vertical"
			disabled={disabled}
			initialValues={{
				name: node.name,
				channels: node.channels,
				recipients: node.recipients.map(toApproverForm),
				message: node.message,
			}}
			onValuesChange={(_, all: { name?: string, channels?: NotifyChannel[], recipients?: ApproverFormItem[], message?: string }) => {
				updateNode(node.id, n => ({
					...(n as NotifyNode),
					name: trimName(all.name),
					channels: all.channels ?? [],
					recipients: fromApproverForm(all.recipients),
					message: all.message?.trim() ? all.message : undefined,
				}));
			}}
		>
			<NameField />
			<Form.Item name="channels" label={t("workflowDesigner.inspector.channels")}>
				<Checkbox.Group
					options={[NotifyChannel.InApp, NotifyChannel.Email].map(c => ({ value: c, label: t(`workflowDesigner.channels.${c}`) }))}
				/>
			</Form.Item>
			<Form.Item label={t("workflowDesigner.inspector.recipients")} extra={t("workflowDesigner.inspector.recipientsHint")}>
				<ApproverListField name="recipients" addText={t("workflowDesigner.actions.addRecipient")} disabled={disabled} />
			</Form.Item>
			<Form.Item name="message" label={t("workflowDesigner.inspector.message")}>
				<Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} maxLength={1000} showCount />
			</Form.Item>
		</Form>
	);
}

/** Bắt đầu / Kết thúc: chỉ có tên */
export function NamePanel({ node, disabled, hint }: PanelProps<WorkflowNode> & { hint?: string }) {
	const updateNode = useDesigner(s => s.updateNode);
	return (
		<Form
			layout="vertical"
			disabled={disabled}
			initialValues={{ name: node.name }}
			onValuesChange={(_, all: { name?: string }) => updateNode(node.id, n => ({ ...n, name: trimName(all.name) }))}
		>
			<NameField />
			{hint && <Typography.Paragraph type="secondary" className="text-xs">{hint}</Typography.Paragraph>}
		</Form>
	);
}
