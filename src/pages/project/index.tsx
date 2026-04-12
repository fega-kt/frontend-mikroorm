import type { ProjectEntity } from "#src/api/project/types";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { DetailRef } from "./components/detail";
import { projectService } from "#src/api/project";
import { ProjectPriority, ProjectStatus } from "#src/api/project/types";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { PeoplePicker } from "#src/components/people-picker";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tag, Tooltip } from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Detail } from "./components/detail";

export default function Project() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const actionRef = useRef<ActionType>(null);
	const detailRef = useRef<DetailRef>(null);

	const handleAdd = async () => {
		const res = await detailRef.current?.show();
		if (res?.isChange) {
			actionRef.current?.reload();
		}
	};

	const handleEdit = async (id: string) => {
		const res = await detailRef.current?.show(id);
		if (res?.isChange) {
			actionRef.current?.reload();
		}
	};

	const handleDelete = async (id: string) => {
		await projectService.fetchDeleteProject(id);
		actionRef.current?.reload();
		window.$message?.success(t("common.deleteSuccess"));
	};

	const columns: ProColumns<ProjectEntity>[] = [
		{
			title: t("common.name"),
			dataIndex: "name",
			copyable: true,
			ellipsis: true,
		},
		{
			title: t("common.status"),
			dataIndex: "status",
			valueType: "select",
			valueEnum: {
				[ProjectStatus.PLANNING]: { text: t("project.status.planning", "Lên kế hoạch"), status: "Default" },
				[ProjectStatus.ACTIVE]: { text: t("project.status.active", "Đang hoạt động"), status: "Processing" },
				[ProjectStatus.COMPLETED]: { text: t("project.status.completed", "Đã hoàn thành"), status: "Success" },
				[ProjectStatus.ON_HOLD]: { text: t("project.status.on_hold", "Tạm dừng"), status: "Warning" },
				[ProjectStatus.ARCHIVED]: { text: t("project.status.archived", "Lưu trữ"), status: "Default" },
			},
			render: (_, record) => {
				const statusMap: Record<ProjectStatus, { color: string, text: string }> = {
					[ProjectStatus.PLANNING]: { color: "default", text: t("project.status.planning", "Lên kế hoạch") },
					[ProjectStatus.ACTIVE]: { color: "processing", text: t("project.status.active", "Đang hoạt động") },
					[ProjectStatus.COMPLETED]: { color: "success", text: t("project.status.completed", "Đã hoàn thành") },
					[ProjectStatus.ON_HOLD]: { color: "warning", text: t("project.status.on_hold", "Tạm dừng") },
					[ProjectStatus.ARCHIVED]: { color: "default", text: t("project.status.archived", "Lưu trữ") },
				};
				const config = statusMap[record.status] || { color: "default", text: record.status };
				return <Tag color={config.color}>{config.text}</Tag>;
			},
		},
		{
			title: t("project.fields.priority", "Độ ưu tiên"),
			dataIndex: "priority",
			valueType: "select",
			valueEnum: {
				[ProjectPriority.URGENT]: { text: t("project.priority.urgent", "Khẩn cấp"), status: "Error" },
				[ProjectPriority.HIGH]: { text: t("project.priority.high", "Cao"), status: "Warning" },
				[ProjectPriority.MEDIUM]: { text: t("project.priority.medium", "Trung bình"), status: "Processing" },
				[ProjectPriority.LOW]: { text: t("project.priority.low", "Thấp"), status: "Default" },
			},
			render: (_, record) => {
				const priorityMap: Record<ProjectPriority, { color: string, text: string }> = {
					[ProjectPriority.URGENT]: { color: "error", text: t("project.priority.urgent", "Khẩn cấp") },
					[ProjectPriority.HIGH]: { color: "volcano", text: t("project.priority.high", "Cao") },
					[ProjectPriority.MEDIUM]: { color: "orange", text: t("project.priority.medium", "Trung bình") },
					[ProjectPriority.LOW]: { color: "blue", text: t("project.priority.low", "Thấp") },
				};
				const config = priorityMap[record.priority];
				if (!config)
					return null;
				return <Tag color={config.color}>{config.text}</Tag>;
			},
		},
		{
			title: t("project.fields.owner", "Chủ sở hữu"),
			dataIndex: "owner",
			hideInSearch: true,
			render: (_, record) => <PeoplePicker readonly user={record.owner} showEmail={false} />,
		},
		{
			title: t("project.fields.due_date", "Hạn chót"),
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
						disabled={!canAccess(PermissionType.UpdateProject)}
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
							disabled={!canAccess(PermissionType.DeleteProject)}
						/>
					</Tooltip>
				</Popconfirm>,
			],
		},
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<ProjectEntity>
				columns={columns}
				actionRef={actionRef}
				request={async (params) => {
					const res = await projectService.fetchProjectList(params);
					return {
						data: res.data,
						total: res.total,
						success: true,
					};
				}}
				headerTitle={t("common.menu.project")}
				toolBarRender={() => [
					<Button
						key="add-project"
						icon={<PlusCircleOutlined />}
						type="primary"
						disabled={!canAccess(PermissionType.CreateProject)}
						onClick={handleAdd}
					>
						{t("common.add")}
					</Button>,
				]}
			/>
			<Detail ref={detailRef} />
		</BasicContent>
	);
}
