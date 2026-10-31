import type { WorkSchedule, WorkShift } from "#src/api/work-calendar";
import type { TableColumnsType } from "antd";
import { workScheduleService } from "#src/api/work-calendar";
import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Space, Table, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cycleDayLabel, DEFAULT_SHIFT_COLOR, formatSegments, isWeekly, WEEKDAY_KEYS } from "../utils";
import { ScheduleModal } from "./schedule-modal";

interface ScheduleTabProps {
	schedules: WorkSchedule[]
	shifts: WorkShift[]
	loading: boolean
	canManage: boolean
	onChanged: () => void
}

export function ScheduleTab({ schedules, shifts, loading, canManage, onChanged }: ScheduleTabProps) {
	const { t } = useTranslation();
	const [editing, setEditing] = useState<WorkSchedule | null>();
	const shiftById = new Map(shifts.map(s => [s.id, s]));

	const remove = async (id: string) => {
		try {
			await workScheduleService.fetchDelete(id);
			window.$message?.success(t("common.deleteSuccess"));
			onChanged();
		}
		catch {
			// lỗi (đang được gán) đã được interceptor hiển thị
		}
	};

	/** Chuỗi ca theo ngày: T2 [HC] T3 [HC] … CN [Nghỉ] */
	const renderDays = (row: WorkSchedule) => (
		<div className="flex flex-wrap gap-1">
			{row.days.map((id, i) => {
				const shift = id ? shiftById.get(id) : undefined;
				const label = isWeekly(row) ? t(`workCalendar.weekdayShort.${WEEKDAY_KEYS[i]}`) : cycleDayLabel(t, i, row.cycleDays, row.anchorDate);
				return (
					<Tooltip key={label} title={shift ? `${shift.name}: ${formatSegments(shift.segments)}` : t("workCalendar.dayOff")}>
						<Tag color={shift ? shift.color || DEFAULT_SHIFT_COLOR : undefined} className="m-0">
							{label}
							{": "}
							{shift ? shift.code : t("workCalendar.dayOffShort")}
						</Tag>
					</Tooltip>
				);
			})}
		</div>
	);

	const columns: TableColumnsType<WorkSchedule> = [
		{ title: t("workCalendar.code"), dataIndex: "code", width: 140 },
		{ title: t("workCalendar.name"), dataIndex: "name", width: 200 },
		{
			title: t("workCalendar.schedule.kind"),
			key: "kind",
			width: 180,
			render: (_, row) => isWeekly(row)
				? t("workCalendar.schedule.weekly")
				: t("workCalendar.schedule.cycleSummary", { n: row.cycleDays, date: dayjs(row.anchorDate).format("DD/MM/YYYY") }),
		},
		{ title: t("workCalendar.schedule.days"), key: "days", render: (_, row) => renderDays(row) },
		{
			title: t("workCalendar.schedule.ignoreHolidays"),
			dataIndex: "ignoreHolidays",
			width: 140,
			render: (value: boolean) => value ? <Tag color="orange">{t("workCalendar.schedule.duty")}</Tag> : null,
		},
		...(canManage
			? [{
				title: t("common.action"),
				key: "actions",
				width: 100,
				render: (_: unknown, row: WorkSchedule) => (
					<Space size={0}>
						<Button type="link" size="small" icon={<EditOutlined />} onClick={() => setEditing(row)} />
						<Popconfirm title={t("workCalendar.schedule.confirmDelete")} onConfirm={() => remove(row.id)}>
							<Button type="link" size="small" danger icon={<DeleteOutlined />} />
						</Popconfirm>
					</Space>
				),
			}]
			: []),
	];

	return (
		<>
			<div className="mb-3 flex justify-end">
				{canManage && (
					<Button type="primary" icon={<PlusCircleOutlined />} disabled={!shifts.length} onClick={() => setEditing(null)}>
						{t("common.add")}
					</Button>
				)}
			</div>
			<Table rowKey="id" size="middle" columns={columns} dataSource={schedules} loading={loading} pagination={false} scroll={{ x: 900 }} />
			<ScheduleModal
				schedule={editing}
				shifts={shifts}
				onClose={(changed) => {
					setEditing(undefined);
					if (changed)
						onChanged();
				}}
			/>
		</>
	);
}
