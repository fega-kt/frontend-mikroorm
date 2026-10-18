import type { PdfSignatureStatus } from "#src/api/signing-certificate";
import type { RequestFile } from "./request-file-list";
import { approvalRequestService } from "#src/api/approval-request";
import { CheckCircleFilled, CloseCircleFilled, DownOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Alert, Modal, Skeleton, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DATE_TIME_FORMAT } from "../../lib/payload";
import { FileBadge } from "./request-file-list";

const { Text } = Typography;

/** Khung chờ: 2 dòng, mỗi cột một thanh dài vừa nội dung thường gặp */
const SKELETON_ROWS = 2;
const SKELETON_WIDTHS = ["70%", "60%", "55%", "80%"];

const GRID = "grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1.4fr)] gap-x-4";

interface FileGroupProps {
	requestId: string
	file: RequestFile
}

/** Một văn bản: đọc chữ ký thật trong PDF (người ký, toàn vẹn, chứng thư còn hiệu lực) */
function FileGroup({ requestId, file }: FileGroupProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [open, setOpen] = useState(true);
	const { data, loading, error } = useRequest(() => approvalRequestService.fetchSignatures(requestId, file.id), { refreshDeps: [file.id] });

	const icon: Record<PdfSignatureStatus, React.ReactNode> = {
		valid: <CheckCircleFilled style={{ color: token.colorSuccess }} />,
		revoked: <ExclamationCircleFilled style={{ color: token.colorWarning }} />,
		untrusted: <ExclamationCircleFilled style={{ color: token.colorWarning }} />,
		tampered: <CloseCircleFilled style={{ color: token.colorError }} />,
	};

	return (
		<div className="flex flex-col">
			<button
				type="button"
				aria-expanded={open}
				onClick={() => setOpen(value => !value)}
				className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-0 pb-1.5 pt-3 text-left font-semibold"
				style={{ color: token.colorText }}
			>
				<DownOutlined className="text-[11px] transition-transform" style={{ transform: open ? undefined : "rotate(-90deg)" }} />
				<FileBadge filename={file.filename} size="small" />
				<span className="min-w-0 truncate">{file.filename}</span>
			</button>
			{open && (
				<div className="pl-7">
					{/* Khung chờ đúng hình dòng chữ ký: tải xong nội dung hiện ra tại chỗ, không giật */}
					{loading && Array.from({ length: SKELETON_ROWS }, (_, row) => (
						<div key={row} className={`${GRID} items-center py-2.5`} style={{ borderBottom: `1px solid ${token.colorFillTertiary}` }}>
							{SKELETON_WIDTHS.map(width => (
								<Skeleton.Input key={width} active size="small" className="!h-4 !min-w-0" style={{ width, height: 16 }} />
							))}
						</div>
					))}
					{!loading && error && <Alert type="error" showIcon message={t("approval.signatures.loadError")} />}
					{!loading && !error && !data?.length && <Text type="secondary" className="block py-2">{t("approval.signatures.none")}</Text>}
					{!loading && data?.map(signature => (
						<div key={signature.id} className={`${GRID} items-start py-2`} style={{ borderBottom: `1px solid ${token.colorFillTertiary}` }}>
							<Text>{signature.signerName ?? t("approval.signatures.unknownSigner")}</Text>
							<Text type="secondary">{signature.step || "—"}</Text>
							<div className="flex flex-col gap-0.5">
								<span className="flex items-center gap-1.5">
									{icon[signature.status]}
									<Text>{t(`approval.signatures.state.${signature.status}`)}</Text>
								</span>
								{signature.revokedAt && (
									<Text type="secondary" className="text-xs">{t("approval.signatures.revokedAt", { date: dayjs(signature.revokedAt).format(DATE_TIME_FORMAT) })}</Text>
								)}
								{signature.error && <Text type="secondary" className="text-xs">{signature.error}</Text>}
							</div>
							<Text type="secondary">{signature.signedAt ? dayjs(signature.signedAt).format(DATE_TIME_FORMAT) : "—"}</Text>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

interface DocumentSignaturesProps {
	requestId: string
	/** Các văn bản PDF cần xem chữ ký; null = đóng hộp */
	files: RequestFile[] | null
	onClose: () => void
}

/** "Tình trạng ký số": chữ ký trên từng văn bản PDF của tờ trình, gom theo văn bản */
export function DocumentSignatures({ requestId, files, onClose }: DocumentSignaturesProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	return (
		<Modal open={!!files} title={t("approval.signatures.statusTitle")} footer={null} onCancel={onClose} destroyOnHidden width={820}>
			<div className="overflow-x-auto">
				<div className="min-w-[620px]">
					<div className={`${GRID} py-2.5 pl-7 text-[13px] font-semibold`} style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, color: token.colorTextSecondary }}>
						<span>{t("approval.signatures.signer")}</span>
						<span>{t("approval.signatures.step")}</span>
						<span>{t("approval.signatures.status")}</span>
						<span>{t("approval.signatures.signedAt")}</span>
					</div>
					{files?.length
						? files.map(file => <FileGroup key={file.id} requestId={requestId} file={file} />)
						: <Text type="secondary" className="block py-4">{t("approval.signatures.none")}</Text>}
				</div>
			</div>
		</Modal>
	);
}
