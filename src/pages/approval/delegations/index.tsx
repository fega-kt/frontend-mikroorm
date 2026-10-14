import type { ApprovalDelegationEntity, ApprovalDelegationTab } from "#src/api/approval-delegation";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { DetailRef } from "./components/detail";
import { ApprovalDelegationMode, approvalDelegationService } from "#src/api/approval-delegation";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { PeoplePicker } from "#src/components/people-picker";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Badge, Button, Popconfirm, Segmented, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DATE_TIME_FORMAT } from "../lib/payload";
import { Detail } from "./components/detail";

type Tab = ApprovalDelegationTab;

function delegationState(item: ApprovalDelegationEntity) {
	const now = dayjs();
	if (now.isBefore(item.startAt))
		return "upcoming" as const;
	if (now.isAfter(item.endAt))
		return "expired" as const;
	return "active" as const;
}

const STATE_BADGE = { active: "success", upcoming: "processing", expired: "default" } as const;

export default function ApprovalDelegations() {
	const { t } = useTranslation();
	const actionRef = useRef<ActionType>(null);
	const detailRef = useRef<DetailRef>(null);
	const [tab, setTab] = useState<Tab>("mine");
	const canManage = useAccess().canAccess(PermissionType.ManageApprovalDelegation);

	const openDetail = async (id?: string) => {
		const res = await detailRef.current?.show(id);
		if (res?.isChange)
			actionRef.current?.reload();
	};

	const handleDelete = async (id: string) => {
		await approvalDelegationService.fetchDelete(id);
		window.$message?.success(t("common.deleteSuccess"));
		actionRef.current?.reload();
	};

	const userCell = (user: ApprovalDelegationEntity["toUser"]) => (
		<PeoplePicker readonly user={user} showEmail={false} />
	);

	// Người ủy quyền + ghi chú "tạo hộ" khi người tạo khác người ủy quyền (vd: HR tạo cho giám đốc)
	const fromUserCell = (item: ApprovalDelegationEntity) => (
		<div className="flex flex-col gap-0.5">
			{userCell(item.fromUser)}
			{item.createdBy && item.createdBy.id !== item.fromUser.id && (
				<Typography.Text type="secondary" className="text-xs">{t("approval.delegation.onBehalf", { name: item.createdBy.fullName })}</Typography.Text>
			)}
		</div>
	);
	const fromUserColumn: ProColumns<ApprovalDelegationEntity> = { title: t("approval.delegation.fromUser"), dataIndex: "fromUser", width: 220, render: (_, item) => fromUserCell(item) };
	const toUserColumn: ProColumns<ApprovalDelegationEntity> = { title: t("approval.delegation.toUser"), dataIndex: "toUser", width: 220, render: (_, item) => userCell(item.toUser) };
	// Tab của tôi: không cần cột người ủy quyền trừ khi có bản được tạo hộ
	const userColumns = tab === "all" ? [fromUserColumn, toUserColumn] : tab === "mine" ? [toUserColumn] : [fromUserColumn];
	const editable = tab !== "toMe";

	const columns: ProColumns<ApprovalDelegationEntity>[] = [
		...userColumns,
		{
			title: t("approval.delegation.mode"),
			dataIndex: "mode",
			width: 130,
			render: (_, item) => (
				<Tooltip title={t(`approval.delegation.modeDesc.${item.mode}`)}>
					<Tag bordered={false} color={item.mode === ApprovalDelegationMode.Handover ? "purple" : "blue"} className="m-0">
						{t(`approval.delegation.modeShort.${item.mode}`)}
					</Tag>
				</Tooltip>
			),
		},
		{
			title: t("approval.delegation.period"),
			dataIndex: "startAt",
			width: 300,
			render: (_, item) => `${dayjs(item.startAt).format(DATE_TIME_FORMAT)} → ${dayjs(item.endAt).format(DATE_TIME_FORMAT)}`,
		},
		{
			title: t("approval.delegation.state"),
			dataIndex: "state",
			width: 140,
			render: (_, item) => {
				const state = delegationState(item);
				return <Badge status={STATE_BADGE[state]} text={t(`approval.delegation.${state}`)} />;
			},
		},
		{
			title: t("approval.delegation.requestType"),
			dataIndex: ["requestType", "name"],
			width: 180,
			render: (_, item) => item.requestType?.name ?? <Typography.Text type="secondary">{t("approval.delegation.allTypes")}</Typography.Text>,
		},
		{ title: t("approval.delegation.reason"), dataIndex: "reason", ellipsis: true },
		...(editable
			? [{
				title: t("common.action"),
				valueType: "option",
				key: "option",
				width: 96,
				fixed: "right",
				render: (_: unknown, item: ApprovalDelegationEntity) => [
					<Tooltip key="edit" title={t("common.edit")}>
						<Button type="text" size="small" icon={<EditOutlined />} onClick={() => openDetail(item.id)} />
					</Tooltip>,
					<Popconfirm
						key="delete"
						title={t("common.confirmDelete")}
						onConfirm={() => handleDelete(item.id)}
						okText={t("common.confirm")}
						cancelText={t("common.cancel")}
					>
						<Tooltip title={t("common.delete")}>
							<Button type="text" size="small" danger icon={<DeleteOutlined />} />
						</Tooltip>
					</Popconfirm>,
				],
			} satisfies ProColumns<ApprovalDelegationEntity>]
			: []),
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<ApprovalDelegationEntity>
				key={tab}
				columns={columns}
				actionRef={actionRef}
				rowKey="id"
				search={false}
				params={{ tab }}
				request={async (params) => {
					const { data, total } = await approvalDelegationService.fetchList(params);
					return { data, total, success: true };
				}}
				headerTitle={(
					<Segmented<Tab>
						value={tab}
						onChange={setTab}
						options={[
							{ value: "mine", label: t("approval.delegation.mine") },
							{ value: "toMe", label: t("approval.delegation.toMe") },
							// Mọi ủy quyền (kể cả tạo hộ) — chỉ người quản lý ủy quyền
							...(canManage ? [{ value: "all" as const, label: t("approval.delegation.all") }] : []),
						]}
					/>
				)}
				toolBarRender={() => editable
					? [
						<Button key="add" type="primary" icon={<PlusCircleOutlined />} onClick={() => openDetail()}>
							{t("approval.delegation.add")}
						</Button>,
					]
					: []}
			/>
			<Detail ref={detailRef} />
		</BasicContent>
	);
}
