import type { TaskEntity } from "#src/api/task/types";
import type { EChartsOption } from "echarts";
import { taskService } from "#src/api/task";
import { TaskStatus } from "#src/api/task/types";
import { Skeleton, Typography } from "antd";
import dayjs from "dayjs";
import ReactECharts from "echarts-for-react";
import { useCallback, useEffect, useState } from "react";

const { Text } = Typography;

const STATUS_COLORS: Record<TaskStatus, string> = {
	[TaskStatus.DRAFT]: "#bfbfbf",
	[TaskStatus.TODO]: "#d9d9d9",
	[TaskStatus.IN_PROGRESS]: "#1677ff",
	[TaskStatus.DONE]: "#52c41a",
	[TaskStatus.CANCELLED]: "#8c8c8c",
	[TaskStatus.REJECTED]: "#ff4d4f",
};

interface GanttTabProps {
	projectId: string
}

export function GanttTab({ projectId }: GanttTabProps) {
	const [tasks, setTasks] = useState<TaskEntity[]>([]);
	const [loading, setLoading] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await taskService.fetchTasksByProject(projectId, { pageSize: 200 });
			setTasks((res.data ?? []).filter(t => t.startDate || t.dueDate));
		}
		finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading)
		return <Skeleton active paragraph={{ rows: 8 }} />;

	if (tasks.length === 0) {
		return (
			<div className="py-16 text-center">
				<Text type="secondary">Chưa có task nào có ngày bắt đầu / kết thúc để hiển thị Gantt.</Text>
			</div>
		);
	}

	const allDates = tasks.flatMap(t => [t.startDate, t.dueDate].filter(Boolean) as string[]);
	const minDate = dayjs(allDates.reduce((a, b) => (a < b ? a : b)));
	const maxDate = dayjs(allDates.reduce((a, b) => (a > b ? a : b)));
	const totalDays = maxDate.diff(minDate, "day") + 1;

	const categories = tasks.map(t => t.title);
	const seriesData = tasks.map((task, index) => {
		const start = task.startDate ? dayjs(task.startDate) : dayjs(task.dueDate);
		const end = task.dueDate ? dayjs(task.dueDate) : dayjs(task.startDate);
		const startOffset = start.diff(minDate, "day");
		const duration = Math.max(end.diff(start, "day") + 1, 1);

		return {
			value: [index, startOffset, duration, task.status],
			itemStyle: { color: STATUS_COLORS[task.status] ?? "#1677ff" },
		};
	});

	const dateLabels: string[] = [];
	for (let i = 0; i <= totalDays; i += Math.max(1, Math.floor(totalDays / 12))) {
		dateLabels.push(minDate.add(i, "day").format("DD/MM"));
	}

	const option: EChartsOption = {
		tooltip: {
			trigger: "item",
			formatter: (params: any) => {
				const task = tasks[params.value[0]];
				const startOff: number = params.value[1];
				const dur: number = params.value[2];
				const s = minDate.add(startOff, "day").format("DD/MM/YYYY");
				const e = minDate.add(startOff + dur - 1, "day").format("DD/MM/YYYY");
				return `<b>${task.title}</b><br/>
          ${s} → ${e}<br/>
          ${task.assignee?.fullName ?? ""}<br/>
          ${dur} ngày`;
			},
		},
		grid: { left: 160, right: 20, top: 20, bottom: 40, containLabel: false },
		xAxis: {
			type: "value",
			min: 0,
			max: totalDays,
			axisLabel: {
				formatter: (val: number) => {
					const d = minDate.add(Math.floor(val), "day");
					return d.format("DD/MM");
				},
				interval: Math.max(0, Math.floor(totalDays / 12) - 1),
				fontSize: 10,
			},
			splitLine: { lineStyle: { type: "dashed", color: "#f0f0f0" } },
		},
		yAxis: {
			type: "category",
			data: categories,
			axisLabel: {
				width: 140,
				overflow: "truncate",
				fontSize: 11,
			},
			axisTick: { show: false },
		},
		series: [
			{
				type: "custom",
				renderItem: (params: any, api: any) => {
					const idx = api.value(0) as number;
					const startVal = api.value(1) as number;
					const durVal = api.value(2) as number;
					const bandWidth = api.size([0, 1])[1];
					const barHeight = Math.min(bandWidth * 0.6, 20);

					const x = api.coord([startVal, idx])[0];
					const y = api.coord([startVal, idx])[1];
					const width = api.size([durVal, 0])[0];

					return {
						type: "rect",
						shape: { x, y: y - barHeight / 2, width: Math.max(width, 4), height: barHeight, r: 3 },
						style: api.style({ fill: STATUS_COLORS[tasks[idx]?.status] }),
					};
				},
				data: seriesData,
				encode: { x: [1, 2], y: 0 },
			},
		],
	};

	return (
		<div className="py-4">
			<div className="flex gap-4 mb-3 flex-wrap">
				{Object.entries(STATUS_COLORS).map(([status, color]) => (
					<div key={status} className="flex items-center gap-1.5">
						<div className="w-3 h-3 rounded" style={{ background: color }} />
						<Text className="text-xs capitalize">{status.replace("_", " ")}</Text>
					</div>
				))}
			</div>
			<ReactECharts
				option={option}
				style={{ height: Math.max(tasks.length * 40 + 80, 300) }}
				notMerge
			/>
		</div>
	);
}
