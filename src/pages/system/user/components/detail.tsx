import type { UserEntity } from "#src/api/user/types";
import { userService } from "#src/api/user";
import { ProFormDepartmentPicker } from "#src/components/department-picker";
import {
	ModalForm,
	ProFormSwitch,
	ProFormText,
} from "@ant-design/pro-components";
import { Form, Spin } from "antd";
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
	const [form] = Form.useForm<UserEntity>();

	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const title = useMemo(
		() => (editingId ? t("system.user.editUser") : t("system.user.addUser")),
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
					const data = await userService.fetchUserItem(id);
					// Map relational data if needed
					form.setFieldsValue({
						...data,
						// department might need specific mapping if using labelInValue
						department: data.department ? { label: data.department.name, value: data.department.id } : null,
					} as any);
				}
				catch (error) {
					console.error("[UserDetail] Failed to fetch user info:", error);
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

	const onFinish = async (values: any) => {
		// Clean values before sending
		const payload = {
			...values,
			department: values.department?.value || values.department,
			isActive: Boolean(values.isActive),
		};

		if (editingId) {
			await userService.fetchUpdateUser(editingId, payload);
			window.$message?.success(t("common.updateSuccess"));
		}
		else {
			await userService.fetchAddUser(payload);
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
		<ModalForm<UserEntity>
			title={title}
			open={open}
			onOpenChange={(visible) => {
				if (visible === false) {
					onClose();
				}
			}}
			labelCol={{ span: 6 }}
			wrapperCol={{ span: 16 }}
			layout="horizontal"
			form={form}
			autoFocusFirstInput
			modalProps={{
				destroyOnHidden: true,
				width: 650,
			}}
			onFinish={onFinish}
			initialValues={{
				isActive: true,
			}}
		>
			<Spin spinning={loading}>
				<ProFormText
					name="fullName"
					label={t("system.user.fullName")}
					rules={[{ required: true }]}
				/>
				<ProFormText
					name="loginName"
					label={t("system.user.loginName")}
					rules={[{ required: true }]}
					disabled={!!editingId}
				/>
				{!editingId && (
					<ProFormText.Password
						name="password"
						label={t("system.user.password")}
						rules={[{ required: true, min: 6 }]}
					/>
				)}
				<ProFormText
					name="workEmail"
					label={t("system.user.email")}
					rules={[{ type: "email" }]}
				/>
				<ProFormText
					name="phoneNumber"
					label={t("system.user.phone")}
				/>
				<ProFormDepartmentPicker
					name="department"
					label={t("system.dept.name")}
					labelInValue={true}
				/>

				<ProFormSwitch
					name="isActive"
					label={t("common.status")}
					checkedChildren={t("common.active")}
					unCheckedChildren={t("common.inactive")}
				/>
			</Spin>
		</ModalForm>
	);
}
