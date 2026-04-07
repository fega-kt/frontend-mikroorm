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
				[ProjectStatus.PLANNING]: { text: "Lên kế hoạch", status: "Default" },
				[ProjectStatus.ACTIVE]: { text: "Đang hoạt động", status: "Processing" },
				[ProjectStatus.COMPLETED]: { text: "Đã hoàn thành", status: "Success" },
				[ProjectStatus.ON_HOLD]: { text: "Tạm dừng", status: "Warning" },
				[ProjectStatus.ARCHIVED]: { text: "Lưu trữ", status: "Default" },
			},
			render: (_, record) => {
				const statusMap: Record<ProjectStatus, { color: string, text: string }> = {
					[ProjectStatus.PLANNING]: { color: "default", text: "Lên kế hoạch" },
					[ProjectStatus.ACTIVE]: { color: "processing", text: "Đang hoạt động" },
					[ProjectStatus.COMPLETED]: { color: "success", text: "Đã hoàn thành" },
					[ProjectStatus.ON_HOLD]: { color: "warning", text: "Tạm dừng" },
					[ProjectStatus.ARCHIVED]: { color: "default", text: "Lưu trữ" },
				};
				const config = statusMap[record.status] || { color: "default", text: record.status };
				return <Tag color={config.color}>{config.text}</Tag>;
			},
		},
		{
			title: "Độ ưu tiên",
			dataIndex: "priority",
			valueType: "select",
			valueEnum: {
				[ProjectPriority.URGENT]: { text: "Khẩn cấp", status: "Error" },
				[ProjectPriority.HIGH]: { text: "Cao", status: "Warning" },
				[ProjectPriority.MEDIUM]: { text: "Trung bình", status: "Processing" },
				[ProjectPriority.LOW]: { text: "Thấp", status: "Default" },
			},
			render: (_, record) => {
				const priorityMap: Record<ProjectPriority, { color: string, text: string }> = {
					[ProjectPriority.URGENT]: { color: "error", text: "Khẩn cấp" },
					[ProjectPriority.HIGH]: { color: "volcano", text: "Cao" },
					[ProjectPriority.MEDIUM]: { color: "orange", text: "Trung bình" },
					[ProjectPriority.LOW]: { color: "blue", text: "Thấp" },
				};
				const config = priorityMap[record.priority];
				if (!config)
					return null;
				return <Tag color={config.color}>{config.text}</Tag>;
			},
		},
		{
			title: "Chủ sở hữu",
			dataIndex: "owner",
			hideInSearch: true,
			render: (_, record) => <PeoplePicker readonly user={record.owner} showEmail={false} />,
		},
		{
			title: "Hạn chót",
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
