import type { ProjectEntity } from "#src/api/project/types";
import { IconLabel } from "#src/components/icon-label";
import { SectionCard } from "#src/components/section-card";
import {
	BarChartOutlined,
	CalendarOutlined,
	ClockCircleOutlined,
	EditOutlined,
	PlusCircleOutlined,
	PlusOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import { Button, Form, Space, Tabs, theme, Timeline, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyTasksIcon } from "../constants/icons";
import { KanbanBoard } from "./kanban";
import { ProjectStatsPanel } from "./project-stats";
import { ProjectTeam } from "./project-team";

const { Text } = Typography;

interface DetailTabsProps {
	isEditing: boolean
	projectId?: string
}

export function DetailTabs({ isEditing, projectId }: DetailTabsProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const form = Form.useFormInstance<ProjectEntity>();
	const [activeTab, setActiveTab] = useState("overview");

	const addSectionBtn = (
		<Button
			type="text"
			icon={<PlusOutlined />}
			size="small"
			className="text-xs font-medium"
			style={{ color: token.colorPrimary }}
		>
			{t("project.tabs.add_section")}
		</Button>
	);

	const emptyState = (
		<div className="py-10 text-center">
			<div className="mb-3 opacity-40">
				<EmptyTasksIcon size={64} />
			</div>
			<Text type="secondary" className="block mb-4 text-sm">
				{t("project.empty.tasks")}
			</Text>
			<Space size={12}>
				<Button type="primary" className="font-semibold border-none rounded-lg">
					{t("project.tabs.create_first_section")}
				</Button>
				<Button className="rounded-lg">{t("project.tabs.use_template")}</Button>
			</Space>
		</div>
	);

	const items = [
		...(isEditing && projectId
			? [
				{
					key: "overview",
					label: <IconLabel icon={<BarChartOutlined />} label={t("project.tabs.overview")} />,
					children: (
						<div className="py-2 px-2">
							<ProjectStatsPanel projectId={projectId} />
						</div>
					),
				},
			]
			: []),
		{
			key: "tasks",
			label: <IconLabel icon={<CalendarOutlined />} label={t("project.tabs.tasks")} />,
			children: isEditing && projectId
				? (
					<div className="py-4 px-2">
						<KanbanBoard projectId={projectId} />
					</div>
				)
				: emptyState,
		},
		{
			key: "team",
			label: <IconLabel icon={<TeamOutlined />} label={t("project.tabs.collaboration")} />,
			children: isEditing && projectId
				? (
					<div className="py-2 px-2">
						<ProjectTeam projectId={projectId} />
					</div>
				)
				: (
					<div className="py-16 text-center">
						<Text type="secondary">{t("project.empty.team")}</Text>
					</div>
				),
		},
		...(isEditing
			? [
				{
					key: "history",
					label: <IconLabel icon={<ClockCircleOutlined />} label={t("project.tabs.history")} />,
					children: (
						<div className="py-6 px-4">
							<Timeline
								items={[
									{
										dot: <EditOutlined style={{ color: token.colorPrimary }} />,
										children: (
											<div className="flex flex-col gap-0.5">
												<Text strong className="text-sm">{t("project.tabs.last_updated")}</Text>
												<Text type="secondary" className="text-xs">
													{dayjs(form.getFieldValue("updatedAt")).format("DD/MM/YYYY HH:mm")}
												</Text>
												{form.getFieldValue("updatedBy") && (
													<Text type="secondary" className="text-xs">
														{t("project.tabs.by")}
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
												<Text strong className="text-sm">{t("project.tabs.created")}</Text>
												<Text type="secondary" className="text-xs">
													{dayjs(form.getFieldValue("created")).format("DD/MM/YYYY HH:mm")}
												</Text>
												{form.getFieldValue("createdBy") && (
													<Text type="secondary" className="text-xs">
														{t("project.tabs.by")}
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
		<SectionCard
			icon={<BarChartOutlined />}
			title={t("project.tabs.panel_title")}
			extra={activeTab === "tasks" ? addSectionBtn : undefined}
			bodyClassName=""
		>
			{isEditing
				? (
					<Tabs
						activeKey={activeTab}
						onChange={setActiveTab}
						className="px-6"
						items={items}
					/>
				)
				: emptyState}
		</SectionCard>
	);
}
