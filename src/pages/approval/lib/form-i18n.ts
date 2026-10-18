import type { I18nLanguage, TranslationDictionary } from "#src/api/i18n";
import type { FormField } from "#src/api/setting/request-type/types";
import { i18nService, toI18nLanguage } from "#src/api/i18n";
import { FormFieldType } from "#src/api/setting/request-type/types";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

/** Nhóm bản dịch của một biểu mẫu */
export const formI18nNamespace = (formId: string) => `form.${formId}`;

export type FormI18nKind = "label" | "placeholder" | "option";

export const fieldI18nKey = (fieldKey: string, part: "label" | "placeholder") => `field.${fieldKey}.${part}`;
export const optionI18nKey = (fieldKey: string, value: string) => `field.${fieldKey}.option.${value}`;
/** Cột của trường bảng: nhãn và nhãn lựa chọn nằm dưới trường bảng — đồng bộ backend form-i18n.ts */
export const columnI18nKey = (fieldKey: string, columnKey: string) => `field.${fieldKey}.column.${columnKey}.label`;
export const columnOptionI18nKey = (fieldKey: string, columnKey: string, value: string) => `field.${fieldKey}.column.${columnKey}.option.${value}`;

/** Một chuỗi có thể dịch của biểu mẫu (chuỗi gốc là tiếng Việt do admin nhập trong formSchema) */
export interface FormI18nString {
	key: string
	kind: FormI18nKind
	fieldKey: string
	/** Nhãn của trường chứa chuỗi này, để người dịch biết ngữ cảnh */
	fieldLabel: string
	source: string
}

/** Liệt kê mọi chuỗi cần dịch trong formSchema: nhãn, gợi ý nhập, nhãn từng lựa chọn, nhãn cột của bảng */
export function collectFormStrings(fields: FormField[]): FormI18nString[] {
	const result: FormI18nString[] = [];
	for (const field of fields) {
		if (!field.key)
			continue;
		const base = { fieldKey: field.key, fieldLabel: field.label };
		if (field.label)
			result.push({ ...base, key: fieldI18nKey(field.key, "label"), kind: "label", source: field.label });
		if (field.placeholder)
			result.push({ ...base, key: fieldI18nKey(field.key, "placeholder"), kind: "placeholder", source: field.placeholder });
		if (field.type === FormFieldType.Select) {
			for (const option of field.options ?? [])
				result.push({ ...base, key: optionI18nKey(field.key, option.value), kind: "option", source: option.label });
		}
		for (const column of field.type === FormFieldType.Table ? field.columns ?? [] : []) {
			// Ngữ cảnh cho người dịch: "Danh sách thiết bị › Đơn giá"
			const columnBase = { fieldKey: field.key, fieldLabel: `${field.label} › ${column.label}` };
			if (column.label)
				result.push({ ...columnBase, key: columnI18nKey(field.key, column.key), kind: "label", source: column.label });
			for (const option of column.options ?? [])
				result.push({ ...columnBase, key: columnOptionI18nKey(field.key, column.key, option.value), kind: "option", source: option.label });
		}
	}
	return result;
}

/** Thay nhãn / gợi ý / lựa chọn bằng bản dịch; chuỗi nào chưa có bản dịch thì giữ nguyên chuỗi gốc */
export function localizeFields(fields: FormField[], dictionary: TranslationDictionary): FormField[] {
	if (!Object.keys(dictionary).length)
		return fields;
	return fields.map(field => ({
		...field,
		label: dictionary[fieldI18nKey(field.key, "label")] || field.label,
		placeholder: dictionary[fieldI18nKey(field.key, "placeholder")] || field.placeholder,
		options: field.options?.map(option => ({ ...option, label: dictionary[optionI18nKey(field.key, option.value)] || option.label })),
		columns: field.columns?.map(column => ({
			...column,
			label: dictionary[columnI18nKey(field.key, column.key)] || column.label,
			options: column.options?.map(option => ({ ...option, label: dictionary[columnOptionI18nKey(field.key, column.key, option.value)] || option.label })),
		})),
	}));
}

const NO_DICTIONARY: TranslationDictionary = {};

type FormDictionaries = Partial<Record<I18nLanguage, TranslationDictionary>>;

/** Bản dịch cả ba ngôn ngữ của từng biểu mẫu đã tải trong phiên (mở lại form / đổi ngôn ngữ không gọi lại API) */
const dictionaryCache = new Map<string, Promise<FormDictionaries>>();

export function clearFormDictionaryCache(formId?: string) {
	if (formId)
		dictionaryCache.delete(formId);
	else
		dictionaryCache.clear();
}

function loadDictionaries(formId: string) {
	let pending = dictionaryCache.get(formId);
	if (!pending) {
		// Lỗi (vd: chưa có quyền / backend cũ) thì coi như chưa có bản dịch, không chặn hiển thị form
		pending = i18nService.fetchDictionaries(formI18nNamespace(formId)).catch(() => ({}));
		dictionaryCache.set(formId, pending);
	}
	return pending;
}

/**
 * Nhãn / gợi ý / lựa chọn của form theo ngôn ngữ đang dùng, lấy bản dịch từ backend (kể cả tiếng Việt:
 * admin có thể sửa chữ hiển thị mà không đổi formSchema); thiếu thì quay về chuỗi gốc trong formSchema.
 * Mỗi form chỉ gọi API một lần cho cả ba ngôn ngữ; đổi ngôn ngữ dùng luôn bản đã tải.
 */
export function useLocalizedFields(formId: string | undefined, fields: FormField[]): FormField[] {
	const { i18n } = useTranslation();
	const lang = toI18nLanguage(i18n.language);
	// Bản dịch kèm biểu mẫu mà nó thuộc về, để không dùng nhầm bản của form chọn trước
	const [loaded, setLoaded] = useState<{ formId: string, dictionaries: FormDictionaries }>();

	useEffect(() => {
		if (!formId)
			return;
		let active = true;
		loadDictionaries(formId).then(dictionaries => active && setLoaded({ formId, dictionaries }));
		return () => {
			active = false;
		};
	}, [formId]);

	const dictionary = (lang && loaded?.formId === formId && loaded?.dictionaries[lang]) || NO_DICTIONARY;
	return useMemo(() => localizeFields(fields, dictionary), [fields, dictionary]);
}
