import type { TaskEntity } from "#src/api/task/types";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { taskService } from "#src/api/task";
import { TaskPriority, TaskStatus } from "#src/api/task/types";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tag, Tooltip } from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

export default function Task() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const actionRef = useRef<ActionType>(null);

	const handleAdd = () => {
		window.$message?.info("Tính năng Thêm mới công việc đang được phát triển");
	};

	const handleEdit = (id: string) => {
		window.$message?.info(`Tính năng Chỉnh sửa công việc ${id} đang được phát triển`);
	};

	const handleDelete = async (id: string) => {
		await taskService.fetchDeleteTask(id);
		actionRef.current?.reload();
		window.$message?.success(t("common.deleteSuccess"));
	};

	const columns: ProColumns<TaskEntity>[] = [
		{
			title: "Tiêu đề",
			dataIndex: "title",
			copyable: true,
			ellipsis: true,
		},
		{
			title: t("common.status"),
			dataIndex: "status",
			valueType: "select",
			valueEnum: {
				[TaskStatus.TODO]: { text: "Cần làm", status: "Default" },
				[TaskStatus.IN_PROGRESS]: { text: "Đang thực hiện", status: "Processing" },
				[TaskStatus.DONE]: { text: "Hoàn thành", status: "Success" },
				[TaskStatus.CANCELLED]: { text: "Hủy bỏ", status: "Default" },
				[TaskStatus.REJECTED]: { text: "Từ chối", status: "Error" },
			},
			render: (_, record) => {
				const statusMap: Record<TaskStatus, { color: string, text: string }> = {
					[TaskStatus.TODO]: { color: "default", text: "Cần làm" },
					[TaskStatus.IN_PROGRESS]: { color: "processing", text: "Đang thực hiện" },
					[TaskStatus.DONE]: { color: "success", text: "Hoàn thành" },
					[TaskStatus.CANCELLED]: { color: "default", text: "Hủy bỏ" },
					[TaskStatus.REJECTED]: { color: "error", text: "Từ chối" },
				};
				const config = statusMap[record.status];
				return <Tag color={config.color}>{config.text}</Tag>;
			},
		},
		{
			title: "Độ ưu tiên",
			dataIndex: "priority",
			valueType: "select",
			valueEnum: {
				[TaskPriority.LOW]: { text: "Thấp", status: "Default" },
				[TaskPriority.MEDIUM]: { text: "Trung bình", status: "Warning" },
				[TaskPriority.HIGH]: { text: "Cao", status: "Error" },
			},
			render: (_, record) => {
				const priorityMap: Record<TaskPriority, { color: string, text: string }> = {
					[TaskPriority.LOW]: { color: "blue", text: "Thấp" },
					[TaskPriority.MEDIUM]: { color: "orange", text: "Trung bình" },
					[TaskPriority.HIGH]: { color: "volcano", text: "Cao" },
				};
				const config = priorityMap[record.priority];
				return <Tag color={config.color}>{config.text}</Tag>;
			},
		},
		{
			title: "Dự án",
			dataIndex: ["project", "name"],
		},
		{
			title: "Người thực hiện",
			dataIndex: ["assignee", "fullName"],
		},
		{
			title: "Hạn chót",
			dataIndex: "dueDate",
			valueType: "date",
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
		</BasicContent>
	);
}
