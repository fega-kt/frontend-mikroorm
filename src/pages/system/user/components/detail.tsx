import type { UserEntity } from "#src/api/user/types";
import { userService } from "#src/api/user";
import { TrimInput } from "#src/components/basic-form";
import { ProFormDepartmentPicker } from "#src/components/department-picker";
import { VIETNAMESE_MOBILE_REGEXP } from "#src/constants/regular-expressions";
import {
	ModalForm,
	ProFormSwitch,
} from "@ant-design/pro-components";
import { Form, Input, Spin } from "antd";
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
				<Form.Item
					name="fullName"
					label={t("system.user.fullName")}
					required
					rules={[
						{
							validator: (_: unknown, value: string) => {
								const v = (value ?? "").trim();
								if (!v)
									return Promise.reject(new Error(t("system.user.fullNameRequired")));
								if (v.length > 255)
									return Promise.reject(new Error(t("system.user.fullNameMaxLength")));
								if (!/^\p{L}+(?:\s\p{L}+)*$/u.test(v))
									return Promise.reject(new Error(t("system.user.fullNameInvalidFormat")));
								return Promise.resolve();
							},
						},
					]}
				>
					<TrimInput placeholder={t("common.pleaseEnter")} />
				</Form.Item>
				<Form.Item
					name="loginName"
					label={t("system.user.loginName")}
					required
					rules={[
						{
							validator: (_: unknown, value: string) => {
								const v = (value ?? "").trim();
								if (!v)
									return Promise.reject(new Error(t("system.user.loginNameRequired")));
								if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(v))
									return Promise.reject(new Error(t("system.user.loginNameInvalidEmail")));
								return Promise.resolve();
							},
						},
					]}
				>
					<TrimInput placeholder={t("common.pleaseEnter")} disabled={!!editingId} />
				</Form.Item>
				{!editingId && (
					<Form.Item
						name="password"
						label={t("system.user.password")}
						required
						rules={[
							{
								validator: (_: unknown, value: string) => {
									const v = value ?? "";
									if (!v)
										return Promise.reject(new Error(t("system.user.passwordRequired")));
									if (v.length < 8)
										return Promise.reject(new Error(t("system.user.passwordMinLength")));
									if (v.length > 16)
										return Promise.reject(new Error(t("system.user.passwordMaxLength")));
									if (!/[a-z]/.test(v))
										return Promise.reject(new Error(t("system.user.passwordLowercase")));
									if (!/[A-Z]/.test(v))
										return Promise.reject(new Error(t("system.user.passwordUppercase")));
									if (!/\d/.test(v))
										return Promise.reject(new Error(t("system.user.passwordNumber")));
									return Promise.resolve();
								},
							},
						]}
					>
						<Input.Password placeholder={t("common.pleaseEnter")} />
					</Form.Item>
				)}
				<Form.Item
					name="workEmail"
					label={t("system.user.email")}
					rules={[
						{
							validator: (_: unknown, value: string) => {
								if (!value || value.trim() === "")
									return Promise.resolve();
								if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(value.trim()))
									return Promise.reject(new Error(t("system.user.emailInvalidFormat")));
								return Promise.resolve();
							},
						},
					]}
				>
					<TrimInput placeholder={t("common.pleaseEnter")} />
				</Form.Item>
				<Form.Item
					name="phoneNumber"
					label={t("system.user.phone")}
					rules={[
						{
							validator: (_: unknown, value: string) => {
								if (!value || value.trim() === "")
									return Promise.resolve();
								if (!VIETNAMESE_MOBILE_REGEXP.test(value.trim()))
									return Promise.reject(new Error(t("system.user.phoneInvalidFormat")));
								return Promise.resolve();
							},
						},
					]}
				>
					<TrimInput placeholder={t("common.pleaseEnter")} />
				</Form.Item>
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
