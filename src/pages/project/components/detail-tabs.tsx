import type { ProjectEntity } from "#src/api/project/types";
import { IconLabel } from "#src/components/icon-label";
import { SectionCard } from "#src/components/section-card";
import {
	AppstoreOutlined,
	CalendarOutlined,
	ClockCircleOutlined,
	EditOutlined,
	PlusCircleOutlined,
	PlusOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import { Button, Form, Space, Tabs, theme, Timeline, Typography } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { EmptyTasksIcon } from "../constants/icons";
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

	/* ── "+ Thêm section" button for header extra ── */
	const addSectionBtn = (
		<Button
			type="text"
			icon={<PlusOutlined />}
			size="small"
			className="text-xs font-medium"
			style={{ color: token.colorPrimary }}
		>
			Thêm section
		</Button>
	);

	/* ── Empty state for new project ── */
	const emptyState = (
		<div className="py-10 text-center">
			<div className="mb-3 opacity-40">
				<EmptyTasksIcon size={64} />
			</div>
			<Text type="secondary" className="block mb-4 text-sm">Chưa có công việc</Text>
			<Space size={12}>
				<Button
					type="primary"
					className="font-semibold border-none rounded-lg"
				>
					Tạo section đầu tiên
				</Button>
				<Button className="rounded-lg">Dùng template...</Button>
			</Space>
		</div>
	);

	/* ── Tab items ── */
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
				: emptyState,
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
		<SectionCard
			icon={<AppstoreOutlined />}
			title={t("project.tabs.tasks")}
			extra={addSectionBtn}
			bodyClassName=""
		>
			{isEditing
				? (
					<Tabs
						defaultActiveKey="tasks"
						className="px-6"
						items={items}
					/>
				)
				: emptyState}
		</SectionCard>
	);
}
