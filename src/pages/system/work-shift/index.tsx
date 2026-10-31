import type { WorkSchedule, WorkShift } from "#src/api/work-calendar";
import { workScheduleService, workShiftService } from "#src/api/work-calendar";
import { BasicContent } from "#src/components/basic-content";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import { Card, Tabs } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AssignmentTab } from "./components/assignment-tab";
import { OverrideTab } from "./components/override-tab";
import { ScheduleTab } from "./components/schedule-tab";
import { ShiftTab } from "./components/shift-tab";

/**
 * Cấu hình ca làm việc: ca → lịch làm việc (theo tuần / chu kỳ) → áp dụng cho công ty / phòng / người
 * → ngày đặc biệt (nghỉ lễ, làm bù). Ca của một người = cấp gần nhất có cấu hình (người → phòng → phòng cha → công ty).
 */
export default function WorkShiftPage() {
	const { t } = useTranslation();
	const canManage = useAccess().canAccess(PermissionType.ManageWorkShift);
	const [shifts, setShifts] = useState<WorkShift[]>([]);
	const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
	const [loading, setLoading] = useState(false);
	const [version, setVersion] = useState(0);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const [shiftList, scheduleList] = await Promise.all([workShiftService.fetchList(), workScheduleService.fetchList()]);
			setShifts(shiftList);
			setSchedules(scheduleList);
			setVersion(v => v + 1);
		}
		finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load().catch(() => undefined);
	}, [load]);

	return (
		<BasicContent className="h-full">
			<Card title={t("workCalendar.title")}>
				<Tabs
					items={[
						{
							key: "shifts",
							label: t("workCalendar.tabs.shifts"),
							children: <ShiftTab shifts={shifts} loading={loading} canManage={canManage} onChanged={load} />,
						},
						{
							key: "schedules",
							label: t("workCalendar.tabs.schedules"),
							children: <ScheduleTab schedules={schedules} shifts={shifts} loading={loading} canManage={canManage} onChanged={load} />,
						},
						{
							key: "assignments",
							label: t("workCalendar.tabs.assignments"),
							children: <AssignmentTab schedules={schedules} canManage={canManage} version={version} />,
						},
						{
							key: "overrides",
							label: t("workCalendar.tabs.overrides"),
							children: <OverrideTab shifts={shifts} canManage={canManage} />,
						},
					]}
				/>
			</Card>
		</BasicContent>
	);
}
