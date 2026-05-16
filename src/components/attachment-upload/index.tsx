import type { FilePreviewModalRef } from "#src/components/file-preview-modal";
import type { AttachmentEntity, AttachmentUploadProps, AttachmentUploadRef, PendingItem, PendingStatus } from "./types";

import { attachmentService } from "#src/api/attachment";
import { FilePreviewModal } from "#src/components/file-preview-modal";
import { DeleteOutlined, EyeOutlined, LoadingOutlined, PaperClipOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, message, Tag, Upload } from "antd";
import * as React from "react";
import { useCallback, useImperativeHandle, useRef, useState } from "react";

// ─── Component ────────────────────────────────────────────────────────────────

import { useTranslation } from "react-i18next";

export type { AttachmentEntity, AttachmentUploadProps, AttachmentUploadRef };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function formatBytes(bytes: number): string {
	if (bytes < 1024)
		return `${bytes} B`;
	if (bytes < 1024 * 1024)
		return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let _uidCounter = 0;
function genUid(): string {
	return `att-${Date.now()}-${++_uidCounter}`;
}

export function AttachmentUpload({ ref, ...props }: AttachmentUploadProps & { ref?: React.RefObject<AttachmentUploadRef | null> }) {
	const { t } = useTranslation();
	const {
		value = [],
		onChange,
		mode = "auto",
		storagePath,
		multiple = true,
		accept = ".pdf,.docx,.xlsx,.pptx,.png,.jpg,.zip,.mp3,.mp4,.txt",
		maxCount,
		maxSize = DEFAULT_MAX_SIZE,
		disabled = false,
	} = props;

	const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
	const previewRef = useRef<FilePreviewModalRef>(null);

	// Refs để tránh stale closure bên trong callbacks
	const valueRef = useRef<AttachmentEntity[]>(value);
	valueRef.current = value;
	const pendingRef = useRef<PendingItem[]>(pendingItems);
	pendingRef.current = pendingItems;

	// ── Core upload ───────────────────────────────────────────────────────

	const uploadItem = useCallback(
		async (uid: string): Promise<AttachmentEntity | null> => {
			const item = pendingRef.current.find(p => p.uid === uid);
			if (!item)
				return null;

			setPendingItems(prev =>
				prev.map(p => p.uid === uid ? { ...p, status: "uploading" as PendingStatus, error: undefined } : p),
			);

			try {
				const attachment = await attachmentService.upload({ file: item.file, storagePath });
				setPendingItems(prev => prev.filter(p => p.uid !== uid));
				return attachment;
			}
			catch (err) {
				const errMsg = err instanceof Error ? err.message : t("common.error", "Upload thất bại");
				setPendingItems(prev =>
					prev.map(p => p.uid === uid ? { ...p, status: "error" as PendingStatus, error: errMsg } : p),
				);
				return null;
			}
		},
		[storagePath, t],
	);

	// ── Validate + enqueue ────────────────────────────────────────────────

	const enqueueFile = useCallback(
		(file: File): PendingItem | null => {
			if (file.size > maxSize) {
				message.error(`${file.name}: ${t("common.attachment.exceedsLimit", "vượt quá")} ${formatBytes(maxSize)}`);
				return null;
			}
			if (maxCount !== undefined) {
				const countPending = pendingRef.current.filter(p => p.status !== "error").length;
				const active = valueRef.current.length + countPending;
				if (active >= maxCount) {
					message.warning(`${t("common.attachment.maxAllowed", "Tối đa")} ${maxCount} file`);
					return null;
				}
			}
			const alreadyUploaded = valueRef.current.some(a => a.filename === file.name);
			const alreadyPending = pendingRef.current.some(p => p.status !== "error" && p.file.name === file.name);
			if (alreadyUploaded || alreadyPending) {
				message.warning(`"${file.name}" ${t("common.attachment.alreadyExists", "đã tồn tại")}`);
				return null;
			}
			return { uid: genUid(), file, status: "pending" };
		},
		[maxSize, maxCount, t],
	);

	// ── beforeUpload (gọi per-file bởi antd) ─────────────────────────────

	const handleBeforeUpload = useCallback(
		async (file: File) => {
			const item = enqueueFile(file);
			if (!item)
				return false;

			if (mode === "manual") {
				setPendingItems(prev => [...prev, item]);
				return false;
			}

			// auto: thêm vào list rồi upload ngay
			setPendingItems(prev => [...prev, item]);
			await Promise.resolve(); // flush state trước khi uploadItem đọc pendingRef

			const attachment = await uploadItem(item.uid);
			if (attachment) {
				onChange?.([...valueRef.current, attachment]);
			}
			return false;
		},
		[mode, enqueueFile, uploadItem, onChange],
	);

	// ── Retry ─────────────────────────────────────────────────────────────

	const handleRetry = useCallback(
		async (uid: string) => {
			const attachment = await uploadItem(uid);
			if (attachment) {
				onChange?.([...valueRef.current, attachment]);
			}
		},
		[uploadItem, onChange],
	);

	// ── Remove done / pending ─────────────────────────────────────────────

	const handleRemoveDone = useCallback(
		(id: string) => onChange?.(valueRef.current.filter(a => a.id !== id)),
		[onChange],
	);

	const handleRemovePending = useCallback(
		(uid: string) => setPendingItems(prev => prev.filter(p => p.uid !== uid)),
		[],
	);

	// ── sync() ────────────────────────────────────────────────────────────

	useImperativeHandle(ref, () => ({
		sync: async () => {
			const toUpload = pendingRef.current.filter(
				p => p.status === "pending" || p.status === "error",
			);
			if (toUpload.length === 0)
				return valueRef.current;

			const uploaded: AttachmentEntity[] = [];
			let failedCount = 0;

			await Promise.allSettled(
				toUpload.map(async (item) => {
					const result = await uploadItem(item.uid);
					if (result)
						uploaded.push(result);
					else
						failedCount++;
				}),
			);

			if (failedCount > 0) {
				message.error(`${failedCount} ${t("common.attachment.failToUpload", "file upload thất bại. Vui lòng thử lại.")}`);
				throw new Error("UPLOAD_FAILED");
			}

			if (uploaded.length > 0) {
				const next = [...valueRef.current, ...uploaded];
				onChange?.(next);
				return next;
			}
			return valueRef.current;
		},
	}), [uploadItem, onChange, t]);

	// ── Derived ───────────────────────────────────────────────────────────

	const activePendingCount = pendingItems.filter(p => p.status !== "error").length;
	const isAtLimit = maxCount !== undefined && value.length + activePendingCount >= maxCount;
	const showDropzone = !disabled && !isAtLimit;

	// ─── Render ───────────────────────────────────────────────────────────

	return (
		<>
			<div className="flex flex-col gap-2 w-full">
				{showDropzone && (
					<Upload.Dragger
						multiple={multiple}
						accept={accept}
						showUploadList={false}
						beforeUpload={handleBeforeUpload}
						disabled={disabled}
					>
						<p className="ant-upload-drag-icon">
							<UploadOutlined style={{ fontSize: 28 }} />
						</p>
						<p className="ant-upload-text text-sm">{t("common.attachment.dragText", "Kéo thả hoặc nhấn để chọn file")}</p>
						<p className="ant-upload-hint text-xs">
							{`${t("common.attachment.maxSize", "Tối đa")} ${formatBytes(maxSize)}/file`}
							{maxCount ? ` · ${t("common.attachment.maxCount", "tối đa")} ${maxCount} file` : ""}
						</p>
					</Upload.Dragger>
				)}

				{value.map(att => (
					<FileRow
						key={att.id}
						name={att.filename}
						size={att.size}
						status="done"
						previewUrl={att.url}
						disabled={disabled}
						onRemove={() => handleRemoveDone(att.id)}
						onPreview={att.url ? () => previewRef.current?.show(att.url, att.filename) : undefined}
						t={t}
					/>
				))}

				{pendingItems.map(item => (
					<FileRow
						key={item.uid}
						name={item.file.name}
						size={item.file.size}
						status={item.status}
						mode={mode}
						error={item.error}
						onRemove={item.status !== "uploading" ? () => handleRemovePending(item.uid) : undefined}
						onRetry={item.status === "error" ? () => handleRetry(item.uid) : undefined}
						t={t}
					/>
				))}
			</div>
			<FilePreviewModal ref={previewRef} />
		</>
	);
}

// ─── FileRow ──────────────────────────────────────────────────────────────────

interface FileRowProps {
	name: string
	size: number
	status: "done" | PendingStatus
	mode?: "auto" | "manual"
	previewUrl?: string
	error?: string
	disabled?: boolean
	onRemove?: () => void
	onRetry?: () => void
	onPreview?: () => void
	t: any
}

function FileRow({ name, size, status, mode, previewUrl, error, disabled, onRemove, onRetry, onPreview, t }: FileRowProps) {
	return (
		<div className="flex flex-col gap-1 px-3 py-2 rounded border border-dashed">
			<div className="flex items-center gap-2">
				{status === "uploading"
					? <LoadingOutlined className="text-blue-500 shrink-0" />
					: <PaperClipOutlined className="text-gray-400 shrink-0" />}

				<span className="flex-1 text-sm truncate min-w-0">{name}</span>
				<span className="text-xs text-gray-400 shrink-0">{formatBytes(size)}</span>

				{status === "done" && <Tag color="success" className="m-0 shrink-0">{t("common.attachment.statusDone", "Đã upload")}</Tag>}
				{status === "pending" && (
					<Tag color="default" className="m-0 shrink-0">
						{mode === "manual" ? t("common.attachment.statusPendingSync", "Chờ sync") : t("common.attachment.statusPending", "Đang chờ")}
					</Tag>
				)}
				{status === "uploading" && <Tag color="processing" className="m-0 shrink-0">{t("common.attachment.statusUploading", "Đang upload")}</Tag>}
				{status === "error" && <Tag color="error" className="m-0 shrink-0">{t("common.error", "Lỗi")}</Tag>}

				<div className="flex gap-1 shrink-0">
					{previewUrl && (
						<Button type="text" size="small" icon={<EyeOutlined />} onClick={onPreview} />
					)}
					{onRetry && (
						<Button type="text" size="small" onClick={onRetry}>{t("common.attachment.retry", "Thử lại")}</Button>
					)}
					{onRemove && !disabled && (
						<Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={onRemove} />
					)}
				</div>
			</div>

			{status === "error" && error && (
				<span className="text-xs text-red-500 pl-5">{error}</span>
			)}
		</div>
	);
}
