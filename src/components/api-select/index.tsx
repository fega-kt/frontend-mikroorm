import type { EntityBase } from "#src/api/entity-base";
import type { FormItemProps, SelectProps } from "antd";
import { ProFormItem } from "@ant-design/pro-components";
import { useDebounceFn } from "ahooks";
import { Select, Spin } from "antd";
import { useCallback, useMemo, useRef, useState } from "react";

export interface ApiSelectProps<T extends EntityBase = EntityBase> extends Omit<SelectProps, "options" | "loading" | "value" | "onChange" | "mode"> {
	fetcher: (keyword?: string) => Promise<T[]>
	displayFieldName?: keyof T & string
	multiple?: boolean
	value?: T | T[]
	onChange?: (value: T | T[] | undefined) => void
}

export function ApiSelect<T extends EntityBase = EntityBase>({
	fetcher,
	displayFieldName = "name" as keyof T & string,
	placeholder,
	multiple,
	value,
	onChange,
	...restProps
}: ApiSelectProps<T>) {
	const [items, setItems] = useState<T[]>([]);
	const [loading, setLoading] = useState(false);
	const fetchedRef = useRef(false);

	const resolveLabel = useCallback(
		(entity: T) => String(entity[displayFieldName] ?? entity.id),
		[displayFieldName],
	);

	const options = useMemo(() => {
		const loadedIds = new Set(items.map(i => i.id));
		const loadedOptions = items.map(item => ({ label: resolveLabel(item), value: item.id }));
		const currentItems = Array.isArray(value) ? value : value ? [value] : [];
		const seedOptions = currentItems
			.filter(item => !loadedIds.has(item.id))
			.map(item => ({ label: resolveLabel(item), value: item.id }));
		return [...loadedOptions, ...seedOptions];
	}, [items, value, resolveLabel]);

	const normalizedValue = useMemo(() => {
		if (!value)
			return undefined;
		if (Array.isArray(value))
			return value.map(v => v.id);
		return value.id;
	}, [value]);

	const fetchData = useCallback(async (keyword?: string) => {
		setLoading(true);
		try {
			const data = await fetcher(keyword);
			setItems(data);
			fetchedRef.current = true;
		}
		catch {
			// handled by global interceptor
		}
		finally {
			setLoading(false);
		}
	}, [fetcher]);

	const { run: runDebouncedSearch } = useDebounceFn(
		(keyword: string) => fetchData(keyword || undefined),
		{ wait: 350 },
	);

	const handleDropdownVisibleChange = (open: boolean) => {
		if (open && !fetchedRef.current) {
			fetchData();
		}
	};

	const handleChange = (selectedId: string | string[] | null | undefined) => {
		if (!onChange)
			return;
		if (!selectedId || (Array.isArray(selectedId) && selectedId.length === 0)) {
			onChange(multiple ? [] : undefined);
			return;
		}
		const allItems = [...items, ...(Array.isArray(value) ? value : value ? [value] : [])];
		const byId = new Map(allItems.map(item => [item.id, item]));
		if (Array.isArray(selectedId)) {
			onChange(selectedId.map(id => byId.get(id)).filter(Boolean) as T[]);
		}
		else {
			onChange(byId.get(selectedId));
		}
	};

	return (
		<Select
			showSearch
			allowClear
			filterOption={false}
			mode={multiple ? "multiple" : undefined}
			placeholder={placeholder}
			loading={loading}
			options={options}
			onDropdownVisibleChange={handleDropdownVisibleChange}
			onSearch={runDebouncedSearch}
			notFoundContent={loading ? <div className="flex justify-center p-4"><Spin size="small" /></div> : undefined}
			className="w-full"
			value={normalizedValue}
			onChange={handleChange}
			{...restProps}
		/>
	);
}

export interface ProFormApiSelectProps<T extends EntityBase = EntityBase> extends Omit<FormItemProps, "children"> {
	name: string
	fetcher: ApiSelectProps<T>["fetcher"]
	displayFieldName?: ApiSelectProps<T>["displayFieldName"]
	fieldProps?: Omit<ApiSelectProps<T>, "fetcher" | "displayFieldName">
}

export function ProFormApiSelect<T extends EntityBase = EntityBase>({
	name,
	label,
	rules,
	fetcher,
	displayFieldName,
	fieldProps,
	...rest
}: ProFormApiSelectProps<T>) {
	return (
		<ProFormItem name={name} label={label} rules={rules} {...rest}>
			<ApiSelect<T> fetcher={fetcher} displayFieldName={displayFieldName} {...fieldProps} />
		</ProFormItem>
	);
}
