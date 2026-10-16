import type { I18nLanguage, TranslationRow } from "#src/api/i18n";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { AppTranslationDetailRef } from "./app-translation-detail";
import type { I18nSource } from "./json-strings";
import type { JsonStringsModalRef } from "./json-strings-modal";
import { I18N_LANGUAGES, i18nService } from "#src/api/i18n";
import { formService } from "#src/api/setting/form";
import { BasicTable } from "#src/components/basic-table";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { loadAppTranslations } from "#src/hooks/use-app-translations";
import { APP_I18N_NAMESPACE } from "#src/locales/overrides";
import { clearFormDictionaryCache, collectFormStrings, formI18nNamespace } from "#src/pages/approval/lib/form-i18n";
import { DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Button, Popconfirm, theme, Typography } from "antd";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppTranslationDetail } from "./app-translation-detail";
import { getJsonStrings } from "./json-strings";
import { JsonStringsModal } from "./json-strings-modal";

const { Text } = Typography;

const FORM_PREFIX = "form.";

/** Khóa duy nhất của một dòng (cùng key có thể có ở nhiều namespace) */
const rowKeyOf = (row: Pick<TranslationRow, "namespace" | "key">) => `${row.namespace}.${row.key}`;

/** Nguồn của một namespace: `app` → giao diện, `form.<formId>` → biểu mẫu */
const sourceOf = (namespace: string): I18nSource => (namespace.startsWith(FORM_PREFIX) ? "form" : "app");
const formIdOf = (namespace: string) => (namespace.startsWith(FORM_PREFIX) ? namespace.slice(FORM_PREFIX.length) : undefined);

interface Filters {
	search?: string
	source?: I18nSource
	formId?: string
}

/** Bộ lọc → tiền tố namespace cho API: một biểu mẫu > mọi biểu mẫu / giao diện > tất cả */
function namespaceFilter({ source, formId }: Filters) {
	if (formId)
		return formI18nNamespace(formId);
	if (source === "form")
		return "form";
	return source === "app" ? APP_I18N_NAMESPACE : undefined;
}

/**
 * Mọi bản dịch trong database trên một danh sách, lọc theo loại (giao diện / biểu mẫu) và biểu mẫu:
 * - Giao diện (`app`): đè lên file JSON; ô trống = dùng chuỗi mặc định của JSON
 * - Biểu mẫu (`form.<formId>`): nhãn / gợi ý / lựa chọn của form, gồm cả key chỉ còn ở phiên bản cũ
 * Thêm = chọn trong danh sách i18n; bấm key để sửa trong popup; tích chọn nhiều dòng để xóa (xóa mềm).
 */
export function AppTranslations() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const canEdit = canAccess(PermissionType.UpdateI18n);
	const actionRef = useRef<ActionType>(null);
	const detailRef = useRef<AppTranslationDetailRef>(null);
	const jsonRef = useRef<JsonStringsModalRef>(null);
	const [filters, setFilters] = useState<Filters>({});
	const [selected, setSelected] = useState<string[]>([]);
	const [removing, setRemoving] = useState(false);

	const { token } = theme.useToken();
	const jsonStrings = getJsonStrings();

	const { data: forms = [] } = useRequest(() => formService.fetchFormOptions(), { cacheKey: "i18n-form-options" });
	const formOptions = useMemo(() => forms.map(form => ({ value: form.id, label: `${form.name} (${form.code})` })), [forms]);
	const formNames = useMemo(() => new Map(forms.map(form => [form.id, form.name])), [forms]);

	/** Đang lọc một biểu mẫu: key của định nghĩa hiện tại — key không có ở đây là của phiên bản cũ (phiếu cũ vẫn dùng) */
	const { data: currentFormKeys } = useRequest(
		async () => new Set(collectFormStrings((await formService.fetchFormItem(filters.formId!)).formSchema ?? []).map(item => item.key)),
		{ ready: !!filters.formId, refreshDeps: [filters.formId] },
	);

	/** Sau khi ghi: giao diện nạp lại bản đè cho người đang dùng; biểu mẫu bỏ bản dịch đã cache trong phiên */
	const afterChange = async (namespaces: string[]) => {
		for (const namespace of new Set(namespaces)) {
			const formId = formIdOf(namespace);
			if (formId)
				clearFormDictionaryCache(formId);
			else
				await loadAppTranslations().catch(() => {});
		}
		actionRef.current?.reload();
	};

	/** Nguồn của dòng (giao diện / tên biểu mẫu) và ghi chú — chỉ hiện trong popup sửa để danh sách gọn */
	const describe = (row: TranslationRow) => {
		const formId = formIdOf(row.namespace);
		if (!formId)
			return { label: t("system.i18n.app.sourceApp"), color: "blue", note: jsonStrings.has(row.key) ? undefined : t("system.i18n.app.orphanHint") };
		const oldVersion = filters.formId === formId && currentFormKeys && !currentFormKeys.has(row.key);
		return {
			label: `${t("system.i18n.app.sourceForm")}: ${formNames.get(formId) ?? formId}`,
			color: "purple",
			note: oldVersion ? t("system.i18n.app.oldVersionHint") : undefined,
		};
	};

	const openDetail = async (row: TranslationRow) => {
		const res = await detailRef.current?.show(row, { source: sourceOf(row.namespace), namespace: row.namespace, info: describe(row) });
		if (res?.isChange)
			await afterChange([row.namespace]);
	};

	/** Popup thêm mở sẵn theo bộ lọc đang dùng (mặc định giao diện) */
	const openStringList = async () => {
		const source = filters.formId ? "form" : filters.source;
		const res = await jsonRef.current?.show({ readOnly: !canEdit, source, formId: filters.formId });
		if (res?.isChange)
			actionRef.current?.reload();
	};

	/** Xóa (mềm) các dòng đã chọn, theo từng namespace; giao diện dùng lại chuỗi mặc định, biểu mẫu dùng lại tiếng Việt */
	const remove = async () => {
		const byNamespace = new Map<string, string[]>();
		for (const full of selected) {
			const isForm = full.startsWith(FORM_PREFIX);
			const parts = full.split(".");
			const size = isForm ? 2 : 1;
			const namespace = parts.slice(0, size).join(".");
			byNamespace.set(namespace, [...(byNamespace.get(namespace) ?? []), parts.slice(size).join(".")]);
		}
		setRemoving(true);
		try {
			for (const [namespace, keys] of byNamespace)
				await i18nService.fetchSave(namespace, [], keys);
			window.$message?.success(t("system.i18n.app.removeDone", { count: selected.length }));
			setSelected([]);
			await afterChange([...byNamespace.keys()]);
		}
		finally {
			setRemoving(false);
		}
	};

	/** Ô để trống: giao diện → chuỗi mặc định của JSON (hiện mờ); biểu mẫu → chưa dịch */
	const renderText = (row: TranslationRow, lang: I18nLanguage) => {
		if (row[lang])
			return <Text className="whitespace-pre-wrap">{row[lang]}</Text>;
		const fallback = sourceOf(row.namespace) === "app" ? jsonStrings.get(row.key)?.[lang] : undefined;
		return <Text type="secondary" italic>{fallback || "—"}</Text>;
	};

	const columns: ProColumns<TranslationRow>[] = [
		{
			title: t("system.i18n.app.key"),
			dataIndex: "key",
			width: 320,
			hideInSearch: true,
			// Chỉ tô màu theo nguồn: giao diện = màu chính, biểu mẫu = tím (chi tiết xem trong popup)
			render: (_, row) => (
				<Text className="break-all" style={{ color: sourceOf(row.namespace) === "form" ? token.purple : token.colorPrimary }}>{row.key}</Text>
			),
		},
		...I18N_LANGUAGES.map(lang => ({
			title: t(`system.i18n.langs.${lang}`),
			dataIndex: lang,
			hideInSearch: true,
			render: (_: unknown, row: TranslationRow) => renderText(row, lang),
		})),
		{
			// Ô tìm kiếm chung theo key / nội dung (backend lọc theo `search`)
			title: t("common.search"),
			dataIndex: "search",
			hideInTable: true,
		},
		{
			title: t("system.i18n.app.type"),
			dataIndex: "source",
			hideInTable: true,
			valueType: "select",
			fieldProps: {
				options: [
					{ value: "app", label: t("system.i18n.app.sourceApp") },
					{ value: "form", label: t("system.i18n.app.sourceForm") },
				],
			},
		},
		{
			title: t("system.i18n.app.sourceForm"),
			dataIndex: "formId",
			hideInTable: true,
			valueType: "select",
			fieldProps: { options: formOptions, showSearch: true, optionFilterProp: "label" },
		},
	];

	return (
		<>
			<BasicTable<TranslationRow>
				columns={columns}
				actionRef={actionRef}
				rowKey={rowKeyOf}
				// Bấm vào dòng để mở popup sửa (bỏ qua khi bấm ô tích chọn)
				onRow={row => ({
					className: "cursor-pointer",
					onClick: (e) => {
						if (!(e.target as HTMLElement).closest(".ant-table-selection-column"))
							openDetail(row);
					},
				})}
				rowSelection={canEdit
					? { selectedRowKeys: selected, preserveSelectedRowKeys: true, onChange: keys => setSelected(keys as string[]) }
					: undefined}
				tableAlertRender={false}
				request={async (params) => {
					const { page = 1, limit = 10, search, source, formId } = params as Filters & { page?: number, limit?: number };
					const next: Filters = { search: search?.trim() || undefined, source, formId };
					setFilters(next);
					const { data, total } = await i18nService.fetchList({ page, limit, search: next.search, namespace: namespaceFilter(next) });
					return { data, total, success: true };
				}}
				headerTitle={t("common.menu.i18n")}
				toolBarRender={() => [
					// Chỉ hiện khi đã tích chọn dòng
					canEdit && selected.length > 0 && (
						<Popconfirm
							key="remove"
							title={t("system.i18n.app.confirmRemove", { count: selected.length })}
							onConfirm={remove}
							okText={t("common.confirm")}
							cancelText={t("common.cancel")}
						>
							<Button danger icon={<DeleteOutlined />} loading={removing}>
								{`${t("common.delete")} (${selected.length})`}
							</Button>
						</Popconfirm>
					),
					<Button key="add" type="primary" icon={<PlusCircleOutlined />} onClick={openStringList}>
						{canEdit ? t("common.add") : t("system.i18n.app.stringList")}
					</Button>,
				]}
			/>
			<AppTranslationDetail ref={detailRef} />
			<JsonStringsModal ref={jsonRef} />
		</>
	);
}
