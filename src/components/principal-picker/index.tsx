import type { PrincipalEntity } from "#src/api/system/principal";
import type { PeoplePrincipal, PersonDisplayProps } from "#src/components/people-picker/person-display";
import type { FormItemProps, SelectProps } from "antd";
import { principalService, PrincipalType } from "#src/api/system/principal";
import { PersonHoverCard } from "#src/components/people-picker/person-card";
import { PersonDisplay } from "#src/components/people-picker/person-display";
import { UserAvatar } from "#src/components/user-avatar";
import { cn } from "#src/utils/cn";
import { TeamOutlined } from "@ant-design/icons";
import { ProFormItem } from "@ant-design/pro-components";
import { useDebounceFn } from "ahooks";
import { Select, Spin, Tag, theme } from "antd";
import * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/** Principal đủ để hiển thị: entity đầy đủ hoặc bản rút gọn từ các API khác (PrincipalBrief…) */
export interface PrincipalLike {
	id: string
	name: string
	type?: PrincipalType
	user?: { id?: string, fullName?: string, avatar?: string | null } | null
	group?: { name?: string } | null
}

function toPeoplePrincipal(p: PrincipalLike): PeoplePrincipal {
	return { id: p.id, name: p.name || p.group?.name || p.user?.fullName || p.id, type: p.type, user: p.user };
}

function PrincipalDisplay({ principal, ...rest }: { principal: PrincipalLike } & Omit<PersonDisplayProps, "user" | "principal">) {
	return <PersonDisplay principal={toPeoplePrincipal(principal)} {...rest} />;
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
	principal?: PrincipalLike
	/** Readonly: dòng phụ tùy ý dưới tên */
	description?: React.ReactNode
	/** Readonly: kích thước avatar (mặc định theo size) */
	avatarSize?: number
	/** Readonly: chỉ hiện avatar (vẫn hover được) */
	avatarOnly?: boolean
	/** Readonly: tên chữ thường màu phụ */
	subtle?: boolean
	/** Readonly: hover hiện thẻ thông tin (mặc định bật) */
	hoverCard?: boolean
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
		description,
		avatarSize,
		avatarOnly,
		subtle,
		hoverCard = true,
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
			const { data } = await principalService.fetchPrincipalList({ keyword: searchKey, pageSize: 10 });
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
			map.set(readonlyPrincipal.id, readonlyPrincipal as PrincipalEntity);
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
		return <PrincipalDisplay principal={option.data.principal} showAvatar={showAvatar} hoverCard={false} />;
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
				<PersonHoverCard target={{ kind: "principal", id: value }}>
					<span className="inline-flex items-center gap-1.5">
						{p && showAvatar && (
							<UserAvatar
								size={16}
								variant="soft"
								user={{ id: p.id, fullName: p.name, avatar: p.type === PrincipalType.User ? p.user?.avatar : undefined }}
								fallbackIcon={p.type === PrincipalType.Group ? <TeamOutlined className="text-[10px]" /> : undefined}
								className="border-none"
								style={{ fontSize: "9px" }}
							/>
						)}
						<span className="max-w-[100px] truncate text-inherit">
							{label || (p && (p.name || p.group?.name)) || value}
						</span>
					</span>
				</PersonHoverCard>
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
		const displayPrincipals = readonlyPrincipal
			? [readonlyPrincipal]
			: (Array.isArray(normalizedValue) ? normalizedValue : normalizedValue ? [normalizedValue] : [])
				.map(id => finalPrincipals.find(p => p.id === id))
				.filter((p): p is PrincipalEntity => !!p);
		const items = displayPrincipals.map(p => <PrincipalDisplay key={p.id} principal={p} showAvatar={showAvatar} description={description} avatarSize={avatarSize} avatarOnly={avatarOnly} subtle={subtle} hoverCard={hoverCard} size={props.size === "small" ? "small" : "middle"} />);
		if (avatarOnly)
			return <span className={cn("inline-flex shrink-0 items-center gap-1", className)}>{items}</span>;
		return (
			<div className={cn("flex min-h-[32px] flex-wrap items-center gap-x-3 gap-y-1", className)}>
				{displayPrincipals.length ? items : <div className="text-[12px] opacity-45">{t("common.noData")}</div>}
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
