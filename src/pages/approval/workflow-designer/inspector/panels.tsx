import type { ApprovalNode, NotifyNode, ParallelNode, StepOptions, WorkflowNode } from "#src/api/approval-workflow/types";
import type { EmailTemplate } from "#src/api/email-template";
import type { ApproverFormItem } from "./approver-form";
import {
	ApproverType,
	DEFAULT_STEP_OPTIONS,
	GroupMode,
	notifiesRequester,
	NotifyChannel,
	OverdueAction,
	ParallelMode,
} from "#src/api/approval-workflow/types";
import { emailTemplateService, NOTIFY_DEFAULT_TEMPLATE } from "#src/api/email-template";
import { Checkbox, Form, Input, InputNumber, Radio, Select, Space, Switch, Tag, theme, Typography } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { approverLabel } from "../canvas/labels";
import { useDesigner } from "../store/designer.store";
import { fromApproverForm, fromApproverFormItem, toApproverForm, useApproverTypeOptions } from "./approver-form";
import { ApproverListField } from "./ApproverListField";
import { DepartmentLeaderFields } from "./DepartmentLeaderFields";
import { PrincipalMultiSelect } from "./PrincipalMultiSelect";
import { PrincipalSelect } from "./PrincipalSelect";
import { StepNotifications } from "./StepNotifications";
import { UserPicker } from "./UserPicker";

interface PanelProps<T extends WorkflowNode> {
	node: T
	disabled: boolean
}

const OPTION_KEYS: (keyof StepOptions)[] = ["allowDelegation", "skipIfRequester", "skipIfNoApprover", "requireRejectReason", "allowReturn", "emailGroup"];

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
						options={[OverdueAction.RemindThenEscalate, OverdueAction.Remind, OverdueAction.AutoApprove, OverdueAction.AutoReject].map(v => ({
							value: v,
							label: t(`workflowDesigner.overdue.${v}`),
						}))}
					/>
				</Form.Item>
			</div>
			{/* Áp dụng khi người duyệt của bước là nhóm */}
			<Form.Item
				name={["options", "groupMode"]}
				label={t("workflowDesigner.inspector.groupMode")}
				tooltip={t("workflowDesigner.inspector.groupModeHint")}
			>
				<Radio.Group
					optionType="button"
					buttonStyle="solid"
					size="small"
					options={Object.values(GroupMode).map(mode => ({ value: mode, label: t(`workflowDesigner.groupMode.${mode}`) }))}
				/>
			</Form.Item>
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
		// Bước cũ chưa có cờ giữ quy tắc cũ (tự bỏ người trình); chỉ bước tạo mới mang false từ DEFAULT_STEP_OPTIONS
		options: { ...DEFAULT_STEP_OPTIONS, autoExcludeRequester: true, ...node.options },
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
		<>
			<Form
				form={form}
				layout="vertical"
				disabled={disabled}
				initialValues={{
					name: node.name,
					approverType: initialApprover.type,
					userId: initialApprover.userId,
					principalId: initialApprover.principalId,
					department: initialApprover.department,
					role: initialApprover.role,
					climbIfEmpty: initialApprover.climbIfEmpty,
					...slaValues(node),
				}}
				onValuesChange={(_, all: SlaFormValues & ApproverFormItem & { name?: string, approverType?: ApproverType }) => {
					updateNode(node.id, (n) => {
						const approver = fromApproverFormItem({
							type: all.approverType,
							userId: all.userId,
							principalId: all.principalId,
							department: all.department,
							role: all.role,
							climbIfEmpty: all.climbIfEmpty,
						});
						return { ...applySla(n as ApprovalNode, all), name: trimName(all.name), approver } as ApprovalNode;
					});
				}}
			>
				<NameField />
				<Form.Item name="approverType" label={t("workflowDesigner.inspector.approver")} className={approverType === ApproverType.SpecificUser || approverType === ApproverType.Principal || approverType === ApproverType.DepartmentLeader ? "mb-2" : undefined}>
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
				{approverType === ApproverType.DepartmentLeader && <DepartmentLeaderFields disabled={disabled} />}
				<SlaFields />
			</Form>
			<StepNotifications node={node} disabled={disabled} />
		</>
	);
}

export function ParallelPanel({ node, disabled }: PanelProps<ParallelNode>) {
	const { t } = useTranslation();
	const updateNode = useDesigner(s => s.updateNode);

	return (
		<>
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
			<StepNotifications node={node} disabled={disabled} />
		</>
	);
}

export function NotifyPanel({ node, disabled }: PanelProps<NotifyNode>) {
	const { t } = useTranslation();
	const updateNode = useDesigner(s => s.updateNode);
	const userNames = useDesigner(s => s.userNames);
	const [form] = Form.useForm();
	const channels = Form.useWatch("channels", form) as NotifyChannel[] | undefined ?? node.channels;
	const [templates, setTemplates] = useState<EmailTemplate[]>([]);
	useEffect(() => {
		emailTemplateService.fetchList().then(setTemplates).catch(() => setTemplates([]));
	}, []);
	const templateOptions = templates
		.filter(tpl => !tpl.system || tpl.code === NOTIFY_DEFAULT_TEMPLATE)
		.map(tpl => ({ value: tpl.code, label: tpl.code === NOTIFY_DEFAULT_TEMPLATE ? t("workflowDesigner.inspector.defaultTemplate", { name: tpl.name }) : tpl.name }));
	// Người nhận cố định chọn ở đây là người dùng / nhóm; cấu hình cũ (trưởng/phó phòng…) được giữ nguyên
	const principalIds = node.recipients.flatMap(a => (a.type === ApproverType.Principal ? [a.principalId] : []));
	const legacy = node.recipients.filter(a => a.type !== ApproverType.Principal);

	return (
		<Form
			form={form}
			layout="vertical"
			disabled={disabled}
			initialValues={{
				name: node.name,
				channels: node.channels,
				emailTemplate: node.emailTemplate ?? NOTIFY_DEFAULT_TEMPLATE,
				targets: [
					...(notifiesRequester(node) ? ["requester"] : []),
					...(node.notifyNextApprovers ? ["nextApprovers"] : []),
				],
				principals: principalIds,
				message: node.message,
			}}
			onValuesChange={(_, all: { name?: string, channels?: NotifyChannel[], emailTemplate?: string, targets?: string[], principals?: string[], message?: string }) => {
				updateNode(node.id, n => ({
					...(n as NotifyNode),
					name: trimName(all.name),
					channels: all.channels ?? [],
					notifyRequester: all.targets?.includes("requester") ?? false,
					notifyNextApprovers: all.targets?.includes("nextApprovers") ?? false,
					recipients: [...legacy, ...(all.principals ?? []).map(principalId => ({ type: ApproverType.Principal as const, principalId }))],
					emailTemplate: all.emailTemplate && all.emailTemplate !== NOTIFY_DEFAULT_TEMPLATE ? all.emailTemplate : undefined,
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
			{channels.includes(NotifyChannel.Email) && (
				<Form.Item name="emailTemplate" label={t("workflowDesigner.inspector.emailTemplate")} extra={t("workflowDesigner.inspector.emailTemplateHint")}>
					<Select options={templateOptions} showSearch optionFilterProp="label" />
				</Form.Item>
			)}
			<Form.Item name="targets" label={t("workflowDesigner.inspector.recipients")} className="mb-3">
				<Checkbox.Group className="flex flex-col gap-2">
					<Checkbox value="requester">{t("workflowDesigner.inspector.notifyRequester")}</Checkbox>
					<Checkbox value="nextApprovers">
						<span className="flex flex-col">
							<span>{t("workflowDesigner.inspector.notifyNextApprovers")}</span>
							<span className="text-xs opacity-60">{t("workflowDesigner.inspector.notifyNextApproversHint")}</span>
						</span>
					</Checkbox>
				</Checkbox.Group>
			</Form.Item>
			<Form.Item name="principals" label={t("workflowDesigner.inspector.fixedRecipients")}>
				<PrincipalMultiSelect disabled={disabled} placeholder={t("workflowDesigner.inspector.selectPrincipal")} />
			</Form.Item>
			{legacy.length > 0 && (
				<div className="-mt-2 mb-4 flex flex-col gap-1.5">
					<Typography.Text type="secondary" className="text-xs">{t("workflowDesigner.inspector.legacyRecipients")}</Typography.Text>
					<div className="flex flex-wrap gap-1">
						{legacy.map((approver, index) => (
							<Tag
								key={`${approver.type}-${index}`}
								closable={!disabled}
								className="m-0"
								onClose={(e) => {
									e.preventDefault();
									updateNode(node.id, n => ({ ...(n as NotifyNode), recipients: (n as NotifyNode).recipients.filter(a => a !== approver) }));
								}}
							>
								{approverLabel(approver, t, userNames)}
							</Tag>
						))}
					</div>
				</div>
			)}
			<Form.Item name="message" label={t("workflowDesigner.inspector.message")} extra={t("workflowDesigner.inspector.messageHint")}>
				<Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} maxLength={1000} />
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
