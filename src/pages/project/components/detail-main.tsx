import type { AttachmentUploadRef } from "#src/components/attachment-upload/types";
import { AttachmentUpload } from "#src/components/attachment-upload";
import { IconLabel } from "#src/components/icon-label";
import {
	CalendarOutlined,
	ClockCircleOutlined,
	DeploymentUnitOutlined,
	EditOutlined,
	FileTextOutlined,
	PaperClipOutlined,
	PlusCircleOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import { ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Card, Form, Tabs, theme, Timeline, Typography } from "antd";
import dayjs from "dayjs";
import * as React from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

interface DetailMainProps {
	attachmentRef: React.RefObject<AttachmentUploadRef | null>
	storagePath: string
	isEditing: boolean
}

export function DetailMain({ attachmentRef, storagePath, isEditing }: DetailMainProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const form = Form.useFormInstance();

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
				className="mb-6 border-none shadow-sm"
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

			{/* Tabs */}
			<Card
				className="border-none shadow-sm"
				bodyStyle={{ padding: 0 }}
				style={{ borderRadius: 12, backgroundColor: token.colorBgContainer }}
			>
				<Tabs
					defaultActiveKey="tasks"
					className="px-6"
					items={[
						{
							key: "tasks",
							label: <IconLabel icon={<CalendarOutlined />} label={t("project.tabs.tasks")} />,
							children: (
								<div className="py-10 text-center">
									<div className="mb-4 text-4xl opacity-20" style={{ color: token.colorTextDescription }}>
										<DeploymentUnitOutlined />
									</div>
									<Text type="secondary">{t("project.empty.tasks")}</Text>
								</div>
							),
						},
						{
							key: "team",
							label: <IconLabel icon={<TeamOutlined />} label={t("project.tabs.collaboration")} />,
							children: (
								<div className="py-10 text-center">
									<Text type="secondary">{t("project.empty.team")}</Text>
								</div>
							),
						},
						...(isEditing
							? [
								{
									key: "history",
									label: <IconLabel icon={<ClockCircleOutlined />} label="Lịch sử" />,
									children: (
										<div className="py-6 px-2">
											<Timeline
												items={[
													{
														dot: <EditOutlined style={{ color: token.colorPrimary }} />,
														children: (
															<div className="flex flex-col gap-0.5">
																<Text strong className="text-sm">Cập nhật lần cuối</Text>
																<Text type="secondary" className="text-xs">
																	{dayjs(form.getFieldValue("updatedAt")).format("DD/MM/YYYY HH:mm")}
																</Text>
																{form.getFieldValue("updatedBy") && (
																	<Text type="secondary" className="text-xs">
																		bởi
																		{" "}
																		{form.getFieldValue("updatedBy")?.workEmail || form.getFieldValue("updatedBy")?.loginName}
																	</Text>
																)}
															</div>
														),
													},
													{
														dot: <PlusCircleOutlined style={{ color: token.colorSuccess }} />,
														children: (
															<div className="flex flex-col gap-0.5">
																<Text strong className="text-sm">Khởi tạo dự án</Text>
																<Text type="secondary" className="text-xs">
																	{dayjs(form.getFieldValue("created")).format("DD/MM/YYYY HH:mm")}
																</Text>
																{form.getFieldValue("createdBy") && (
																	<Text type="secondary" className="text-xs">
																		bởi
																		{" "}
																		{form.getFieldValue("createdBy")?.workEmail || form.getFieldValue("createdBy")?.loginName}
																	</Text>
																)}
															</div>
														),
													},
												]}
											/>
										</div>
									),
								},
							]
							: []),
					]}
				/>
			</Card>
		</>
	);
}
