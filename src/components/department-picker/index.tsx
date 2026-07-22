import type { DepartmentEntity, DepartmentTreeNode } from "#src/api/system/dept/types";
import type { FormItemProps, TreeSelectProps } from "antd";
import { departmentService } from "#src/api/system/dept";
import { ProFormItem } from "@ant-design/pro-components";
import { useDebounceFn } from "ahooks";
import { Spin, TreeSelect, Typography } from "antd";
import * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./department-picker.module.scss";

interface TreeNode {
	value: string
	title: React.ReactNode
	name: string
	children?: TreeNode[]
}

function makeTitleNode(text: string): React.ReactNode {
	return (
		<Typography.Text ellipsis={{ tooltip: text }} className="w-full block">
			{text}
		</Typography.Text>
	);
}

function getParentId(parent: DepartmentEntity["parent"]): string | undefined {
	if (!parent)
		return undefined;
	if (typeof parent === "string")
		return parent;
	return parent.id;
}

function filterTreeNodes(nodes: TreeNode[], excludeIds: Set<string>): TreeNode[] {
	return nodes
		.filter(n => !excludeIds.has(n.value))
		.map(n => ({
			...n,
			children: n.children ? filterTreeNodes(n.children, excludeIds) : undefined,
		}));
}

function collectAllTreeIds(nodes: TreeNode[], ids: Set<string>) {
	for (const node of nodes) {
		ids.add(node.value);
		collectAllTreeIds(node.children ?? [], ids);
	}
}

function getDescendantIdsFromTree(nodes: TreeNode[], rootId: string): Set<string> {
	for (const node of nodes) {
		if (node.value === rootId) {
			const ids = new Set<string>([rootId]);
			collectAllTreeIds(node.children ?? [], ids);
			return ids;
		}
		const found = getDescendantIdsFromTree(node.children ?? [], rootId);
		if (found.size > 0)
			return found;
	}
	return new Set<string>();
}

function convertToTreeNodes(nodes: DepartmentTreeNode[]): TreeNode[] {
	return nodes.map(n => ({
		value: n.id,
		name: n.name,
		title: makeTitleNode(n.name),
		children: n.children?.length ? convertToTreeNodes(n.children) : undefined,
	}));
}

function buildTree(departments: DepartmentEntity[]): TreeNode[] {
	const map = new Map<string, TreeNode & { _parentId?: string }>();

	departments.forEach((dept) => {
		map.set(dept.id, {
			value: dept.id,
			name: dept.name,
			title: makeTitleNode(dept.name),
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
	excludeRootId?: string
	ref?: React.Ref<React.ComponentRef<typeof TreeSelect>>
}

export function DepartmentPicker(props: DepartmentPickerProps) {
	const {
		dataSource,
		api: _api,
		multiple,
		placeholder,
		excludeRootId,
		ref,
		value,
		onChange,
		labelInValue: _labelInValue,
		...restProps
	} = props;

	const { t } = useTranslation();
	const [apiTreeData, setApiTreeData] = useState<TreeNode[]>([]);
	const [loading, setLoading] = useState(false);
	const fetchedRef = useRef(false);

	const isRemote = !dataSource;

	const [remoteExpandedKeys, setRemoteExpandedKeys] = useState<string[]>([]);

	const fetchData = useCallback(async (keyword?: string) => {
		setLoading(true);
		try {
			const data = await departmentService.fetchActiveDeptTreeList({ keyword });
			const nodes = convertToTreeNodes(data || []);
			setApiTreeData(nodes);
			setRemoteExpandedKeys(nodes.map(n => n.value));
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

	const treeData = useMemo(() => {
		const tree = dataSource ? buildTree(dataSource) : apiTreeData;
		if (!excludeRootId)
			return tree;
		const excludeSet = getDescendantIdsFromTree(tree, excludeRootId);
		return excludeSet.size > 0 ? filterTreeNodes(tree, excludeSet) : tree;
	}, [dataSource, apiTreeData, excludeRootId]);

	const localDefaultExpandedKeysRef = useRef(treeData.map(n => n.value));

	const normalizedValue = useMemo(() => {
		if (!value)
			return value;
		const toInternal = (v: unknown) => {
			if (v && typeof v === "object" && "id" in v)
				return { value: (v as DepartmentEntity).id, label: (v as DepartmentEntity).name };
			return v;
		};
		return Array.isArray(value) ? value.map(toInternal) : toInternal(value);
	}, [value]);

	const findNodeName = (nodes: TreeNode[], id: string): string | undefined => {
		for (const n of nodes) {
			if (n.value === id)
				return n.name;
			const found = n.children ? findNodeName(n.children, id) : undefined;
			if (found)
				return found;
		}
	};

	const handleChange: TreeSelectProps["onChange"] = (selected, ...args) => {
		if (!onChange)
			return;
		const toEntity = (s: { value: string }) => ({ id: s.value, name: findNodeName(treeData, s.value) ?? s.value });
		const result = !selected
			? selected
			: Array.isArray(selected)
				? selected.map(toEntity)
				: toEntity(selected as { value: string });
		onChange(result, ...args);
	};
	return (
		<TreeSelect
			ref={ref}
			showSearch={isRemote
				? { onSearch: (keyword: string) => runDebouncedSearch(keyword), filterTreeNode: false }
				: { treeNodeFilterProp: "name" }}
			allowClear
			labelInValue
			placeholder={placeholder || t("common.keywordSearch")}
			loading={loading}
			treeData={treeData}
			{...(isRemote
				? { treeExpandedKeys: remoteExpandedKeys, onTreeExpand: keys => setRemoteExpandedKeys(keys as string[]) }
				: { treeDefaultExpandedKeys: localDefaultExpandedKeysRef.current })}
			multiple={multiple}
			treeCheckable={multiple}
			showCheckedStrategy={TreeSelect.SHOW_ALL}
			onOpenChange={handleDropdownVisibleChange}
			notFoundContent={loading ? <div className="flex justify-center p-4"><Spin size="small" /></div> : undefined}
			className="w-full"
			classNames={{ popup: { root: styles.dropdown } }}
			styles={{ popup: { root: { maxHeight: 360, overflow: "auto" } } }}
			value={normalizedValue as TreeSelectProps["value"]}
			onChange={handleChange}
			{...restProps}
		/>
	);
}

export interface ProFormDepartmentPickerProps extends Omit<FormItemProps, "children" | "initialValue"> {
	name: string
	multiple?: boolean
	labelInValue?: boolean
	excludeRootId?: string
	fieldProps?: DepartmentPickerProps
	initialValue?: string | string[]
}

export function ProFormDepartmentPicker({
	name,
	label,
	rules,
	multiple,
	labelInValue = true,
	excludeRootId,
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
				excludeRootId={excludeRootId}
				{...fieldProps}
			/>
		</ProFormItem>
	);
}
