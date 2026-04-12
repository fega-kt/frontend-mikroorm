import type { AttachmentUploadRef } from "#src/components/attachment-upload/types";
import { AttachmentUpload } from "#src/components/attachment-upload";
import { FieldTitle } from "#src/components/field-title";
import { RichTextEditor } from "#src/components/rich-text-editor";
import { SectionCard } from "#src/components/section-card";

import { AlignLeftOutlined, EditOutlined, PaperClipOutlined, ProfileOutlined } from "@ant-design/icons";
import { ProFormText } from "@ant-design/pro-components";
import { Form, theme } from "antd";
import * as React from "react";
import { useTranslation } from "react-i18next";

interface DetailMainProps {
	attachmentRef: React.RefObject<AttachmentUploadRef | null>
	storagePath: string
}

export function DetailMain({ attachmentRef, storagePath }: DetailMainProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	return (
		<div className="flex flex-col gap-4">
			{/* ──── White Card: Name + Description ──── */}
			<SectionCard
				icon={<EditOutlined />}
				title={t("project.section.general", "Thông tin chung")}
			>
				{/* Project Name */}
				<ProFormText
					name="name"
					label={<FieldTitle icon={<ProfileOutlined />} title={t("project.fields.name", "Tên dự án")} />}
					placeholder={t("project.placeholder.name")}
					rules={[{ required: true, message: t("project.error.name_required", "Vui lòng nhập tên dự án") }]}
					fieldProps={{
						variant: "outlined",
						style: { borderRadius: token.borderRadiusLG },
					}}
				/>

				{/* Description – Tiptap Rich Text Editor */}
				<div className="mt-2">
					<FieldTitle icon={<AlignLeftOutlined />} title={t("project.fields.description", "Mô tả dự án")} className="mb-2" />
					<Form.Item name="description" className="mb-0">
						<RichTextEditor
							placeholder={t("project.placeholder.description")}
							minHeight={140}
						/>
					</Form.Item>
				</div>
			</SectionCard>

			{/* ──── Attachments ──── */}
			<SectionCard icon={<PaperClipOutlined />} title={t("project.section.attachments", "Tài liệu đính kèm")} className="mb-0">
				<Form.Item name="attachments" noStyle>
					<AttachmentUpload
						ref={attachmentRef}
						mode="manual"
						storagePath={storagePath}
						maxSize={50 * 1024 * 1024}
					/>
				</Form.Item>
			</SectionCard>
		</div>
	);
}
