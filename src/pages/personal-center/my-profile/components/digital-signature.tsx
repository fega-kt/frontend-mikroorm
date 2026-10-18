import type { MySigningCertificate } from "#src/api/signing-certificate";
import { signingCertificateService, SigningCertificateStatus } from "#src/api/signing-certificate";
import { SignaturePad } from "#src/components/signature-pad";
import { LockOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Alert, Button, Descriptions, Divider, Form, Input, Popconfirm, Spin, Tag, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const { Text, Paragraph } = Typography;

const PIN_PATTERN = /^\d{6,12}$/;
const DATE_FORMAT = "DD/MM/YYYY";

const STATUS_COLOR: Record<SigningCertificateStatus, string> = {
	[SigningCertificateStatus.Pending]: "processing",
	[SigningCertificateStatus.Active]: "success",
	[SigningCertificateStatus.Rejected]: "error",
	[SigningCertificateStatus.Revoked]: "default",
};

/** Ô nhập PIN: chỉ số, ẩn ký tự */
function PinInput(props: React.ComponentProps<typeof Input.Password>) {
	return <Input.Password inputMode="numeric" autoComplete="new-password" maxLength={12} prefix={<LockOutlined />} {...props} />;
}

/** Trạng thái chứng thư hiển thị (đang dùng nhưng hết hạn → "hết hạn") */
function StatusTag({ certificate }: { certificate: MySigningCertificate }) {
	const { t } = useTranslation();
	if (certificate.expired)
		return <Tag color="warning">{t("personal-center.signature.status.expired")}</Tag>;
	return <Tag color={STATUS_COLOR[certificate.status]}>{t(`personal-center.signature.status.${certificate.status}`)}</Tag>;
}

/**
 * Chữ ký số của tôi: đăng ký (đặt PIN + ảnh chữ ký) → chờ quản trị duyệt → dùng để "Ký và duyệt".
 * PIN không lưu ở hệ thống (chỉ dùng để mở khóa ký), quên PIN thì phải nhờ quản trị thu hồi rồi đăng ký lại.
 */
export function DigitalSignature() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { data: certificate, loading, refresh } = useRequest(() => signingCertificateService.fetchMine());
	const [enrollForm] = Form.useForm<{ pin: string, confirmPin: string, signatureImage?: string | null }>();
	const [pinForm] = Form.useForm<{ oldPin: string, newPin: string, confirmPin: string }>();
	const [image, setImage] = useState<string | null>();
	const [busy, setBusy] = useState<"enroll" | "cancel" | "pin" | "image">();

	const run = async (kind: typeof busy, fn: () => Promise<unknown>, successKey: string) => {
		setBusy(kind);
		try {
			await fn();
			window.$message?.success(t(successKey));
			return true;
		}
		catch {
			// Lỗi đã được interceptor hiển thị
			return false;
		}
		finally {
			setBusy(undefined);
		}
	};

	const pinRules = [
		{ required: true, message: t("personal-center.signature.pinRequired") },
		{ pattern: PIN_PATTERN, message: t("personal-center.signature.pinInvalid") },
	];
	const confirmRule = (field: string) => ({ getFieldValue }: { getFieldValue: (name: string) => unknown }) => ({
		validator: (_: unknown, value: string) => (!value || value === getFieldValue(field)
			? Promise.resolve()
			: Promise.reject(new Error(t("personal-center.signature.pinMismatch")))),
	});

	if (loading && certificate === undefined)
		return <div className="flex justify-center py-16"><Spin /></div>;

	const canEnroll = !certificate || certificate.expired || [SigningCertificateStatus.Rejected, SigningCertificateStatus.Revoked].includes(certificate.status);
	const currentImage = image === undefined ? certificate?.signatureImage ?? null : image;

	const intro = (
		<Alert
			type="info"
			showIcon
			icon={<SafetyCertificateOutlined />}
			message={t("personal-center.signature.introTitle")}
			description={t("personal-center.signature.intro")}
		/>
	);

	if (!certificate || canEnroll) {
		return (
			<div className="flex flex-col gap-4">
				{intro}
				{certificate?.status === SigningCertificateStatus.Rejected && (
					<Alert type="error" showIcon message={t("personal-center.signature.rejected")} description={certificate.reviewNote || undefined} />
				)}
				{certificate?.status === SigningCertificateStatus.Revoked && (
					<Alert type="warning" showIcon message={t("personal-center.signature.revoked")} description={certificate.reviewNote || undefined} />
				)}
				{certificate?.expired && <Alert type="warning" showIcon message={t("personal-center.signature.expiredHint")} />}
				<Form
					form={enrollForm}
					layout="vertical"
					className="max-w-xl"
					onFinish={async (values) => {
						const ok = await run("enroll", () => signingCertificateService.fetchEnroll({ pin: values.pin, signatureImage: values.signatureImage }), "personal-center.signature.enrolled");
						if (ok) {
							enrollForm.resetFields();
							refresh();
						}
					}}
				>
					<div className="grid gap-x-4 sm:grid-cols-2">
						<Form.Item name="pin" label={t("personal-center.signature.pin")} rules={pinRules} extra={t("personal-center.signature.pinHint")}>
							<PinInput />
						</Form.Item>
						<Form.Item name="confirmPin" label={t("personal-center.signature.confirmPin")} dependencies={["pin"]} rules={[{ required: true, message: t("personal-center.signature.pinRequired") }, confirmRule("pin")]}>
							<PinInput />
						</Form.Item>
					</div>
					<Form.Item name="signatureImage" label={t("personal-center.signature.image")}>
						<SignaturePad />
					</Form.Item>
					<Button type="primary" htmlType="submit" loading={busy === "enroll"}>{t("personal-center.signature.enroll")}</Button>
				</Form>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{certificate.status === SigningCertificateStatus.Pending && (
				<Alert
					type="info"
					showIcon
					message={t("personal-center.signature.pendingTitle")}
					description={t("personal-center.signature.pendingHint")}
					action={(
						<Popconfirm title={t("personal-center.signature.cancelConfirm")} onConfirm={async () => (await run("cancel", () => signingCertificateService.fetchCancelMine(), "personal-center.signature.cancelled")) && refresh()}>
							<Button size="small" loading={busy === "cancel"}>{t("personal-center.signature.cancel")}</Button>
						</Popconfirm>
					)}
				/>
			)}

			<Descriptions size="small" column={{ xs: 1, sm: 2 }} bordered>
				<Descriptions.Item label={t("personal-center.signature.statusLabel")}><StatusTag certificate={certificate} /></Descriptions.Item>
				<Descriptions.Item label={t("personal-center.signature.registeredAt")}>{dayjs(certificate.createdAt).format(DATE_FORMAT)}</Descriptions.Item>
				{certificate.status === SigningCertificateStatus.Active && (
					<>
						<Descriptions.Item label={t("personal-center.signature.validity")}>
							{`${dayjs(certificate.notBefore).format(DATE_FORMAT)} – ${dayjs(certificate.notAfter).format(DATE_FORMAT)}`}
						</Descriptions.Item>
						<Descriptions.Item label={t("personal-center.signature.serial")}>
							<Text copyable className="font-mono text-xs">{certificate.serialNumber}</Text>
						</Descriptions.Item>
					</>
				)}
			</Descriptions>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="flex flex-col gap-2">
					<Text strong>{t("personal-center.signature.image")}</Text>
					<SignaturePad value={currentImage} onChange={setImage} />
					<div>
						<Button
							disabled={image === undefined}
							loading={busy === "image"}
							onClick={async () => (await run("image", () => signingCertificateService.fetchUpdateSignatureImage(currentImage), "personal-center.signature.imageSaved")) && setImage(undefined)}
						>
							{t("common.save")}
						</Button>
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<Text strong>{t("personal-center.signature.changePin")}</Text>
					<Form
						form={pinForm}
						layout="vertical"
						onFinish={async (values) => {
							if (await run("pin", () => signingCertificateService.fetchChangePin({ oldPin: values.oldPin, newPin: values.newPin }), "personal-center.signature.pinChanged"))
								pinForm.resetFields();
						}}
					>
						<Form.Item name="oldPin" label={t("personal-center.signature.oldPin")} rules={[{ required: true, message: t("personal-center.signature.pinRequired") }]}>
							<PinInput />
						</Form.Item>
						<Form.Item name="newPin" label={t("personal-center.signature.newPin")} rules={pinRules}>
							<PinInput />
						</Form.Item>
						<Form.Item name="confirmPin" label={t("personal-center.signature.confirmPin")} dependencies={["newPin"]} rules={[{ required: true, message: t("personal-center.signature.pinRequired") }, confirmRule("newPin")]}>
							<PinInput />
						</Form.Item>
						<Button htmlType="submit" loading={busy === "pin"}>{t("personal-center.signature.changePin")}</Button>
					</Form>
				</div>
			</div>

			<Divider className="my-0" />
			<Paragraph className="m-0 text-xs" style={{ color: token.colorTextTertiary }}>{t("personal-center.signature.forgotPin")}</Paragraph>
		</div>
	);
}
