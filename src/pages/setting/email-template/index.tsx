import type { EmailTemplate } from "#src/api/email-template";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { DetailRef } from "./components/detail";
import { emailTemplateService } from "#src/api/email-template";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { DeleteOutlined, EditOutlined, PlusCircleOutlined, UndoOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Detail } from "./components/detail";

/** Mẫu email — mẫu hệ thống (gắn với sự kiện tờ trình) + mẫu tùy chỉnh cho bước Thông báo */
export default function EmailTemplates() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const canEdit = canAccess(PermissionType.UpdateEmailTemplate);
	const actionRef = useRef<ActionType>(null);
	const detailRef = useRef<DetailRef>(null);

	const open = async (code?: string) => {
		const res = await detailRef.current?.show(code);
		if (res?.isChange)
			actionRef.current?.reload();
	};

	const remove = async (item: EmailTemplate) => {
		await emailTemplateService.fetchDelete(item.code);
		window.$message?.success(t(item.system ? "approval.emailTemplate.resetDone" : "common.deleteSuccess"));
		actionRef.current?.reload();
	};

	const columns: ProColumns<EmailTemplate>[] = [
		{
			title: t("approval.emailTemplate.name"),
			dataIndex: "name",
			width: 260,
			render: (_, item) => (
				<div className="flex flex-col">
					<Typography.Link onClick={() => open(item.code)}>{item.name}</Typography.Link>
					<Typography.Text type="secondary" className="text-xs">{item.code}</Typography.Text>
				</div>
			),
		},
		{
			title: t("approval.emailTemplate.type"),
			dataIndex: "system",
			width: 170,
			render: (_, item) => (
				<Space size={4} wrap>
					<Tag color={item.system ? "blue" : "default"} className="m-0">{t(item.system ? "approval.emailTemplate.system" : "approval.emailTemplate.custom")}</Tag>
					{item.system && item.customized && <Tag color="orange" className="m-0">{t("approval.emailTemplate.customized")}</Tag>}
				</Space>
			),
		},
		{ title: t("approval.emailTemplate.subject"), dataIndex: "subject", ellipsis: true },
		{
			title: t("approval.fields.updatedAt"),
			dataIndex: "updatedAt",
			width: 150,
			render: (_, item) => (item.updatedAt ? dayjs(item.updatedAt).format("DD/MM/YYYY HH:mm") : "—"),
		},
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 100,
			fixed: "right",
			render: (_, item) => [
				<Tooltip key="edit" title={t("common.edit")}>
					<Button type="text" size="small" icon={<EditOutlined />} onClick={() => open(item.code)} />
				</Tooltip>,
				(!item.system || item.customized) && (
					<Popconfirm
						key="remove"
						title={t(item.system ? "approval.emailTemplate.confirmReset" : "common.confirmDelete")}
						onConfirm={() => remove(item)}
						okText={t("common.confirm")}
						cancelText={t("common.cancel")}
						disabled={!canEdit}
					>
						<Tooltip title={t(item.system ? "approval.emailTemplate.reset" : "common.delete")}>
							<Button type="text" size="small" danger={!item.system} disabled={!canEdit} icon={item.system ? <UndoOutlined /> : <DeleteOutlined />} />
						</Tooltip>
					</Popconfirm>
				),
			].filter(Boolean),
		},
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<EmailTemplate>
				columns={columns}
				actionRef={actionRef}
				rowKey="code"
				search={false}
				pagination={false}
				request={async () => {
					const data = await emailTemplateService.fetchList();
					return { data, total: data.length, success: true };
				}}
				headerTitle={t("common.menu.emailTemplate")}
				toolBarRender={() => [
					<Button key="add" type="primary" icon={<PlusCircleOutlined />} disabled={!canEdit} onClick={() => open()}>
						{t("approval.emailTemplate.add")}
					</Button>,
				]}
			/>
			<Detail ref={detailRef} />
		</BasicContent>
	);
}
