import { authService } from "#src/api/auth";
import { PASSWORD_REGEXP } from "#src/constants/regular-expressions";
import { loginPath } from "#src/router/extra-info";
import { useAuthStore } from "#src/store/auth";
import { ModalForm, ProFormText } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

interface ChangePasswordModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const logout = useAuthStore(state => state.logout);

	const passwordRule = { pattern: PASSWORD_REGEXP, message: t("form.password.invalid") };

	return (
		<ModalForm
			title={t("authority.changePassword")}
			open={open}
			onOpenChange={onOpenChange}
			modalProps={{ destroyOnClose: true, width: 420 }}
			onFinish={async (values) => {
				await authService.changePassword({
					oldPassword: values.currentPassword,
					newPassword: values.newPassword,
				});
				window.$message?.success(t("authority.changePasswordSuccess"));
				await logout();
				navigate(loginPath);
				return true;
			}}
		>
			<ProFormText.Password
				name="currentPassword"
				label={t("authority.currentPassword")}
				rules={[
					{ required: true, message: t("form.password.required") },
					passwordRule,
				]}
			/>
			<ProFormText.Password
				name="newPassword"
				label={t("authority.newPassword")}
				dependencies={["currentPassword"]}
				rules={[
					{ required: true, message: t("form.password.required") },
					passwordRule,
					({ getFieldValue }) => ({
						validator(_, value) {
							if (!value || getFieldValue("currentPassword") !== value)
								return Promise.resolve();
							return Promise.reject(t("authority.newPasswordSameAsOld"));
						},
					}),
				]}
			/>
			<ProFormText.Password
				name="confirmPassword"
				label={t("authority.confirmPassword")}
				dependencies={["newPassword"]}
				rules={[
					{ required: true, message: t("form.confirmPassword.required") },
					({ getFieldValue }) => ({
						validator(_, value) {
							if (!value || getFieldValue("newPassword") === value)
								return Promise.resolve();
							return Promise.reject(t("form.confirmPassword.invalid"));
						},
					}),
				]}
			/>
		</ModalForm>
	);
}
