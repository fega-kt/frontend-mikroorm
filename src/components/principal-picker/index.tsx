import type { PrincipalEntity } from "#src/api/system/principal";
import type { FormItemProps, SelectProps } from "antd";
import { principalService } from "#src/api/system/principal";
import { getAvatarColorStyle } from "#src/utils/avatar";
import { cn } from "#src/utils/cn";
import { TeamOutlined } from "@ant-design/icons";
import { ProFormItem } from "@ant-design/pro-components";
import { useDebounceFn } from "ahooks";
import { Avatar, Select, Space, Spin, Tag, Typography } from "antd";
import * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

/** PrincipalDisplay: Show principal info consistently (avatar/icon + name + subtext) */
export function PrincipalDisplay({ principal, showAvatar = true, size = "middle" }: { principal: PrincipalEntity, showAvatar?: boolean, size?: "small" | "middle" }) {
	const style = getAvatarColorStyle(principal.id);
	const iconSize = size === "small" ? 18 : 22;
	const nameSize = size === "small" ? "text-[12px]" : "text-[13px]";
	const subSize = size === "small" ? "text-[9px]" : "text-[10px]";

	const isUser = principal.type === "user";
	const user = principal.user;

	// fallback text if user has no avatar and we want to render initals
	const initials = principal.name?.[0]?.toUpperCase() || "?";

	return (
		<Space size={size} className="p-0">
			{showAvatar && (
				<Avatar
					size={iconSize}
					src={isUser && user?.avatar ? user.avatar : undefined}
					icon={!isUser ? <TeamOutlined className="text-[12px]" /> : undefined}
					className={cn("shrink-0 font-semibold border-solid", size === "small" ? "text-[10px]" : "text-[11px]")}
					style={(!isUser || !user?.avatar)
						? {
							backgroundColor: style.backgroundColor,
							color: style.color,
							borderColor: style.borderColor,
						}
						: undefined}
				>
					{isUser && !user?.avatar ? initials : ""}
				</Avatar>
			)}
			<div className="flex flex-col overflow-hidden leading-none">
				<Text strong className={cn(nameSize, "-mb-0.5")} ellipsis>{principal.name}</Text>
				<Text type="secondary" className={subSize} ellipsis>
					{isUser ? (user?.workEmail || user?.loginName) : "Group"}
				</Text>
			</div>
		</Space>
	);
}

export interface PrincipalOption {
	label: string
	value: string
	principal: PrincipalEntity
}

export interface PrincipalPickerProps extends Omit<SelectProps<string | string[], PrincipalOption>, "options" | "mode" | "onDropdownVisibleChange"> {
	dataSource?: PrincipalEntity[]
	/** Label to display logic */
	labelKey?: keyof PrincipalEntity
	showAvatar?: boolean
	mode?: "multiple" | "tags"
	onOpenChange?: (open: boolean) => void
	readonly?: boolean
	principal?: PrincipalEntity
	ref?: React.Ref<React.ComponentRef<typeof Select>>
}

/**
 * PrincipalPicker: A flexible component to select Principals (Users or Groups)
 * Operates similarly to PeoplePicker but uses principalService.
 */
export function PrincipalPicker(props: PrincipalPickerProps) {
	const {
		dataSource,
		mode,
		placeholder,
		labelKey = "name",
		showAvatar = true,
		onOpenChange,
		onSearch,
		readonly,
		principal,
		ref,
		className,
		...restProps
	} = props;

	const { t } = useTranslation();
	const [apiOptions, setApiOptions] = useState<PrincipalEntity[]>([]);
	const [loading, setLoading] = useState(false);
	const fetchedRef = useRef(false);

	const isRemote = !dataSource;

	const fetchData = useCallback(async (searchKey?: string) => {
		setLoading(true);
		try {
			// By default fetch up to 50 items using keyword search
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
			if (isRemote)
				fetchData(key);
		},
		{ wait: 350 },
	);

	const handleOpenChange = (open: boolean) => {
		if (open && !fetchedRef.current) {
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

	const finalPrincipals = useMemo(() => dataSource || apiOptions, [dataSource, apiOptions]);

	const selectOptions = useMemo<PrincipalOption[]>(() => {
		return finalPrincipals.map(p => ({
			label: String(p[labelKey] || p.name),
			value: p.id,
			principal: p,
		}));
	}, [finalPrincipals, labelKey]);

	const optionRender = (option: { data: PrincipalOption }) => {
		return <PrincipalDisplay principal={option.data.principal} showAvatar={showAvatar} />;
	};

	const tagRender = (tagProps: {
		label: React.ReactNode
		closable: boolean
		value: string
		onClose: (event?: React.MouseEvent<HTMLElement, MouseEvent>) => void
	}) => {
		const { label, closable, onClose, value } = tagProps;
		// Determine colour based on whether it is a User or Group tag (using finalPrincipals)
		const targetPrincipal = finalPrincipals.find(p => p.id === value);
		const tagColor = targetPrincipal?.type === "group" ? "orange" : "blue";
		const bgColor = targetPrincipal?.type === "group" ? "bg-orange-50" : "bg-[#4f46e5]/5";
		const textColor = targetPrincipal?.type === "group" ? "text-orange-600" : "text-[#4f46e5]";
		const borderColor = targetPrincipal?.type === "group" ? "border-orange-500/25" : "border-[#4f46e5]/25";

		return (
			<Tag
				color={tagColor}
				closable={closable}
				onClose={onClose}
				className={cn(
					"mr-1 flex items-center rounded px-1.5 h-5 text-[11px] font-medium border border-solid",
					bgColor,
					textColor,
					borderColor,
				)}
			>
				{label}
			</Tag>
		);
	};

	const filterOption = (input: string, option?: PrincipalOption) => {
		if (isRemote || !option)
			return true;
		const searchStr = input.toLowerCase();
		return option.label.toLowerCase().includes(searchStr);
	};

	if (readonly) {
		return (
			<div className={cn("flex min-h-[32px] items-center", className)}>
				{principal ? <PrincipalDisplay principal={principal} showAvatar={showAvatar} /> : <div className="text-[12px] opacity-45">{t("common.noData")}</div>}
			</div>
		);
	}

	return (
		<Select<string | string[], PrincipalOption>
			ref={ref}
			showSearch
			allowClear
			mode={mode}
			placeholder={placeholder || t("common.keywordSearch")}
			optionFilterProp="label"
			loading={loading}
			onOpenChange={handleOpenChange}
			onSearch={handleSearch}
			options={selectOptions}
			optionRender={optionRender}
			tagRender={mode === "multiple" || mode === "tags" ? tagRender : undefined}
			filterOption={filterOption}
			listHeight={182}
			dropdownStyle={{ borderRadius: 8, padding: 4, minWidth: 200 }}
			className={cn("w-full", className)}
			notFoundContent={loading
				? (
					<div className="flex flex-col items-center justify-center gap-2 h-20">
						<Spin size="small" />
						<Text type="secondary" className="text-[11px]">{t("common.loading")}</Text>
					</div>
				)
				: undefined}
			{...(restProps as SelectProps<string | string[], PrincipalOption>)}
		/>
	);
}

export interface ProFormPrincipalPickerProps extends Omit<FormItemProps, "children" | "initialValue"> {
	name: string
	multiple?: boolean
	labelInValue?: boolean
	fieldProps?: PrincipalPickerProps
	initialValue?: string | string[]
}

/**
 * ProFormPrincipalPicker: Ready-to-use ProForm component
 */
export function ProFormPrincipalPicker({ name, label, rules, multiple, labelInValue = true, fieldProps, initialValue, readonly, ...rest }: ProFormPrincipalPickerProps & { readonly?: boolean }) {
	return (
		<ProFormItem
			name={name}
			label={label}
			rules={rules}
			initialValue={initialValue}
			{...rest}
		>
			<PrincipalPicker
				mode={multiple ? "multiple" : undefined}
				labelInValue={labelInValue}
				readonly={readonly}
				{...fieldProps}
			/>
		</ProFormItem>
	);
}
