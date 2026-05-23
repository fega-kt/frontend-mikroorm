import type { TextAreaProps } from "antd/es/input/TextArea";
import { Input } from "antd";

type TrimTextAreaProps = Omit<TextAreaProps, "onChange"> & {
	onChange?: (value: string) => void
};

export function TrimTextArea({ value, onChange, onBlur, ...rest }: TrimTextAreaProps) {
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange?.(e.target.value);
	};

	const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
		onChange?.(e.target.value.trim());
		onBlur?.(e);
	};

	return (
		<Input.TextArea
			{...rest}
			value={value}
			onChange={handleChange}
			onBlur={handleBlur}
		/>
	);
}
