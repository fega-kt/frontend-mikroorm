import type { ApprovalWorkflowEntity } from "#src/api/approval-workflow";
import type { ProColumns } from "@ant-design/pro-components";
import { Badge, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { DATE_TIME_FORMAT } from "../lib/payload";

export function getConstantColumns(t: (key: string, options?: Record<string, unknown>) => string): ProColumns<ApprovalWorkflowEntity>[] {
	return [
		{
			title: t("approval.workflow.name"),
			dataIndex: "search",
			hideInTable: true,
		},
		{
			title: t("approval.workflow.name"),
			dataIndex: "name",
			width: 240,
			ellipsis: true,
			hideInSearch: true,
			render: (_, record) => (
				<div className="flex flex-col">
					<Typography.Text strong>{record.name}</Typography.Text>
					{record.description && <Typography.Text type="secondary" className="text-xs" ellipsis>{record.description}</Typography.Text>}
				</div>
			),
		},
		{
			title: t("approval.workflow.requestType"),
			dataIndex: ["requestType", "name"],
			width: 180,
			hideInSearch: true,
		},
		{
			title: t("approval.workflow.department"),
			dataIndex: ["department", "name"],
			width: 180,
			hideInSearch: true,
			render: (_, record) => record.department?.name ?? <Typography.Text type="secondary">{t("approval.workflow.allDepartments")}</Typography.Text>,
		},
		{
			title: t("approval.workflow.priority"),
			dataIndex: "priority",
			width: 90,
			align: "center",
			hideInSearch: true,
		},
		{
			title: t("approval.workflow.publishedVersion"),
			dataIndex: "publishedVersion",
			width: 220,
			hideInSearch: true,
			render: (_, record) => (
				<Space size={4} wrap>
					{record.publishedVersion
						? (
							<Tag color="success" className="m-0">
								{`v${record.publishedVersion.version}`}
								{record.publishedVersion.publishedAt && ` · ${dayjs(record.publishedVersion.publishedAt).format("DD/MM/YYYY")}`}
							</Tag>
						)
						: <Tag className="m-0">{t("approval.workflow.noPublished")}</Tag>}
					{record.draftVersion && <Tag color="processing" className="m-0">{`v${record.draftVersion.version} · ${t("approval.workflow.draft")}`}</Tag>}
				</Space>
			),
		},
		{
			title: t("approval.workflow.isActive"),
			dataIndex: "isActive",
			width: 110,
			hideInSearch: true,
			render: (_, record) => <Badge status={record.isActive ? "success" : "default"} text={t(record.isActive ? "approval.workflow.active" : "approval.workflow.inactive")} />,
		},
		{
			title: t("approval.fields.updatedAt"),
			dataIndex: "updatedAt",
			width: 150,
			hideInSearch: true,
			render: (_, record) => dayjs(record.updatedAt).format(DATE_TIME_FORMAT),
		},
	];
}
