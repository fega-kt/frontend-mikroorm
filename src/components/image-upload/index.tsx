import type { FormItemProps } from "antd";
import { attachmentService } from "#src/api/attachment";
import { DeleteOutlined, EyeOutlined, LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { ProFormItem } from "@ant-design/pro-components";
import { Image, Upload } from "antd";
import * as React from "react";
import { useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const ACCEPT = ".jpg,.jpeg,.png,.svg";
const MAX_SIZE = 5 * 1024 * 1024;

export interface ImageUploadRef {
	hasPending: boolean
	uploadedUrl: string | null
	flush: () => Promise<string | undefined>
}

export interface ImageUploadProps {
	value?: string
	onChange?: (url: string | undefined) => void
	storagePath?: string
	disabled?: boolean
	uploadRef?: React.RefObject<ImageUploadRef | null>
}

export function ImageUpload({ value, onChange, storagePath, disabled, uploadRef }: ImageUploadProps) {
	const { t } = useTranslation();
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [previewSrc, setPreviewSrc] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const pendingFileRef = useRef<File | null>(null);
	const uploadedUrlRef = useRef<string | null>(null);

	useImperativeHandle(uploadRef, () => ({
		get hasPending() { return pendingFileRef.current !== null; },
		get uploadedUrl() { return uploadedUrlRef.current; },
		flush: async () => {
			if (!pendingFileRef.current)
				return value;
			setUploading(true);
			try {
				const attachment = await attachmentService.upload({ file: pendingFileRef.current, storagePath });
				setPendingFile(null);
				pendingFileRef.current = null;
				uploadedUrlRef.current = attachment.url;
				setPreviewSrc(attachment.url);
				return attachment.url;
			}
			finally {
				setUploading(false);
			}
		},
	}));

	const handleBeforeUpload = (file: File) => {
		if (file.size > MAX_SIZE) {
			window.$message?.error(`${file.name}: ${t("common.attachment.exceedsLimit", "File too large")} (5 MB)`);
			return false;
		}
		const objectUrl = URL.createObjectURL(file);
		if (previewSrc)
			URL.revokeObjectURL(previewSrc);
		setPendingFile(file);
		pendingFileRef.current = file;
		setPreviewSrc(objectUrl);
		return false;
	};

	const handleRemove = () => {
		if (previewSrc)
			URL.revokeObjectURL(previewSrc);
		setPendingFile(null);
		pendingFileRef.current = null;
		setPreviewSrc(null);
		onChange?.(undefined);
	};

	const displaySrc = previewSrc ?? value;

	if (displaySrc) {
		return (
			<>
				<Upload
					accept={ACCEPT}
					showUploadList={false}
					beforeUpload={handleBeforeUpload}
					disabled={disabled || uploading}
				>
					<div className="relative w-20 h-20 rounded-lg border border-dashed overflow-hidden group cursor-pointer">
						<img src={displaySrc} alt="icon" className="w-full h-full object-contain p-1" />
						{uploading && (
							<div className="absolute inset-0 flex items-center justify-center bg-white/70">
								<LoadingOutlined className="text-blue-500" />
							</div>
						)}
						{!disabled && !uploading && (
							<div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
								{!pendingFile && (
									<EyeOutlined
										className="text-white text-sm"
										onClick={(e) => {
											e.stopPropagation();
											setPreviewOpen(true);
										}}
									/>
								)}
								<DeleteOutlined
									className="text-white text-sm"
									onClick={(e) => {
										e.stopPropagation();
										handleRemove();
									}}
								/>
							</div>
						)}
					</div>
				</Upload>
				{!pendingFile && (
					<Image
						src={value}
						style={{ display: "none" }}
						preview={{ visible: previewOpen, onVisibleChange: setPreviewOpen }}
					/>
				)}
			</>
		);
	}

	return (
		<Upload
			accept={ACCEPT}
			showUploadList={false}
			beforeUpload={handleBeforeUpload}
			disabled={disabled}
		>
			<div className="flex flex-col items-center justify-center w-20 h-20 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:text-blue-400 transition-colors text-gray-400">
				<PlusOutlined className="text-lg" />
				<span className="text-xs mt-1">{t("common.upload", "Tải lên")}</span>
			</div>
		</Upload>
	);
}

export interface ProFormImageUploadProps extends Omit<FormItemProps, "children"> {
	name: string
	storagePath?: string
	uploadRef?: React.RefObject<ImageUploadRef | null>
	fieldProps?: Omit<ImageUploadProps, "value" | "onChange" | "uploadRef">
}

export function ProFormImageUpload({ name, label, rules, storagePath, uploadRef, fieldProps, ...rest }: ProFormImageUploadProps) {
	return (
		<ProFormItem name={name} label={label} rules={rules} {...rest}>
			<ImageUpload storagePath={storagePath} uploadRef={uploadRef} {...fieldProps} />
		</ProFormItem>
	);
}
