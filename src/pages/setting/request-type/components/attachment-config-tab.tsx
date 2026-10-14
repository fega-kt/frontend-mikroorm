import type { AttachmentConfig, FileBlockConfig } from "#src/api/setting/request-type/types";
import { FileKind } from "#src/api/setting/request-type/types";
import { SectionCard } from "#src/components/section-card";
import { blockSummary } from "#src/pages/approval/lib/files";
import { PaperClipOutlined, WarningOutlined } from "@ant-design/icons";
import { Checkbox, Input, InputNumber, Switch, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

type BlockKey = keyof AttachmentConfig;

interface AttachmentConfigTabProps {
	value: AttachmentConfig
	onChange: (value: AttachmentConfig) => void
	/** Xem phiên bản cũ: khóa mọi ô nhập. Phải truyền xuống từng ô vì ô đã có `disabled` tường minh nên không nhận khóa chung của ConfigProvider */
	readOnly?: boolean
}

/** Cấu hình 2 khối tệp (Văn bản tờ trình, Tài liệu đính kèm) của loại tờ trình + xem trước phía người tạo */
export function AttachmentConfigTab({ value, onChange, readOnly }: AttachmentConfigTabProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	const update = (block: BlockKey, patch: Partial<FileBlockConfig>) => onChange({ ...value, [block]: { ...value[block], ...patch } });

	const renderBlock = (block: BlockKey) => {
		const config = value[block];
		const disabled = !!readOnly || !config.enabled;
		return (
			<SectionCard
				key={block}
				icon={<PaperClipOutlined />}
				title={t(`approval.files.${block}`)}
				extra={(
					<label className="flex cursor-pointer items-center gap-2">
						<span className="text-[13px]" style={{ color: token.colorTextSecondary }}>{t("approval.attachmentConfig.enabled")}</span>
						<Switch disabled={readOnly} checked={config.enabled} onChange={enabled => update(block, { enabled })} />
					</label>
				)}
			>
				<Text type="secondary" className="mb-4 block text-[13px]">{t(`approval.attachmentConfig.${block}Desc`)}</Text>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div
						className="flex items-center justify-between gap-3 rounded-lg px-3.5 py-3 md:col-span-2"
						style={{
							border: `1px solid ${config.required ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
							background: config.required ? token.colorPrimaryBg : token.colorFillQuaternary,
						}}
					>
						<div className="flex flex-col">
							<span className="font-semibold">{t("approval.attachmentConfig.required")}</span>
							<Text type="secondary" className="text-[13px]">
								{t(config.required ? "approval.attachmentConfig.requiredOn" : "approval.attachmentConfig.requiredOff")}
							</Text>
						</div>
						<Switch disabled={disabled} checked={config.required} onChange={required => update(block, { required })} />
					</div>

					<label className="flex flex-col gap-1.5">
						<span className="font-medium">{t("approval.attachmentConfig.minFiles")}</span>
						<InputNumber
							className="w-full"
							min={1}
							max={config.maxFiles}
							disabled={disabled || !config.required}
							value={config.required ? Math.max(config.minFiles, 1) : 0}
							onChange={minFiles => update(block, { minFiles: minFiles ?? 1 })}
						/>
					</label>
					<label className="flex flex-col gap-1.5">
						<span className="font-medium">{t("approval.attachmentConfig.maxFiles")}</span>
						<InputNumber className="w-full" min={1} max={50} disabled={disabled} value={config.maxFiles} onChange={maxFiles => update(block, { maxFiles: maxFiles ?? 1 })} />
					</label>
					<label className="flex flex-col gap-1.5">
						<span className="font-medium">{t("approval.attachmentConfig.maxSize")}</span>
						<InputNumber
							className="w-full"
							min={1}
							max={100}
							addonAfter="MB"
							disabled={disabled}
							value={config.maxSizeMb}
							onChange={maxSizeMb => update(block, { maxSizeMb: maxSizeMb ?? 10 })}
						/>
					</label>

					<div className="flex flex-col gap-2 md:col-span-2">
						<span className="font-medium">{t("approval.attachmentConfig.fileTypes")}</span>
						<Checkbox.Group
							disabled={disabled}
							value={config.fileTypes}
							onChange={fileTypes => fileTypes.length && update(block, { fileTypes: fileTypes as FileKind[] })}
							options={Object.values(FileKind).map(kind => ({ value: kind, label: t(`approval.files.kinds.${kind}`) }))}
						/>
					</div>

					<label className="flex flex-col gap-1.5 md:col-span-2">
						<span className="font-medium">{t("approval.attachmentConfig.hint")}</span>
						<Input
							maxLength={500}
							disabled={disabled}
							value={config.hint ?? ""}
							placeholder={t("approval.attachmentConfig.hintPlaceholder")}
							onChange={e => update(block, { hint: e.target.value || null })}
						/>
					</label>
				</div>
			</SectionCard>
		);
	};

	const previewBlock = (block: BlockKey) => {
		const config = value[block];
		if (!config.enabled)
			return null;
		return (
			<div key={block} className="overflow-hidden rounded-xl" style={{ border: `1px solid ${token.colorBorderSecondary}`, background: token.colorBgContainer }}>
				<div className="flex flex-col gap-0.5 px-4 py-3" style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
					<span className="font-semibold">
						{t(`approval.files.${block}`)}
						{config.required && <span className="ml-1 text-[#c62828]">*</span>}
					</span>
					<Text type="secondary" className="text-xs">{blockSummary(config, t)}</Text>
				</div>
				<div className="flex flex-col gap-2 px-4 py-3.5">
					<div className="rounded-lg p-3 text-center text-[13px]" style={{ border: `1.5px dashed ${token.colorBorder}`, color: token.colorTextSecondary }}>
						{t("approval.attachmentConfig.dropzone")}
					</div>
					{config.hint && <Text type="secondary" className="text-xs">{config.hint}</Text>}
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-wrap items-start gap-5">
			<div className="flex min-w-0 flex-col gap-5" style={{ flex: "999 1 560px" }}>
				<Text type="secondary">{t("approval.attachmentConfig.description")}</Text>
				{renderBlock("documents")}
				{renderBlock("attachments")}
			</div>
			<aside className="flex min-w-0 flex-col gap-3" style={{ flex: "1 1 300px", maxWidth: 380 }}>
				<span className="font-semibold">{t("approval.attachmentConfig.preview")}</span>
				{previewBlock("documents")}
				{previewBlock("attachments")}
				<div className="flex gap-2.5 rounded-lg px-3.5 py-3 text-[13px]" style={{ background: token.colorWarningBg, color: token.colorWarningText }}>
					<WarningOutlined className="mt-0.5" />
					<span>{t("approval.attachmentConfig.notice")}</span>
				</div>
			</aside>
		</div>
	);
}
