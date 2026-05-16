import { authService } from "#src/api/auth";
import { BasicButton } from "#src/components/basic-button";

import { LeftOutlined } from "@ant-design/icons";
import { useCountDown } from "ahooks";
import {
	Button,
	Form,
	Input,
	message,
	Modal,
	Space,
	Typography,
} from "antd";
import { use, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormModeContext } from "../form-mode-context";

const { Title } = Typography;

export function ForgotPassword() {
	const [otpModalOpen, setOtpModalOpen] = useState(false);
	const [submittedEmail, setSubmittedEmail] = useState("");

	const [resendTargetDate, setResendTargetDate] = useState<number>(0);
	const [resendCountdown] = useCountDown({
		targetDate: resendTargetDate,
		onEnd: () => setResendTargetDate(0),
	});

	const [emailLoading, setEmailLoading] = useState(false);
	const [otpLoading, setOtpLoading] = useState(false);

	const [emailForm] = Form.useForm();
	const { t } = useTranslation();
	const { setFormMode } = use(FormModeContext);

	const handleEmailFinish = async ({ email }: { email: string }) => {
		setEmailLoading(true);
		try {
			await authService.forgotPassword({ email });
			setSubmittedEmail(email);
			setResendTargetDate(Date.now() + 1000 * 60);
			setOtpModalOpen(true);
		}
		catch {
			// error handled by request interceptor
		}
		finally {
			setEmailLoading(false);
		}
	};

	const handleOtpFinish = async ({ otp }: { otp: string }) => {
		setOtpLoading(true);
		try {
			await authService.verifyOtp({ email: submittedEmail, otp });
			message.success(t("authority.resetPasswordSuccess"));
			setOtpModalOpen(false);
			setFormMode("login");
		}
		catch {
			setOtpModalOpen(false);
		}
		finally {
			setOtpLoading(false);
		}
	};

	const handleResend = async () => {
		try {
			await authService.forgotPassword({ email: submittedEmail });
			setResendTargetDate(Date.now() + 1000 * 60);
			message.success(t("authority.otpResent"));
		}
		catch {
			// error handled by request interceptor
		}
	};

	const handleModalCancel = () => {
		setOtpModalOpen(false);
	};

	return (
		<>
			<Space orientation="vertical">
				<Title level={3}>
					{t("authority.forgotPassword")}
				</Title>
				<p className="text-xs opacity-80">
					{t("authority.forgotPasswordSubtitle")}
				</p>
			</Space>

			<Form
				name="forgotForm"
				form={emailForm}
				layout="vertical"
				onFinish={handleEmailFinish}
			>
				<Form.Item
					label={t("authority.email")}
					name="email"
					rules={[
						{ required: true },
						{ type: "email", message: t("form.email.invalid") },
					]}
				>
					<Input placeholder={t("form.email.required")} />
				</Form.Item>

				<Form.Item>
					<Button
						block
						type="primary"
						htmlType="submit"
						loading={emailLoading}
					>
						{t("authority.sendOtp")}
					</Button>
				</Form.Item>

				<div className="text-sm text-center">
					<BasicButton
						type="link"
						icon={<LeftOutlined />}
						className="px-1"
						onPointerDown={() => setFormMode("login")}
					>
						{t("common.back")}
					</BasicButton>
				</div>
			</Form>

			<Modal
				open={otpModalOpen}
				title={t("authority.enterOtpTitle")}
				footer={null}
				onCancel={handleModalCancel}
				destroyOnHidden
			>
				<p className="text-sm text-gray-500 mb-4">
					{t("authority.otpSubtitle", { email: submittedEmail })}
				</p>

				<div className="flex flex-col items-center gap-4">
					<div>
						<Input.OTP
							length={6}
							autoFocus
							disabled={otpLoading}
							onChange={(value) => {
								if (value.length === 6) {
									handleOtpFinish({ otp: value });
								}
							}}
						/>
					</div>

					{otpLoading && (
						<p className="text-xs text-gray-400">{t("authority.verifying")}</p>
					)}

					<BasicButton
						type="link"
						disabled={resendCountdown > 0}
						onClick={handleResend}
					>
						{resendCountdown > 0
							? t("authority.retryAfterText", { count: Math.floor(resendCountdown / 1000) })
							: t("authority.resendOtp")}
					</BasicButton>
				</div>
			</Modal>
		</>
	);
}
