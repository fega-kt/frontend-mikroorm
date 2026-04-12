import type { AttachmentUploadRef } from "#src/components/attachment-upload/types";
import { AttachmentUpload } from "#src/components/attachment-upload";
import { RichTextEditor } from "#src/components/rich-text-editor";
import { SectionCard } from "#src/components/section-card";
import { PaperClipOutlined } from "@ant-design/icons";
import { ProFormText } from "@ant-design/pro-components";
import { Card, Form, theme, Typography } from "antd";
import * as React from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface DetailMainProps {
	attachmentRef: React.RefObject<AttachmentUploadRef | null>
	storagePath: string
}

export function DetailMain({ attachmentRef, storagePath }: DetailMainProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	return (
		<>
			{/* ──── White Card: Name + Description ──── */}
			<Card
				className="border-none shadow-sm"
				bodyStyle={{ padding: "24px 28px" }}
				style={{ borderRadius: token.borderRadiusLG, backgroundColor: token.colorBgContainer }}
			>
				{/* Project Name */}
				<Text strong className="text-sm block mb-2" style={{ color: token.colorTextSecondary }}>
					Project Name
				</Text>
				<ProFormText
					name="name"
					placeholder={t("project.placeholder.name")}
					rules={[{ required: true, message: "" }]}
					formItemProps={{ className: "[&_.ant-form-item-label]:hidden mb-4" }}
					fieldProps={{
						variant: "outlined",
						className: "[&.ant-input-status-error::placeholder]:text-red-500",
						style: { fontSize: 15, padding: "8px 12px", borderRadius: 8 },
					}}
				/>

				{/* Description – Tiptap Rich Text Editor */}
				<Form.Item name="description" className="mb-0">
					<RichTextEditor
						placeholder={t("project.placeholder.description")}
						minHeight={140}
					/>
				</Form.Item>
			</Card>

			{/* ──── Attachments ──── */}
			<SectionCard icon={<PaperClipOutlined />} title="Tài liệu đính" className="mb-0">
				<Form.Item name="attachments" noStyle>
					<AttachmentUpload
						ref={attachmentRef}
						mode="manual"
						storagePath={storagePath}
						maxSize={50 * 1024 * 1024}
					/>
				</Form.Item>
			</SectionCard>
		</>
	);
}
