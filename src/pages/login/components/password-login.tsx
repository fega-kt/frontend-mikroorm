import type { LoginInfo } from "#src/api/user";

import { authProvider } from "#src/api/auth";
import { BasicButton } from "#src/components/basic-button";
import { PASSWORD_RULES, USERNAME_RULES } from "#src/constants/rules";
import { useAuthStore } from "#src/store/auth";

import {
	Button,
	Divider,
	Form,
	Input,
	message,
	Space,
} from "antd";
import { use, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";

import { FormModeContext } from "../form-mode-context";

const FORM_INITIAL_VALUES: LoginInfo = {
	username: "",
	password: "",
};

export function PasswordLogin() {
	const [loading, setLoading] = useState(false);
	const [passwordLoginForm] = Form.useForm();
	const { t } = useTranslation();
	const [messageLoadingApi, contextLoadingHolder] = message.useMessage();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const login = useAuthStore(state => state.login);
	const { setFormMode } = use(FormModeContext);

	const handleFinish = async (values: LoginInfo) => {
		setLoading(true);
		messageLoadingApi?.loading(t("authority.loginInProgress"), 0);

		try {
			const res = await login(values);

			if (res.error) {
				throw res.error;
			}
			messageLoadingApi?.destroy();

			window.$message?.success(t("authority.loginSuccess"));
			const redirect = searchParams.get("redirect");
			if (redirect) {
				navigate(`/${redirect.slice(1)}`);
			}
			else {
				navigate(import.meta.env.VITE_BASE_HOME_PATH);
			}
		}
		catch {
			messageLoadingApi?.destroy();
			window.$message?.error(t("authority.loginFail"));
		}
		finally {
			messageLoadingApi?.destroy();
			// Prevent multiple requests from being made by clicking the login button
			setTimeout(() => {
				window.$message?.destroy();
				setLoading(false);
			}, 1000);
		}
	};

	return (
		<>
			{contextLoadingHolder}
			<Space orientation="vertical">
				<h2 className="text-colorText mb-3 text-3xl font-bold leading-9 tracking-tight lg:text-4xl">
					{t("authority.welcomeBack")}
					&nbsp;
					👏
				</h2>
				<p className="lg:text-base text-sm text-colorTextSecondary">
					{t("authority.loginDescription")}
				</p>
			</Space>

			<Form
				name="passwordLoginForm"
				form={passwordLoginForm}
				layout="vertical"
				initialValues={FORM_INITIAL_VALUES}
				onFinish={handleFinish}
			>
				<Form.Item
					label={t("authority.username")}
					name="username"
					rules={USERNAME_RULES(t)}
				>
					<Input placeholder={t("form.username.required")} />
				</Form.Item>

				<Form.Item
					label={t("authority.password")}
					name="password"
					rules={PASSWORD_RULES(t)}
				>
					<Input.Password placeholder={t("form.password.required")} />
				</Form.Item>

				<Form.Item>
					<div className="flex justify-between mb-5 -mt-1 text-sm">
						<BasicButton
							type="link"
							className="p-0"
							onPointerDown={() => {
								setFormMode("codeLogin");
							}}
						>
							{t("authority.codeLogin")}
						</BasicButton>
						<BasicButton
							type="link"
							className="p-0"
							onPointerDown={() => {
								setFormMode("forgotPassword");
							}}
						>
							{t("authority.forgotPassword")}
						</BasicButton>
					</div>
					<Button block type="primary" htmlType="submit" loading={loading}>
						{t("authority.login")}
					</Button>
				</Form.Item>

				<div className="text-sm text-center">
					{t("authority.noAccountYet")}
					<BasicButton
						type="link"
						className="px-1"
						onPointerDown={() => {
							window.$message?.info(t("authority.registerContactAdmin"));
						}}
					>
						{t("authority.goToRegister")}
					</BasicButton>
				</div>
			</Form>

			{authProvider.loginWithGoogle && (
				<>
					<Divider plain className="text-colorTextTertiary! text-xs!">
						{t("authority.orContinueWith")}
					</Divider>
					<Button
						block
						size="large"
						icon={(
							<svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
								<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
								<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
								<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
								<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
							</svg>
						)}
						onClick={() => authProvider.loginWithGoogle?.()}
					>
						{t("authority.loginWithGoogle")}
					</Button>
				</>
			)}
		</>
	);
}
