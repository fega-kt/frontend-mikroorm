/** Đối tượng nhận lịch / ngày đặc biệt; lấy ca theo thứ tự người → phòng → phòng cha … → công ty */
export enum WorkTargetType {
	Company = "company",
	Department = "department",
	User = "user",
}

export enum WorkDayType {
	/** Nghỉ (lễ, Tết, nghỉ riêng) */
	Off = "off",
	/** Đi làm với ca chỉ định (làm bù, đổi ca) */
	Work = "work",
}

export enum WorkDayStatus {
	Work = "work",
	Off = "off",
	/** Không cấp nào có lịch — thiếu cấu hình */
	None = "none",
}

/** Khung giờ "HH:mm"; end <= start nghĩa là sang ngày hôm sau */
export interface ShiftSegment {
	start: string
	end: string
}

export interface WorkShift {
	id: string
	code: string
	name: string
	color?: string | null
	segments: ShiftSegment[]
	workMinutes: number
	description?: string | null
}

export type WorkShiftPayload = Omit<WorkShift, "id" | "workMinutes">;

/** Lịch theo chu kỳ: days[i] = id ca của ngày thứ i (null = nghỉ); lịch tuần: 7 ngày, days[0] = thứ Hai */
export interface WorkSchedule {
	id: string
	code: string
	name: string
	cycleDays: number
	anchorDate: string
	days: (string | null)[]
	ignoreHolidays: boolean
	description?: string | null
}

export type WorkSchedulePayload = Omit<WorkSchedule, "id" | "anchorDate"> & { anchorDate?: string | null };

export interface WorkTarget {
	targetType: WorkTargetType
	departmentId?: string | null
	userId?: string | null
}

interface TargetRefs {
	targetType: WorkTargetType
	department?: { id: string, name: string } | null
	user?: { id: string, fullName: string, avatar?: string } | null
}

export interface WorkAssignment extends TargetRefs {
	id: string
	schedule: { id: string, code: string, name: string }
	effectiveFrom: string
	effectiveTo?: string | null
}

export interface WorkAssignmentPayload {
	scheduleId: string
	effectiveFrom: string
	effectiveTo?: string | null
}

export interface WorkDayOverride extends TargetRefs {
	id: string
	date: string
	type: WorkDayType
	name: string
	shift?: { id: string, code: string, name: string, color?: string | null } | null
}

export interface WorkDayOverridePayload {
	type: WorkDayType
	shiftId?: string | null
	name: string
}

export interface WorkDaySource {
	kind: "override" | "schedule"
	targetType: WorkTargetType
	targetId: string | null
	/** Rỗng với cấp công ty */
	targetName: string
	refId: string
	refName: string
}

export interface WorkDay {
	date: string
	status: WorkDayStatus
	shiftId: string | null
	source: WorkDaySource | null
}

export type CalendarShift = Omit<WorkShift, "description">;

export interface UserCalendar {
	user: { id: string, fullName: string, avatar?: string }
	department: { id: string, name: string } | null
	days: WorkDay[]
	shifts: CalendarShift[]
}

export interface WorkCalendarList {
	/** Phạm vi của dòng lịch chung; null = cả công ty */
	department: { id: string, name: string } | null
	/** Lịch chung của phạm vi (chưa tính lịch riêng của người) */
	days: WorkDay[]
	users: { user: { id: string, fullName: string, avatar?: string }, department: { id: string, name: string } | null, days: WorkDay[] }[]
	total: number
	shifts: CalendarShift[]
}

export interface WorkCalendarListParams {
	from: string
	to: string
	/** Bỏ trống = toàn bộ trong phạm vi được xem */
	departmentId?: string
	includeChildren?: boolean
	keyword?: string
	page?: number
	limit?: number
}
