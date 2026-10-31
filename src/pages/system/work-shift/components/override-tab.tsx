import type { WorkDayOverride, WorkShift } from "#src/api/work-calendar";
import type { TableColumnsType } from "antd";
import { workDayOverrideService, WorkDayType, WorkTargetType } from "#src/api/work-calendar";
import { CopyOutlined, DeleteOutlined, EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, DatePicker, Popconfirm, Select, Space, Table, Tag } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_SHIFT_COLOR, targetName, WEEKDAY_KEYS, weekdayIndex } from "../utils";
import { OverrideModal } from "./override-modal";

interface OverrideTabProps {
	shifts: WorkShift[]
	canManage: boolean
}

/** Ngày đặc biệt theo năm: nghỉ lễ / Tết, làm bù, đổi ca — của công ty, phòng hoặc người */
export function OverrideTab({ shifts, canManage }: OverrideTabProps) {
	const { t } = useTranslation();
	const [year, setYear] = useState(dayjs().year());
	const [scope, setScope] = useState<WorkTargetType | "all">("all");
	const [rows, setRows] = useState<WorkDayOverride[]>([]);
	const [loading, setLoading] = useState(false);
	const [editing, setEditing] = useState<WorkDayOverride | null>();

	const load = useCallback(async () => {
		setLoading(true);
		try {
			setRows(await workDayOverrideService.fetchList({
				from: `${year}-01-01`,
				to: `${year}-12-31`,
				targetType: scope === "all" ? undefined : scope,
			}));
		}
		finally {
			setLoading(false);
		}
	}, [year, scope]);

	useEffect(() => {
		load().catch(() => undefined);
	}, [load]);

	const remove = async (id: string) => {
		try {
			await workDayOverrideService.fetchDelete(id);
			window.$message?.success(t("common.deleteSuccess"));
			await load();
		}
		catch {
			// lỗi đã được interceptor hiển thị
		}
	};

	/** Chép ngày đặc biệt cấp công ty sang năm sau (ngày âm lịch như Tết cần sửa lại) */
	const copyToNextYear = () => {
		window.$modal?.confirm({
			title: t("workCalendar.override.copyConfirm", { from: year, to: year + 1 }),
			content: t("workCalendar.override.copyHint"),
			okText: t("common.confirm"),
			cancelText: t("common.cancel"),
			onOk: async () => {
				try {
					const { copied, skipped } = await workDayOverrideService.fetchCopyYear({
						targetType: WorkTargetType.Company,
						fromYear: year,
						toYear: year + 1,
					});
					window.$message?.success(t("workCalendar.override.copied", { copied, skipped }));
				}
				catch {
					// lỗi đã được interceptor hiển thị
				}
			},
		});
	};

	const columns: TableColumnsType<WorkDayOverride> = [
		{
			title: t("workCalendar.override.date"),
			dataIndex: "date",
			width: 160,
			render: (date: string) => `${t(`workCalendar.weekdayShort.${WEEKDAY_KEYS[weekdayIndex(date)]}`)}, ${dayjs(date).format("DD/MM/YYYY")}`,
		},
		{ title: t("workCalendar.override.name"), dataIndex: "name" },
		{
			title: t("workCalendar.override.type"),
			key: "type",
			width: 220,
			render: (_, row) => row.type === WorkDayType.Off
				? <Tag>{t("workCalendar.override.off")}</Tag>
				: (
					<Tag color={row.shift?.color || DEFAULT_SHIFT_COLOR}>
						{t("workCalendar.override.work")}
						{row.shift && `: ${row.shift.code}`}
					</Tag>
				),
		},
		{
			title: t("workCalendar.target.title"),
			key: "target",
			width: 240,
			render: (_, row) => (
				<span>
					<Tag bordered={false}>{t(`workCalendar.target.${row.targetType}`)}</Tag>
					{row.targetType !== WorkTargetType.Company && targetName(t, row)}
				</span>
			),
		},
		...(canManage
			? [{
				title: t("common.action"),
				key: "actions",
				width: 100,
				render: (_: unknown, row: WorkDayOverride) => (
					<Space size={0}>
						<Button type="link" size="small" icon={<EditOutlined />} onClick={() => setEditing(row)} />
						<Popconfirm title={t("workCalendar.override.confirmDelete")} onConfirm={() => remove(row.id)}>
							<Button type="link" size="small" danger icon={<DeleteOutlined />} />
						</Popconfirm>
					</Space>
				),
			}]
			: []),
	];

	return (
		<>
			<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
				<Space wrap>
					<DatePicker picker="year" allowClear={false} value={dayjs().year(year)} onChange={value => value && setYear(value.year())} />
					<Select
						className="w-44"
						value={scope}
						onChange={setScope}
						options={[
							{ value: "all", label: t("workCalendar.target.all") },
							...[WorkTargetType.Company, WorkTargetType.Department, WorkTargetType.User].map(value => ({
								value,
								label: t(`workCalendar.target.${value}`),
							})),
						]}
					/>
				</Space>
				{canManage && (
					<Space wrap>
						<Button icon={<CopyOutlined />} onClick={copyToNextYear}>
							{t("workCalendar.override.copyToNextYear")}
						</Button>
						<Button type="primary" icon={<PlusCircleOutlined />} onClick={() => setEditing(null)}>
							{t("common.add")}
						</Button>
					</Space>
				)}
			</div>
			<Table
				rowKey="id"
				size="middle"
				columns={columns}
				dataSource={rows}
				loading={loading}
				pagination={{ pageSize: 50, hideOnSinglePage: true }}
				scroll={{ x: 800 }}
			/>
			<OverrideModal
				override={editing}
				shifts={shifts}
				onClose={(changed) => {
					setEditing(undefined);
					if (changed)
						load().catch(() => undefined);
				}}
			/>
		</>
	);
}
