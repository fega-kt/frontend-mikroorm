import type { GetRef } from "antd";
import { Input } from "antd";

/** Mã PIN chữ ký số: đúng 6 chữ số */
export const PIN_LENGTH = 6;
export const PIN_PATTERN = /^\d{6}$/;

export type PinInputRef = GetRef<typeof Input.OTP>;

interface PinInputProps {
	value?: string
	/** Gọi mỗi lần đổi một ô (kể cả khi chưa đủ 6 số), giá trị là các số đã nhập ghép lại */
	onChange?: (value: string) => void
	status?: "error"
	disabled?: boolean
	autoFocus?: boolean
	ref?: React.Ref<PinInputRef>
}

/** Ô nhập PIN: 6 ô, mỗi ô một chữ số, ẩn ký tự; dùng được trong Form.Item */
export function PinInput({ onChange, ...props }: PinInputProps) {
	return (
		<Input.OTP
			length={PIN_LENGTH}
			mask="•"
			formatter={value => value.replace(/\D/g, "")}
			// onChange của OTP chỉ gọi khi đủ 6 ô; onInput gọi mỗi lần đổi để Form biết cả lúc xóa bớt số
			onInput={cells => onChange?.(cells.join(""))}
			{...props}
		/>
	);
}
