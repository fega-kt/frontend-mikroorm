import type { PdfSignatureInfo } from "#src/api/signing-certificate";
import type { RequestFile } from "./request-file-list";
import { approvalRequestService } from "#src/api/approval-request";
import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Alert, Empty, Modal, Spin, Tag, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { DATE_TIME_FORMAT } from "../../lib/payload";

const { Text } = Typography;

interface DocumentSignaturesProps {
	requestId: string
	file: RequestFile | null
	onClose: () => void
}

/** Chữ ký hợp lệ: nội dung nguyên vẹn + chứng thư do CA nội bộ cấp (thu hồi sau khi ký chỉ cảnh báo) */
function verdict(signature: PdfSignatureInfo) {
	if (!signature.integrityValid)
		return "tampered" as const;
	if (!signature.certificateTrusted)
		return "untrusted" as const;
	return signature.revoked ? "revoked" as const : "valid" as const;
}

/** Các chữ ký số trên một văn bản PDF: ai ký, lúc nào, còn nguyên vẹn không */
export function DocumentSignatures({ requestId, file, onClose }: DocumentSignaturesProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { data, loading, error } = useRequest(
		() => approvalRequestService.fetchSignatures(requestId, file!.id),
		{ ready: !!file, refreshDeps: [file?.id] },
	);

	const icon = {
		valid: <CheckCircleFilled style={{ color: token.colorSuccess }} />,
		revoked: <ExclamationCircleFilled style={{ color: token.colorWarning }} />,
		untrusted: <ExclamationCircleFilled style={{ color: token.colorWarning }} />,
		tampered: <CloseCircleFilled style={{ color: token.colorError }} />,
	};
	const tagColor = { valid: "success", revoked: "warning", untrusted: "warning", tampered: "error" } as const;

	return (
		<Modal open={!!file} title={t("approval.signatures.title")} footer={null} onCancel={onClose} destroyOnHidden width={560}>
			{file && <Text type="secondary" className="mb-3 block text-[13px]">{file.filename}</Text>}
			{loading && <div className="flex justify-center py-8"><Spin /></div>}
			{!loading && error && <Alert type="error" showIcon message={t("approval.signatures.loadError")} />}
			{!loading && !error && !data?.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("approval.signatures.none")} />}
			{!loading && !!data?.length && (
				<ul className="m-0 flex list-none flex-col gap-2 p-0">
					{data.map((signature) => {
						const state = verdict(signature);
						return (
							<li key={signature.fieldName} className="flex gap-3 rounded-lg p-3" style={{ border: `1px solid ${token.colorBorderSecondary}` }}>
								<span className="pt-0.5 text-base">{icon[state]}</span>
								<div className="flex min-w-0 flex-1 flex-col gap-0.5">
									<div className="flex flex-wrap items-center gap-2">
										<Text strong>{signature.signerName ?? t("approval.signatures.unknownSigner")}</Text>
										<Tag className="m-0" bordered={false} color={tagColor[state]}>{t(`approval.signatures.state.${state}`)}</Tag>
									</div>
									<Text type="secondary" className="text-xs">
										{[
											signature.signedAt && dayjs(signature.signedAt).format(DATE_TIME_FORMAT),
											signature.reason,
											signature.placement && t("approval.sign.page", { page: signature.placement.page }),
										].filter(Boolean).join(" · ")}
									</Text>
									{state === "revoked" && signature.revokedAt && (
										<Text type="secondary" className="text-xs">{t("approval.signatures.revokedAt", { date: dayjs(signature.revokedAt).format(DATE_TIME_FORMAT) })}</Text>
									)}
									{state !== "valid" && state !== "revoked" && signature.error && <Text type="secondary" className="text-xs">{signature.error}</Text>}
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</Modal>
	);
}
