import type { ProjectEntity } from "#src/api/project/types";
import type { EChartsOption } from "echarts";
import { projectService } from "#src/api/project";
import { taskService } from "#src/api/task";
import { TaskStatus } from "#src/api/task/types";
import { BasicContent } from "#src/components/basic-content";
import { Card, Col, Row, Select, Skeleton, Statistic, Typography } from "antd";
import dayjs from "dayjs";
import ReactECharts from "echarts-for-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

export default function Reports() {
	const { t } = useTranslation();
	const [projects, setProjects] = useState<ProjectEntity[]>([]);
	const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
	const [tasks, setTasks] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		projectService.fetchProjectList({ pageSize: 200 }).then(res => setProjects(res.data ?? []));
	}, []);

	useEffect(() => {
		if (!selectedProjectId)
			return;
		setLoading(true);
		taskService.fetchTasksByProject(selectedProjectId).then((res) => {
			setTasks(res.data ?? []);
		}).finally(() => setLoading(false));
	}, [selectedProjectId]);

	const project = useMemo(
		() => projects.find(p => p.id === selectedProjectId),
		[projects, selectedProjectId],
	);

	const stats = useMemo(() => {
		const total = tasks.length;
		const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
		const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
		const todo = tasks.filter(t => t.status === TaskStatus.TODO).length;
		const overdue = tasks.filter(t => t.dueDate && dayjs(t.dueDate).isBefore(dayjs()) && t.status !== TaskStatus.DONE).length;
		const rate = total > 0 ? Math.round((done / total) * 100) : 0;
		return { total, done, inProgress, todo, overdue, rate };
	}, [tasks]);

	const statusChartOption: EChartsOption = {
		tooltip: { trigger: "item" },
		legend: { bottom: 0 },
		series: [{
			type: "pie",
			radius: ["40%", "70%"],
			data: [
				{ value: stats.done, name: t("task.status.done"), itemStyle: { color: "#52c41a" } },
				{ value: stats.inProgress, name: t("task.status.in_progress"), itemStyle: { color: "#1677ff" } },
				{ value: stats.todo, name: t("task.status.todo"), itemStyle: { color: "#d9d9d9" } },
				{ value: stats.overdue, name: "Trễ hạn", itemStyle: { color: "#ff4d4f" } },
			].filter(d => d.value > 0),
		}],
	};

	const burndownOption = useMemo<EChartsOption>(() => {
		if (!project?.startDate || !project?.dueDate)
			return {};

		const start = dayjs(project.startDate);
		const end = dayjs(project.dueDate);
		const days = end.diff(start, "day") + 1;
		const total = tasks.length;

		const categories: string[] = [];
		const ideal: number[] = [];
		const actual: number[] = [];

		for (let i = 0; i < days; i++) {
			const d = start.add(i, "day");
			categories.push(d.format("DD/MM"));
			ideal.push(Math.max(0, total - Math.round((i / (days - 1)) * total)));

			const doneByDay = tasks.filter(t =>
				t.completedAt && dayjs(t.completedAt).isBefore(d.add(1, "day")),
			).length;
			actual.push(Math.max(0, total - doneByDay));
		}

		return {
			tooltip: { trigger: "axis" },
			legend: { data: ["Lý tưởng", "Thực tế"] },
			xAxis: { type: "category", data: categories, axisLabel: { rotate: 45, fontSize: 10 } },
			yAxis: { type: "value", name: "Tasks còn lại", min: 0 },
			series: [
				{ name: "Lý tưởng", type: "line", data: ideal, lineStyle: { type: "dashed" }, itemStyle: { color: "#1677ff" } },
				{ name: "Thực tế", type: "line", data: actual, itemStyle: { color: "#ff4d4f" }, areaStyle: { opacity: 0.1 } },
			],
		};
	}, [project, tasks]);

	const priorityChartOption: EChartsOption = {
		tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
		xAxis: {
			type: "category",
			data: ["LOW", "MEDIUM", "HIGH"],
		},
		yAxis: { type: "value" },
		series: [
			{
				name: "Tasks",
				type: "bar",
				data: [
					{ value: tasks.filter(t => t.priority === "LOW").length, itemStyle: { color: "#1677ff" } },
					{ value: tasks.filter(t => t.priority === "MEDIUM").length, itemStyle: { color: "#fa8c16" } },
					{ value: tasks.filter(t => t.priority === "HIGH").length, itemStyle: { color: "#ff4d4f" } },
				],
			},
		],
	};

	return (
		<BasicContent className="h-full overflow-y-auto">
			<div className="p-6">
				<div className="flex items-center justify-between mb-6">
					<Title level={4} className="!mb-0">{t("common.menu.reports")}</Title>
					<Select
						placeholder="Chọn dự án"
						style={{ width: 260 }}
						options={projects.map(p => ({ label: p.name, value: p.id }))}
						onChange={setSelectedProjectId}
						showSearch
						allowClear
					/>
				</div>

				{!selectedProjectId
					? (
						<div className="text-center py-24 text-gray-400">Chọn một dự án để xem báo cáo</div>
					)
					: loading
						? <Skeleton active paragraph={{ rows: 10 }} />
						: (
							<div className="flex flex-col gap-4">
								<Row gutter={[16, 16]}>
									<Col xs={12} sm={6}>
										<Card size="small">
											<Statistic title="Tổng Tasks" value={stats.total} valueStyle={{ color: "#1677ff" }} />
										</Card>
									</Col>
									<Col xs={12} sm={6}>
										<Card size="small">
											<Statistic title="Hoàn thành" value={stats.done} suffix={`/ ${stats.total}`} valueStyle={{ color: "#52c41a" }} />
										</Card>
									</Col>
									<Col xs={12} sm={6}>
										<Card size="small">
											<Statistic title="Tỷ lệ hoàn thành" value={stats.rate} suffix="%" valueStyle={{ color: stats.rate >= 80 ? "#52c41a" : "#fa8c16" }} />
										</Card>
									</Col>
									<Col xs={12} sm={6}>
										<Card size="small">
											<Statistic title="Trễ hạn" value={stats.overdue} valueStyle={{ color: stats.overdue > 0 ? "#ff4d4f" : undefined }} />
										</Card>
									</Col>
								</Row>

								<Row gutter={[16, 16]}>
									<Col xs={24} md={12}>
										<Card title="Trạng thái Tasks" size="small">
											<ReactECharts option={statusChartOption} style={{ height: 280 }} />
										</Card>
									</Col>
									<Col xs={24} md={12}>
										<Card title="Phân bố theo Độ ưu tiên" size="small">
											<ReactECharts option={priorityChartOption} style={{ height: 280 }} />
										</Card>
									</Col>
								</Row>

								{project?.startDate && project?.dueDate && (
									<Card title="Burndown Chart" size="small">
										<ReactECharts option={burndownOption} style={{ height: 300 }} />
									</Card>
								)}
							</div>
						)}
			</div>
		</BasicContent>
	);
}
