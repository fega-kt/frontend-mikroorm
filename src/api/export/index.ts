import type { ExportJob, ExportJobSearchParams, ExportPayload, ExportPrepareResult, ExportResource } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

/** Danh sách thuộc core (người dùng, phòng ban, nhóm, vai trò, nhật ký, hàng đợi mail): xuất qua API core. Còn lại (phê duyệt) qua API app */
const CORE_RESOURCES: readonly ExportResource[] = ["user", "department", "group", "role", "activity-log", "activity-log-queue"];

/** Một backend (core hoặc app) cùng route `export`: mỗi bên chỉ biết các danh sách của mình */
class ExportApi extends CrudServiceBase {
	constructor(service: ApiService, readonly baseUrl: string) {
		super({ endpoint: "export", service });
	}

	/** Backend kiểm quyền, chốt bộ lọc + cột. Ít dòng trả link tải một lần; nhiều dòng tạo job chạy nền */
	prepare(resource: ExportResource, data: ExportPayload) {
		return this.post<ExportPrepareResult>(`${resource}/prepare`, { json: data as never, ignoreLoading: true });
	}

	jobs(params?: ExportJobSearchParams) {
		return this.get<{ data: ExportJob[], total: number, page: number, limit: number }>("jobs", { searchParams: params as never, ignoreLoading: true });
	}

	cancel(id: string) {
		return this.post<{ cancelled: boolean }>(`jobs/${id}/cancel`, { ignoreLoading: true });
	}

	jobDownload(id: string) {
		return this.get<{ url: string, expiresAt: string, filename: string }>(`jobs/${id}/download`, { ignoreLoading: true });
	}
}

const coreApi = new ExportApi(ApiService.Core, import.meta.env.VITE_API_BASE_URL);
const appApi = new ExportApi(ApiService.App, import.meta.env.VITE_API_APP_BASE_URL);

/** API chịu trách nhiệm một danh sách */
const apiOf = (resource: ExportResource) => (CORE_RESOURCES.includes(resource) ? coreApi : appApi);

/** Xuất Excel các danh sách; tự chọn API core hay app theo danh sách */
export class ExportService {
	/** Backend kiểm quyền, chốt bộ lọc + cột. Ít dòng trả link tải một lần; nhiều dòng tạo job chạy nền */
	fetchPrepare(resource: ExportResource, data: ExportPayload) {
		return apiOf(resource).prepare(resource, data);
	}

	/**
	 * Chuẩn bị rồi xuất. Chế độ tải ngay: mở link nên trình duyệt tải như một tệp thường (có tiến trình, không giữ cả file
	 * trong bộ nhớ), giống `downloadArchive` của tờ trình. Chế độ chạy nền: không tải gì — người gọi báo người dùng chờ thông báo.
	 */
	async start(resource: ExportResource, data: ExportPayload) {
		const api = apiOf(resource);
		const result = await api.prepare(resource, data);
		// Link tải một lần chỉ có hiệu lực ở đúng API đã cấp nó
		if (result.mode === "download")
			window.location.assign(`${api.baseUrl.replace(/\/+$/, "")}${result.downloadPath}`);
		return result;
	}

	/** Lịch sử xuất chạy nền của tôi (bảng job của core, đủ cả danh sách core lẫn phê duyệt), mới nhất trước */
	fetchJobs(params?: ExportJobSearchParams) {
		return coreApi.jobs(params);
	}

	/** Hủy lượt xuất đang chờ / đang chạy */
	fetchCancelJob(id: string) {
		return coreApi.cancel(id);
	}

	/** Link tải ngắn hạn của file đã xong; ký thẳng tới kho nên trình duyệt tải không qua backend */
	fetchJobDownload(id: string) {
		return coreApi.jobDownload(id);
	}
}

export const exportService = new ExportService();
