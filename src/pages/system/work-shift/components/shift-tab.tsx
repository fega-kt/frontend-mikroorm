import type { WorkShift } from "#src/api/work-calendar";
import type { TableColumnsType } from "antd";
import { workShiftService } from "#src/api/work-calendar";
import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Space, Table, Tag } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_SHIFT_COLOR, formatMinutes, formatSegments } from "../utils";
import { ShiftModal } from "./shift-modal";

interface ShiftTabProps {
	shifts: WorkShift[]
	loading: boolean
	canManage: boolean
	onChanged: () => void
}

export function ShiftTab({ shifts, loading, canManage, onChanged }: ShiftTabProps) {
	const { t } = useTranslation();
	const [editing, setEditing] = useState<WorkShift | null>();

	const remove = async (id: string) => {
		try {
			await workShiftService.fetchDelete(id);
			window.$message?.success(t("common.deleteSuccess"));
			onChanged();
		}
		catch {
			// lỗi (đang được dùng) đã được interceptor hiển thị
		}
	};

	const columns: TableColumnsType<WorkShift> = [
		{
			title: t("workCalendar.code"),
			dataIndex: "code",
			width: 140,
			render: (code: string, row) => <Tag color={row.color || DEFAULT_SHIFT_COLOR}>{code}</Tag>,
		},
		{ title: t("workCalendar.name"), dataIndex: "name" },
		{ title: t("workCalendar.shift.segments"), dataIndex: "segments", render: formatSegments },
		{ title: t("workCalendar.shift.workHours"), dataIndex: "workMinutes", width: 120, render: formatMinutes },
		{ title: t("workCalendar.description"), dataIndex: "description", ellipsis: true },
		...(canManage
			? [{
				title: t("common.action"),
				key: "actions",
				width: 100,
				render: (_: unknown, row: WorkShift) => (
					<Space size={0}>
						<Button type="link" size="small" icon={<EditOutlined />} onClick={() => setEditing(row)} />
						<Popconfirm title={t("workCalendar.shift.confirmDelete")} onConfirm={() => remove(row.id)}>
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
					<Button type="primary" icon={<PlusCircleOutlined />} onClick={() => setEditing(null)}>
						{t("common.add")}
					</Button>
				)}
			</div>
			<Table rowKey="id" size="middle" columns={columns} dataSource={shifts} loading={loading} pagination={false} />
			<ShiftModal
				shift={editing}
				onClose={(changed) => {
					setEditing(undefined);
					if (changed)
						onChanged();
				}}
			/>
		</>
	);
}
