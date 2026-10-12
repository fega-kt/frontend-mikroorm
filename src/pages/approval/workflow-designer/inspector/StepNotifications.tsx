import type { StepEvent, StepNotifyRule, WaitNode } from "#src/api/approval-workflow/types";
import type { EmailTemplate } from "#src/api/email-template";
import { ApproverType, DEFAULT_STEP_NOTIFY_RULE, NotifyChannel } from "#src/api/approval-workflow/types";
import { emailTemplateService } from "#src/api/email-template";
import { RightOutlined } from "@ant-design/icons";
import { Checkbox, Form, Input, Select, Switch, theme, Typography } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDesigner } from "../store/designer.store";
import { PrincipalMultiSelect } from "./PrincipalMultiSelect";

const EVENTS: StepEvent[] = ["approved", "rejected", "returned"];

/** Mẫu email hệ thống dùng khi không chọn mẫu riêng — đồng bộ backend SystemEmailTemplate */
const DEFAULT_TEMPLATE: Record<StepEvent, string> = {
	approved: "approval.step_approved",
	rejected: "approval.rejected",
	returned: "approval.returned",
};

interface RuleFormValues {
	channels?: NotifyChannel[]
	emailTemplate?: string
	targets?: string[]
	principals?: string[]
	message?: string
}

/** Thông báo khi bước duyệt xong / bị từ chối / bị trả lại — mỗi sự kiện bật tắt và chọn người nhận riêng */
export function StepNotifications({ node, disabled }: { node: WaitNode, disabled: boolean }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [templates, setTemplates] = useState<EmailTemplate[]>([]);
	useEffect(() => {
		emailTemplateService.fetchList().then(setTemplates).catch(() => setTemplates([]));
	}, []);

	return (
		<div className="mt-2 flex flex-col gap-2 pt-4" style={{ borderTop: `1px solid ${token.colorBorderSecondary}` }}>
			<span className="font-semibold">{t("workflowDesigner.stepNotify.title")}</span>
			<Typography.Text type="secondary" className="text-xs">{t("workflowDesigner.stepNotify.hint")}</Typography.Text>
			{EVENTS.map(event => (
				<EventRule key={`${node.id}-${event}`} node={node} event={event} disabled={disabled} templates={templates} />
			))}
		</div>
	);
}

function EventRule({ node, event, disabled, templates }: { node: WaitNode, event: StepEvent, disabled: boolean, templates: EmailTemplate[] }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const updateNode = useDesigner(s => s.updateNode);
	const [form] = Form.useForm<RuleFormValues>();
	const [expanded, setExpanded] = useState(false);
	const rule = node.notifications?.[event];
	// Từ chối / trả lại chưa cấu hình vẫn gửi người trình như mặc định → coi như đang bật
	const enabled = rule ? rule.enabled : event !== "approved";
	const current = rule ?? DEFAULT_STEP_NOTIFY_RULE;
	const channels = Form.useWatch("channels", form) ?? current.channels;

	const setRule = (next: StepNotifyRule) => {
		updateNode(node.id, n => ({ ...(n as WaitNode), notifications: { ...(n as WaitNode).notifications, [event]: next } }) as WaitNode);
	};

	const principalIds = current.recipients.flatMap(a => (a.type === ApproverType.Principal ? [a.principalId] : []));
	const legacy = current.recipients.filter(a => a.type !== ApproverType.Principal);
	const templateOptions = templates
		.filter(tpl => !tpl.system || tpl.code === DEFAULT_TEMPLATE[event])
		.map(tpl => ({ value: tpl.code, label: tpl.system ? t("workflowDesigner.inspector.defaultTemplate", { name: tpl.name }) : tpl.name }));
	const otherTarget = event === "approved" ? "nextApprovers" : "previousApprovers";
	const notifyOther = event === "approved" ? current.notifyNextApprovers : current.notifyPreviousApprovers;

	/** Tóm tắt khi thu gọn: người nhận · kênh */
	const summary = (() => {
		if (!enabled)
			return t("workflowDesigner.stepNotify.off");
		const targets = [
			current.notifyRequester && t("workflowDesigner.inspector.notifyRequester"),
			notifyOther && t(event === "approved" ? "workflowDesigner.inspector.notifyNextApprovers" : "workflowDesigner.stepNotify.previousApprovers"),
			current.recipients.length > 0 && t("workflowDesigner.stepNotify.fixedCount", { count: current.recipients.length }),
		].filter(Boolean);
		const via = current.channels.map(c => t(`workflowDesigner.channels.${c}`)).join(", ");
		return `${targets.length ? targets.join(", ") : t("workflowDesigner.stepNotify.noRecipient")} · ${via}`;
	})();

	return (
		<div className="rounded-lg px-3 py-2.5" style={{ border: `1px solid ${token.colorBorderSecondary}` }}>
			<div className="flex items-center justify-between gap-2">
				<button
					type="button"
					className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 border-none bg-transparent p-0 text-left"
					style={{ color: "inherit" }}
					onClick={() => setExpanded(v => !v)}
					aria-expanded={expanded}
				>
					<RightOutlined className="mt-1 text-[10px] transition-transform" style={{ transform: expanded ? "rotate(90deg)" : undefined, color: token.colorTextTertiary }} />
					<span className="flex min-w-0 flex-col">
						<span className="font-medium">{t(`workflowDesigner.stepNotify.events.${event}`)}</span>
						<Typography.Text type="secondary" className="text-xs" ellipsis={{ tooltip: true }}>
							{!rule && event !== "approved" ? t("workflowDesigner.stepNotify.defaultRequester") : summary}
						</Typography.Text>
					</span>
				</button>
				<Switch
					size="small"
					checked={enabled}
					disabled={disabled}
					onChange={(checked) => {
						setRule({ ...current, enabled: checked });
						setExpanded(checked);
					}}
				/>
			</div>
			{/* luôn render (chỉ ẩn) để useWatch luôn gắn với form */}
			<Form<RuleFormValues>
				form={form}
				layout="vertical"
				disabled={disabled}
				className={enabled && expanded ? "mt-3" : "hidden"}
				initialValues={{
					channels: current.channels,
					emailTemplate: current.emailTemplate ?? DEFAULT_TEMPLATE[event],
					targets: [
						...(current.notifyRequester ? ["requester"] : []),
						...((event === "approved" ? current.notifyNextApprovers : current.notifyPreviousApprovers) ? [otherTarget] : []),
					],
					principals: principalIds,
					message: current.message,
				}}
				onValuesChange={(_, all) => {
					setRule({
						...current,
						enabled: true,
						channels: all.channels ?? [],
						notifyRequester: all.targets?.includes("requester") ?? false,
						notifyNextApprovers: event === "approved" && (all.targets?.includes("nextApprovers") ?? false),
						notifyPreviousApprovers: event !== "approved" && (all.targets?.includes("previousApprovers") ?? false),
						recipients: [...legacy, ...(all.principals ?? []).map(principalId => ({ type: ApproverType.Principal as const, principalId }))],
						emailTemplate: all.emailTemplate && all.emailTemplate !== DEFAULT_TEMPLATE[event] ? all.emailTemplate : undefined,
						message: all.message?.trim() ? all.message : undefined,
					});
				}}
			>
				<Form.Item name="channels" label={t("workflowDesigner.inspector.channels")} className="mb-3">
					<Checkbox.Group
						options={[NotifyChannel.InApp, NotifyChannel.Email].map(c => ({ value: c, label: t(`workflowDesigner.channels.${c}`) }))}
					/>
				</Form.Item>
				{channels.includes(NotifyChannel.Email) && (
					<Form.Item name="emailTemplate" label={t("workflowDesigner.inspector.emailTemplate")} className="mb-3">
						<Select options={templateOptions} showSearch optionFilterProp="label" />
					</Form.Item>
				)}
				<Form.Item name="targets" label={t("workflowDesigner.inspector.recipients")} className="mb-3">
					<Checkbox.Group className="flex flex-col gap-2">
						<Checkbox value="requester">{t("workflowDesigner.inspector.notifyRequester")}</Checkbox>
						<Checkbox value={otherTarget}>
							{t(event === "approved" ? "workflowDesigner.inspector.notifyNextApprovers" : "workflowDesigner.stepNotify.previousApprovers")}
						</Checkbox>
					</Checkbox.Group>
				</Form.Item>
				<Form.Item name="principals" label={t("workflowDesigner.inspector.fixedRecipients")} className="mb-3">
					<PrincipalMultiSelect disabled={disabled} placeholder={t("workflowDesigner.inspector.selectPrincipal")} />
				</Form.Item>
				<Form.Item name="message" label={t("workflowDesigner.inspector.message")} extra={t("workflowDesigner.inspector.messageHint")} className="mb-1">
					<Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} maxLength={1000} />
				</Form.Item>
			</Form>
		</div>
	);
}
