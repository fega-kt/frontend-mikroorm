import type { UserEntity } from "#src/api/user/types";
import type { FormItemProps, SelectProps } from "antd";
import { userService } from "#src/api/user";
import { getAvatarColor } from "#src/utils/avatar/index";
import { cn } from "#src/utils/cn";
import { ProFormItem } from "@ant-design/pro-components";
import { useDebounceFn } from "ahooks";
import { Avatar, Select, Space, Spin, Tag, Typography } from "antd";
import * as React from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

/** UserDisplay: Static component to show user info consistently (avatar + name + subtext) */
export function UserDisplay({ user, showAvatar = true, size = "middle" }: { user: UserEntity, showAvatar?: boolean, size?: "small" | "middle" }) {
	const avatarSize = size === "small" ? 18 : 22;
	const nameSize = size === "small" ? "text-[12px]" : "text-[13px]";
	const subSize = size === "small" ? "text-[9px]" : "text-[10px]";

	return (
		<Space size={size} className="p-0">
			{showAvatar && (
				<Avatar
					size={avatarSize}
					src={user.avatar}
					className={cn("shrink-0 font-semibold border-solid", size === "small" ? "text-[10px]" : "text-[11px]")}
					style={{
						backgroundColor: getAvatarColor(user.id),
					}}
				>
					{user.fullName?.[0]?.toUpperCase() || user.loginName?.[0]?.toUpperCase() || "?"}
				</Avatar>
			)}
			<div className="flex flex-col overflow-hidden leading-none">
				<Text strong className={cn(nameSize, "-mb-0.5")} ellipsis>{user.fullName || user.loginName}</Text>
				<Text type="secondary" className={subSize} ellipsis>
					{user.workEmail || user.loginName}
				</Text>
			</div>
		</Space>
	);
}

/** Define the shape of our Select components options */
export interface PeopleOption {
	label: string
	value: string
	user: UserEntity
}

/** Value type for PeoplePicker - can be IDs or full objects */
export type PickerValueType = string | string[] | UserEntity | UserEntity[] | Record<string, unknown> | Record<string, unknown>[] | null | undefined;

/** Specific props for the PeoplePicker component */
export interface PeoplePickerProps extends Omit<SelectProps<string | string[], PeopleOption>, "options" | "mode" | "onDropdownVisibleChange" | "value" | "onChange"> {
	/** Current value (can be IDs or full UserEntity objects) */
	value?: PickerValueType
	/** Callback when value changes - returns full UserEntity objects */
	onChange?: (value: PickerValueType, option?: PeopleOption | PeopleOption[]) => void
	/** Manual list of users. If provided, filtering is local. */
	dataSource?: UserEntity[]
	/** API endpoint (string) to fetch users. If provided, it handles remote filtering */
	api?: string
	/** Label to display logic: 'fullName' | 'loginName' | 'workEmail' */
	labelKey?: keyof UserEntity
	/** show avatar in dropdown suggestions */
	showAvatar?: boolean
	/** Selection mode */
	mode?: "multiple" | "tags"
	/** Callback when the dropdown opens */
	onOpenChange?: (open: boolean) => void
	/** Readonly mode */
	readonly?: boolean
	/** Fixed user for display in readonly mode */
	user?: UserEntity
	/** Ref to internal Select */
	ref?: React.Ref<React.ComponentRef<typeof Select>>
}

/**
 * PeoplePicker: A premium, functional user selection component.
 * Handles both ID-based and Object-based value flow with automatic hydration.
 */
export function PeoplePicker(props: PeoplePickerProps) {
	const {
		dataSource,
		api = "user",
		labelKey = "fullName",
		showAvatar = true,
		mode,
		onOpenChange,
		onSearch,
		placeholder,
		className,
		readonly,
		user: readonlyUser,
		ref,
		...restProps
	} = props;

	const { t } = useTranslation();
	const [apiOptions, setApiOptions] = useState<UserEntity[]>([]);
	const [loading, setLoading] = useState(false);
	const isRemote = !!api;

	// Fetch remote users
	const fetchData = async (keyword?: string) => {
		if (!isRemote) {
			return;
		}
		setLoading(true);
		try {
			const res = await userService.fetchUserByApi(api, keyword);
			setApiOptions(res.data);
		}
		catch (error) {
			console.error("[PeoplePicker] Search Error:", error);
		}
		finally {
			setLoading(false);
		}
	};

	const { run: runDebouncedSearch } = useDebounceFn(fetchData, { wait: 300 });

	const handleOpenChange = (open: boolean) => {
		if (open && isRemote && apiOptions.length === 0) {
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

	// --- DATA MAPPING ---
	// Merge current value objects, data source, and api results to ensure we always have labels
	const finalUsers = useMemo(() => {
		const map = new Map<string, UserEntity>();

		// 1. Start with data source / background options
		(dataSource || []).forEach(u => map.set(u.id, u));
		apiOptions.forEach(u => map.set(u.id, u));
		if (readonlyUser) {
			map.set(readonlyUser.id, readonlyUser);
		}

		// 2. Add objects from current value (most up-to-date labels)
		const incoming = Array.isArray(restProps.value) ? restProps.value : (restProps.value ? [restProps.value] : []);
		incoming.forEach((v: unknown) => {
			if (v && typeof v === "object" && v !== null && "id" in v) {
				const u = v as UserEntity;
				if (u.fullName || u.loginName) {
					map.set(u.id, u);
				}
			}
		});

		return Array.from(map.values());
	}, [dataSource, apiOptions, restProps.value, readonlyUser]);

	// Convert external value (Objects or Strings) into string IDs for AntD Select
	const normalizedValue = useMemo(() => {
		if (!restProps.value) {
			return restProps.value;
		}
		const arr = Array.isArray(restProps.value) ? restProps.value : [restProps.value];
		const mapped = arr.map((v: unknown) => {
			if (v && typeof v === "object") {
				const rec = v as Record<string, unknown>;
				return (rec.id || rec.value || v) as string;
			}
			return v as string;
		});
		return (mode === "multiple" || mode === "tags") ? mapped : mapped[0];
	}, [restProps.value, mode]);

	const selectOptions = useMemo<PeopleOption[]>(() => {
		return finalUsers.map(user => ({
			label: (user[labelKey] || user.fullName || user.loginName || user.id) as string,
			value: user.id as string,
			user,
		}));
	}, [finalUsers, labelKey]);

	const handleChange = (val: string | string[], options?: PeopleOption | PeopleOption[]) => {
		if (!val || (Array.isArray(val) && val.length === 0)) {
			props.onChange?.(val as any, options);
			return;
		}

		// Reconstruct full UserEntity objects from options metadata
		const opts = Array.isArray(options) ? options : (options ? [options] : []);
		const resultObjects = opts.map(o => o.user || { id: o.value });

		const finalVal = (mode === "multiple" || mode === "tags") ? resultObjects : resultObjects[0];
		props.onChange?.(finalVal as any, options);
	};

	const optionRender = (option: { data: PeopleOption }) => {
		const u = option.data.user;
		// Fallback for names in case of poor backend data
		const safeUser = { ...u, fullName: u.fullName || u.loginName || u.id };
		return <UserDisplay user={safeUser} showAvatar={showAvatar} />;
	};

	const tagRender = (tagProps: any) => {
		const { label, closable, onClose, value } = tagProps;
		return (
			<Tag
				color="blue"
				closable={closable}
				onClose={onClose}
				className={cn(
					"mr-1 flex items-center rounded bg-[#4f46e5]/5 px-1.5 h-5 text-[11px] font-medium text-[#4f46e5] border border-solid border-[#4f46e5]/25",
				)}
			>
				{label || value || "..."}
			</Tag>
		);
	};

	const filterOption = (input: string, option?: PeopleOption) => {
		if (isRemote || !option) {
			return true;
		}
		const { user } = option;
		const searchStr = input.toLowerCase();
		return (
			user.fullName?.toLowerCase().includes(searchStr)
			|| user.loginName?.toLowerCase().includes(searchStr)
			|| user.workEmail?.toLowerCase().includes(searchStr)
		);
	};

	if (readonly) {
		const displayUser = readonlyUser || (Array.isArray(props.value) ? (props.value[0] as UserEntity) : (props.value as UserEntity));
		return (
			<div className={cn("flex min-h-[32px] items-center", className)}>
				{displayUser ? <UserDisplay user={displayUser} showAvatar={showAvatar} /> : <div className="text-[12px] opacity-45">{t("common.noData")}</div>}
			</div>
		);
	}

	return (
		<Select<string | string[], PeopleOption>
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
			value={normalizedValue as any}
			options={loading ? [] : selectOptions}
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
		/>
	);
}

/** Shared props for the ProForm wrapper */
export interface ProFormPeoplePickerProps extends Omit<FormItemProps, "children" | "initialValue"> {
	name: string
	multiple?: boolean
	api?: string
	dataSource?: UserEntity[]
	showAvatar?: boolean
	placeholder?: string
	readonly?: boolean
	labelInValue?: boolean
	fieldProps?: PeoplePickerProps
	initialValue?: string | string[]
}

/**
 * ProFormPeoplePicker: Ready-to-use ProForm component
 */
export function ProFormPeoplePicker({ name, label, rules, multiple, fieldProps, initialValue, readonly, ...rest }: ProFormPeoplePickerProps) {
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
				readonly={readonly}
				{...fieldProps}
			/>
		</ProFormItem>
	);
}
