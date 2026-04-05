import { userService } from "#src/api/user";
import { useUserStore } from "#src/store/user";
import { LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import { Avatar, Button, message, Spin, theme, Upload } from "antd";
import ImgCrop from "antd-img-crop";
import * as React from "react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface FormAvatarItemProps {
	value?: string | File
	onChange?: (value: any) => void
}

/**
 * FormAvatarItem
 * Now supports immediate "Upload on Change" logic and theme-aware styling.
 */
function FormAvatarItemBase({ value, onChange }: FormAvatarItemProps) {
	const { t } = useTranslation();
	const currentUser = useUserStore();
	const { token } = theme.useToken();
	const [uploading, setUploading] = useState(false);
	const lastProcessedRef = useRef<{ file: File | null, url: string | undefined }>({ file: null, url: undefined });

	const previewSrc = useMemo(() => {
		if (typeof value === "string") {
			return value;
		}
		if (value instanceof File) {
			const cache = lastProcessedRef.current;
			if (value === cache.file && cache.url) {
				return cache.url;
			}
			if (cache.url?.startsWith("blob:")) {
				URL.revokeObjectURL(cache.url);
			}
			const newUrl = URL.createObjectURL(value);
			lastProcessedRef.current = { file: value, url: newUrl };
			return newUrl;
		}
		return undefined;
	}, [value]);

	useEffect(() => {
		return () => {
			const { url } = lastProcessedRef.current;
			if (url?.startsWith("blob:")) {
				URL.revokeObjectURL(url);
			}
		};
	}, []);

	// Handle immediate upload when a file is selected and cropped
	const handleBeforeUpload = useCallback(async (file: File) => {
		setUploading(true);
		const hide = message.loading(t("personal-center.uploadingAvatar") || "Uploading...", 0);

		try {
			// 1. Call the centralized uploadAvatar API (which is a Direct Upload to 'avatar' endpoint)
			await userService.uploadAvatar(file);

			// 2. Refresh the global user store to get the new avatar URL across the application
			await currentUser.getUserInfo();

			message.success(t("personal-center.updateAvatarSuccess") || "Avatar updated!");

			// 3. Emit the file just to keep the form field in sync if needed,
			// though the display will refresh from the global user store.
			onChange?.(file);
		}
		catch (error) {
			console.error("Avatar upload failed:", error);
			message.error(t("personal-center.uploadError") || "Upload failed");
		}
		finally {
			setUploading(false);
			hide();
		}

		return false; // Prevent standard Upload UI from triggering an XHR
	}, [onChange, t, currentUser]);

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="relative group">
				<Spin spinning={uploading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
					<Avatar
						size={120}
						src={previewSrc}
						style={{
							border: `3px solid ${token.colorBorder}`,
							boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
						}}
						className="ring-1 ring-gray-200 dark:ring-gray-800"
					/>
				</Spin>
			</div>
			<ImgCrop
				rotationSlider
				aspectSlider
				showReset
				showGrid
				cropShape="rect"
			>
				<Upload
					accept="image/*"
					showUploadList={false}
					fileList={[]}
					beforeUpload={handleBeforeUpload}
					disabled={uploading}
				>
					<Button
						icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
						className="rounded-lg"
						disabled={uploading}
					>
						{t("personal-center.avatar")}
					</Button>
				</Upload>
			</ImgCrop>
		</div>
	);
}

export const FormAvatarItem = React.memo(FormAvatarItemBase);
