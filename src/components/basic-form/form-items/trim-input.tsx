import type { InputProps } from "antd";
import { Input } from "antd";

type TrimInputProps = Omit<InputProps, "onChange"> & {
	onChange?: (value: string) => void
};

export function TrimInput({ value, onChange, onBlur, onPaste, ...rest }: TrimInputProps) {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const normalized = e.target.value.replace(/ {2,}/g, " ");
		onChange?.(normalized);
	};

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		onChange?.(e.target.value.trim());
		onBlur?.(e);
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		const pasted = e.clipboardData.getData("text").trim();
		const input = e.currentTarget;
		const start = input.selectionStart ?? 0;
		const end = input.selectionEnd ?? 0;
		const current = String(value ?? "");
		const merged = current.slice(0, start) + pasted + current.slice(end);
		onChange?.(merged.replace(/ {2,}/g, " "));
		onPaste?.(e);
	};

	return (
		<Input
			{...rest}
			value={value}
			onChange={handleChange}
			onBlur={handleBlur}
			onPaste={handlePaste}
		/>
	);
}
