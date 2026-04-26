import type { TaskEntity } from "#src/api/task/types";
import type { TaskDetailRef } from "#src/pages/project/components/task-detail";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { projectService } from "#src/api/project";
import { taskService } from "#src/api/task";
import { TaskPriority, TaskStatus } from "#src/api/task/types";
import { userService } from "#src/api/user";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import { TaskDetail } from "#src/pages/project/components/task-detail";
import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tag, Tooltip } from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

export default function Task() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const actionRef = useRef<ActionType>(null);
	const detailRef = useRef<TaskDetailRef>(null);

	const handleAdd = async () => {
		const res = await detailRef.current?.show();
		if (res?.isChange)
			actionRef.current?.reload();
	};

	const handleEdit = async (id: string) => {
		const res = await detailRef.current?.show(id);
		if (res?.isChange)
			actionRef.current?.reload();
	};

	const handleDelete = async (id: string) => {
		await taskService.fetchDeleteTask(id);
		actionRef.current?.reload();
		window.$message?.success(t("common.deleteSuccess"));
	};

	const columns: ProColumns<TaskEntity>[] = [
		{
			title: t("task.fields.title"),
			dataIndex: "title",
			copyable: true,
			ellipsis: true,
		},
		{
			title: t("task.fields.status"),
			dataIndex: "status",
			valueType: "select",
			valueEnum: {
				[TaskStatus.DRAFT]: { text: t("task.status.draft", "Nháp"), status: "Default" },
				[TaskStatus.TODO]: { text: t("task.status.todo"), status: "Default" },
				[TaskStatus.IN_PROGRESS]: { text: t("task.status.in_progress"), status: "Processing" },
				[TaskStatus.DONE]: { text: t("task.status.done"), status: "Success" },
				[TaskStatus.CANCELLED]: { text: t("task.status.cancelled"), status: "Default" },
				[TaskStatus.REJECTED]: { text: t("task.status.rejected"), status: "Error" },
			},
			render: (_, record) => {
				const statusMap: Record<TaskStatus, { color: string, key: string }> = {
					[TaskStatus.DRAFT]: { color: "default", key: "task.status.draft" },
					[TaskStatus.TODO]: { color: "default", key: "task.status.todo" },
					[TaskStatus.IN_PROGRESS]: { color: "processing", key: "task.status.in_progress" },
					[TaskStatus.DONE]: { color: "success", key: "task.status.done" },
					[TaskStatus.CANCELLED]: { color: "default", key: "task.status.cancelled" },
					[TaskStatus.REJECTED]: { color: "error", key: "task.status.rejected" },
				};
				const config = statusMap[record.status];
				return <Tag color={config.color}>{t(config.key)}</Tag>;
			},
		},
		{
			title: t("task.fields.priority"),
			dataIndex: "priority",
			valueType: "select",
			valueEnum: {
				[TaskPriority.LOW]: { text: t("task.priority.low"), status: "Default" },
				[TaskPriority.MEDIUM]: { text: t("task.priority.medium"), status: "Warning" },
				[TaskPriority.HIGH]: { text: t("task.priority.high"), status: "Error" },
			},
			render: (_, record) => {
				const priorityMap: Record<TaskPriority, { color: string, key: string }> = {
					[TaskPriority.LOW]: { color: "blue", key: "task.priority.low" },
					[TaskPriority.MEDIUM]: { color: "orange", key: "task.priority.medium" },
					[TaskPriority.HIGH]: { color: "volcano", key: "task.priority.high" },
				};
				const config = priorityMap[record.priority];
				return <Tag color={config.color}>{t(config.key)}</Tag>;
			},
		},
		{
			title: t("task.fields.project"),
			dataIndex: ["project", "name"],
			hideInSearch: true,
		},
		{
			title: t("task.fields.project"),
			key: "projectId",
			dataIndex: "projectId",
			hideInTable: true,
			valueType: "select",
			fieldProps: { placeholder: t("task.fields.project"), allowClear: true, showSearch: true },
			request: async () => {
				const res = await projectService.fetchProjectList({ pageSize: 200 });
				return (res.data ?? []).map(p => ({ label: p.name, value: p.id }));
			},
		},
		{
			title: t("task.fields.assignee"),
			dataIndex: ["assignee", "fullName"],
			hideInSearch: true,
		},
		{
			title: t("task.fields.assignee"),
			key: "assigneeId",
			dataIndex: "assigneeId",
			hideInTable: true,
			valueType: "select",
			fieldProps: { placeholder: t("task.fields.assignee"), allowClear: true, showSearch: true },
			request: async () => {
				const res = await userService.fetchUserList({ pageSize: 200, isActive: true });
				return (res.data ?? []).map(u => ({ label: u.fullName || u.loginName, value: u.id }));
			},
		},
		{
			title: t("task.fields.due_date"),
			dataIndex: "dueDate",
			valueType: "date",
			hideInSearch: true,
		},
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 120,
			fixed: "right",
			render: (_, record) => [
				<Tooltip key="edit" title={t("common.edit")}>
					<Button
						type="text"
						size="small"
						icon={<EditOutlined />}
						disabled={!canAccess(PermissionType.UpdateTask)}
						onClick={() => handleEdit(record.id)}
					/>
				</Tooltip>,
				<Popconfirm
					key="delete"
					title={t("common.confirmDelete")}
					description={t("task.deleteWarning")}
					onConfirm={() => handleDelete(record.id)}
					okText={t("common.confirm")}
					cancelText={t("common.cancel")}
				>
					<Tooltip title={t("common.delete")}>
						<Button
							type="text"
							size="small"
							danger
							icon={<DeleteOutlined />}
							disabled={!canAccess(PermissionType.DeleteTask)}
						/>
					</Tooltip>
				</Popconfirm>,
			],
		},
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<TaskEntity>
				columns={columns}
				actionRef={actionRef}
				request={async (params) => {
					const res = await taskService.fetchTaskList(params);
					return {
						data: res.data,
						total: res.total,
						success: true,
					};
				}}
				headerTitle={t("common.menu.task")}
				toolBarRender={() => [
					<Button
						key="add-task"
						icon={<PlusCircleOutlined />}
						type="primary"
						disabled={!canAccess(PermissionType.CreateTask)}
						onClick={handleAdd}
					>
						{t("common.add")}
					</Button>,
				]}
			/>
			<TaskDetail ref={detailRef} />
		</BasicContent>
	);
}
