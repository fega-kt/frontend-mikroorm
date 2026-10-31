import type { DepartmentTreeNode } from "#src/api/system/dept/types";
import type { WorkAssignment, WorkSchedule, WorkTarget } from "#src/api/work-calendar";
import type { TableColumnsType, TreeDataNode } from "antd";
import type { AssignmentModalState } from "./assignment-modal";
import { departmentService } from "#src/api/system/dept";
import { workScheduleAssignmentService, WorkTargetType } from "#src/api/work-calendar";
import { UserAvatar } from "#src/components/user-avatar";
import { BankOutlined, DeleteOutlined, EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Alert, Badge, Button, Card, Empty, Popconfirm, Segmented, Space, Table, Tag, Tree, Typography } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DATE_FORMAT, targetName } from "../utils";
import { AssignmentModal } from "./assignment-modal";

const COMPANY_KEY = "company";

interface AssignmentTabProps {
	schedules: WorkSchedule[]
	canManage: boolean
	/** Tăng khi lịch làm việc đổi tên để nạp lại */
	version: number
}

function isActiveOn(a: WorkAssignment, date: string) {
	return a.effectiveFrom <= date && (!a.effectiveTo || a.effectiveTo >= date);
}

function formatDate(date?: string | null) {
	return date ? dayjs(date).format("DD/MM/YYYY") : "";
}

/**
 * Áp dụng lịch: theo đơn vị (cây công ty → phòng ban, mỗi nút hiện lịch đang áp dụng hoặc kế thừa từ cấp nào)
 * hoặc theo người (lịch riêng, thắng lịch của phòng)
 */
export function AssignmentTab({ schedules, canManage, version }: AssignmentTabProps) {
	const { t } = useTranslation();
	const [mode, setMode] = useState<"unit" | "user">("unit");
	const [assignments, setAssignments] = useState<WorkAssignment[]>([]);
	const [tree, setTree] = useState<DepartmentTreeNode[]>([]);
	const [loading, setLoading] = useState(false);
	const [selected, setSelected] = useState<string>(COMPANY_KEY);
	const [modal, setModal] = useState<AssignmentModalState>();
	const today = dayjs().format(DATE_FORMAT);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			setAssignments(await workScheduleAssignmentService.fetchList());
		}
		finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load().catch(() => undefined);
	}, [load, version]);

	useEffect(() => {
		departmentService.fetchActiveDeptTreeList().then(setTree).catch(() => undefined);
	}, []);

	const { parentOf, nameOf } = useMemo(() => {
		const parent = new Map<string, string | undefined>();
		const name = new Map<string, string>();
		const walk = (nodes: DepartmentTreeNode[], parentId?: string) => {
			for (const node of nodes) {
				parent.set(node.id, parentId);
				name.set(node.id, node.name);
				walk(node.children ?? [], node.id);
			}
		};
		walk(tree);
		return { parentOf: parent, nameOf: name };
	}, [tree]);

	const keyOf = (a: WorkAssignment) => a.targetType === WorkTargetType.Company ? COMPANY_KEY : a.department?.id ?? a.user?.id ?? "";
	const unitAssignments = (key: string) => assignments.filter(a => a.targetType !== WorkTargetType.User && keyOf(a) === key);
	const activeOf = (key: string) => unitAssignments(key).find(a => isActiveOn(a, today));

	/** Lịch hôm nay của đơn vị: của chính nó, hoặc kế thừa từ phòng cha gần nhất / công ty */
	const effective = (key: string): { from: string, assignment: WorkAssignment } | undefined => {
		let current: string | undefined = key;
		while (current) {
			const active = activeOf(current);
			if (active)
				return { from: current, assignment: active };
			current = current === COMPANY_KEY ? undefined : parentOf.get(current) ?? COMPANY_KEY;
		}
		return undefined;
	};

	const treeData: TreeDataNode[] = useMemo(() => {
		const toNode = (node: DepartmentTreeNode): TreeDataNode => ({
			key: node.id,
			title: (
				<span>
					{node.name}
					{assignments.some(a => a.department?.id === node.id && isActiveOn(a, today)) && <Badge status="processing" className="ml-2" />}
				</span>
			),
			children: (node.children ?? []).map(toNode),
		});
		return [{
			key: COMPANY_KEY,
			icon: <BankOutlined />,
			title: (
				<span>
					{t("workCalendar.target.company")}
					{assignments.some(a => a.targetType === WorkTargetType.Company && isActiveOn(a, today)) && <Badge status="processing" className="ml-2" />}
				</span>
			),
			children: tree.map(toNode),
		}];
	}, [tree, assignments, today, t]);

	const remove = async (id: string) => {
		try {
			await workScheduleAssignmentService.fetchDelete(id);
			window.$message?.success(t("common.deleteSuccess"));
			await load();
		}
		catch {
			// lỗi đã được interceptor hiển thị
		}
	};

	const statusTag = (a: WorkAssignment) => {
		if (isActiveOn(a, today))
			return <Tag color="green">{t("workCalendar.assignment.active")}</Tag>;
		return a.effectiveFrom > today
			? <Tag color="blue">{t("workCalendar.assignment.upcoming")}</Tag>
			: <Tag>{t("workCalendar.assignment.expired")}</Tag>;
	};

	const actionColumn = canManage
		? [{
			title: t("common.action"),
			key: "actions",
			width: 100,
			render: (_: unknown, row: WorkAssignment) => (
				<Space size={0}>
					<Button
						type="link"
						size="small"
						icon={<EditOutlined />}
						onClick={() => setModal({ target: { targetType: row.targetType }, assignment: row })}
					/>
					<Popconfirm title={t("workCalendar.assignment.confirmDelete")} onConfirm={() => remove(row.id)}>
						<Button type="link" size="small" danger icon={<DeleteOutlined />} />
					</Popconfirm>
				</Space>
			),
		}]
		: [];

	const baseColumns: TableColumnsType<WorkAssignment> = [
		{ title: t("workCalendar.schedule.title"), key: "schedule", render: (_, row) => `${row.schedule.code} – ${row.schedule.name}` },
		{ title: t("workCalendar.assignment.from"), dataIndex: "effectiveFrom", width: 130, render: formatDate },
		{
			title: t("workCalendar.assignment.to"),
			dataIndex: "effectiveTo",
			width: 130,
			render: (value?: string | null) => value ? formatDate(value) : t("workCalendar.assignment.noEnd"),
		},
		{ title: t("workCalendar.status"), key: "status", width: 120, render: (_, row) => statusTag(row) },
	];

	const selectedTarget: WorkTarget = selected === COMPANY_KEY
		? { targetType: WorkTargetType.Company }
		: { targetType: WorkTargetType.Department, departmentId: selected };
	const selectedName = selected === COMPANY_KEY ? t("workCalendar.target.company") : nameOf.get(selected) ?? "";
	const current = effective(selected);

	const unitView = (
		<div className="flex flex-col gap-4 lg:flex-row">
			<Card size="small" className="lg:w-80 lg:shrink-0" styles={{ body: { maxHeight: 560, overflow: "auto" } }}>
				<Tree
					showIcon
					blockNode
					defaultExpandedKeys={[COMPANY_KEY]}
					selectedKeys={[selected]}
					treeData={treeData}
					onSelect={keys => keys[0] && setSelected(String(keys[0]))}
				/>
			</Card>
			<Card
				size="small"
				className="min-w-0 flex-1"
				title={selectedName}
				extra={canManage && (
					<Button type="primary" size="small" icon={<PlusCircleOutlined />} disabled={!schedules.length} onClick={() => setModal({ target: selectedTarget })}>
						{t("workCalendar.assignment.add")}
					</Button>
				)}
			>
				{current
					? (
						<Alert
							showIcon
							type={current.from === selected ? "success" : "info"}
							className="mb-3"
							message={current.from === selected
								? t("workCalendar.assignment.applying", { schedule: current.assignment.schedule.name })
								: t("workCalendar.assignment.inheriting", {
									schedule: current.assignment.schedule.name,
									from: current.from === COMPANY_KEY ? t("workCalendar.target.company") : nameOf.get(current.from),
								})}
						/>
					)
					: <Alert showIcon type="warning" className="mb-3" message={t("workCalendar.assignment.noneApplied")} />}
				<Table
					rowKey="id"
					size="small"
					loading={loading}
					columns={[...baseColumns, ...actionColumn]}
					dataSource={unitAssignments(selected)}
					pagination={false}
					locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("workCalendar.assignment.noOwn")} /> }}
				/>
			</Card>
		</div>
	);

	const userView = (
		<Card
			size="small"
			title={t("workCalendar.assignment.userTitle")}
			extra={canManage && (
				<Button
					type="primary"
					size="small"
					icon={<PlusCircleOutlined />}
					disabled={!schedules.length}
					onClick={() => setModal({ target: { targetType: WorkTargetType.User } })}
				>
					{t("workCalendar.assignment.add")}
				</Button>
			)}
		>
			<Typography.Paragraph type="secondary">{t("workCalendar.assignment.userHint")}</Typography.Paragraph>
			<Table
				rowKey="id"
				size="small"
				loading={loading}
				columns={[
					{
						title: t("workCalendar.target.user"),
						key: "user",
						render: (_, row) => (
							<Space>
								<UserAvatar user={row.user} size={24} />
								{targetName(t, row)}
							</Space>
						),
					},
					...baseColumns,
					...actionColumn,
				]}
				dataSource={assignments.filter(a => a.targetType === WorkTargetType.User)}
				pagination={{ pageSize: 20, hideOnSinglePage: true }}
			/>
		</Card>
	);

	return (
		<>
			<Segmented
				className="mb-3"
				value={mode}
				onChange={value => setMode(value as "unit" | "user")}
				options={[
					{ value: "unit", label: t("workCalendar.assignment.byUnit") },
					{ value: "user", label: t("workCalendar.assignment.byUser") },
				]}
			/>
			{mode === "unit" ? unitView : userView}
			<AssignmentModal
				state={modal}
				schedules={schedules}
				onClose={(changed) => {
					setModal(undefined);
					if (changed)
						load().catch(() => undefined);
				}}
			/>
		</>
	);
}
