import type { RequestTypeEntity } from "#src/api/setting/request-type";
import { categoryService } from "#src/api/setting/category";
import { requestTypeService, RequestTypeStatus } from "#src/api/setting/request-type";
import { ModalForm, ProFormSelect, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Form, Spin } from "antd";
import * as React from "react";
import { useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface DetailRef {
	show: (id?: string) => Promise<{ isChange: boolean } | undefined>
}

interface DetailProps {
	ref: React.Ref<DetailRef>
}

let guard: (res?: { isChange: boolean }) => void;

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<RequestTypeEntity>();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const title = useMemo(
		() => (editingId ? t("setting.requestType.editRequestType") : t("setting.requestType.addRequestType")),
		[editingId, t],
	);

	useImperativeHandle(ref, () => ({
		show: async (id?: string) => {
			form.resetFields();
			setEditingId(id ?? null);
			setOpen(true);
			if (id) {
				setLoading(true);
				try {
					const data = await requestTypeService.fetchRequestTypeItem(id);
					form.setFieldsValue({
						...data,
						category: data.category?.id as any,
					});
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

	const onFinish = async (values: RequestTypeEntity) => {
		if (editingId) {
			await requestTypeService.fetchUpdateRequestType(editingId, values);
			window.$message?.success(t("common.updateSuccess"));
		}
		else {
			await requestTypeService.fetchAddRequestType(values);
			window.$message?.success(t("common.addSuccess"));
		}
		guard?.({ isChange: true });
		return true;
	};

	const onClose = () => {
		setOpen(false);
		setEditingId(null);
		form.resetFields();
		guard?.();
	};

	return (
		<ModalForm<RequestTypeEntity>
			title={title}
			open={open}
			onOpenChange={(visible) => {
				if (!visible) {
					onClose();
				}
			}}
			layout="vertical"
			form={form}
			autoFocusFirstInput
			modalProps={{
				destroyOnHidden: true,
				width: 520,
			}}
			onFinish={onFinish}
		>
			<Spin spinning={loading}>
				<ProFormSelect
					name="category"
					label={t("setting.requestType.category")}
					rules={[{ required: true }]}
					fieldProps={{ placeholder: t("common.pleaseSelect"), showSearch: true }}
					request={async () => {
						const res = await categoryService.fetchCategoryList({ limit: 500 });
						return (res.data ?? []).map(c => ({ label: c.name, value: c.id }));
					}}
				/>

				<ProFormText
					name="code"
					label={t("setting.requestType.code")}
					placeholder={t("common.pleaseInput")}
					normalize={v => v?.toUpperCase()}
					rules={[
						{ required: true },
						{ min: 2 },
						{ max: 50 },
						{ pattern: /^[A-Z0-9_]+$/, message: t("setting.requestType.codePattern") },
					]}
				/>

				<ProFormText
					name="name"
					label={t("setting.requestType.name")}
					placeholder={t("common.pleaseInput")}
					rules={[{ required: true }, { max: 255 }]}
				/>

				<ProFormText
					name="prefix"
					label={t("setting.requestType.prefix")}
					placeholder={t("common.pleaseInput")}
					normalize={v => v?.toUpperCase()}
					rules={[
						{ required: true },
						{ max: 10 },
						{ pattern: /^[A-Z0-9]+$/, message: t("setting.requestType.prefixPattern") },
					]}
				/>

				<ProFormSelect
					name="status"
					label={t("setting.requestType.status")}
					rules={[{ required: true }]}
					initialValue={RequestTypeStatus.Draft}
					options={Object.values(RequestTypeStatus).map(s => ({
						label: t(`setting.requestType.statusOptions.${s}`),
						value: s,
					}))}
				/>

				<ProFormTextArea
					name="description"
					label={t("setting.requestType.description")}
					placeholder={t("common.pleaseInput")}
					fieldProps={{ rows: 3 }}
					rules={[{ max: 500 }]}
				/>
			</Spin>
		</ModalForm>
	);
}
