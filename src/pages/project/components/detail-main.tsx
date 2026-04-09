import type { AttachmentUploadRef } from "#src/components/attachment-upload/types";
import { AttachmentUpload } from "#src/components/attachment-upload";
import { FileTextOutlined, PaperClipOutlined } from "@ant-design/icons";
import { ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Card, Form, theme, Typography } from "antd";
import * as React from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

interface DetailMainProps {
	attachmentRef: React.RefObject<AttachmentUploadRef | null>
	storagePath: string
}

export function DetailMain({ attachmentRef, storagePath }: DetailMainProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	return (
		<>
			{/* Project name */}
			<div className="mb-8 px-2">
				<ProFormText
					name="name"
					placeholder={t("project.placeholder.name")}
					rules={[{ required: true, message: "" }]}
					formItemProps={{ className: "[&_.ant-form-item-label]:hidden" }}
					fieldProps={{
						variant: "borderless",
						className: "mb-1 [&.ant-input-status-error::placeholder]:text-red-500",
						style: { fontSize: 28, fontWeight: 700, padding: 0, height: "auto" },
					}}
				/>
				<Text strong type="secondary" className="text-sm italic block px-1">
					{t("project.subtitle.headline")}
				</Text>
			</div>

			{/* Description */}
			<Card
				className="mb-6 border-none shadow-sm"
				bodyStyle={{ padding: "24px" }}
				style={{ borderRadius: 12, backgroundColor: token.colorBgContainer }}
			>
				<div className="flex items-center gap-2 mb-6">
					<Title level={5} className="m-0 flex items-center gap-2">
						<FileTextOutlined style={{ color: token.colorPrimary }} />
						{t("project.section.description")}
					</Title>
				</div>
				<ProFormTextArea
					name="description"
					placeholder={t("project.placeholder.description")}
					fieldProps={{
						rows: 8,
						className: "border-none rounded-xl p-4 transition-all",
						style: { backgroundColor: token.colorFillQuaternary },
					}}
				/>
			</Card>

			{/* Attachments */}
			<Card
				className="border-none shadow-sm"
				bodyStyle={{ padding: "24px" }}
				style={{ borderRadius: 12, backgroundColor: token.colorBgContainer }}
			>
				<div className="flex items-center gap-2 mb-4">
					<Title level={5} className="m-0 flex items-center gap-2">
						<PaperClipOutlined style={{ color: token.colorPrimary }} />
						Tài liệu đính kèm
					</Title>
				</div>
				<Form.Item name="attachments" noStyle>
					<AttachmentUpload
						ref={attachmentRef}
						mode="manual"
						storagePath={storagePath}
						maxSize={50 * 1024 * 1024}
					/>
				</Form.Item>
			</Card>
		</>
	);
}
