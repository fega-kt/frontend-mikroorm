import type { ProjectEntity } from "#src/api/project/types";
import { IconLabel } from "#src/components/icon-label";
import {
	CalendarOutlined,
	ClockCircleOutlined,
	DeploymentUnitOutlined,
	EditOutlined,
	PlusCircleOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import { Card, Form, Tabs, theme, Timeline, Typography } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { KanbanBoard } from "./kanban";

const { Text } = Typography;

interface DetailTabsProps {
	isEditing: boolean
	projectId?: string
}

export function DetailTabs({ isEditing, projectId }: DetailTabsProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const form = Form.useFormInstance<ProjectEntity>();

	const items = [
		{
			key: "tasks",
			label: <IconLabel icon={<CalendarOutlined />} label={t("project.tabs.tasks")} />,
			children: isEditing && projectId
				? (
					<div className="py-4 px-2">
						<KanbanBoard projectId={projectId} />
					</div>
				)
				: (
					<div className="py-16 text-center">
						<div className="mb-4 text-4xl opacity-20" style={{ color: token.colorTextDescription }}>
							<DeploymentUnitOutlined />
						</div>
						<Text type="secondary">Lưu project trước để quản lý tasks</Text>
					</div>
				),
		},
		{
			key: "team",
			label: <IconLabel icon={<TeamOutlined />} label={t("project.tabs.collaboration")} />,
			children: (
				<div className="py-16 text-center">
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
						<div className="py-6 px-4">
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
	];

	return (
		<Card
			className="border-none shadow-sm"
			bodyStyle={{ padding: 0 }}
			style={{ borderRadius: 12, backgroundColor: token.colorBgContainer }}
		>
			<Tabs
				defaultActiveKey="tasks"
				className="px-6"
				items={items}
			/>
		</Card>
	);
}
