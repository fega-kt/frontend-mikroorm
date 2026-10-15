import type { EmailBrand, EmailTemplate, EmailTemplateCategory, EmailTemplatePreview, TemplateVariable } from "#src/api/email-template";
import type { InputRef } from "antd";
import type { TextAreaRef } from "antd/es/input/TextArea";
import type { HtmlEmailEditorApi } from "./html-email-editor";
import { emailTemplateService } from "#src/api/email-template";
import { CodeOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Modal, Segmented, Spin, Tag, theme, Tooltip, Typography } from "antd";
import { useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HtmlEmailEditor } from "./html-email-editor";

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

type View = "edit" | "html" | "preview";

/** Ô đang được chọn để chèn biến */
type InsertTarget = "subject" | "body" | "html";

let guard: ((res?: { isChange: boolean }) => void) | undefined;

/**
 * Sửa mẫu email. Nội dung là toàn bộ email (header, thẻ, footer); khi gửi backend chỉ bọc thêm nền xám.
 * Soạn: sửa chữ trực tiếp trên email · HTML: sửa mã (đổi bố cục) · Xem trước: email thật với dữ liệu mẫu.
 */
export function Detail({ ref }: { ref: React.Ref<DetailRef> }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm<FormValues>();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [template, setTemplate] = useState<EmailTemplate | null>(null);
	const [variablesByCategory, setVariablesByCategory] = useState<Partial<Record<EmailTemplateCategory, TemplateVariable[]>>>({});
	const [brand, setBrand] = useState<EmailBrand | null>(null);
	const [view, setView] = useState<View>("edit");
	const [preview, setPreview] = useState<EmailTemplatePreview | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);

	const subjectRef = useRef<InputRef>(null);
	const htmlRef = useRef<TextAreaRef>(null);
	const editorApi = useRef<HtmlEmailEditorApi | null>(null);
	const target = useRef<InsertTarget>("body");
	const handleEditorReady = useCallback((api: HtmlEmailEditorApi) => {
		editorApi.current = api;
	}, []);
	const focusBody = useCallback(() => {
		target.current = "body";
	}, []);

	/** Logo / tên app thật để hiện trong khung soạn (khi lưu vẫn giữ biến) */
	const displayVars = useMemo((): Record<string, string> => {
		if (!brand)
			return {};
		return { "app.logo": brand.logoUrl, "app.name": brand.appName, "app.link": brand.appLink };
	}, [brand]);

	useImperativeHandle(ref, () => ({
		show: async (code) => {
			form.resetFields();
			target.current = "body";
			setTemplate(null);
			setVariablesByCategory({});
			setView("edit");
			setPreview(null);
			setOpen(true);
			setLoading(true);
			try {
				const [vars, item, brandInfo] = await Promise.all([
					emailTemplateService.fetchVariables(),
					code ? emailTemplateService.fetchItem(code) : Promise.resolve(null),
					brand ? Promise.resolve(brand) : emailTemplateService.fetchBrand(),
				]);
				setVariablesByCategory(vars);
				setBrand(brandInfo);
				if (item) {
					setTemplate(item);
					form.setFieldsValue({ code: item.code, name: item.name, description: item.description ?? undefined, subject: item.subject, body: item.body });
				}
				else {
					form.setFieldsValue({ body: (await emailTemplateService.fetchStarter()).body });
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

	// Mẫu mới luôn là mẫu tùy chỉnh (dùng ở bước Thông báo → có biến của tờ trình)
	const category = template?.category ?? "custom";
	const variables = variablesByCategory[category] ?? [];
	const withPayload = category === "approval" || category === "custom";
	const body = Form.useWatch("body", form) as string | undefined;

	const close = (res?: { isChange: boolean }) => {
		setOpen(false);
		guard?.(res);
		guard = undefined;
	};

	/** Chèn token vào ô nhập thường (tiêu đề / mã HTML) tại con trỏ */
	const insertInto = (field: "subject" | "body", el: HTMLInputElement | HTMLTextAreaElement | null | undefined, token: string) => {
		const current: string = form.getFieldValue(field) ?? "";
		const start = el?.selectionStart ?? current.length;
		const end = el?.selectionEnd ?? current.length;
		form.setFieldValue(field, current.slice(0, start) + token + current.slice(end));
		requestAnimationFrame(() => {
			el?.focus();
			el?.setSelectionRange(start + token.length, start + token.length);
		});
	};

	const insertVariable = (key: string) => {
		const token = `{{${key}}}`;
		if (target.current === "subject")
			insertInto("subject", subjectRef.current?.input, token);
		else if (target.current === "html")
			insertInto("body", htmlRef.current?.resizableTextArea?.textArea, token);
		else
			editorApi.current?.insertText(token);
	};

	/** Đổi tab; sang Xem trước thì nhờ backend dựng email với dữ liệu mẫu */
	const changeView = async (next: View) => {
		setView(next);
		if (next !== "preview")
			return;
		const { subject = "", body: html = "" } = form.getFieldsValue();
		// Bỏ bản cũ để không thấy nội dung trước khi sửa rồi mới đổi
		setPreview(null);
		setPreviewLoading(true);
		try {
			setPreview(await emailTemplateService.fetchPreview({ subject, body: html, code: template?.code }));
		}
		catch {
			setPreview(null);
		}
		finally {
			setPreviewLoading(false);
		}
	};

	const onSave = async () => {
		const values = await form.validateFields();
		const text = `${values.subject} ${values.body}`;
		const missing = (template?.requiredVariables ?? []).filter(key => !text.includes(`{{${key}}}`));
		if (missing.length) {
			window.$message?.error(t("approval.emailTemplate.missingRequired", { list: missing.map(key => `{{${key}}}`).join(", ") }));
			return;
		}
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
			style={{ top: 24 }}
			title={(
				<div className="flex flex-wrap items-center gap-2">
					<span>{t(template ? "approval.emailTemplate.edit" : "approval.emailTemplate.add")}</span>
					{template && <Tag color="blue" className="m-0">{t(`approval.emailTemplate.category.${template.category}`)}</Tag>}
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
					<div className="flex min-w-0 flex-col" style={{ flex: "999 1 560px" }}>
						<Form<FormValues> form={form} layout="vertical">
							<div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
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
								<Form.Item name="description" label={t("approval.emailTemplate.description")}>
									<Input maxLength={1000} />
								</Form.Item>
							</div>
							<Form.Item name="subject" label={t("approval.emailTemplate.subject")} rules={[{ required: true, whitespace: true }]}>
								<Input
									ref={subjectRef}
									maxLength={500}
									onFocus={() => {
										target.current = "subject";
									}}
								/>
							</Form.Item>

							{template?.requiredVariables.length
								? (
									<Alert
										className="mb-3"
										type="info"
										showIcon
										message={t("approval.emailTemplate.requiredHint", { list: template.requiredVariables.map(key => `{{${key}}}`).join(", ") })}
									/>
								)
								: null}

							<Segmented<View>
								className="mb-3"
								value={view}
								onChange={changeView}
								options={[
									{ value: "edit", label: (
										<span className="flex items-center gap-1.5">
											<EditOutlined />
											{t("approval.emailTemplate.compose")}
										</span>
									) },
									{ value: "html", label: (
										<span className="flex items-center gap-1.5">
											<CodeOutlined />
											HTML
										</span>
									) },
									{ value: "preview", label: (
										<span className="flex items-center gap-1.5">
											<EyeOutlined />
											{t("approval.emailTemplate.preview")}
										</span>
									) },
								]}
							/>

							{/* Soạn: luôn giữ trong form (ẩn khi ở tab khác) để body được kiểm tra khi lưu */}
							<div className={view === "edit" ? undefined : "hidden"}>
								<Form.Item name="body" rules={[{ required: true, whitespace: true, message: t("approval.emailTemplate.bodyRequired") }]} className="mb-2">
									<HtmlEmailEditor displayVars={displayVars} active={view === "edit"} onReady={handleEditorReady} onFocus={focusBody} />
								</Form.Item>
								<Text type="secondary" className="text-xs">{t("approval.emailTemplate.composeHint")}</Text>
							</div>
						</Form>

						{view === "html" && (
							<div className="flex flex-col gap-2">
								<Input.TextArea
									ref={htmlRef}
									value={body}
									onChange={e => form.setFieldValue("body", e.target.value)}
									onFocus={() => {
										target.current = "html";
									}}
									spellCheck={false}
									autoSize={{ minRows: 18, maxRows: 32 }}
									className="font-mono text-xs"
								/>
								<Text type="secondary" className="text-xs">{t("approval.emailTemplate.htmlHint")}</Text>
							</div>
						)}

						{view === "preview" && (
							<div className="flex flex-col gap-3">
								{preview?.unknownVariables.length
									? <Alert type="warning" showIcon message={t("approval.emailTemplate.unknownVariables", { list: preview.unknownVariables.join(", ") })} />
									: null}
								{/* delay: backend dựng xong nhanh thì không hiện vòng xoay (tránh chớp) */}
								<Spin spinning={previewLoading} delay={200}>
									<div className="flex flex-col gap-3">
										<div className="rounded-lg px-4 py-3" style={{ border: `1px solid ${token.colorBorderSecondary}` }}>
											<Text type="secondary" className="text-xs">{t("approval.emailTemplate.subject")}</Text>
											<div className="min-h-[22px] font-semibold">{preview?.subject}</div>
										</div>
										{/* sandbox: không chạy script trong nội dung mẫu */}
										<iframe
											title={t("approval.emailTemplate.preview")}
											sandbox=""
											srcDoc={preview?.html ?? ""}
											className="h-[640px] w-full rounded-lg"
											style={{ background: "#f2f4f7", border: `1px solid ${token.colorBorderSecondary}` }}
										/>
									</div>
								</Spin>
								<Text type="secondary" className="text-xs">{t("approval.emailTemplate.previewHint")}</Text>
							</div>
						)}
					</div>

					<aside className="sticky top-0 flex min-w-0 flex-col gap-2" style={{ flex: "1 1 260px", maxWidth: 320 }}>
						<span className="font-semibold">{t("approval.emailTemplate.variables")}</span>
						<Text type="secondary" className="text-xs">{t("approval.emailTemplate.variablesHint")}</Text>
						<div className="flex max-h-[560px] flex-col gap-1 overflow-y-auto">
							{variables.map(v => (
								<Tooltip key={v.key} title={`${t("approval.emailTemplate.sample")}: ${v.sample}`} placement="left">
									<button
										type="button"
										disabled={view === "preview"}
										// Giữ focus ở ô đang soạn để chèn đúng vị trí con trỏ
										onMouseDown={e => e.preventDefault()}
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
						{withPayload && <Text type="secondary" className="text-xs">{t("approval.emailTemplate.payloadHint")}</Text>}
					</aside>
				</div>
			</Spin>
		</Modal>
	);
}
