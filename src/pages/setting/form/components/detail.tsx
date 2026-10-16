import type { FormEntity, FormVersionBrief } from "#src/api/setting/form";
import type { FormField } from "#src/api/setting/request-type";
import type { FullscreenModalRef } from "#src/components/fullscreen-modal";
import { formService } from "#src/api/setting/form";
import { FullscreenModal } from "#src/components/fullscreen-modal";
import { SectionCard } from "#src/components/section-card";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { PayloadFormItems } from "#src/pages/approval/components/form-fields";
import { PAYLOAD_GRID_CLASS } from "#src/pages/approval/lib/payload";
import { Header } from "#src/pages/setting/request-type/components/header";
import { CheckOutlined, CloseOutlined, InfoCircleOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { ProForm, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Badge, Button, Empty, Form, Segmented, Spin, theme } from "antd";
import * as React from "react";
import { useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { validateFormSchema } from "../form-schema";
import { FormBuilder } from "./builder";
import { VersionList } from "./version-list";
import { VersionPreviewModal } from "./version-preview-modal";

export interface DetailRef {
	show: (id?: string) => Promise<{ isChange: boolean } | undefined>
}

interface DetailProps {
	ref: React.Ref<DetailRef>
}

type Tab = "info" | "design" | "preview" | "history";

let guard: (res?: { isChange: boolean }) => void;

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const { token } = theme.useToken();
	const [form] = Form.useForm<FormEntity>();
	const modalRef = useRef<FullscreenModalRef>(null);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [formSchema, setFormSchema] = useState<FormField[]>([]);
	const [previewVersion, setPreviewVersion] = useState<FormVersionBrief | null>(null);
	const [versionsToken, setVersionsToken] = useState(0);
	const [tab, setTab] = useState<Tab>("info");
	// Tab Thông tin có chấm đỏ khi mã / tên còn lỗi
	const [infoInvalid, setInfoInvalid] = useState(false);
	const [previewForm] = Form.useForm();

	const watchedName = Form.useWatch("name", form);
	const watchedCode = Form.useWatch("code", form);

	useImperativeHandle(ref, () => ({
		show: async (id?: string) => {
			form.resetFields();
			setEditingId(id ?? null);
			setFormSchema([]);
			setPreviewVersion(null);
			// Biểu mẫu mới vào tab Thông tin để nhập mã và tên trước; biểu mẫu có sẵn vào thẳng Thiết kế
			setTab(id ? "design" : "info");
			setInfoInvalid(false);
			setVersionsToken(token => token + 1);
			modalRef.current?.open();
			if (id) {
				setLoading(true);
				try {
					const data = await formService.fetchFormItem(id);
					form.setFieldsValue(data);
					setFormSchema(data.formSchema ?? []);
				}
				catch {
					window.$message?.error(t("common.fetchError"));
				}
				finally {
					setLoading(false);
				}
			}
			return new Promise<{ isChange: boolean } | undefined>((resolve) => {
				guard = resolve;
			});
		},
	}));

	const onFinish = async (formValues: FormEntity) => {
		const schemaError = validateFormSchema(formSchema, t);
		if (schemaError) {
			window.$message?.error(schemaError);
			return;
		}
		// ProForm bỏ hẳn trường rỗng khỏi dữ liệu gửi đi → phải gửi null tường minh thì backend mới xóa mô tả
		const values = { ...formValues, description: formValues.description || null, formSchema };
		setSubmitting(true);
		try {
			if (editingId) {
				await formService.fetchUpdateForm(editingId, values);
				window.$message?.success(t("common.updateSuccess"));
			}
			else {
				await formService.fetchAddForm(values);
				window.$message?.success(t("common.addSuccess"));
			}
			guard?.({ isChange: true });
			modalRef.current?.close();
		}
		catch {
			// error handled by global interceptor
		}
		finally {
			setSubmitting(false);
		}
	};

	const onClose = () => {
		modalRef.current?.close();
		setEditingId(null);
		form.resetFields();
		guard?.();
	};

	const tabOptions: { value: Tab, label: React.ReactNode }[] = [
		{ value: "info", label: <Badge dot={infoInvalid} offset={[6, 0]}>{t("approval.formSchema.builder.tabInfo")}</Badge> },
		{ value: "design", label: t("approval.formSchema.builder.tabDesign") },
		{ value: "preview", label: t("approval.formSchema.preview") },
		...(editingId ? [{ value: "history" as const, label: t("approval.formSchema.builder.tabHistory") }] : []),
	];

	const ruleItems = [
		{ ok: true, text: t("setting.form.codeRules.chars") },
		{ ok: true, text: t("setting.form.codeRules.normalize") },
		{ ok: false, text: t("setting.form.codeRules.unique") },
	];

	return (
		<FullscreenModal
			ref={modalRef}
			header={(
				<Header
					onClose={onClose}
					title={t("setting.form.detailTitle")}
					subtitle={(
						<span className="inline-flex items-center gap-2">
							{watchedName || t("setting.form.newForm")}
							{watchedCode && <code className="rounded px-2 py-0.5 text-xs font-normal" style={{ background: token.colorFillTertiary, color: token.colorTextSecondary }}>{watchedCode}</code>}
						</span>
					)}
					lastUpdated={t("approval.formSchema.builder.fieldCount", { count: formSchema.length })}
					extra={(
						<>
							<Button onClick={onClose}>{t("common.cancel")}</Button>
							<Button type="primary" loading={submitting} onClick={() => form.submit()}>
								{t("common.save")}
							</Button>
						</>
					)}
				/>
			)}
		>
			<div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
				{loading && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
						<Spin size="large" />
					</div>
				)}
				<Segmented<Tab> className="shrink-0 self-start" value={tab} onChange={setTab} options={tabOptions} />

				{/* Thông tin luôn nằm trong cây (chỉ ẩn ở tab khác) để Lưu vẫn kiểm tra được mã và tên */}
				<ProForm
					form={form}
					layout="vertical"
					submitter={false}
					onFinish={onFinish}
					onFinishFailed={() => {
						setInfoInvalid(true);
						setTab("info");
					}}
					onFieldsChange={(_, all) => setInfoInvalid(all.some(f => f.errors?.length))}
					className={tab === "info" ? "grid min-h-0 flex-1 grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_360px]" : "hidden"}
				>
					<SectionCard className="h-full" icon={<InfoCircleOutlined />} title={t("setting.form.basicInfo")} bodyClassName="px-6 pb-5 pt-6">
						<div className="grid grid-cols-1 gap-x-6 md:grid-cols-[1fr_2fr]">
							<ProFormText
								name="code"
								label={t("setting.form.code")}
								placeholder={t("common.pleaseInput")}
								// Mã chỉ đặt lúc tạo: đổi mã sau đó làm lệch các nơi đang tham chiếu
								disabled={!!editingId}
								// Bỏ mọi khoảng trắng ngay khi gõ / dán, và viết hoa
								normalize={v => v?.replace(/\s/g, "").toUpperCase()}
								rules={[
									{ required: true },
									{ min: 2 },
									{ max: 50 },
									{ pattern: /^[A-Z0-9_]+$/, message: t("setting.form.codePattern") },
									// Mã là duy nhất: báo trùng ngay khi rời ô (backend vẫn chặn khi lưu)
									...(editingId
										? []
										: [{
											validateTrigger: "onBlur",
											validator: async (_: unknown, code?: string) => {
												if (!code || !/^[A-Z0-9_]+$/.test(code))
													return;
												const { data } = await formService.fetchFormList({ search: code, limit: 50 });
												if (data.some(item => item.code === code))
													throw new Error(t("setting.form.codeDuplicate"));
											},
										}]),
								]}
							/>
							<ProFormText
								name="name"
								label={t("setting.form.name")}
								placeholder={t("common.pleaseInput")}
								rules={[{ required: true }, { max: 255 }]}
							/>
						</div>
						<ProFormTextArea
							name="description"
							label={t("setting.form.description")}
							placeholder={t("common.pleaseInput")}
							fieldProps={{ rows: 10 }}
							rules={[{ max: 500 }]}
						/>
					</SectionCard>
					<SectionCard className="h-full" icon={<SafetyCertificateOutlined />} title={t("setting.form.codeRules.title")} bodyClassName="px-6 pb-5 pt-6">
						<ul className="m-0 flex list-none flex-col gap-3 p-0">
							{ruleItems.map(item => (
								<li key={item.text} className="flex gap-2">
									{item.ok ? <CheckOutlined style={{ color: token.colorSuccess }} /> : <CloseOutlined style={{ color: token.colorError }} />}
									{item.text}
								</li>
							))}
							<li className="flex gap-2" style={{ color: token.colorTextSecondary }}>
								<InfoCircleOutlined />
								{t("setting.form.codeRules.immutable")}
							</li>
						</ul>
					</SectionCard>
				</ProForm>

				{/* Thiết kế luôn được giữ trong cây (chỉ ẩn ở tab khác) để không mất vị trí cuộn */}
				<div className={tab === "design" ? "flex min-h-[520px] flex-1 flex-col" : "hidden"}>
					<FormBuilder value={formSchema} onChange={setFormSchema} />
				</div>
				{tab === "preview" && (
					<div
						className="min-h-0 w-full flex-1 overflow-y-auto rounded-xl px-9 py-7"
						style={{ background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}` }}
					>
						{formSchema.length
							? (
								<Form form={previewForm} layout="vertical" className={PAYLOAD_GRID_CLASS}>
									<PayloadFormItems fields={formSchema.filter(f => f.key)} />
								</Form>
							)
							: <Empty description={t("approval.formSchema.empty")} />}
					</div>
				)}
				{editingId && tab === "history" && (
					<div className="min-h-0 flex-1 overflow-y-auto">
						<VersionList formId={editingId} refreshToken={versionsToken} onPreview={setPreviewVersion} />
					</div>
				)}
				{editingId && (
					<VersionPreviewModal
						formId={editingId}
						version={previewVersion}
						canRestore={canAccess(PermissionType.UpdateForm)}
						onClose={() => setPreviewVersion(null)}
						onRestore={(fields, version) => {
							setFormSchema(fields);
							window.$message?.success(t("setting.form.versions.restored", { version }));
						}}
					/>
				)}
			</div>
		</FullscreenModal>
	);
}
