import type { TranslationItem } from "#src/api/i18n";
import type { I18nSource } from "./json-strings";
import { I18N_LANGUAGES, i18nService } from "#src/api/i18n";
import { FormModal } from "#src/components/form-modal";
import { Form, Input, Tag, Typography } from "antd";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { EMPTY_TEXTS, getJsonStrings, variablesOf } from "./json-strings";

const { Text } = Typography;

/** Nguồn của dòng để hiện trong popup: nhãn (giao diện / tên biểu mẫu), màu tag, ghi chú (key không còn dùng, phiên bản cũ…) */
export interface TranslationSourceInfo {
	label: string
	color: string
	note?: string
}

export interface AppTranslationDetailRef {
	/** Lưu xong trả về `isChange`; nạp lại bản dịch / xóa cache do nơi gọi lo */
	show: (item: TranslationItem, options: { source: I18nSource, namespace: string, info?: TranslationSourceInfo }) => Promise<{ isChange: boolean } | undefined>
}

type FormValues = Omit<TranslationItem, "key">;

let guard: ((res?: { isChange: boolean }) => void) | undefined;

/**
 * Sửa bản dịch của một key, mỗi ngôn ngữ một ô.
 * Giao diện: kèm chuỗi mặc định (file JSON) để đối chiếu, bản đè phải giữ đúng các biến {{...}}.
 * Biểu mẫu: tiếng Việt mặc định là chuỗi gốc của form, sửa thì đè lên chuỗi gốc khi hiển thị (để trống = dùng chuỗi gốc).
 */
export function AppTranslationDetail({ ref }: { ref: React.Ref<AppTranslationDetailRef> }) {
	const { t } = useTranslation();
	const [form] = Form.useForm<FormValues>();
	const [open, setOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [key, setKey] = useState("");
	const [source, setSource] = useState<I18nSource>("app");
	const [namespace, setNamespace] = useState("");
	const [info, setInfo] = useState<TranslationSourceInfo>();

	const isApp = source === "app";
	const defaults = (isApp && getJsonStrings().get(key)) || EMPTY_TEXTS;
	const orphan = isApp && !!key && !getJsonStrings().has(key);

	useImperativeHandle(ref, () => ({
		show: async (item, options) => {
			setKey(item.key);
			setSource(options.source);
			setNamespace(options.namespace);
			setInfo(options.info);
			form.setFieldsValue({ vi: item.vi, en: item.en, zh: item.zh });
			setOpen(true);
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

	const save = async () => {
		// Bắt buộc đủ cả ba ngôn ngữ (rule `required` của từng ô)
		const values = await form.validateFields();
		const item = { key, vi: values.vi.trim(), en: values.en.trim(), zh: values.zh.trim() };
		setSaving(true);
		try {
			await i18nService.fetchSave(namespace, [item]);
			window.$message?.success(t("common.updateSuccess"));
			close({ isChange: true });
		}
		finally {
			setSaving(false);
		}
	};

	return (
		<FormModal
			title={t("system.i18n.app.editTitle")}
			width={720}
			open={open}
			saving={saving}
			onSave={save}
			onCancel={() => close()}
		>
			<div className="mb-4 flex flex-col items-start gap-1">
				<Text type="secondary" className="text-xs">{t("system.i18n.app.key")}</Text>
				<Text code copyable className="break-all">{key}</Text>
				{info && <Tag color={info.color} className="m-0">{info.label}</Tag>}
				{(info?.note ?? (orphan ? t("system.i18n.app.orphanHint") : undefined)) && (
					<Text type="warning" className="text-xs">{info?.note ?? t("system.i18n.app.orphanHint")}</Text>
				)}
			</div>
			<Form form={form} layout="vertical">
				{I18N_LANGUAGES.map((lang) => {
					const fallback = defaults[lang] || defaults.vi;
					// Biểu mẫu: ô tiếng Việt đè lên chuỗi gốc trong formSchema
					const formSource = !isApp && lang === "vi";
					return (
						<Form.Item
							key={lang}
							name={lang}
							label={t(`system.i18n.langs.${lang}`)}
							required
							extra={formSource
								? t("system.i18n.app.formSourceHint")
								: defaults[lang] ? t("system.i18n.app.defaultValue", { value: defaults[lang] }) : undefined}
							rules={[
								{ required: true, whitespace: true, message: t("system.i18n.app.required", { lang: t(`system.i18n.langs.${lang}`) }) },
								{
									validator: async (_, value?: string) => {
										const text = value?.trim();
										if (isApp && !orphan && text && variablesOf(text) !== variablesOf(fallback))
											throw new Error(t("system.i18n.app.variableHint", { variables: variablesOf(fallback) || "—" }));
									},
								},
							]}
						>
							<Input.TextArea autoSize={{ minRows: 1, maxRows: 6 }} maxLength={5000} placeholder={t("system.i18n.app.inputPlaceholder", { lang: t(`system.i18n.langs.${lang}`) })} />
						</Form.Item>
					);
				})}
			</Form>
		</FormModal>
	);
}
