import type { FormEntity, FormVersionBrief } from "#src/api/setting/form";
import type { FormField } from "#src/api/setting/request-type";
import type { FullscreenModalRef } from "#src/components/fullscreen-modal";
import { formService } from "#src/api/setting/form";
import { FullscreenModal } from "#src/components/fullscreen-modal";
import { SectionCard } from "#src/components/section-card";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { Header } from "#src/pages/setting/request-type/components/header";
import { InfoCircleOutlined } from "@ant-design/icons";
import { ProForm, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Button, Form, Spin } from "antd";
import * as React from "react";
import { useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { validateFormSchema } from "../form-schema";
import { FormDocTab } from "./form-doc-tab";
import { VersionList } from "./version-list";
import { VersionPreviewModal } from "./version-preview-modal";

export interface DetailRef {
	show: (id?: string) => Promise<{ isChange: boolean } | undefined>
}

interface DetailProps {
	ref: React.Ref<DetailRef>
}

let guard: (res?: { isChange: boolean }) => void;

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const [form] = Form.useForm<FormEntity>();
	const modalRef = useRef<FullscreenModalRef>(null);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [formSchema, setFormSchema] = useState<FormField[]>([]);
	const [previewVersion, setPreviewVersion] = useState<FormVersionBrief | null>(null);
	const [versionsToken, setVersionsToken] = useState(0);

	const watchedName = Form.useWatch("name", form);

	useImperativeHandle(ref, () => ({
		show: async (id?: string) => {
			form.resetFields();
			setEditingId(id ?? null);
			setFormSchema([]);
			setPreviewVersion(null);
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

	return (
		<FullscreenModal
			ref={modalRef}
			header={(
				<Header
					onClose={onClose}
					title={t("setting.form.detailTitle")}
					subtitle={watchedName}
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
			<div className="relative min-h-0 flex-1 overflow-y-auto p-6">
				{loading && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
						<Spin size="large" />
					</div>
				)}
				<div className="flex flex-col gap-4">
					<SectionCard icon={<InfoCircleOutlined />} title={t("setting.form.basicInfo")}>
						<ProForm form={form} layout="vertical" submitter={false} onFinish={onFinish}>
							<div className="grid grid-cols-2 gap-x-4">
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
								fieldProps={{ rows: 3 }}
								rules={[{ max: 500 }]}
							/>
						</ProForm>
					</SectionCard>
					{editingId && <VersionList formId={editingId} refreshToken={versionsToken} onPreview={setPreviewVersion} />}
					<FormDocTab value={formSchema} onChange={setFormSchema} />
				</div>
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
