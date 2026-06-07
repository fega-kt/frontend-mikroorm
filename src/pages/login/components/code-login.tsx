import { authProvider, authService } from "#src/api/auth";
import { BasicButton } from "#src/components/basic-button";
import { parseErrorMessage } from "#src/utils/request";

import { LeftOutlined } from "@ant-design/icons";
import { useCountDown } from "ahooks";
import {
	Button,
	Form,
	Input,
	Space,
	Typography,
} from "antd";
import { use, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";

import { FormModeContext } from "../form-mode-context";

const { Title } = Typography;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN_MS = 5 * 60 * 1000;

enum Step {
	Email = "email",
	Otp = "otp",
}

export function CodeLogin() {
	const [step, setStep] = useState(Step.Email);
	const [email, setEmail] = useState("");
	const [otpValue, setOtpValue] = useState("");
	const [sendLoading, setSendLoading] = useState(false);
	const [verifyLoading, setVerifyLoading] = useState(false);
	const [sendBlocked, setSendBlocked] = useState(false);

	const [resendTargetDate, setResendTargetDate] = useState(0);
	const [resendCountdown] = useCountDown({
		targetDate: resendTargetDate,
		onEnd: () => setResendTargetDate(0),
	});

	const { t } = useTranslation();
	const { setFormMode } = use(FormModeContext);
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const startCooldown = () => setResendTargetDate(Date.now() + RESEND_COOLDOWN_MS);

	const handleSendOtp = async ({ email: emailValue }: { email: string }) => {
		setSendLoading(true);
		try {
			await authService.sendOtp({ email: emailValue });
			setEmail(emailValue);
			startCooldown();
			setStep(Step.Otp);
		}
		catch (err) {
			const msg = await parseErrorMessage(err);
			if (msg && /too many otp requests/i.test(msg)) {
				setSendBlocked(true);
			}
		}
		finally {
			setSendLoading(false);
		}
	};

	const handleVerifyOtp = async (otp: string) => {
		setVerifyLoading(true);
		try {
			const result = await authService.otpLogin({ email, otp });
			await authProvider.setSession({
				access_token: result.access_token,
				refresh_token: result.refresh_token,
			});
			window.$message?.success(t("authority.loginSuccess"));
			const redirect = searchParams.get("redirect");
			navigate(redirect ? `/${redirect.slice(1)}` : import.meta.env.VITE_BASE_HOME_PATH);
		}
		catch (err) {
			const msg = await parseErrorMessage(err);
			setOtpValue("");
			if (msg && (/expired or not found/i.test(msg) || /too many failed/i.test(msg))) {
				setStep(Step.Email);
			}
		}
		finally {
			setVerifyLoading(false);
		}
	};

	const handleResend = async () => {
		try {
			await authService.sendOtp({ email });
			startCooldown();
			window.$message?.success(t("authority.otpResent"));
		}
		catch (err) {
			const msg = await parseErrorMessage(err);
			if (msg && /already sent/i.test(msg)) {
				startCooldown();
			}
		}
	};

	return (
		<>
			<Space orientation="vertical">
				<Title level={3}>
					{t("authority.codeLogin")}
				</Title>
				<p className="text-xs opacity-80">
					{t("authority.codeLoginSubtitle")}
				</p>
			</Space>

			{step === Step.Email
				? (
					<Form layout="vertical" onFinish={handleSendOtp}>
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
								loading={sendLoading}
								disabled={sendBlocked}
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
				)
				: (
					<div>
						<p className="text-sm text-colorTextSecondary mb-6">
							{t("authority.otpSubtitle", { email })}
						</p>

						<div className="flex flex-col items-center gap-4">
							<Input.OTP
								length={OTP_LENGTH}
								autoFocus
								value={otpValue}
								disabled={verifyLoading}
								onChange={(value) => {
									setOtpValue(value);
									if (value.length === OTP_LENGTH)
										handleVerifyOtp(value);
								}}
							/>

							{verifyLoading && (
								<p className="text-xs text-colorTextTertiary">{t("authority.verifying")}</p>
							)}

							<BasicButton
								type="link"
								disabled={resendCountdown > 0}
								onClick={handleResend}
							>
								{resendCountdown > 0
									? t("authority.retryAfterText", { count: Math.ceil(resendCountdown / 1000) })
									: t("authority.resendOtp")}
							</BasicButton>
						</div>

						<div className="text-sm text-center mt-4">
							<BasicButton
								type="link"
								icon={<LeftOutlined />}
								className="px-1"
								onPointerDown={() => setStep(Step.Email)}
							>
								{t("common.back")}
							</BasicButton>
						</div>
					</div>
				)}
		</>
	);
}
