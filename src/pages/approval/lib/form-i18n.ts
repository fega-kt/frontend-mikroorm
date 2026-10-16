import type { TranslationDictionary, TranslationTarget } from "#src/api/i18n";
import type { FormField } from "#src/api/setting/request-type/types";
import { i18nService, TRANSLATION_TARGETS } from "#src/api/i18n";
import { FormFieldType } from "#src/api/setting/request-type/types";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

/** Nhóm bản dịch của một biểu mẫu */
export const formI18nNamespace = (formId: string) => `form.${formId}`;

export type FormI18nKind = "label" | "placeholder" | "option";

export const fieldI18nKey = (fieldKey: string, part: "label" | "placeholder") => `field.${fieldKey}.${part}`;
export const optionI18nKey = (fieldKey: string, value: string) => `field.${fieldKey}.option.${value}`;

/** Một chuỗi có thể dịch của biểu mẫu (chuỗi gốc là tiếng Việt do admin nhập trong formSchema) */
export interface FormI18nString {
	key: string
	kind: FormI18nKind
	fieldKey: string
	/** Nhãn của trường chứa chuỗi này, để người dịch biết ngữ cảnh */
	fieldLabel: string
	source: string
}

/** Liệt kê mọi chuỗi cần dịch trong formSchema: nhãn, gợi ý nhập, nhãn từng lựa chọn */
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
	}));
}

/** Ngôn ngữ giao diện (vd: en-US) → ngôn ngữ có bản dịch (en); tiếng Việt là gốc nên không có */
function toTranslationTarget(language: string): TranslationTarget | undefined {
	const short = language.split("-")[0];
	return (TRANSLATION_TARGETS as readonly string[]).includes(short) ? (short as TranslationTarget) : undefined;
}

const NO_DICTIONARY: TranslationDictionary = {};

/** Bản dịch đã tải trong phiên (mở nhiều tờ trình cùng biểu mẫu không gọi lại API) */
const dictionaryCache = new Map<string, Promise<TranslationDictionary>>();

export function clearFormDictionaryCache(formId?: string) {
	if (!formId) {
		dictionaryCache.clear();
		return;
	}
	for (const key of [...dictionaryCache.keys()]) {
		if (key.startsWith(`${formI18nNamespace(formId)}|`))
			dictionaryCache.delete(key);
	}
}

function loadDictionary(formId: string, lang: TranslationTarget) {
	const cacheKey = `${formI18nNamespace(formId)}|${lang}`;
	let pending = dictionaryCache.get(cacheKey);
	if (!pending) {
		// Lỗi (vd: chưa có quyền / backend cũ) thì coi như chưa có bản dịch, không chặn hiển thị form
		pending = i18nService.fetchDictionary(formI18nNamespace(formId), lang).catch(() => ({}));
		dictionaryCache.set(cacheKey, pending);
	}
	return pending;
}

/**
 * Nhãn / gợi ý / lựa chọn của form theo ngôn ngữ đang dùng: tiếng Việt (gốc) giữ nguyên;
 * ngôn ngữ khác lấy bản dịch từ backend, thiếu thì quay về chuỗi gốc.
 */
export function useLocalizedFields(formId: string | undefined, fields: FormField[]): FormField[] {
	const { i18n } = useTranslation();
	const lang = toTranslationTarget(i18n.language);
	// Bản dịch kèm khóa (biểu mẫu + ngôn ngữ) mà nó thuộc về, để không dùng nhầm bản của lần chọn trước
	const [loaded, setLoaded] = useState<{ id: string, dictionary: TranslationDictionary }>();
	const wanted = formId && lang ? `${formId}|${lang}` : undefined;

	useEffect(() => {
		if (!formId || !lang)
			return;
		let active = true;
		loadDictionary(formId, lang).then(dictionary => active && setLoaded({ id: `${formId}|${lang}`, dictionary }));
		return () => {
			active = false;
		};
	}, [formId, lang]);

	const dictionary = wanted && loaded?.id === wanted ? loaded.dictionary : NO_DICTIONARY;
	return useMemo(() => localizeFields(fields, dictionary), [fields, dictionary]);
}
