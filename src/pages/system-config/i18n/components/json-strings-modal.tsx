import type { TranslationItem } from "#src/api/i18n";
import type { ColumnsType } from "antd/es/table";
import type { I18nSource, LanguageTexts } from "./json-strings";
import { I18N_LANGUAGES, i18nService } from "#src/api/i18n";
import { formService } from "#src/api/setting/form";
import { FormModal } from "#src/components/form-modal";
import { APP_I18N_NAMESPACE } from "#src/locales/overrides";
import { clearFormDictionaryCache, collectFormStrings, formI18nNamespace } from "#src/pages/approval/lib/form-i18n";
import { CheckCircleFilled, SearchOutlined } from "@ant-design/icons";
import { useDebounce, useRequest } from "ahooks";
import { Button, Checkbox, Input, Segmented, Select, Table, Tag, Typography } from "antd";
import { useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { EMPTY_TEXTS, getJsonStrings, matchesKeyword } from "./json-strings";

const { Text } = Typography;

/** API giới hạn số mục mỗi lần lưu */
const SAVE_CHUNK = 500;

type Source = I18nSource;

interface SourceString {
	key: string
	/** Chuỗi sẽ lưu khi thêm (JSON: chuỗi mặc định; biểu mẫu: chuỗi gốc tiếng Việt, en/zh là bản dịch đã có) */
	texts: LanguageTexts
}

export interface JsonStringsModalRef {
	/** `readOnly`: chỉ xem danh sách (không có quyền sửa); `source` / `formId`: mở sẵn đúng nguồn đang xem (mặc định giao diện) */
	show: (options?: { readOnly?: boolean, source?: Source, formId?: string }) => Promise<{ isChange: boolean } | undefined>
}

let guard: ((res?: { isChange: boolean }) => void) | undefined;

/** Danh sách chuỗi theo nguồn (giao diện / biểu mẫu); tích chọn rồi thêm → lưu ngay vào database */
export function JsonStringsModal({ ref }: { ref: React.Ref<JsonStringsModalRef> }) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [readOnly, setReadOnly] = useState(false);
	const [source, setSource] = useState<Source>("app");
	const [formId, setFormId] = useState<string>();
	const [rows, setRows] = useState<SourceString[]>([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<string[]>([]);
	const [existing, setExisting] = useState<ReadonlySet<string>>(() => new Set());
	/** Mặc định chỉ hiện chuỗi chưa có trong database (chưa thêm) */
	const [onlyNotAdded, setOnlyNotAdded] = useState(true);
	/** Bỏ kết quả của lần tải cũ khi người dùng đã đổi nguồn / biểu mẫu */
	const loadId = useRef(0);

	const { data: forms = [] } = useRequest(() => formService.fetchFormOptions(), { ready: open && source === "form", cacheKey: "i18n-form-options" });

	/** Lọc ngay khi gõ (chờ ngừng gõ một chút để không lọc lại ~1.500 dòng sau mỗi phím) */
	const keyword = useDebounce(search, { wait: 200 });

	const visibleRows = useMemo(
		() => rows.filter(row => !(onlyNotAdded && existing.has(row.key)) && matchesKeyword(keyword, row.key, row.texts)),
		[rows, keyword, onlyNotAdded, existing],
	);

	const namespace = source === "app" ? APP_I18N_NAMESPACE : formId && formI18nNamespace(formId);

	const load = async (nextSource: Source, nextFormId?: string) => {
		const id = ++loadId.current;
		setSelected([]);
		setRows([]);
		setExisting(new Set());
		if (nextSource === "form" && !nextFormId)
			return;
		setLoading(true);
		try {
			let nextRows: SourceString[];
			let keys: string[];
			if (nextSource === "app") {
				keys = await i18nService.fetchKeys(APP_I18N_NAMESPACE);
				nextRows = [...getJsonStrings()].map(([key, texts]) => ({ key, texts }));
			}
			else {
				const [form, table] = await Promise.all([formService.fetchFormItem(nextFormId!), i18nService.fetchTable(formI18nNamespace(nextFormId!))]);
				keys = Object.keys(table);
				nextRows = collectFormStrings(form.formSchema ?? []).map(item => ({
					key: item.key,
					texts: { vi: item.source, en: table[item.key]?.en ?? "", zh: table[item.key]?.zh ?? "" },
				}));
			}
			if (id !== loadId.current)
				return;
			setRows(nextRows);
			setExisting(new Set(keys));
		}
		finally {
			if (id === loadId.current)
				setLoading(false);
		}
	};

	useImperativeHandle(ref, () => ({
		show: async (options) => {
			const nextSource = options?.source ?? "app";
			const nextFormId = nextSource === "form" ? options?.formId : undefined;
			setReadOnly(!!options?.readOnly);
			setSource(nextSource);
			setFormId(nextFormId);
			setOnlyNotAdded(true);
			setSearch("");
			setOpen(true);
			load(nextSource, nextFormId);
			return new Promise((resolve) => {
				guard = resolve;
			});
		},
	}));

	const close = (res?: { isChange: boolean }) => {
		setOpen(false);
		guard?.(res);
		guard = undefined;
	};

	const changeSource = (value: Source) => {
		setSource(value);
		setFormId(undefined);
		load(value);
	};

	const pickForm = (id: string) => {
		setFormId(id);
		load("form", id);
	};

	/** Chỉ thêm được chuỗi có đủ cả ba ngôn ngữ (API bắt buộc) */
	const isComplete = (row: SourceString) => I18N_LANGUAGES.every(lang => row.texts[lang].trim());
	const incompleteKeys = useMemo(() => new Set(rows.filter(row => !isComplete(row)).map(row => row.key)), [rows]);

	const add = async () => {
		const keys = selected.filter(key => !existing.has(key) && !incompleteKeys.has(key));
		if (!keys.length || !namespace)
			return;
		const byKey = new Map(rows.map(row => [row.key, row.texts]));
		setSaving(true);
		try {
			for (let start = 0; start < keys.length; start += SAVE_CHUNK) {
				const items: TranslationItem[] = keys.slice(start, start + SAVE_CHUNK).map(key => ({ key, ...(byKey.get(key) ?? EMPTY_TEXTS) }));
				await i18nService.fetchSave(namespace, items);
			}
			if (source === "form" && formId)
				clearFormDictionaryCache(formId);
			window.$message?.success(t("system.i18n.app.addSuccess", { count: keys.length }));
			close({ isChange: true });
		}
		finally {
			setSaving(false);
		}
	};

	const columns: ColumnsType<SourceString> = [
		{
			title: t("system.i18n.app.key"),
			width: 260,
			render: (_, row) => (
				<div className="flex flex-col gap-1">
					<Text code className="text-xs break-all">{row.key}</Text>
					{existing.has(row.key)
						? <Tag color="success" icon={<CheckCircleFilled />} className="m-0 w-fit">{t("system.i18n.app.added")}</Tag>
						: incompleteKeys.has(row.key) && <Tag color="warning" className="m-0 w-fit">{t("system.i18n.app.missingLanguage")}</Tag>}
				</div>
			),
		},
		...I18N_LANGUAGES.map(lang => ({
			title: t(`system.i18n.langs.${lang}`),
			key: lang,
			render: (_: unknown, row: SourceString) => <Text className="text-sm whitespace-pre-wrap">{row.texts[lang] || "—"}</Text>,
		})),
	];

	return (
		<FormModal
			title={t("system.i18n.app.stringList")}
			width={1100}
			open={open}
			onCancel={() => close()}
			footer={(
				<div className="flex flex-wrap items-center gap-3">
					{/* Bộ lọc nằm ở footer, bên trái nút thao tác */}
					<Checkbox checked={onlyNotAdded} onChange={e => setOnlyNotAdded(e.target.checked)}>{t("system.i18n.app.onlyNotAdded")}</Checkbox>
					<Text type="secondary">{t("system.i18n.app.total", { count: visibleRows.length })}</Text>
					<div className="flex-1" />
					<Button onClick={() => close()}>{t("common.cancel")}</Button>
					{!readOnly && (
						<Button type="primary" disabled={!selected.length} loading={saving} onClick={add}>
							{t("system.i18n.app.addSelected", { count: selected.length })}
						</Button>
					)}
				</div>
			)}
		>
			<div className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center gap-3">
					<Segmented<Source>
						value={source}
						onChange={changeSource}
						options={[
							{ value: "app", label: t("system.i18n.app.sourceApp") },
							{ value: "form", label: t("system.i18n.app.sourceForm") },
						]}
					/>
					{source === "form" && (
						<Select
							showSearch
							className="w-[300px]"
							placeholder={t("system.i18n.pickForm")}
							value={formId}
							optionFilterProp="label"
							options={forms.map(form => ({ value: form.id, label: `${form.name} (${form.code})` }))}
							onChange={pickForm}
						/>
					)}
					<Input allowClear autoFocus className="w-[300px]" prefix={<SearchOutlined />} placeholder={t("system.i18n.app.search")} value={search} onChange={e => setSearch(e.target.value)} />
				</div>
				<Table<SourceString>
					size="small"
					rowKey="key"
					loading={loading}
					columns={columns}
					dataSource={visibleRows}
					pagination={{ defaultPageSize: 10, showSizeChanger: true }}
					locale={source === "form" && !formId ? { emptyText: t("system.i18n.pickForm") } : undefined}
					rowSelection={readOnly
						? undefined
						: {
							selectedRowKeys: selected,
							preserveSelectedRowKeys: true,
							onChange: keys => setSelected(keys as string[]),
							getCheckboxProps: row => ({ disabled: existing.has(row.key) || incompleteKeys.has(row.key) }),
						}}
				/>
			</div>
		</FormModal>
	);
}
