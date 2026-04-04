import type { UserEntity } from "#src/api/user/types";
import type { FormItemProps, SelectProps } from "antd";
import { userService } from "#src/api/user";
import { cn } from "#src/utils/cn";
import { ProFormItem } from "@ant-design/pro-components";
import { useDebounceFn } from "ahooks";
import { Avatar, Select, Space, Spin, Tag, Typography } from "antd";
import * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

/** Helper to generate a vivid, theme-safe color from a string (user id) */
function getUserColor(id: string = "") {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash);
	}
	const h = Math.abs(hash % 360);
	// Saturation 65%, Lightness 55% for a vivid but not over-saturated look
	return {
		color: `hsl(${h}, 70%, 45%)`,
		backgroundColor: `hsla(${h}, 70%, 45%, 0.12)`,
		borderColor: `hsla(${h}, 70%, 45%, 0.25)`,
	};
}

/** Define the shape of our Select components options */
export interface PeopleOption {
	label: string
	value: string
	user: UserEntity
}

/** Specific props for the PeoplePicker component */
export interface PeoplePickerProps extends Omit<SelectProps<string | string[], PeopleOption>, "options" | "mode" | "onDropdownVisibleChange"> {
	/** Manual list of users. If provided, filtering is local. */
	dataSource?: UserEntity[]
	/** API endpoint (string) to fetch users. If provided, it handles remote filtering by passing '?keyword=...' */
	api?: string
	/** Label to display logic: 'fullName' | 'loginName' | 'workEmail' */
	labelKey?: keyof UserEntity
	/** show avatar in dropdown suggestions */
	showAvatar?: boolean
	/** Selection mode */
	mode?: "multiple" | "tags"
	/** Callback when the dropdown open state changes (AntD 5.x renamed from onDropdownVisibleChange) */
	onOpenChange?: (open: boolean) => void
	/** Readonly mode: only displays the user info without selection */
	readonly?: boolean
	/** Fixed user to display when in readonly mode (if not selecting from options) */
	user?: UserEntity
	/** Ref to the internal Select component */
	ref?: React.Ref<React.ComponentRef<typeof Select>>
}

/**
 * PeoplePicker: A premium, reusable user selection component
 * - 'dataSource' for local data
 * - 'api' (string endpoint) for remote fetching
 * - Dynamic color-coded Avatars based on User ID
 * - Optimized compact design using userService and TailwindCSS
 */
export function PeoplePicker(props: PeoplePickerProps) {
	const {
		dataSource,
		api,
		mode,
		placeholder,
		labelKey = "fullName",
		showAvatar = true,
		onOpenChange,
		onSearch,
		readonly,
		user,
		ref,
		className,
		...restProps
	} = props;

	const { t } = useTranslation();
	const [apiOptions, setApiOptions] = useState<UserEntity[]>([]);
	const [loading, setLoading] = useState(false);
	const fetchedRef = useRef(false);

	// Remote if 'api' (string) is provided and no 'dataSource'
	const isRemote = useMemo(() => !!api && !dataSource, [api, dataSource]);

	const fetchData = useCallback(async (searchKey?: string) => {
		if (!api)
			return;
		setLoading(true);
		try {
			const data = await userService.fetchUserByApi(api, searchKey);
			setApiOptions(data || []);
			fetchedRef.current = true;
		}
		catch (error) {
			console.error("[PeoplePicker] Failed to fetch users from:", api, error);
		}
		finally {
			setLoading(false);
		}
	}, [api]);

	const { run: runDebouncedSearch } = useDebounceFn(
		(key: string) => {
			if (isRemote)
				fetchData(key);
		},
		{ wait: 350 },
	);

	const handleOpenChange = (open: boolean) => {
		if (open && !fetchedRef.current && api) {
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

	const finalUsers = useMemo(() => dataSource || apiOptions, [dataSource, apiOptions]);

	const selectOptions = useMemo<PeopleOption[]>(() => {
		return finalUsers.map(user => ({
			label: user[labelKey] as string,
			value: user.id,
			user,
		}));
	}, [finalUsers, labelKey]);

	const optionRender = (option: { data: PeopleOption }) => {
		const { user } = option.data;
		const userStyle = getUserColor(user.id);

		return (
			<Space size="middle" className="p-0">
				{showAvatar && (
					<Avatar
						size={22}
						src={user.avatar}
						className="shrink-0 text-[10px] font-semibold border-solid"
						style={{
							backgroundColor: userStyle.backgroundColor,
							color: userStyle.color,
							borderColor: userStyle.borderColor,
						}}
					>
						{user.fullName?.[0]?.toUpperCase() || "?"}
					</Avatar>
				)}
				<div className="flex flex-col overflow-hidden leading-none">
					<Text strong className="text-[13px] -mb-0.5" ellipsis>{user.fullName}</Text>
					<Text type="secondary" className="text-[10px]" ellipsis>
						{user.workEmail || user.loginName}
					</Text>
				</div>
			</Space>
		);
	};

	const tagRender = (tagProps: {
		label: React.ReactNode
		closable: boolean
		onClose: (event?: React.MouseEvent<HTMLElement, MouseEvent>) => void
	}) => {
		const { label, closable, onClose } = tagProps;
		return (
			<Tag
				color="blue"
				closable={closable}
				onClose={onClose}
				className={cn(
					"mr-1 flex items-center rounded bg-[#4f46e5]/5 px-1.5 h-5 text-[11px] font-medium text-[#4f46e5] border border-solid border-[#4f46e5]/25",
				)}
			>
				{label}
			</Tag>
		);
	};

	const filterOption = (input: string, option?: PeopleOption) => {
		if (isRemote || !option)
			return true;
		const { user } = option;
		const searchStr = input.toLowerCase();
		return (
			user.fullName?.toLowerCase().includes(searchStr)
			|| user.loginName?.toLowerCase().includes(searchStr)
			|| user.workEmail?.toLowerCase().includes(searchStr)
		);
	};

	return (
		<Select<string | string[], PeopleOption>
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
			{...(restProps as SelectProps<string | string[], PeopleOption>)}
		/>
	);
}

/** Shared props for the ProForm wrapper */
export interface ProFormPeoplePickerProps extends Omit<FormItemProps, "children" | "initialValue"> {
	name: string
	multiple?: boolean
	labelInValue?: boolean
	fieldProps?: PeoplePickerProps
	initialValue?: string | string[]
}

/**
 * ProFormPeoplePicker: Ready-to-use ProForm component
 */
export function ProFormPeoplePicker({ name, label, rules, multiple, labelInValue = true, fieldProps, initialValue, readonly, ...rest }: ProFormPeoplePickerProps & { readonly?: boolean }) {
	return (
		<ProFormItem
			name={name}
			label={label}
			rules={rules}
			initialValue={initialValue}
			{...rest}
		>
			<PeoplePicker
				mode={multiple ? "multiple" : undefined}
				labelInValue={labelInValue}
				readonly={readonly}
				{...fieldProps}
			/>
		</ProFormItem>
	);
}
