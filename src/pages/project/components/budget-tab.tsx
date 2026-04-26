import type { ProjectEntity } from "#src/api/project/types";
import type { TaskEntity } from "#src/api/task/types";
import type { EChartsOption } from "echarts";
import { taskService } from "#src/api/task";
import { TaskStatus } from "#src/api/task/types";
import { Col, Form, Progress, Row, Statistic, Table, Tag, theme, Typography } from "antd";
import ReactECharts from "echarts-for-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const { Text, Title } = Typography;

interface BudgetTabProps {
	projectId: string
}

export function BudgetTab({ projectId }: BudgetTabProps) {
	const { token } = theme.useToken();
	const form = Form.useFormInstance<ProjectEntity>();
	const budget: number = form.getFieldValue("budget") ?? 0;

	const [tasks, setTasks] = useState<TaskEntity[]>([]);
	const [loading, setLoading] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await taskService.fetchTasksByProject(projectId, { pageSize: 500 });
			setTasks(res.data ?? []);
		}
		finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		load();
	}, [load]);

	const costByAssignee = useMemo(() => {
		const map: Record<string, { name: string, estimated: number, actual: number, tasks: number }> = {};
		tasks.forEach((t) => {
			const key = t.assignee?.id ?? "unassigned";
			if (!map[key]) {
				map[key] = { name: t.assignee?.fullName ?? t.assignee?.loginName ?? "Chưa giao", estimated: 0, actual: 0, tasks: 0 };
			}
			map[key].estimated += t.estimatedHours ?? 0;
			map[key].actual += t.actualHours ?? 0;
			map[key].tasks += 1;
		});
		return Object.values(map);
	}, [tasks]);

	const totalEstimated = tasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
	const totalActual = tasks.reduce((s, t) => s + (t.actualHours ?? 0), 0);
	const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
	const budgetPercent = budget > 0 ? Math.min(Math.round((totalActual / budget) * 100), 999) : 0;

	const chartOption: EChartsOption = {
		tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
		legend: { data: ["Dự kiến (h)", "Thực tế (h)"], bottom: 0 },
		xAxis: {
			type: "category",
			data: costByAssignee.map(r => r.name),
			axisLabel: { rotate: 20, fontSize: 10 },
		},
		yAxis: { type: "value", name: "Giờ" },
		series: [
			{ name: "Dự kiến (h)", type: "bar", data: costByAssignee.map(r => r.estimated), itemStyle: { color: token.colorPrimary } },
			{ name: "Thực tế (h)", type: "bar", data: costByAssignee.map(r => r.actual), itemStyle: { color: token.colorSuccess } },
		],
	};

	const columns = [
		{ title: "Thành viên", dataIndex: "name", key: "name" },
		{
			title: "Tasks",
			dataIndex: "tasks",
			key: "tasks",
			width: 80,
			render: (v: number) => <Tag>{v}</Tag>,
		},
		{
			title: "Dự kiến",
			dataIndex: "estimated",
			key: "estimated",
			width: 100,
			render: (v: number) => (
				<Text>
					{v}
					h
				</Text>
			),
		},
		{
			title: "Thực tế",
			dataIndex: "actual",
			key: "actual",
			width: 100,
			render: (v: number, record: any) => (
				<Text style={{ color: v > record.estimated ? token.colorError : token.colorSuccess }}>
					{v}
					h
				</Text>
			),
		},
		{
			title: "Chênh lệch",
			key: "diff",
			width: 100,
			render: (_: any, record: any) => {
				const diff = record.actual - record.estimated;
				return (
					<Text style={{ color: diff > 0 ? token.colorError : token.colorSuccess }}>
						{diff > 0 ? "+" : ""}
						{diff}
						h
					</Text>
				);
			},
		},
	];

	return (
		<div className="py-4">
			<Row gutter={[16, 16]} className="mb-6">
				<Col xs={12} sm={6}>
					<div className="rounded-xl p-4" style={{ background: token.colorPrimaryBg, border: `1px solid ${token.colorPrimaryBorder}` }}>
						<Text type="secondary" className="text-xs block mb-1">Ngân sách (h)</Text>
						<Title level={3} className="!mb-0" style={{ color: token.colorPrimary }}>
							{budget > 0 ? `${budget}h` : "—"}
						</Title>
					</div>
				</Col>
				<Col xs={12} sm={6}>
					<div className="rounded-xl p-4" style={{ background: token.colorInfoBg, border: `1px solid ${token.colorInfoBorder}` }}>
						<Text type="secondary" className="text-xs block mb-1">Dự kiến</Text>
						<Title level={3} className="!mb-0" style={{ color: token.colorInfo }}>
							{totalEstimated}
							h
						</Title>
					</div>
				</Col>
				<Col xs={12} sm={6}>
					<div className="rounded-xl p-4" style={{ background: totalActual > totalEstimated ? token.colorErrorBg : token.colorSuccessBg, border: `1px solid ${totalActual > totalEstimated ? token.colorErrorBorder : token.colorSuccessBorder}` }}>
						<Text type="secondary" className="text-xs block mb-1">Thực tế</Text>
						<Title level={3} className="!mb-0" style={{ color: totalActual > totalEstimated ? token.colorError : token.colorSuccess }}>
							{totalActual}
							h
						</Title>
					</div>
				</Col>
				<Col xs={12} sm={6}>
					<div className="rounded-xl p-4" style={{ background: token.colorWarningBg, border: `1px solid ${token.colorWarningBorder}` }}>
						<Statistic
							title={<Text type="secondary" className="text-xs">Hoàn thành</Text>}
							value={completedTasks}
							suffix={`/ ${tasks.length} tasks`}
							valueStyle={{ fontSize: 22, color: token.colorWarning }}
						/>
					</div>
				</Col>
			</Row>

			{budget > 0 && (
				<div className="mb-6 p-4 rounded-xl" style={{ background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}` }}>
					<div className="flex justify-between mb-2">
						<Text strong className="text-sm">Sử dụng ngân sách</Text>
						<Text type={budgetPercent > 90 ? "danger" : "secondary"} className="text-sm">
							{totalActual}
							h /
							{budget}
							h (
							{budgetPercent}
							%)
						</Text>
					</div>
					<Progress
						percent={Math.min(budgetPercent, 100)}
						strokeColor={budgetPercent > 100 ? token.colorError : budgetPercent > 80 ? token.colorWarning : token.colorPrimary}
						showInfo={false}
					/>
					{budgetPercent > 100 && (
						<Text type="danger" className="text-xs mt-1 block">
							⚠ Vượt ngân sách
							{" "}
							{totalActual - budget}
							h
						</Text>
					)}
				</div>
			)}

			{costByAssignee.length > 0 && (
				<>
					<div className="mb-4 p-4 rounded-xl" style={{ background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}` }}>
						<Title level={5} className="!mb-4">Giờ làm việc theo thành viên</Title>
						<ReactECharts option={chartOption} style={{ height: 240 }} />
					</div>

					<div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${token.colorBorderSecondary}` }}>
						<Table
							size="small"
							columns={columns}
							dataSource={costByAssignee}
							pagination={false}
							loading={loading}
							rowKey="name"
						/>
					</div>
				</>
			)}
		</div>
	);
}
