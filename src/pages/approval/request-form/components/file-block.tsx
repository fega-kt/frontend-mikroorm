import type { RequestFileCategory } from "#src/api/approval-request";
import type { FileBlockConfig } from "#src/api/setting/request-type/types";
import type { AttachmentUploadRef } from "#src/components/attachment-upload";
import type { FileViewTarget } from "#src/components/file-viewer";
import { approvalRequestService } from "#src/api/approval-request";
import { FileContextType, fileViewService } from "#src/api/file-view";
import { AttachmentUpload } from "#src/components/attachment-upload";
import { FileViewer } from "#src/components/file-viewer";
import { STORAGE_PATH } from "#src/constants/storage-path";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Form, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { acceptFor, blockSummary } from "../../lib/files";
import { NumberedCard } from "./numbered-card";

interface FileBlockProps {
	index: number
	name: RequestFileCategory
	/** Id phiếu (đã có hoặc sinh sẵn ở client) — tệp upload vào Attachments/{requestId}/{name}/ */
	requestId: string
	config: FileBlockConfig
	disabled?: boolean
	/** Tệp chỉ được tải lên khi gọi uploadRef.current.sync() (lúc bấm Lưu nháp / Gửi) */
	uploadRef: React.RefObject<AttachmentUploadRef | null>
}

/** Một khối tệp (Văn bản tờ trình / Tài liệu đính kèm) theo cấu hình của loại tờ trình */
export function FileBlock({ index, name, requestId, config, disabled, uploadRef }: FileBlockProps) {
	const { t } = useTranslation();
	const [viewing, setViewing] = useState<FileViewTarget | null>(null);
	return (
		<>
			<NumberedCard
				index={index}
				title={(
					<>
						{t(`approval.files.${name}`)}
						{config.required && <span className="ml-1 text-[#c62828]">*</span>}
					</>
				)}
				extra={(
					<span className="flex items-center gap-1.5">
						<InfoCircleOutlined />
						{blockSummary(config, t)}
					</span>
				)}
			>
				<Form.Item name={name} noStyle>
					<AttachmentUpload
						ref={uploadRef}
						mode="manual"
						storagePath={STORAGE_PATH.ATTACHMENTS}
						presign={file => approvalRequestService.fetchPresignFileUpload(requestId, name, file)}
						onViewFile={file => setViewing({ contextType: FileContextType.ApprovalRequest, fileId: file.id, filename: file.filename })}
						onDownloadFile={file => fileViewService.download(FileContextType.ApprovalRequest, file.id)}
						accept={acceptFor(config.fileTypes)}
						maxCount={config.maxFiles}
						maxSize={config.maxSizeMb * 1024 * 1024}
						disabled={disabled}
					/>
				</Form.Item>
				{config.hint && <Typography.Text type="secondary" className="mt-2 block text-xs">{config.hint}</Typography.Text>}
			</NumberedCard>
			<FileViewer target={viewing} onClose={() => setViewing(null)} />
		</>
	);
}
