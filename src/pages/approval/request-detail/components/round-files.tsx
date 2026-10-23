import type { ApprovalRequestDetail, RequestArchiveKind, RoundFileItem } from "#src/api/approval-request";
import type { MenuProps } from "antd";
import type { RequestFile } from "./request-file-list";
import { approvalRequestService, ApprovalRequestStatus } from "#src/api/approval-request";
import { isConvertibleToPdf } from "#src/api/file-view";
import { SectionCard } from "#src/components/section-card";
import { formatBytes } from "#src/utils/format-bytes";
import { DownloadOutlined, DownOutlined, ExclamationCircleOutlined, FilePdfOutlined, PaperClipOutlined, SafetyCertificateOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Dropdown, theme, Tooltip, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { extOf, fileListSummary } from "../../lib/files";
import { DocumentSignatures } from "./document-signatures";
import { FileBadge } from "./request-file-list";

const { Text } = Typography;

interface FileActions {
	downloadingId?: string | null
	onView: (file: RequestFile) => void
	onDownload: (file: RequestFile) => void
	onDownloadPdf: (file: RequestFile) => void
}

interface RoundFilesProps extends FileActions {
	detail: ApprovalRequestDetail
}

/** Một tệp: ô loại tệp, tên (bấm để xem), dung lượng, nút tải */
function FileCell({ file, downloadingId, onView, onDownload, onDownloadPdf }: FileActions & { file: RequestFile }) {
	const { t } = useTranslation();
	return (
		<div className="flex min-w-0 items-center gap-2.5">
			<FileBadge filename={file.filename} size="middle" />
			<div className="flex min-w-0 flex-1 flex-col">
				<Typography.Link ellipsis className="text-sm" onClick={() => onView(file)}>{file.filename}</Typography.Link>
				<Text type="secondary" className="text-xs">{formatBytes(file.size)}</Text>
			</div>
			{isConvertibleToPdf(file.filename) && (
				<Tooltip title={t("common.attachment.downloadPdf")}>
					<Button
						type="text"
						icon={<FilePdfOutlined className="!text-red-500" />}
						aria-label={t("common.attachment.downloadPdf")}
						loading={downloadingId === `${file.id}:pdf`}
						onClick={() => onDownloadPdf(file)}
					/>
				</Tooltip>
			)}
			<Tooltip title={t("approval.files.download")}>
				<Button
					type="text"
					icon={<DownloadOutlined />}
					aria-label={t("approval.files.download")}
					loading={downloadingId === file.id}
					onClick={() => onDownload(file)}
				/>
			</Tooltip>
		</div>
	);
}

/** Ô "Bản ký số" khi chưa có bản PDF riêng: đang chuyển / chuyển lỗi / chưa có */
function NoSignedVersion({ item }: { item: RoundFileItem }) {
	const { t } = useTranslation();
	const [icon, label] = item.convertStatus === "pending"
		? [<SyncOutlined key="i" spin />, t("approval.files.converting")]
		: item.convertStatus === "failed"
			? [<ExclamationCircleOutlined key="i" />, t("approval.files.convertFailed")]
			: [null, t("approval.files.noSignedVersion")];
	return (
		<Text type="secondary" className="flex min-h-8 items-center gap-2 text-[13px]">
			{icon}
			{label}
		</Text>
	);
}

/** Danh sách tệp đơn giản (tài liệu đính kèm, bộ tệp đang soạn) */
function FileList({ files, ...actions }: FileActions & { files: RequestFile[] }) {
	return (
		<ul className="m-0 flex list-none flex-col p-0">
			{files.map(file => (
				<li key={file.id} className="rounded-lg px-3 py-2 transition-colors hover:bg-colorFillTertiary">
					<FileCell file={file} {...actions} />
				</li>
			))}
		</ul>
	);
}

/**
 * Tab Tệp: chỉ bộ tệp đang dùng — đang soạn / bị trả lại là bộ tệp người trình đang sửa, còn lại là bộ tệp của vòng hiện tại.
 * Văn bản tờ trình là bảng Tệp gốc | Bản ký số (bản cuối: PDF chuyển đổi / bản ký mới nhất); tình trạng chữ ký xem ở hộp riêng.
 */
export function RoundFiles({ detail, ...actions }: RoundFilesProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [statusFiles, setStatusFiles] = useState<RequestFile[] | null>(null);
	const [archiving, setArchiving] = useState(false);

	const editing = [ApprovalRequestStatus.Draft, ApprovalRequestStatus.Returned].includes(detail.status);
	const round = editing ? undefined : detail.rounds?.find(item => item.round === detail.round);
	const documents: RoundFileItem[] = round?.documents ?? detail.documents.map(original => ({ original, current: null, signatureCount: 0 }));
	const attachments = round?.attachments.map(item => item.original) ?? detail.attachments;
	const hasFiles = documents.length > 0 || attachments.length > 0;
	// Văn bản có chữ ký để xem: bản PDF riêng, hoặc chính tệp gốc nếu đã là PDF
	const pdfFiles = documents.map(item => item.current ?? item.original).filter(file => extOf(file.filename) === "pdf");
	// Chỉ hiện cột "Bản ký số" khi quy trình có bước bắt buộc ký (hoặc văn bản đã có bản ký / bản chuyển đổi từ trước)
	const signing = !editing && (
		!!detail.definition?.nodes.some(node => "options" in node && node.options.requireSignature)
		|| documents.some(item => item.current || item.signatureCount > 0 || item.convertStatus)
	);

	const downloadAll = async (kind: RequestArchiveKind) => {
		setArchiving(true);
		try {
			await approvalRequestService.downloadArchive(detail.id, kind);
		}
		catch {
			// Lỗi đã được interceptor hiển thị
		}
		finally {
			setArchiving(false);
		}
	};

	const archiveMenu: MenuProps["items"] = [
		{
			key: "signed",
			label: (
				<div className="flex flex-col">
					<span>{t("approval.files.downloadSigned")}</span>
					<Text type="secondary" className="text-xs">{t("approval.files.downloadSignedHint")}</Text>
				</div>
			),
			onClick: () => downloadAll("signed"),
		},
		{
			key: "original",
			label: (
				<div className="flex flex-col">
					<span>{t("approval.files.downloadOriginal")}</span>
					<Text type="secondary" className="text-xs">{t("approval.files.downloadOriginalHint")}</Text>
				</div>
			),
			onClick: () => downloadAll("original"),
		},
	];

	const toolbar = hasFiles && (
		<div className="flex flex-wrap items-center gap-1">
			{!signing
				? (
					<Button type="text" size="small" icon={<DownloadOutlined />} loading={archiving} onClick={() => downloadAll("original")}>
						{t("approval.files.downloadAll")}
					</Button>
				)
				: (
					<Dropdown menu={{ items: archiveMenu }} trigger={["click"]} placement="bottomRight">
						<Button type="text" size="small" icon={<DownloadOutlined />} loading={archiving}>
							{t("approval.files.downloadAll")}
							<DownOutlined className="text-[10px]" />
						</Button>
					</Dropdown>
				)}
			{signing && pdfFiles.length > 0 && (
				<Button type="text" size="small" icon={<SafetyCertificateOutlined />} onClick={() => setStatusFiles(pdfFiles)}>
					{t("approval.files.signingStatus")}
				</Button>
			)}
		</div>
	);

	const sources = documents.map(item => item.original);
	const rowBorder = { borderBottom: `1px solid ${token.colorBorderSecondary}` };

	return (
		<div className="flex flex-col gap-4">
			<SectionCard
				icon={<PaperClipOutlined />}
				title={(
					<span className="flex flex-wrap items-baseline gap-x-3">
						{t("approval.files.documents")}
						{sources.length > 0 && <Text type="secondary" className="text-[13px] font-normal">{fileListSummary(sources, t)}</Text>}
					</span>
				)}
				extra={toolbar}
				bodyClassName={documents.length ? (signing ? "p-0" : "px-2 py-2") : undefined}
			>
				{!documents.length && <Text type="secondary">{t("common.noData")}</Text>}
				{documents.length > 0 && !signing && <FileList files={sources} {...actions} />}
				{documents.length > 0 && signing && (
					<div className="flex flex-col">
						<div className="grid grid-cols-2 gap-x-6 px-5 py-2.5 text-[13px] font-semibold max-sm:hidden" style={{ ...rowBorder, color: token.colorTextSecondary }}>
							<span>{t("approval.files.originalColumn")}</span>
							<span>{t("approval.files.signedColumn")}</span>
						</div>
						{documents.map((item, index) => (
							<div
								key={item.original.id}
								className="grid grid-cols-1 gap-x-6 gap-y-2 px-5 py-3 sm:grid-cols-2"
								style={index < documents.length - 1 ? rowBorder : undefined}
							>
								<FileCell file={item.original} {...actions} />
								{item.current ? <FileCell file={item.current} {...actions} /> : <NoSignedVersion item={item} />}
							</div>
						))}
					</div>
				)}
			</SectionCard>

			{/* Không có tài liệu đính kèm thì bỏ hẳn khối */}
			{attachments.length > 0 && (
				<SectionCard
					icon={<PaperClipOutlined />}
					title={t("approval.files.attachments")}
					extra={<Text type="secondary" className="text-[13px]">{fileListSummary(attachments, t)}</Text>}
					bodyClassName="px-2 py-2"
				>
					<FileList files={attachments} {...actions} />
				</SectionCard>
			)}

			<DocumentSignatures requestId={detail.id} files={statusFiles} onClose={() => setStatusFiles(null)} />
		</div>
	);
}
