import type { TextAreaProps } from "antd/es/input/TextArea";
import { Input } from "antd";

type TrimTextAreaProps = Omit<TextAreaProps, "onChange" | "onPaste"> & {
	onChange?: (value: string) => void
	onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void
};

export function TrimTextArea({ value, onChange, onBlur, onPaste, ...rest }: TrimTextAreaProps) {
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const normalized = e.target.value.replace(/ {2,}/g, " ");
		onChange?.(normalized);
	};

	const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
		onChange?.(e.target.value.trim());
		onBlur?.(e);
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
		e.preventDefault();
		const pasted = e.clipboardData.getData("text").trim();
		const textarea = e.currentTarget;
		const start = textarea.selectionStart ?? 0;
		const end = textarea.selectionEnd ?? 0;
		const current = String(value ?? "");
		const merged = current.slice(0, start) + pasted + current.slice(end);
		onChange?.(merged.replace(/ {2,}/g, " "));
		onPaste?.(e);
	};

	return (
		<Input.TextArea
			{...rest}
			value={value}
			onChange={handleChange}
			onBlur={handleBlur}
			onPaste={handlePaste}
		/>
	);
}
