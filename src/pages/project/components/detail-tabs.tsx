import { IconLabel } from "#src/components/icon-label";
import { SectionCard } from "#src/components/section-card";
import {
	BarChartOutlined,
	CalendarOutlined,
	ClockCircleOutlined,
	DollarOutlined,
	FlagOutlined,
	NodeIndexOutlined,
	PlusOutlined,
	TeamOutlined,
	ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Space, Tabs, theme, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyTasksIcon } from "../constants/icons";
import { ActivityHistoryTab } from "./activity-history-tab";
import { BudgetTab } from "./budget-tab";
import { GanttTab } from "./gantt-tab";
import { KanbanBoard } from "./kanban";
import { MilestoneTab } from "./milestone-tab";
import { ProjectStatsPanel } from "./project-stats";
import { ProjectTeam } from "./project-team";
import { SprintTab } from "./sprint-tab";

const { Text } = Typography;

interface DetailTabsProps {
	isEditing: boolean
	projectId?: string
}

export function DetailTabs({ isEditing, projectId }: DetailTabsProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
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
		...(isEditing && projectId
			? [
				{
					key: "milestone",
					label: <IconLabel icon={<FlagOutlined />} label="Milestone" />,
					children: (
						<div className="py-2 px-2">
							<MilestoneTab projectId={projectId} />
						</div>
					),
				},
				{
					key: "sprint",
					label: <IconLabel icon={<ThunderboltOutlined />} label="Sprint" />,
					children: (
						<div className="py-2 px-2">
							<SprintTab projectId={projectId} />
						</div>
					),
				},
				{
					key: "gantt",
					label: <IconLabel icon={<NodeIndexOutlined />} label="Gantt" />,
					children: (
						<div className="py-2 px-2">
							<GanttTab projectId={projectId} />
						</div>
					),
				},
				{
					key: "budget",
					label: <IconLabel icon={<DollarOutlined />} label="Ngân sách" />,
					children: (
						<div className="py-2 px-2">
							<BudgetTab projectId={projectId} />
						</div>
					),
				},
			]
			: []),
		...(isEditing
			? [
				{
					key: "history",
					label: <IconLabel icon={<ClockCircleOutlined />} label={t("project.tabs.history")} />,
					children: (
						<div className="py-2 px-4">
							<ActivityHistoryTab projectId={projectId!} active={activeTab === "history"} />
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
