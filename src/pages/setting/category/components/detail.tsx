import type { CategoryEntity } from "#src/api/setting/category";
import { categoryService } from "#src/api/setting/category";
import { ProFormDepartmentPicker } from "#src/components/department-picker";
import { ModalForm, ProFormText } from "@ant-design/pro-components";
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
	const [form] = Form.useForm<CategoryEntity>();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const title = useMemo(
		() => (editingId ? t("setting.category.editCategory") : t("setting.category.addCategory")),
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
					const data = await categoryService.fetchCategoryItem(id);
					form.setFieldsValue({
						...data,
						department: data.department,
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

	const onFinish = async (values: CategoryEntity) => {
		if (editingId) {
			await categoryService.fetchUpdateCategory(editingId, values);
			window.$message?.success(t("common.updateSuccess"));
		}
		else {
			await categoryService.fetchAddCategory(values);
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
		<ModalForm<CategoryEntity>
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
				<ProFormDepartmentPicker
					name="department"
					label={t("setting.category.department")}
					rules={[{ required: true }]}
					fieldProps={{ placeholder: t("common.pleaseSelect") }}
					labelInValue={false}
				/>

				<ProFormText
					name="code"
					label={t("setting.category.code")}
					placeholder={t("common.pleaseInput")}
					normalize={v => v?.toUpperCase()}
					rules={[
						{ required: true },
						{ min: 3, message: t("setting.category.codeMinLength") },
						{ max: 50 },
						{ pattern: /^[A-Z0-9]+$/, message: t("setting.category.codePattern") },
					]}
				/>

				<ProFormText
					name="name"
					label={t("setting.category.name")}
					placeholder={t("common.pleaseInput")}
					rules={[
						{ required: true },
						{ max: 255 },
					]}
				/>

				<ProFormText
					name="icon"
					label={t("setting.category.icon")}
					placeholder={t("common.pleaseInput")}
				/>
			</Spin>
		</ModalForm>
	);
}
