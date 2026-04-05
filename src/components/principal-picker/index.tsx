import type { PrincipalEntity } from "#src/api/system/principal";
import type { FormItemProps, SelectProps } from "antd";
import { principalService, PrincipalType } from "#src/api/system/principal";
import { getAvatarColorStyle } from "#src/utils/avatar";
import { cn } from "#src/utils/cn";
import { TeamOutlined, UserOutlined } from "@ant-design/icons";
import { ProFormItem } from "@ant-design/pro-components";
import { useDebounceFn } from "ahooks";
import { Avatar, Select, Space, Spin, Tag, theme, Typography } from "antd";
import * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

/** PrincipalDisplay: Show principal info consistently (avatar/icon + name + subtext) */
export function PrincipalDisplay({
	principal,
	showAvatar = true,
	size = "middle",
}: {
	principal: PrincipalEntity
	showAvatar?: boolean
	size?: "small" | "middle"
}) {
	const style = getAvatarColorStyle(principal.id);
	const iconSize = size === "small" ? 18 : 22;
	const nameSize = size === "small" ? "text-[12px]" : "text-[13px]";

	const isUser = principal.type === PrincipalType.User;
	const user = principal.user;

	return (
		<Space size={size} className="p-0">
			{showAvatar && (
				<Avatar
					size={iconSize}
					src={isUser && user?.avatar ? user.avatar : undefined}
					icon={!isUser ? <TeamOutlined className="text-[12px]" /> : (user?.avatar ? undefined : <UserOutlined className="text-[12px]" />)}
					className={cn("shrink-0 font-semibold border-solid", size === "small" ? "text-[10px]" : "text-[11px]")}
					style={(!isUser || !user?.avatar)
						? {
							backgroundColor: style.backgroundColor,
							color: style.color,
							borderColor: style.borderColor,
						}
						: undefined}
				>
					{isUser && !user?.avatar ? (principal.name?.[0]?.toUpperCase() || "?") : ""}
				</Avatar>
			)}
			<div className="flex flex-col overflow-hidden leading-none">
				<Text strong className={cn(nameSize)} ellipsis>{principal.name}</Text>
			</div>
		</Space>
	);
}

export interface PrincipalOption {
	label: string
	value: string
	principal: PrincipalEntity
}

export interface PrincipalPickerProps extends Omit<SelectProps<string | string[], PrincipalOption>, "options" | "mode" | "onDropdownVisibleChange" | "onChange" | "value"> {
	dataSource?: PrincipalEntity[]
	showAvatar?: boolean
	mode?: "multiple" | "tags"
	onOpenChange?: (open: boolean) => void
	readonly?: boolean
	principal?: PrincipalEntity
	ref?: React.Ref<React.ComponentRef<typeof Select>>
	value?: string | string[] | PrincipalEntity | PrincipalEntity[]
	onChange?: (value: PrincipalEntity | PrincipalEntity[] | string | string[], options?: PrincipalOption | PrincipalOption[]) => void
}

interface CustomTagProps {
	label: React.ReactNode
	value: string
	closable: boolean
	onClose: (event?: React.MouseEvent<HTMLElement, MouseEvent>) => void
}

/**
 * PrincipalPicker: A flexible component to select Principals (Users or Groups)
 */
export function PrincipalPicker(props: PrincipalPickerProps) {
	const {
		dataSource,
		mode,
		placeholder,
		showAvatar = true,
		onOpenChange,
		onSearch,
		readonly,
		principal: readonlyPrincipal,
		ref,
		className,
		...restProps
	} = props;

	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [apiOptions, setApiOptions] = useState<PrincipalEntity[]>([]);
	const [loading, setLoading] = useState(false);
	const fetchedRef = useRef(false);

	const isRemote = !dataSource;

	const fetchData = useCallback(async (searchKey?: string) => {
		setLoading(true);
		try {
			const { data } = await principalService.fetchPrincipalList({ keyword: searchKey, pageSize: 50 });
			setApiOptions(data || []);
			fetchedRef.current = true;
		}
		catch (error) {
			console.error("[PrincipalPicker] Failed to fetch principals:", error);
		}
		finally {
			setLoading(false);
		}
	}, []);

	const { run: runDebouncedSearch } = useDebounceFn(
		(key: string) => {
			if (isRemote) {
				fetchData(key);
			}
		},
		{ wait: 350 },
	);

	const handleOpenChange = (open: boolean) => {
		if (open && !fetchedRef.current && isRemote) {
			fetchData();
		}
		onOpenChange?.(open);
	};

	const handleSearch = (val: string) => {
		if (isRemote) {
			runDebouncedSearch(val);
		}
		onSearch?.(val);
	};

	const finalPrincipals = useMemo(() => {
		const map = new Map<string, PrincipalEntity>();
		(dataSource || []).forEach(p => map.set(p.id, p));
		apiOptions.forEach(p => map.set(p.id, p));
		if (readonlyPrincipal) {
			map.set(readonlyPrincipal.id, readonlyPrincipal);
		}

		// Extract from value
		const val = restProps.value;
		const incoming = Array.isArray(val) ? val : (val ? [val] : []);
		incoming.forEach((v: any) => {
			if (v && typeof v === "object") {
				const id = v.id || v.value;
				// Group name usually lives in group.name, User in name
				const name = v.name || v.label || v.group?.name || v.user?.fullName;
				if (id && name && !map.has(id)) {
					map.set(id, { ...v, id, name } as PrincipalEntity);
				}
			}
		});

		return Array.from(map.values());
	}, [dataSource, apiOptions, readonlyPrincipal, restProps.value]);

	const normalizedValue = useMemo(() => {
		if (!restProps.value) {
			return restProps.value;
		}
		const arr = Array.isArray(restProps.value) ? restProps.value : [restProps.value];
		const mapped = arr.map((v: any) => {
			if (v && typeof v === "object") {
				return (v.id || v.value || v) as string;
			}
			return v as string;
		});
		return (mode === "multiple" || mode === "tags") ? mapped : mapped[0];
	}, [restProps.value, mode]);

	const selectOptions = useMemo<PrincipalOption[]>(() => {
		return finalPrincipals.map(p => ({
			label: String(p.name || p.group?.name || p.user?.fullName || p.id),
			value: p.id,
			principal: p,
		}));
	}, [finalPrincipals]);

	const optionRender = (option: { data: PrincipalOption }) => {
		return <PrincipalDisplay principal={option.data.principal} showAvatar={showAvatar} />;
	};

	const labelRender = (labelProps: { label: React.ReactNode, value: string | number }) => {
		const valStr = String(labelProps.value);
		const p = finalPrincipals.find(item => String(item.id) === valStr);
		if (!p) {
			return labelProps.label || labelProps.value;
		}
		return <PrincipalDisplay principal={p} showAvatar={showAvatar} size="small" />;
	};

	const tagRender = (tagProps: CustomTagProps) => {
		const { label, closable, onClose, value } = tagProps;
		const p = finalPrincipals.find(item => String(item.id) === String(value));

		return (
			<Tag
				closable={closable}
				onClose={onClose}
				style={{
					backgroundColor: token.colorFillAlter,
					color: token.colorText,
					borderColor: token.colorBorderSecondary,
				}}
				className={cn(
					"mr-1 inline-flex items-center rounded pl-1 pr-1.5 h-6 text-[12px] font-medium border border-solid gap-1.5 transition-all hover:opacity-85",
				)}
			>
				{p && showAvatar && (
					<Avatar
						size={16}
						src={p.type === PrincipalType.User ? p.user?.avatar : undefined}
						icon={p.type === PrincipalType.Group ? <TeamOutlined className="text-[10px]" /> : (p.user?.avatar ? undefined : <UserOutlined className="text-[10px]" />)}
						className="shrink-0 font-bold border-none"
						style={{
							backgroundColor: getAvatarColorStyle(p.id).backgroundColor,
							color: getAvatarColorStyle(p.id).color,
							fontSize: "9px",
						}}
					>
						{p.type === PrincipalType.User && !p.user?.avatar ? (p.name?.[0]?.toUpperCase() || "?") : ""}
					</Avatar>
				)}
				<span className="max-w-[100px] truncate text-inherit">
					{label || (p && (p.name || p.group?.name)) || value}
				</span>
			</Tag>
		);
	};

	const filterOption = (input: string, option?: PrincipalOption) => {
		if (isRemote || !option) {
			return true;
		}
		return option.label.toLowerCase().includes(input.toLowerCase());
	};

	const handleChange = (val: string | string[], options?: PrincipalOption | PrincipalOption[]) => {
		if (!val || (Array.isArray(val) && val.length === 0)) {
			props.onChange?.(val, options);
			return;
		}

		const opts = Array.isArray(options) ? options : (options ? [options] : []);
		const resultObjects = opts.map(o => o.principal || { id: o.value });

		const finalVal = (mode === "multiple" || mode === "tags") ? resultObjects : resultObjects[0];
		props.onChange?.(finalVal, options);
	};

	if (readonly) {
		return (
			<div className={cn("flex min-h-[32px] items-center", className)}>
				{readonlyPrincipal ? <PrincipalDisplay principal={readonlyPrincipal} showAvatar={showAvatar} /> : <div className="text-[12px] opacity-45">{t("common.noData")}</div>}
			</div>
		);
	}

	return (
		<Select<string | string[], PrincipalOption>
			{...restProps}
			ref={ref}
			showSearch
			allowClear
			mode={mode}
			placeholder={placeholder || t("common.keywordSearch")}
			optionFilterProp="label"
			loading={loading}
			onOpenChange={handleOpenChange}
			onSearch={handleSearch}
			onChange={handleChange}
			value={normalizedValue}
			options={loading ? [] : selectOptions}
			optionRender={optionRender}
			labelRender={mode === "multiple" || mode === "tags" ? undefined : labelRender}
			tagRender={mode === "multiple" || mode === "tags" ? tagRender : undefined}
			filterOption={filterOption}
			listHeight={182}
			dropdownStyle={{ borderRadius: 8, padding: 4, minWidth: 200 }}
			className={cn("w-full", className)}
			notFoundContent={loading
				? (
					<div className="flex flex-col items-center justify-center gap-2 h-20">
						<Spin size="small" />
						<span className="text-[11px] opacity-45">{t("common.loading")}</span>
					</div>
				)
				: undefined}
		/>
	);
}

export interface ProFormPrincipalPickerProps extends Omit<FormItemProps, "children" | "initialValue"> {
	name: string
	multiple?: boolean
	labelInValue?: boolean
	fieldProps?: PrincipalPickerProps
	initialValue?: any
	readonly?: boolean
}

export function ProFormPrincipalPicker({ name, label, rules, multiple, labelInValue = true, fieldProps, initialValue, readonly, ...rest }: ProFormPrincipalPickerProps) {
	return (
		<ProFormItem name={name} label={label} rules={rules} initialValue={initialValue} {...rest}>
			<PrincipalPicker
				mode={multiple ? "multiple" : undefined}
				labelInValue={labelInValue}
				readonly={readonly}
				{...fieldProps}
			/>
		</ProFormItem>
	);
}
