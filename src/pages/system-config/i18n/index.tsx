import type { TranslationItem, TranslationTable, TranslationTarget } from "#src/api/i18n";
import type { FormI18nString } from "#src/pages/approval/lib/form-i18n";
import type { ColumnsType } from "antd/es/table";
import { i18nService, TRANSLATION_TARGETS } from "#src/api/i18n";
import { formService } from "#src/api/setting/form";
import { BasicContent } from "#src/components/basic-content";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { clearFormDictionaryCache, collectFormStrings, formI18nNamespace } from "#src/pages/approval/lib/form-i18n";
import { SaveOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Alert, Button, Empty, Input, Select, Space, Spin, Table, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

type Drafts = Record<string, Partial<Record<TranslationTarget, string>>>;

const KIND_COLOR = { label: "blue", placeholder: "cyan", option: "purple" } as const;

/**
 * Bản dịch dữ liệu: chọn một biểu mẫu → bảng các chuỗi (nhãn, gợi ý, lựa chọn) với cột tiếng Việt (gốc, chỉ xem)
 * và các ngôn ngữ cần dịch. Chuỗi nào không có bản dịch thì hiển thị bằng tiếng Việt.
 */
export default function I18nManagement() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const canEdit = canAccess(PermissionType.UpdateI18n);

	const [formId, setFormId] = useState<string>();
	const [strings, setStrings] = useState<FormI18nString[]>([]);
	const [saved, setSaved] = useState<TranslationTable>({});
	const [drafts, setDrafts] = useState<Drafts>({});
	const [saving, setSaving] = useState(false);

	const { data: forms = [] } = useRequest(() => formService.fetchFormOptions());

	const { loading, run: load } = useRequest(async (id: string) => {
		const [form, table] = await Promise.all([formService.fetchFormItem(id), i18nService.fetchTable(formI18nNamespace(id))]);
		setStrings(collectFormStrings(form.formSchema ?? []));
		setSaved(table);
		setDrafts({});
	}, { manual: true });

	const valueOf = (key: string, lang: TranslationTarget) => drafts[key]?.[lang] ?? saved[key]?.[lang] ?? "";

	/**
	 * Mỗi chuỗi có thay đổi gửi thành một mục đủ cả ba ngôn ngữ (vi = chuỗi gốc của biểu mẫu).
	 * English và 中文 phải đủ cả hai hoặc để trống cả hai: trống cả hai thì xóa bản dịch đã lưu, thiếu một thì chưa lưu được.
	 */
	const plan = useMemo(() => {
		const items: TranslationItem[] = [];
		const remove: string[] = [];
		const incomplete = new Set<string>();
		for (const item of strings) {
			if (!drafts[item.key])
				continue;
			const en = valueOf(item.key, "en").trim();
			const zh = valueOf(item.key, "zh").trim();
			if (en === (saved[item.key]?.en ?? "") && zh === (saved[item.key]?.zh ?? ""))
				continue;
			if (en && zh)
				items.push({ key: item.key, vi: item.source, en, zh });
			else if (!en && !zh)
				saved[item.key] && remove.push(item.key);
			else
				incomplete.add(item.key);
		}
		return { items, remove, incomplete };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [strings, drafts, saved]);

	const changeCount = plan.items.length + plan.remove.length;

	const missing = useMemo(
		() => strings.reduce((sum, item) => sum + TRANSLATION_TARGETS.filter(lang => !valueOf(item.key, lang).trim()).length, 0),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[strings, drafts, saved],
	);

	const pickForm = (id: string) => {
		setFormId(id);
		load(id);
	};

	const save = async () => {
		if (!formId || !changeCount || plan.incomplete.size)
			return;
		setSaving(true);
		try {
			await i18nService.fetchSave(formI18nNamespace(formId), plan.items, plan.remove);
			clearFormDictionaryCache(formId);
			window.$message?.success(t("common.updateSuccess"));
			await load(formId);
		}
		finally {
			setSaving(false);
		}
	};

	const columns: ColumnsType<FormI18nString> = [
		{
			title: t("system.i18n.field"),
			width: 260,
			render: (_, item) => (
				<div className="flex flex-col gap-1">
					<Space size={6}>
						<Tag color={KIND_COLOR[item.kind]} className="m-0">{t(`system.i18n.kind.${item.kind}`)}</Tag>
						<Text code className="text-xs">{item.fieldKey}</Text>
					</Space>
					{item.kind !== "label" && <Text type="secondary" className="text-xs">{item.fieldLabel}</Text>}
				</div>
			),
		},
		{ title: t("system.i18n.source"), dataIndex: "source", width: 280, render: (value: string) => <Text className="whitespace-pre-wrap">{value}</Text> },
		...TRANSLATION_TARGETS.map(lang => ({
			title: t(`system.i18n.langs.${lang}`),
			key: lang,
			render: (_: unknown, item: FormI18nString) => {
				const value = valueOf(item.key, lang);
				return (
					<Input
						value={value}
						disabled={!canEdit}
						maxLength={5000}
						status={value.trim() ? undefined : plan.incomplete.has(item.key) ? "error" : "warning"}
						placeholder={t("system.i18n.fallbackHint")}
						onChange={e => setDrafts(prev => ({ ...prev, [item.key]: { ...prev[item.key], [lang]: e.target.value } }))}
					/>
				);
			},
		})),
	];

	return (
		<BasicContent>
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center gap-3">
					<Select
						showSearch
						className="w-[360px]"
						placeholder={t("system.i18n.pickForm")}
						value={formId}
						optionFilterProp="label"
						options={forms.map(form => ({ value: form.id, label: `${form.name} (${form.code})` }))}
						onChange={pickForm}
					/>
					{formId && !loading && strings.length > 0 && (
						<Tag color={missing ? "warning" : "success"} className="m-0">{t("system.i18n.missing", { count: missing })}</Tag>
					)}
					<div className="flex-1" />
					{canEdit && (
						<Button type="primary" icon={<SaveOutlined />} disabled={!changeCount || plan.incomplete.size > 0} loading={saving} onClick={save}>
							{t("common.save")}
							{changeCount > 0 && ` (${changeCount})`}
						</Button>
					)}
				</div>

				<Alert type="info" showIcon message={t("system.i18n.hint")} />
				{plan.incomplete.size > 0 && <Alert type="error" showIcon message={t("system.i18n.incomplete", { count: plan.incomplete.size })} />}

				<Spin spinning={loading}>
					{!formId
						? <Empty description={t("system.i18n.pickForm")} />
						: (
							<Table<FormI18nString>
								size="middle"
								rowKey="key"
								columns={columns}
								dataSource={strings}
								pagination={false}
								locale={{ emptyText: <Empty description={t("system.i18n.noStrings")} /> }}
							/>
						)}
				</Spin>
			</div>
		</BasicContent>
	);
}
