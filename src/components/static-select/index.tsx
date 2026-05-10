import type { FormItemProps, SelectProps } from "antd";
import { ProFormItem } from "@ant-design/pro-components";
import { Select } from "antd";

export interface StaticSelectOption { label: string, value: string | number }

export interface StaticSelectProps extends Omit<SelectProps, "options" | "mode"> {
	options: StaticSelectOption[]
	multiple?: boolean
}

export function StaticSelect({ options, multiple, ...restProps }: StaticSelectProps) {
	return (
		<Select
			allowClear
			mode={multiple ? "multiple" : undefined}
			options={options}
			className="w-full"
			{...restProps}
		/>
	);
}

export interface ProFormStaticSelectProps extends Omit<FormItemProps, "children"> {
	name: string
	options: StaticSelectOption[]
	fieldProps?: Omit<StaticSelectProps, "options">
}

export function ProFormStaticSelect({ name, label, rules, options, fieldProps, ...rest }: ProFormStaticSelectProps) {
	return (
		<ProFormItem name={name} label={label} rules={rules} {...rest}>
			<StaticSelect options={options} {...fieldProps} />
		</ProFormItem>
	);
}
