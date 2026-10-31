import type {
	UserCalendar,
	WorkAssignment,
	WorkAssignmentPayload,
	WorkCalendarList,
	WorkCalendarListParams,
	WorkDayOverride,
	WorkDayOverridePayload,
	WorkSchedule,
	WorkSchedulePayload,
	WorkShift,
	WorkShiftPayload,
	WorkTarget,
	WorkTargetType,
} from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

/** Bỏ tham số rỗng để không gửi "undefined" / "null" lên query string */
function clean<T extends object>(params: T) {
	return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")) as Record<string, string>;
}

export class WorkShiftService extends CrudServiceBase {
	constructor() {
		super({ endpoint: "work-shift", service: ApiService.Core });
	}

	fetchList() {
		return this.get<WorkShift[]>("", { ignoreLoading: true });
	}

	fetchCreate(data: WorkShiftPayload) {
		return this.post<{ id: string }>("", { json: data, ignoreLoading: true });
	}

	fetchUpdate(id: string, data: WorkShiftPayload) {
		return this.patch<{ id: string }>(id, { json: data, ignoreLoading: true });
	}

	fetchDelete(id: string) {
		return this.delete(id, { ignoreLoading: true });
	}
}

export class WorkScheduleService extends CrudServiceBase {
	constructor() {
		super({ endpoint: "work-schedule", service: ApiService.Core });
	}

	fetchList() {
		return this.get<WorkSchedule[]>("", { ignoreLoading: true });
	}

	fetchCreate(data: WorkSchedulePayload) {
		return this.post<{ id: string }>("", { json: data, ignoreLoading: true });
	}

	fetchUpdate(id: string, data: WorkSchedulePayload) {
		return this.patch<{ id: string }>(id, { json: data, ignoreLoading: true });
	}

	fetchDelete(id: string) {
		return this.delete(id, { ignoreLoading: true });
	}
}

export class WorkScheduleAssignmentService extends CrudServiceBase {
	constructor() {
		super({ endpoint: "work-schedule-assignment", service: ApiService.Core });
	}

	fetchList(params: { targetType?: WorkTargetType, departmentId?: string, userId?: string } = {}) {
		return this.get<WorkAssignment[]>("", { searchParams: clean(params), ignoreLoading: true });
	}

	/** Lịch đang hiệu lực của đối tượng tự kết thúc trước ngày bắt đầu của lịch mới */
	fetchCreate(data: WorkTarget & WorkAssignmentPayload) {
		return this.post<{ id: string }>("", { json: data, ignoreLoading: true });
	}

	fetchUpdate(id: string, data: WorkAssignmentPayload) {
		return this.patch<{ id: string }>(id, { json: data, ignoreLoading: true });
	}

	fetchDelete(id: string) {
		return this.delete(id, { ignoreLoading: true });
	}
}

export class WorkDayOverrideService extends CrudServiceBase {
	constructor() {
		super({ endpoint: "work-day-override", service: ApiService.Core });
	}

	fetchList(params: { from: string, to: string, targetType?: WorkTargetType, departmentId?: string, userId?: string }) {
		return this.get<WorkDayOverride[]>("", { searchParams: clean(params), ignoreLoading: true });
	}

	/** Tạo cho mọi ngày trong [from, to]; ngày đối tượng đã có thì ghi đè */
	fetchCreate(data: WorkTarget & WorkDayOverridePayload & { from: string, to: string }) {
		return this.post<{ count: number }>("", { json: data, ignoreLoading: true });
	}

	fetchUpdate(id: string, data: WorkDayOverridePayload) {
		return this.patch<{ id: string }>(id, { json: data, ignoreLoading: true });
	}

	fetchDelete(id: string) {
		return this.delete(id, { ignoreLoading: true });
	}

	fetchCopyYear(data: WorkTarget & { fromYear: number, toYear: number }) {
		return this.post<{ copied: number, skipped: number }>("copy-year", { json: data, ignoreLoading: true });
	}
}

export class WorkCalendarService extends CrudServiceBase {
	constructor() {
		super({ endpoint: "work-calendar", service: ApiService.Core });
	}

	fetchMine(range: { from: string, to: string }) {
		return this.get<UserCalendar>("me", { searchParams: range, ignoreLoading: true });
	}

	fetchUser(id: string, range: { from: string, to: string }) {
		return this.get<UserCalendar>(`user/${id}`, { searchParams: range, ignoreLoading: true });
	}

	/** Lịch nhiều nhân viên (phân trang); bỏ trống phòng = toàn bộ trong phạm vi được xem */
	fetchList(params: WorkCalendarListParams) {
		return this.get<WorkCalendarList>("", {
			searchParams: clean({ ...params, includeChildren: params.includeChildren ? "true" : undefined }),
			ignoreLoading: true,
		});
	}
}

export const workShiftService = new WorkShiftService();
export const workScheduleService = new WorkScheduleService();
export const workScheduleAssignmentService = new WorkScheduleAssignmentService();
export const workDayOverrideService = new WorkDayOverrideService();
export const workCalendarService = new WorkCalendarService();
