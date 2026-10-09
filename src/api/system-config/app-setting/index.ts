import type { ActivityLogEntity } from "../../activity-log/types";
import type { AppSettingKeyOption, AppSettingPayload, AppSettingRow, AppSettingSearchParams, AppSettingValue } from "./types";
import { ApiService, CrudServiceBase } from "../../service-base";

export * from "./types";

export class AppSettingService extends CrudServiceBase<AppSettingRow> {
	constructor() {
		super({ endpoint: "app-setting", service: ApiService.Core });
	}

	async fetchAppSettingList(params?: AppSettingSearchParams) {
		return this.get<{ data: AppSettingRow[], total: number }>("", { searchParams: params, ignoreLoading: true });
	}

	/** Các key chưa có giá trị, dùng cho ô chọn key khi thêm mới. */
	async fetchAvailableKeys() {
		return this.get<AppSettingKeyOption[]>("available-keys", { ignoreLoading: true });
	}

	/** Setting cho client (mọi user đăng nhập): map key -> value, backend chỉ trả các key được phép lộ ra. */
	async fetchClientSettings() {
		return this.get<Record<string, AppSettingValue>>("client", { ignoreLoading: true });
	}

	async fetchAppSettingItem(key: string) {
		return this.get<AppSettingRow>(key, { ignoreLoading: true });
	}

	/** Thiết lập giá trị cho key chưa cấu hình. */
	async fetchAddAppSetting(data: AppSettingPayload) {
		return this.post<AppSettingRow>("", { json: data, ignoreLoading: true });
	}

	async fetchUpdateAppSetting(key: string, data: Omit<AppSettingPayload, "key">) {
		return this.patch<AppSettingRow>(key, { json: data, ignoreLoading: true });
	}

	/** Lịch sử thao tác (activity log) của một key, mới nhất trước. */
	async fetchAppSettingHistory(key: string, params?: { page?: number, limit?: number }) {
		return this.get<{ data: ActivityLogEntity[], total: number }>(`${key}/history`, {
			searchParams: { page: 1, limit: 100, ...params },
			ignoreLoading: true,
		});
	}

	/** Xóa giá trị, key trở về trạng thái chưa cấu hình. */
	async fetchDeleteAppSetting(key: string) {
		return this.delete<void>(key, { ignoreLoading: true });
	}
}

export const appSettingService = new AppSettingService();
