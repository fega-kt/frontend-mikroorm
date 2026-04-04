import type { DepartmentEntity } from "#src/api/system/dept/types";
import type { FormItemProps, SelectProps } from "antd";
import { departmentService } from "#src/api/system/dept";
import { cn } from "#src/utils/cn";
import { ProFormItem } from "@ant-design/pro-components";
import { useDebounceFn } from "ahooks";
import { Badge, Select, Space, Spin, Tag, Typography } from "antd";
import * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

/** Define the shape of our Select components options */
export interface DepartmentOption {
	label: string
	value: string
	department: DepartmentEntity
}

/** Specific props for the DepartmentPicker component */
export interface DepartmentPickerProps extends Omit<SelectProps<string | string[], DepartmentOption>, "options" | "mode" | "onDropdownVisibleChange"> {
	/** Manual list of departments. If provided, filtering is local. */
	dataSource?: DepartmentEntity[]
	/** API endpoint (string) to fetch departments. Defaults to "department" via departmentService */
	api?: string
	/** Label to display logic: 'name' | 'code' */
	labelKey?: keyof DepartmentEntity
	/** Show department code in dropdown suggestions */
	showCode?: boolean
	/** Selection mode */
	mode?: "multiple" | "tags"
	/** Callback when the dropdown open state changes */
	onOpenChange?: (open: boolean) => void
	/** Ref to the internal Select component */
	ref?: React.Ref<React.ComponentRef<typeof Select>>
}

/**
 * DepartmentPicker: A premium, reusable department selection component
 * - Supports hierarchical or flat lists
 * - Remote fetching with debounced search
 * - Visual indicators for department status/code
 */
export function DepartmentPicker(props: DepartmentPickerProps) {
	const {
		dataSource,
		api = "department",
		mode,
		placeholder,
		labelKey = "name",
		showCode = true,
		onOpenChange,
		onSearch,
		ref,
		className,
		...restProps
	} = props;

	const { t } = useTranslation();
	const [apiOptions, setApiOptions] = useState<DepartmentEntity[]>([]);
	const [loading, setLoading] = useState(false);
	const fetchedRef = useRef(false);

	// Remote if no 'dataSource' provided
	const isRemote = useMemo(() => !dataSource, [dataSource]);

	const fetchData = useCallback(async (searchKey?: string) => {
		setLoading(true);
		try {
			// Using the newly refactored departmentService
			const data = await departmentService.fetchDeptByApi(api, searchKey);
			setApiOptions(data || []);
			fetchedRef.current = true;
		}
		catch (error) {
			console.error("[DepartmentPicker] Failed to fetch departments:", api, error);
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

	const finalDepts = useMemo(() => dataSource || apiOptions, [dataSource, apiOptions]);

	const selectOptions = useMemo<DepartmentOption[]>(() => {
		return finalDepts.map(dept => ({
			label: dept[labelKey] as string,
			value: dept.id,
			department: dept,
		}));
	}, [finalDepts, labelKey]);

	const optionRender = (option: { data: DepartmentOption }) => {
		const { department } = option.data;

		return (
			<Space size="small" className="p-0">
				<Badge
					status={department.status === 1 ? "success" : "default"}
					className="mr-1"
				/>
				<div className="flex flex-col overflow-hidden leading-tight">
					<Text strong className="text-[13px]" ellipsis>
						{department.name}
					</Text>
					{showCode && (
						<Text type="secondary" className="text-[10px]" ellipsis>
							{department.code}
						</Text>
					)}
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
				color="cyan"
				closable={closable}
				onClose={onClose}
				className={cn(
					"mr-1 flex items-center rounded bg-cyan-50 px-1.5 h-5 text-[11px] font-medium text-cyan-700 border border-solid border-cyan-200",
				)}
			>
				{label}
			</Tag>
		);
	};

	const filterOption = (input: string, option?: DepartmentOption) => {
		if (isRemote || !option)
			return true;
		const { department } = option;
		const searchStr = input.toLowerCase();
		return (
			department.name?.toLowerCase().includes(searchStr)
			|| department.code?.toLowerCase().includes(searchStr)
		);
	};

	return (
		<Select<string | string[], DepartmentOption>
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
			listHeight={220}
			dropdownStyle={{ borderRadius: 8, padding: 4, minWidth: 220 }}
			className={cn("w-full", className)}
			notFoundContent={loading
				? (
					<div className="flex flex-col items-center justify-center gap-2 h-20">
						<Spin size="small" />
						<Text type="secondary" className="text-[11px]">{t("common.loading")}</Text>
					</div>
				)
				: undefined}
			{...(restProps as SelectProps<string | string[], DepartmentOption>)}
		/>
	);
}

/** Shared props for the ProForm wrapper */
export interface ProFormDepartmentPickerProps extends Omit<FormItemProps, "children" | "initialValue"> {
	name: string
	multiple?: boolean
	labelInValue?: boolean
	fieldProps?: DepartmentPickerProps
	initialValue?: string | string[]
}

/**
 * ProFormDepartmentPicker: Ready-to-use ProForm component for departments
 */
export function ProFormDepartmentPicker({ name, label, rules, multiple, labelInValue = true, fieldProps, initialValue, ...rest }: ProFormDepartmentPickerProps) {
	return (
		<ProFormItem
			name={name}
			label={label}
			rules={rules}
			initialValue={initialValue}
			{...rest}
		>
			<DepartmentPicker
				mode={multiple ? "multiple" : undefined}
				labelInValue={labelInValue}
				{...fieldProps}
			/>
		</ProFormItem>
	);
}
