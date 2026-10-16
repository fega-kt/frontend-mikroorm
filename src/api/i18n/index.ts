import type { I18nLanguage, TranslationDictionary, TranslationItem, TranslationTable } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

/** Bản dịch dữ liệu do người dùng nhập (nhãn trường của biểu mẫu…). Namespace là tiền tố của khóa, vd: `form.<formId>` */
export class I18nService extends CrudServiceBase<TranslationTable> {
	constructor() {
		super({ endpoint: "i18n", service: ApiService.App });
	}

	fetchDictionary(namespace: string, lang: I18nLanguage) {
		return this.get<TranslationDictionary>(namespace, { searchParams: { lang }, ignoreLoading: true });
	}

	fetchTable(namespace: string) {
		return this.get<TranslationTable>(`${namespace}/all`, { ignoreLoading: true });
	}

	/** Mỗi mục đặt đủ cả ba ngôn ngữ một lần; `remove` là các key cần xóa */
	fetchSave(namespace: string, items: TranslationItem[], remove: string[] = []) {
		return this.put<{ saved: number, removed: number }>(namespace, { json: { items, remove } as never, ignoreLoading: true });
	}
}

export const i18nService = new I18nService();
