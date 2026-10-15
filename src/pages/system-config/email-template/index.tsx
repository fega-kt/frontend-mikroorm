import type { EmailTemplate, EmailTemplateCategory } from "#src/api/email-template";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { DetailRef } from "./components/detail";
import { EMAIL_TEMPLATE_CATEGORIES, emailTemplateService } from "#src/api/email-template";
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

const CATEGORY_COLOR: Record<EmailTemplateCategory, string> = { approval: "blue", auth: "purple", system: "cyan", custom: "default" };

/**
 * Mẫu email — mẫu hệ thống (sự kiện tờ trình; đăng nhập, mật khẩu; nhắc nhở) + mẫu tùy chỉnh cho bước Thông báo
 */
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
			dataIndex: "category",
			width: 190,
			filters: EMAIL_TEMPLATE_CATEGORIES.map(value => ({ value, text: t(`approval.emailTemplate.category.${value}`) })),
			onFilter: (value, item) => item.category === value,
			render: (_, item) => (
				<Space size={4} wrap>
					<Tag color={CATEGORY_COLOR[item.category]} className="m-0">{t(`approval.emailTemplate.category.${item.category}`)}</Tag>
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
