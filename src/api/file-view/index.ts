import { ApiService, CrudServiceBase } from "../service-base";

/** Cách xem một tệp — do backend quyết định theo loại tệp */
export enum FileViewKind {
	/** OnlyOffice Document Server */
	Office = "office",
	/** pdf.js ở client, tải theo từng đoạn (Range) */
	Pdf = "pdf",
	Image = "image",
	Video = "video",
	Audio = "audio",
	/** Không xem được trong hệ thống */
	Unsupported = "unsupported",
}

/**
 * Ngữ cảnh của tệp — mỗi ngữ cảnh có quy tắc phân quyền riêng ở backend (đồng bộ FileContextType của backend).
 * Thêm loại mới: thêm vào đây và khai báo service sở hữu ở CONTEXT_SERVICE.
 */
export enum FileContextType {
	/** Tệp của tờ trình — quyền theo quyền xem tờ trình */
	ApprovalRequest = "approval-request",
}

/** Backend nào xử lý ngữ cảnh đó (Core hay App) */
const CONTEXT_SERVICE: Record<FileContextType, ApiService> = {
	[FileContextType.ApprovalRequest]: ApiService.App,
};

const BASE_URL: Record<ApiService, string> = {
	[ApiService.Core]: import.meta.env.VITE_API_BASE_URL,
	[ApiService.App]: import.meta.env.VITE_API_APP_BASE_URL,
};

export interface FileViewDescriptor {
	fileId: string
	filename: string
	mimetype: string
	size: number
	kind: FileViewKind
	/** kind = pdf | image | video | audio: đường dẫn stream (cộng với base URL của backend xử lý ngữ cảnh) */
	streamPath?: string
	/** kind = office: địa chỉ Document Server để tải api.js */
	documentServerUrl?: string
	/** kind = office: cấu hình trình soạn thảo đã ký JWT */
	config?: Record<string, unknown>
}

/** Link tải tệp: ký thẳng tới R2, sống rất ngắn — mở ngay sau khi nhận */
export interface FileDownloadLink {
	url: string
	expiresAt: string
}

/** Thời gian chờ chuyển sang PDF: bằng giới hạn phía backend gọi Document Converter (120 giây) cộng thời gian tải lên R2 */
const PDF_CONVERT_TIMEOUT_MS = 150_000;

class FileViewApi extends CrudServiceBase<never> {
	constructor(service: ApiService) {
		super({ endpoint: "file-view", service });
	}

	fetchView(fileId: string) {
		return this.get<FileViewDescriptor>(fileId, {
			ignoreLoading: true,
			// Lỗi của API này (không đủ quyền, chưa cấu hình OnlyOffice…) không tự hết khi thử lại: tắt retry mặc định của ky
			// để không phải chờ nhiều lần và không hiện thông báo lỗi lặp
			retry: 0,
		});
	}

	fetchDownloadUrl(fileId: string) {
		return this.get<FileDownloadLink>(`${fileId}/download`, { ignoreLoading: true, retry: 0 });
	}

	/** Lần đầu backend phải chuyển Word / Excel / PowerPoint sang PDF (tệp lớn mất vài chục giây) nên chờ lâu hơn mặc định */
	fetchPdfDownloadUrl(fileId: string) {
		return this.get<FileDownloadLink>(`${fileId}/download-pdf`, { ignoreLoading: true, retry: 0, timeout: PDF_CONVERT_TIMEOUT_MS });
	}
}

/** Tệp chuyển được sang PDF để tải (Word / Excel / PowerPoint) — cùng danh sách với backend */
export function isConvertibleToPdf(filename: string) {
	return ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(filename.split(".").pop()?.toLowerCase() ?? "");
}

const clients: Record<ApiService, FileViewApi> = {
	[ApiService.Core]: new FileViewApi(ApiService.Core),
	[ApiService.App]: new FileViewApi(ApiService.App),
};

export const fileViewService = {
	/**
	 * Cách xem tệp (người xem không tải được). Chỉ cần id tệp: backend đọc ngữ cảnh chủ sở hữu từ bản ghi tệp để kiểm quyền.
	 * `contextType` chỉ để chọn đúng backend (Core hay App) xử lý ngữ cảnh đó.
	 */
	fetchView(contextType: FileContextType, fileId: string) {
		return clients[CONTEXT_SERVICE[contextType]].fetchView(fileId);
	},

	/** Link tải tệp (cùng quyền với xem tệp) */
	fetchDownloadUrl(contextType: FileContextType, fileId: string) {
		return clients[CONTEXT_SERVICE[contextType]].fetchDownloadUrl(fileId);
	},

	/** Tải tệp: xin link rồi mở ngay. Lỗi API đã được request util báo bằng message nên ở đây bỏ qua */
	async download(contextType: FileContextType, fileId: string) {
		try {
			const { url } = await this.fetchDownloadUrl(contextType, fileId);
			// Link ký trả Content-Disposition: attachment nên trình duyệt chỉ tải tệp, không rời trang
			window.location.assign(url);
		}
		catch {}
	},

	/** Tải bản PDF của tệp (Word / Excel / PowerPoint được chuyển sang PDF; tệp PDF thì như download) */
	async downloadPdf(contextType: FileContextType, fileId: string) {
		try {
			const { url } = await clients[CONTEXT_SERVICE[contextType]].fetchPdfDownloadUrl(fileId);
			window.location.assign(url);
		}
		catch {}
	},

	/** URL đầy đủ để trình xem PDF, thẻ img/video/audio đọc tệp từ đường dẫn stream backend trả về */
	buildStreamUrl(contextType: FileContextType, streamPath: string) {
		return `${BASE_URL[CONTEXT_SERVICE[contextType]].replace(/\/+$/, "")}${streamPath}`;
	},
};
