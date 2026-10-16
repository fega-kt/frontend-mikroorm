import type { CreatableRequestType } from "#src/api/approval-request";
import { CheckOutlined, LockOutlined } from "@ant-design/icons";
import { Select, Tag, theme, Tooltip, Typography } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

/** Ô vuông chứa mã viết tắt của loại tờ trình (tiền tố mã, thiếu thì 2 ký tự đầu của code) */
function TypeTile({ type, size = 22, muted }: { type: Pick<CreatableRequestType, "prefix" | "code">, size?: number, muted?: boolean }) {
	const { token } = theme.useToken();
	return (
		<span
			className="inline-flex shrink-0 items-center justify-center rounded-md px-1 font-bold leading-none tracking-wide"
			style={{
				minWidth: size,
				height: size,
				fontSize: size <= 22 ? 10 : 12,
				background: muted ? token.colorFillTertiary : token.colorPrimaryBg,
				color: muted ? token.colorTextSecondary : token.colorPrimaryText,
			}}
		>
			{(type.prefix || type.code).slice(0, 3).toUpperCase()}
		</span>
	);
}

/** Tên loại tờ trình trên một dòng, giãn hết chỗ còn lại (vừa chiều cao ô nhập một dòng) */
function TypeText({ name }: { name: string }) {
	return <Text strong className="min-w-0 flex-1 truncate">{name}</Text>;
}

function WorkflowTag({ hasWorkflow }: { hasWorkflow: boolean }) {
	const { t } = useTranslation();
	return hasWorkflow
		? <Tag color="success" icon={<CheckOutlined />} className="m-0">{t("approval.form.hasWorkflow")}</Tag>
		: <Tag color="warning" className="m-0">{t("approval.form.noWorkflow")}</Tag>;
}

interface RequestTypePickerProps {
	/** Form.Item truyền value / onChange / id */
	id?: string
	value?: string
	onChange?: (value: string) => void
	/** Các loại chọn được (đã lọc theo nhóm đang chọn) */
	types: CreatableRequestType[]
	/** Gọi sau khi chọn loại khác (vd: xóa dữ liệu nội dung tờ trình của loại cũ) */
	onSelectType?: (type: CreatableRequestType) => void
	disabled?: boolean
	placeholder?: string
}

/**
 * Chọn loại tờ trình (tạo mới) trong nhóm đã chọn: tìm theo tên / mã;
 * ô đã chọn hiện mã viết tắt, tên và trạng thái luồng duyệt trên một dòng.
 */
export function RequestTypePicker({ id, value, onChange, types, onSelectType, disabled, placeholder }: RequestTypePickerProps) {
	const { t } = useTranslation();

	const byId = useMemo(() => new Map(types.map(type => [type.id, type])), [types]);
	const options = useMemo(() => types.map(type => ({ value: type.id, label: type.name })), [types]);

	const search = (input: string, option?: { value?: string | number | null }) => {
		const type = typeof option?.value === "string" ? byId.get(option.value) : undefined;
		if (!type)
			return false;
		const keyword = input.trim().toLowerCase();
		return [type.name, type.code, type.prefix].some(text => text?.toLowerCase().includes(keyword));
	};

	return (
		<Select<string>
			id={id}
			value={value}
			disabled={disabled}
			showSearch={{ filterOption: search }}
			placeholder={placeholder ?? t("approval.form.typePlaceholder")}
			className="w-full"
			listHeight={360}
			options={options}
			onChange={(next) => {
				onChange?.(next);
				const type = byId.get(next);
				if (type)
					onSelectType?.(type);
			}}
			labelRender={({ value: selected }) => {
				const type = byId.get(selected as string);
				if (!type)
					return null;
				return (
					<span className="flex w-full min-w-0 items-center gap-2">
						<TypeTile type={type} />
						<TypeText name={type.name} />
						<WorkflowTag hasWorkflow={type.hasWorkflow} />
					</span>
				);
			}}
			optionRender={(option) => {
				const type = byId.get(option.value as string);
				if (!type)
					return option.label;
				// Một dòng mỗi mục (dropdown gọn): mã viết tắt, tên, phiên bản ở cuối; chưa có luồng duyệt thì mờ + tag
				return (
					<span className="flex items-center gap-2" title={type.hasWorkflow ? undefined : t("approval.form.noWorkflowHint")}>
						<TypeTile type={type} muted={!type.hasWorkflow} />
						<Text className="min-w-0 flex-1 truncate" type={type.hasWorkflow ? undefined : "secondary"}>{type.name}</Text>
						{!type.hasWorkflow && <WorkflowTag hasWorkflow={false} />}
						<Text type="secondary" className="shrink-0 text-xs">{`v${type.version}`}</Text>
					</span>
				);
			}}
		/>
	);
}

/** Loại tờ trình khi cập nhật: chỉ xem, không đổi được (biểu mẫu đã gắn với tờ trình) */
export function LockedRequestType({ type }: { type: Pick<CreatableRequestType, "prefix" | "code" | "name"> }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	return (
		<div
			className="flex h-8 items-center gap-2 rounded-md px-3"
			style={{ border: `1px solid ${token.colorBorderSecondary}`, background: token.colorFillQuaternary }}
		>
			<TypeTile type={type} />
			<TypeText name={type.name} />
			{/* Lý do khóa xem trong tooltip, không chiếm chỗ dưới ô */}
			<Tooltip title={t("approval.form.typeLockedHint")} placement="topRight">
				<Text type="secondary" className="inline-flex cursor-help items-center gap-1.5 text-xs" tabIndex={0}>
					<LockOutlined />
					{t("approval.form.typeLocked")}
				</Text>
			</Tooltip>
		</div>
	);
}
