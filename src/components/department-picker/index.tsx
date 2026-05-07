import type { DepartmentEntity } from "#src/api/system/dept/types";
import type { FormItemProps, TreeSelectProps } from "antd";
import { departmentService } from "#src/api/system/dept";
import { ProFormItem } from "@ant-design/pro-components";
import { useDebounceFn } from "ahooks";
import { Spin, TreeSelect } from "antd";
import * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface TreeNode {
	value: string
	title: string
	children?: TreeNode[]
}

function getParentId(parent: DepartmentEntity["parent"]): string | undefined {
	if (!parent)
		return undefined;
	if (typeof parent === "string")
		return parent;
	return parent.id;
}

function buildTree(departments: DepartmentEntity[]): TreeNode[] {
	const map = new Map<string, TreeNode & { _parentId?: string }>();

	departments.forEach((dept) => {
		map.set(dept.id, {
			value: dept.id,
			title: dept.name,
			children: [],
			_parentId: getParentId(dept.parent),
		});
	});

	const roots: TreeNode[] = [];
	map.forEach((node) => {
		if (node._parentId && map.has(node._parentId)) {
			map.get(node._parentId)!.children!.push(node);
		}
		else {
			roots.push(node);
		}
	});

	// Remove empty children arrays
	const clean = (nodes: TreeNode[]): TreeNode[] =>
		nodes.map(n => ({
			...n,
			children: n.children?.length ? clean(n.children) : undefined,
		}));

	return clean(roots);
}

export interface DepartmentPickerProps extends Omit<TreeSelectProps, "treeData" | "loadData"> {
	dataSource?: DepartmentEntity[]
	api?: string
	multiple?: boolean
	ref?: React.Ref<React.ComponentRef<typeof TreeSelect>>
}

export function DepartmentPicker(props: DepartmentPickerProps) {
	const {
		dataSource,
		api: _api,
		multiple,
		placeholder,
		ref,
		...restProps
	} = props;

	const { t } = useTranslation();
	const [apiDepartments, setApiDepartments] = useState<DepartmentEntity[]>([]);
	const [loading, setLoading] = useState(false);
	const fetchedRef = useRef(false);

	const isRemote = !dataSource;

	const fetchData = useCallback(async (keyword?: string) => {
		setLoading(true);
		try {
			const data = await departmentService.fetchDeptTree(keyword);
			setApiDepartments(data || []);
			fetchedRef.current = true;
		}
		catch (error) {
			console.error("[DepartmentPicker] Failed to fetch departments:", error);
		}
		finally {
			setLoading(false);
		}
	}, []);

	const { run: runDebouncedSearch } = useDebounceFn(
		(keyword: string) => {
			if (isRemote)
				fetchData(keyword);
		},
		{ wait: 350 },
	);

	const handleDropdownVisibleChange = (open: boolean) => {
		if (open && !fetchedRef.current && isRemote) {
			fetchData();
		}
	};

	const treeData = useMemo(
		() => buildTree(dataSource || apiDepartments),
		[dataSource, apiDepartments],
	);

	return (
		<TreeSelect
			ref={ref}
			showSearch
			allowClear
			treeDefaultExpandAll
			placeholder={placeholder || t("common.keywordSearch")}
			loading={loading}
			treeData={treeData}
			multiple={multiple}
			treeCheckable={multiple}
			showCheckedStrategy={TreeSelect.SHOW_ALL}
			onOpenChange={handleDropdownVisibleChange}
			onSearch={keyword => runDebouncedSearch(keyword)}
			notFoundContent={loading ? <div className="flex justify-center p-4"><Spin size="small" /></div> : undefined}
			className="w-full"
			dropdownStyle={{ maxHeight: 360, overflow: "auto" }}
			{...restProps}
		/>
	);
}

export interface ProFormDepartmentPickerProps extends Omit<FormItemProps, "children" | "initialValue"> {
	name: string
	multiple?: boolean
	labelInValue?: boolean
	fieldProps?: DepartmentPickerProps
	initialValue?: string | string[]
}

export function ProFormDepartmentPicker({
	name,
	label,
	rules,
	multiple,
	labelInValue = true,
	fieldProps,
	initialValue,
	...rest
}: ProFormDepartmentPickerProps) {
	return (
		<ProFormItem
			name={name}
			label={label}
			rules={rules}
			initialValue={initialValue}
			{...rest}
		>
			<DepartmentPicker
				multiple={multiple}
				labelInValue={labelInValue}
				{...fieldProps}
			/>
		</ProFormItem>
	);
}
