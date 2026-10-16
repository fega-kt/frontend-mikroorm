import type { FormFieldType } from "#src/api/setting/request-type/types";
import type { ComponentType } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { useDraggable } from "@dnd-kit/core";
import { Input, theme, Typography } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FIELD_TYPES, PALETTE_GROUPS } from "./field-types";

const { Text } = Typography;

export const PALETTE_ID_PREFIX = "palette:";

function PaletteTile({ type, label, icon: Icon, onAdd }: { type: FormFieldType, label: string, icon: ComponentType, onAdd: (type: FormFieldType) => void }) {
	const { token } = theme.useToken();
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `${PALETTE_ID_PREFIX}${type}`, data: { fieldType: type } });
	return (
		<button
			ref={setNodeRef}
			type="button"
			{...attributes}
			{...listeners}
			onClick={() => onAdd(type)}
			className="flex h-[68px] cursor-grab flex-col items-center justify-center gap-1.5 rounded-[10px] text-[12.5px] transition-colors hover:border-[var(--tile-hover)] active:cursor-grabbing"
			style={{
				"border": `1px solid ${token.colorBorderSecondary}`,
				"background": token.colorBgContainer,
				"color": token.colorText,
				"opacity": isDragging ? 0.4 : 1,
				"--tile-hover": token.colorPrimary,
			} as React.CSSProperties}
		>
			<span className="text-[18px]" style={{ color: token.colorPrimary }}><Icon /></span>
			{label}
		</button>
	);
}

/** Thư viện loại trường: kéo thả vào form hoặc bấm để thêm xuống cuối */
export function Palette({ onAdd }: { onAdd: (type: FormFieldType) => void }) {
	const { t } = useTranslation();
	const [keyword, setKeyword] = useState("");

	const groups = useMemo(() => {
		const kw = keyword.trim().toLowerCase();
		return PALETTE_GROUPS.map(group => ({
			group,
			items: FIELD_TYPES
				.filter(item => item.group === group)
				.map(item => ({ ...item, label: t(`approval.formSchema.types.${item.type}`) }))
				.filter(item => !kw || item.label.toLowerCase().includes(kw)),
		})).filter(g => g.items.length);
	}, [keyword, t]);

	return (
		<div className="flex flex-col gap-4">
			<Input
				allowClear
				prefix={<SearchOutlined />}
				placeholder={t("approval.formSchema.builder.search")}
				value={keyword}
				onChange={e => setKeyword(e.target.value)}
			/>
			<Text type="secondary" className="text-xs leading-relaxed">{t("approval.formSchema.builder.paletteHint")}</Text>
			{groups.map(({ group, items }) => (
				<div key={group}>
					<div className="mb-2 text-[11px] font-semibold uppercase tracking-wider opacity-50">{t(`approval.formSchema.builder.groups.${group}`)}</div>
					<div className="grid grid-cols-2 gap-2">
						{items.map(item => <PaletteTile key={item.type} type={item.type} label={item.label} icon={item.icon} onAdd={onAdd} />)}
					</div>
				</div>
			))}
		</div>
	);
}
