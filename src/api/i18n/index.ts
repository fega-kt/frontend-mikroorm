import type { I18nLanguage, TranslationDictionary, TranslationItem, TranslationRow, TranslationTable } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

/** Bản dịch dữ liệu do người dùng nhập (nhãn trường của biểu mẫu…). Namespace là tiền tố của khóa, vd: `form.<formId>` */
export class I18nService extends CrudServiceBase<TranslationTable> {
	constructor() {
		super({ endpoint: "i18n", service: ApiService.App });
	}

	/** Bản dịch của cả ba ngôn ngữ một lần (nạp sẵn, đổi ngôn ngữ không phải gọi lại) */
	fetchDictionaries(namespace: string) {
		return this.get<Record<I18nLanguage, TranslationDictionary>>(`${namespace}/dictionaries`, { ignoreLoading: true });
	}

	fetchTable(namespace: string) {
		return this.get<TranslationTable>(`${namespace}/all`, { ignoreLoading: true });
	}

	/**
	 * Mọi bản dịch theo trang (sắp theo khóa đầy đủ); `search` tìm theo key hoặc nội dung;
	 * `namespace` lọc theo tiền tố: `app`, `form` (mọi biểu mẫu), `form.<formId>`; bỏ trống = tất cả
	 */
	fetchList(query: { page: number, limit: number, search?: string, namespace?: string }) {
		const searchParams = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== "")) as Record<string, string | number>;
		return this.get<{ data: TranslationRow[], total: number }>("", { searchParams, ignoreLoading: true });
	}

	/** Mọi key đang có của namespace */
	fetchKeys(namespace: string) {
		return this.get<string[]>(`${namespace}/keys`, { ignoreLoading: true });
	}

	/** Mỗi mục đặt đủ cả ba ngôn ngữ một lần; `remove` là các key cần xóa */
	fetchSave(namespace: string, items: TranslationItem[], remove: string[] = []) {
		return this.put<{ saved: number, removed: number }>(namespace, { json: { items, remove } as never, ignoreLoading: true });
	}
}

export const i18nService = new I18nService();
