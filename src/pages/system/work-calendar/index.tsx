import type { CalendarShift, WorkCalendarList, WorkDay } from "#src/api/work-calendar";
import type { TableColumnsType } from "antd";
import type { Dayjs } from "dayjs";
import { workCalendarService, WorkDayStatus, WorkTargetType } from "#src/api/work-calendar";
import { BasicContent } from "#src/components/basic-content";
import { DepartmentPicker } from "#src/components/department-picker";
import { UserAvatar } from "#src/components/user-avatar";
import { ApartmentOutlined, WarningOutlined } from "@ant-design/icons";
import { Card, Checkbox, DatePicker, Input, Pagination, Space, Table, Tag, theme, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DATE_FORMAT, DEFAULT_SHIFT_COLOR, formatMinutes, formatSegments, WEEKDAY_KEYS, weekdayIndex } from "../work-shift/utils";

interface Row {
	key: string
	name: string
	avatar?: string
	userId?: string
	/** Dòng lịch chung của phòng */
	general?: boolean
	subDepartment?: string
	days: WorkDay[]
}

const PAGE_SIZE = 50;

/**
 * Lịch làm việc theo tháng: dòng đầu là lịch chung của phạm vi (phòng đã chọn, hoặc cả công ty / cây phòng của mình khi bỏ trống),
 * mỗi dòng sau là một nhân viên — phân trang, tìm theo tên
 */
export default function WorkCalendarPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	// DepartmentPicker nhận và trả về { id, name } (labelInValue)
	const [department, setDepartment] = useState<{ id: string, name: string }>();
	const departmentId = department?.id;
	const [month, setMonth] = useState<Dayjs>(dayjs().startOf("month"));
	const [includeChildren, setIncludeChildren] = useState(false);
	const [keyword, setKeyword] = useState<string>();
	const [page, setPage] = useState(1);
	const [data, setData] = useState<WorkCalendarList>();
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			setLoading(true);
			try {
				const result = await workCalendarService.fetchList({
					from: month.startOf("month").format(DATE_FORMAT),
					to: month.endOf("month").format(DATE_FORMAT),
					departmentId,
					includeChildren: !!departmentId && includeChildren,
					keyword,
					page,
					limit: PAGE_SIZE,
				});
				if (!cancelled)
					setData(result);
			}
			catch {
				if (!cancelled)
					setData(undefined);
			}
			finally {
				if (!cancelled)
					setLoading(false);
			}
		};
		load();
		return () => {
			cancelled = true;
		};
	}, [departmentId, month, includeChildren, keyword, page]);

	const shiftById = useMemo(() => new Map<string, CalendarShift>((data?.shifts ?? []).map(s => [s.id, s])), [data]);

	const rows: Row[] = useMemo(() => {
		if (!data)
			return [];
		return [
			{
				key: "__general",
				name: data.department ? t("workCalendar.calendar.general") : t("workCalendar.calendar.generalCompany"),
				general: true,
				days: data.days,
			},
			...data.users.map(u => ({
				key: u.user.id,
				name: u.user.fullName,
				avatar: u.user.avatar,
				userId: u.user.id,
				subDepartment: u.department && u.department.id !== data.department?.id ? u.department.name : undefined,
				days: u.days,
			})),
		];
	}, [data, t]);

	const sourceText = (day: WorkDay) => {
		if (!day.source)
			return t("workCalendar.calendar.noSchedule");
		const target = day.source.targetType === WorkTargetType.Company
			? t("workCalendar.target.company")
			: day.source.targetType === WorkTargetType.User
				? t("workCalendar.calendar.personal")
				: day.source.targetName;
		return t(day.source.kind === "override" ? "workCalendar.calendar.fromOverride" : "workCalendar.calendar.fromSchedule", {
			name: day.source.refName,
			target,
		});
	};

	const renderCell = (day: WorkDay) => {
		const shift = day.shiftId ? shiftById.get(day.shiftId) : undefined;
		const outline = day.source?.kind === "override" ? `2px solid ${token.colorWarning}` : undefined;
		const tooltip = (
			<div>
				<div className="font-medium">{dayjs(day.date).format("DD/MM/YYYY")}</div>
				{shift
					? <div>{`${shift.name} · ${formatSegments(shift.segments)} (${formatMinutes(shift.workMinutes)})`}</div>
					: <div>{day.status === WorkDayStatus.None ? t("workCalendar.calendar.noSchedule") : t("workCalendar.dayOff")}</div>}
				{day.source && <div className="opacity-80">{sourceText(day)}</div>}
			</div>
		);
		let content;
		if (shift) {
			content = (
				<div className="rounded px-0.5 py-1 text-center text-xs font-medium text-white" style={{ background: shift.color || DEFAULT_SHIFT_COLOR, outline }}>
					{shift.code}
				</div>
			);
		}
		else if (day.status === WorkDayStatus.None) {
			content = <div className="text-center" style={{ color: token.colorWarning }}><WarningOutlined /></div>;
		}
		else {
			content = (
				<div className="rounded py-1 text-center text-xs" style={{ color: token.colorTextTertiary, outline }}>
					{t("workCalendar.dayOffShort")}
				</div>
			);
		}
		return <Tooltip title={tooltip}>{content}</Tooltip>;
	};

	const dates = data?.days.map(d => d.date) ?? [];
	const columns: TableColumnsType<Row> = [
		{
			title: t("workCalendar.calendar.employee"),
			key: "name",
			fixed: "left",
			width: 220,
			render: (_, row) => row.general
				? (
					<Space>
						<ApartmentOutlined />
						<Typography.Text strong>{row.name}</Typography.Text>
					</Space>
				)
				: (
					<Space>
						<UserAvatar user={{ id: row.userId, fullName: row.name, avatar: row.avatar }} size={24} />
						<div className="leading-tight">
							<div>{row.name}</div>
							{row.subDepartment && <Typography.Text type="secondary" className="text-xs">{row.subDepartment}</Typography.Text>}
						</div>
					</Space>
				),
		},
		...dates.map((date, i) => {
			const weekday = weekdayIndex(date);
			const weekend = weekday >= 5;
			return {
				title: (
					<div className="text-center leading-tight" style={{ color: weekend ? token.colorError : undefined }}>
						<div>{dayjs(date).date()}</div>
						<div className="text-xs font-normal">{t(`workCalendar.weekdayShort.${WEEKDAY_KEYS[weekday]}`)}</div>
					</div>
				),
				key: date,
				width: 52,
				align: "center" as const,
				onCell: () => ({ style: { padding: 4, background: weekend ? token.colorFillQuaternary : undefined } }),
				render: (_: unknown, row: Row) => renderCell(row.days[i]),
			};
		}),
		{
			title: t("workCalendar.calendar.total"),
			key: "total",
			fixed: "right",
			width: 90,
			align: "center",
			render: (_, row) => {
				const working = row.days.filter(d => d.status === WorkDayStatus.Work);
				const minutes = working.reduce((sum, d) => sum + (d.shiftId ? shiftById.get(d.shiftId)?.workMinutes ?? 0 : 0), 0);
				return (
					<Tooltip title={t("workCalendar.calendar.totalHint", { days: working.length, hours: formatMinutes(minutes) })}>
						{t("workCalendar.calendar.totalDays", { count: working.length })}
					</Tooltip>
				);
			},
		},
	];

	return (
		<BasicContent className="h-full">
			<Card
				title={t("workCalendar.calendar.title")}
				extra={(
					<Space wrap>
						<DepartmentPicker
							className="w-64"
							placeholder={t("workCalendar.calendar.pickDepartment")}
							value={department}
							onChange={(value) => {
								setDepartment(value);
								setPage(1);
							}}
						/>
						<Input.Search
							className="w-56"
							allowClear
							placeholder={t("workCalendar.calendar.searchEmployee")}
							onSearch={(value) => {
								setKeyword(value.trim() || undefined);
								setPage(1);
							}}
						/>
						<DatePicker picker="month" format="MM/YYYY" allowClear={false} value={month} onChange={value => value && setMonth(value)} />
						<Checkbox
							checked={!!departmentId && includeChildren}
							disabled={!departmentId}
							onChange={(e) => {
								setIncludeChildren(e.target.checked);
								setPage(1);
							}}
						>
							{t("workCalendar.calendar.includeChildren")}
						</Checkbox>
					</Space>
				)}
			>
				<Table<Row>
					rowKey="key"
					size="small"
					bordered
					loading={loading}
					columns={columns}
					dataSource={rows}
					pagination={false}
					scroll={{ x: "max-content", y: 600 }}
				/>
				<div className="mt-3 flex flex-wrap items-center justify-between gap-2">
					<Space wrap>
						{(data?.shifts ?? []).map(s => (
							<Tag key={s.id} color={s.color || DEFAULT_SHIFT_COLOR}>{`${s.code}: ${s.name} (${formatSegments(s.segments)})`}</Tag>
						))}
						<Tag>{`${t("workCalendar.dayOffShort")}: ${t("workCalendar.dayOff")}`}</Tag>
						<Tag icon={<WarningOutlined />} color="warning">{t("workCalendar.calendar.noSchedule")}</Tag>
						<Tag style={{ outline: `2px solid ${token.colorWarning}` }}>{t("workCalendar.calendar.overrideLegend")}</Tag>
					</Space>
					<Pagination
						size="small"
						current={page}
						pageSize={PAGE_SIZE}
						total={data?.total ?? 0}
						showSizeChanger={false}
						showTotal={total => t("workCalendar.calendar.totalEmployees", { count: total })}
						hideOnSinglePage
						onChange={setPage}
					/>
				</div>
			</Card>
		</BasicContent>
	);
}
