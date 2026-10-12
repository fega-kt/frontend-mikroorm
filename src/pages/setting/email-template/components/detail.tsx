import type { EmailTemplate, EmailTemplatePreview, TemplateVariable } from "#src/api/email-template";
import type { Editor } from "@tiptap/react";
import type { InputRef } from "antd";
import { emailTemplateService } from "#src/api/email-template";
import { RichTextEditor } from "#src/components/rich-text-editor";
import { EyeOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Modal, Segmented, Spin, Tag, theme, Tooltip, Typography } from "antd";
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export interface DetailRef {
	/** Mở form sửa mẫu (code) hoặc tạo mẫu mới (không truyền) */
	show: (code?: string) => Promise<{ isChange: boolean } | undefined>
}

interface FormValues {
	code?: string
	name: string
	description?: string
	subject: string
	body: string
}

let guard: ((res?: { isChange: boolean }) => void) | undefined;

export function Detail({ ref }: { ref: React.Ref<DetailRef> }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm<FormValues>();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [template, setTemplate] = useState<EmailTemplate | null>(null);
	const [variables, setVariables] = useState<TemplateVariable[]>([]);
	const [view, setView] = useState<"edit" | "preview">("edit");
	const [preview, setPreview] = useState<EmailTemplatePreview | null>(null);

	const subjectRef = useRef<InputRef>(null);
	const editorRef = useRef<Editor | null>(null);
	/** Ô đang được chọn để chèn biến */
	const target = useRef<"subject" | "body">("body");
	const handleEditorReady = useCallback((editor: Editor) => {
		editorRef.current = editor;
		editor.on("focus", () => {
			target.current = "body";
		});
	}, []);

	useImperativeHandle(ref, () => ({
		show: async (code) => {
			form.resetFields();
			setTemplate(null);
			setView("edit");
			setPreview(null);
			setOpen(true);
			setLoading(true);
			try {
				const [vars, item] = await Promise.all([
					emailTemplateService.fetchVariables(),
					code ? emailTemplateService.fetchItem(code) : Promise.resolve(null),
				]);
				setVariables(vars);
				if (item) {
					setTemplate(item);
					form.setFieldsValue({ code: item.code, name: item.name, description: item.description ?? undefined, subject: item.subject, body: item.body });
				}
			}
			finally {
				setLoading(false);
			}
			return new Promise((resolve) => {
				guard = resolve;
			});
		},
	}));

	const close = (res?: { isChange: boolean }) => {
		setOpen(false);
		guard?.(res);
		guard = undefined;
	};

	const insertVariable = (key: string) => {
		const token = `{{${key}}}`;
		if (target.current === "subject") {
			const input = subjectRef.current?.input;
			const current = form.getFieldValue("subject") ?? "";
			const start = input?.selectionStart ?? current.length;
			const end = input?.selectionEnd ?? current.length;
			form.setFieldValue("subject", current.slice(0, start) + token + current.slice(end));
			requestAnimationFrame(() => {
				input?.focus();
				input?.setSelectionRange(start + token.length, start + token.length);
			});
			return;
		}
		editorRef.current?.chain().focus().insertContent(token).run();
	};

	useEffect(() => {
		if (view !== "preview")
			return;
		const { subject = "", body = "" } = form.getFieldsValue();
		emailTemplateService.fetchPreview({ subject, body }).then(setPreview).catch(() => setPreview(null));
	}, [view, form]);

	const onSave = async () => {
		const values = await form.validateFields();
		setSaving(true);
		try {
			const payload = { name: values.name, subject: values.subject, body: values.body, description: values.description || null };
			if (template)
				await emailTemplateService.fetchUpdate(template.code, payload);
			else
				await emailTemplateService.fetchCreate({ ...payload, code: values.code! });
			window.$message?.success(t(template ? "common.updateSuccess" : "common.addSuccess"));
			close({ isChange: true });
		}
		finally {
			setSaving(false);
		}
	};

	return (
		<Modal
			open={open}
			width={1180}
			title={(
				<div className="flex flex-wrap items-center gap-2">
					<span>{t(template ? "approval.emailTemplate.edit" : "approval.emailTemplate.add")}</span>
					{template?.system && <Tag color="blue" className="m-0">{t("approval.emailTemplate.system")}</Tag>}
				</div>
			)}
			onCancel={() => close()}
			destroyOnHidden
			footer={[
				<Button key="cancel" onClick={() => close()}>{t("common.cancel")}</Button>,
				<Button key="save" type="primary" loading={saving} onClick={onSave}>{t("common.save")}</Button>,
			]}
		>
			<Spin spinning={loading}>
				<div className="flex flex-wrap items-start gap-5">
					<div className="flex min-w-0 flex-col" style={{ flex: "999 1 520px" }}>
						<Segmented<"edit" | "preview">
							className="mb-4 self-start"
							value={view}
							onChange={setView}
							options={[
								{ value: "edit", label: t("approval.emailTemplate.compose") },
								{ value: "preview", label: (
									<span className="flex items-center gap-1.5">
										<EyeOutlined />
										{t("approval.emailTemplate.preview")}
									</span>
								) },
							]}
						/>
						<Form<FormValues> form={form} layout="vertical" className={view === "edit" ? undefined : "hidden"}>
							<div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
								<Form.Item name="name" label={t("approval.emailTemplate.name")} rules={[{ required: true, whitespace: true }]}>
									<Input maxLength={255} />
								</Form.Item>
								<Form.Item
									name="code"
									label={t("approval.emailTemplate.code")}
									extra={!template && t("approval.emailTemplate.codeHint")}
									rules={template ? [] : [{ required: true }, { pattern: /^[a-z][a-z0-9._-]*$/, message: t("approval.emailTemplate.codePattern") }]}
								>
									<Input maxLength={100} disabled={!!template} placeholder="vd: thong-bao-ke-toan" />
								</Form.Item>
							</div>
							<Form.Item name="description" label={t("approval.emailTemplate.description")}>
								<Input maxLength={1000} />
							</Form.Item>
							<Form.Item name="subject" label={t("approval.emailTemplate.subject")} rules={[{ required: true, whitespace: true }]}>
								<Input
									ref={subjectRef}
									maxLength={500}
									onFocus={() => {
										target.current = "subject";
									}}
								/>
							</Form.Item>
							<Form.Item name="body" label={t("approval.emailTemplate.body")} rules={[{ required: true, whitespace: true }]}>
								<RichTextEditor minHeight={260} placeholder={t("approval.emailTemplate.bodyPlaceholder")} onReady={handleEditorReady} />
							</Form.Item>
						</Form>

						{view === "preview" && (
							<div className="flex flex-col gap-3">
								{preview?.unknownVariables.length
									? <Alert type="warning" showIcon message={t("approval.emailTemplate.unknownVariables", { list: preview.unknownVariables.join(", ") })} />
									: null}
								<div className="rounded-lg px-4 py-3" style={{ border: `1px solid ${token.colorBorderSecondary}` }}>
									<Text type="secondary" className="text-xs">{t("approval.emailTemplate.subject")}</Text>
									<div className="font-semibold">{preview?.subject}</div>
								</div>
								{/* sandbox: không chạy script trong nội dung mẫu */}
								<iframe
									title={t("approval.emailTemplate.preview")}
									sandbox=""
									srcDoc={preview?.html ?? ""}
									className="h-[420px] w-full rounded-lg bg-white"
									style={{ border: `1px solid ${token.colorBorderSecondary}` }}
								/>
								<Text type="secondary" className="text-xs">{t("approval.emailTemplate.previewHint")}</Text>
							</div>
						)}
					</div>

					<aside className="flex min-w-0 flex-col gap-2" style={{ flex: "1 1 280px", maxWidth: 340 }}>
						<span className="font-semibold">{t("approval.emailTemplate.variables")}</span>
						<Text type="secondary" className="text-xs">{t("approval.emailTemplate.variablesHint")}</Text>
						<div className="flex max-h-[520px] flex-col gap-1 overflow-y-auto">
							{variables.map(v => (
								<Tooltip key={v.key} title={`${t("approval.emailTemplate.sample")}: ${v.sample}`} placement="left">
									<button
										type="button"
										disabled={view !== "edit"}
										onClick={() => insertVariable(v.key)}
										className="flex cursor-pointer flex-col items-start rounded-md px-2.5 py-1.5 text-left disabled:cursor-not-allowed disabled:opacity-50"
										style={{ border: `1px solid ${token.colorBorderSecondary}`, background: token.colorBgContainer }}
									>
										<code className="text-xs" style={{ color: token.colorPrimary }}>{`{{${v.key}}}`}</code>
										<span className="text-xs" style={{ color: token.colorTextSecondary }}>{t(`approval.emailTemplate.vars.${v.key}`)}</span>
									</button>
								</Tooltip>
							))}
						</div>
						<Text type="secondary" className="text-xs">{t("approval.emailTemplate.payloadHint")}</Text>
					</aside>
				</div>
			</Spin>
		</Modal>
	);
}
