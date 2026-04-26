import type { TaskEntity } from "#src/api/task/types";
import type { UserEntity } from "#src/api/user/types";
import { taskService } from "#src/api/task";
import { userService } from "#src/api/user";
import { BasicContent } from "#src/components/basic-content";
import { Avatar, Badge, Card, Col, Progress, Row, Select, Skeleton, Space, Statistic, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;

interface MemberWorkload {
	user: UserEntity
	tasks: TaskEntity[]
	totalEstimated: number
	totalActual: number
	overdue: number
	inProgress: number
	done: number
}

export default function Resource() {
	const { t } = useTranslation();
	const [users, setUsers] = useState<UserEntity[]>([]);
	const [tasks, setTasks] = useState<TaskEntity[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedProject, setSelectedProject] = useState<string | undefined>();

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			try {
				const [userRes, taskRes] = await Promise.all([
					userService.fetchUserList({ pageSize: 200, isActive: true }),
					taskService.fetchTaskList({ pageSize: 500, ...(selectedProject ? { projectId: selectedProject } : {}) }),
				]);
				setUsers(userRes.data ?? []);
				setTasks(taskRes.data ?? []);
			}
			finally {
				setLoading(false);
			}
		};
		load();
	}, [selectedProject]);

	const workloads = useMemo<MemberWorkload[]>(() => {
		return users.map((user) => {
			const memberTasks = tasks.filter(t => t.assignee?.id === user.id);
			const now = dayjs();
			return {
				user,
				tasks: memberTasks,
				totalEstimated: memberTasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0),
				totalActual: memberTasks.reduce((s, t) => s + (t.actualHours ?? 0), 0),
				overdue: memberTasks.filter(t => t.dueDate && dayjs(t.dueDate).isBefore(now) && t.status !== "DONE").length,
				inProgress: memberTasks.filter(t => t.status === "IN_PROGRESS").length,
				done: memberTasks.filter(t => t.status === "DONE").length,
			};
		}).filter(w => w.tasks.length > 0);
	}, [users, tasks]);

	const maxTasks = Math.max(...workloads.map(w => w.tasks.length), 1);

	return (
		<BasicContent className="h-full overflow-y-auto">
			<div className="p-6">
				<div className="flex items-center justify-between mb-6">
					<Title level={4} className="!mb-0">{t("common.menu.resource")}</Title>
					<Select
						allowClear
						placeholder={t("task.fields.project")}
						style={{ width: 200 }}
						onChange={setSelectedProject}
					/>
				</div>

				{loading
					? (
						<Row gutter={[16, 16]}>
							{[1, 2, 3, 4].map(i => <Col key={i} xs={24} sm={12} lg={8} xl={6}><Skeleton active /></Col>)}
						</Row>
					)
					: workloads.length === 0
						? (
							<div className="text-center py-20">
								<Text type="secondary">{t("common.noData")}</Text>
							</div>
						)
						: (
							<Row gutter={[16, 16]}>
								{workloads.map(({ user, tasks: memberTasks, totalEstimated, totalActual, overdue, inProgress, done }) => {
									const utilization = Math.min(Math.round((memberTasks.length / maxTasks) * 100), 100);
									const isOverloaded = memberTasks.length > 8;

									return (
										<Col key={user.id} xs={24} sm={12} lg={8} xl={6}>
											<Card
												size="small"
												bordered
												className="h-full"
												styles={{ body: { padding: 16 } }}
											>
												<Space direction="vertical" className="w-full" size={12}>
													<div className="flex items-center gap-3">
														<Badge dot status={isOverloaded ? "error" : "success"} offset={[-4, 4]}>
															<Avatar src={user.avatar} size={40}>
																{user.fullName?.charAt(0) ?? user.loginName?.charAt(0)}
															</Avatar>
														</Badge>
														<div className="flex-1 min-w-0">
															<Text strong className="block truncate">{user.fullName || user.loginName}</Text>
															<Text type="secondary" className="text-xs truncate block">{user.workEmail}</Text>
														</div>
													</div>

													<div>
														<div className="flex justify-between mb-1">
															<Text className="text-xs" type="secondary">Workload</Text>
															<Text className="text-xs" strong>
																{memberTasks.length}
																{" "}
																tasks
															</Text>
														</div>
														<Tooltip title={isOverloaded ? "Quá tải!" : `${utilization}%`}>
															<Progress
																percent={utilization}
																size="small"
																strokeColor={isOverloaded ? "#ff4d4f" : undefined}
																showInfo={false}
															/>
														</Tooltip>
													</div>

													<Row gutter={8}>
														<Col span={8}>
															<Statistic
																title={<span className="text-xs">Đang làm</span>}
																value={inProgress}
																valueStyle={{ fontSize: 18, color: "#1677ff" }}
															/>
														</Col>
														<Col span={8}>
															<Statistic
																title={<span className="text-xs">Xong</span>}
																value={done}
																valueStyle={{ fontSize: 18, color: "#52c41a" }}
															/>
														</Col>
														<Col span={8}>
															<Statistic
																title={<span className="text-xs">Trễ</span>}
																value={overdue}
																valueStyle={{ fontSize: 18, color: overdue > 0 ? "#ff4d4f" : undefined }}
															/>
														</Col>
													</Row>

													{(totalEstimated > 0 || totalActual > 0) && (
														<div className="flex gap-2 flex-wrap">
															<Tag color="blue" className="text-xs">
																Est:
																{" "}
																{totalEstimated}
																h
															</Tag>
															<Tag color={totalActual > totalEstimated ? "red" : "green"} className="text-xs">
																Act:
																{" "}
																{totalActual}
																h
															</Tag>
														</div>
													)}
												</Space>
											</Card>
										</Col>
									);
								})}
							</Row>
						)}
			</div>
		</BasicContent>
	);
}
