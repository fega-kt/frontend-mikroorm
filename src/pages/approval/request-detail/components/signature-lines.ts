/** Như signatureLines bên backend (document-signing.service.ts) */
const MAX_DEPARTMENT_LENGTH = 40;
/** Chưa ký: mẫu cùng độ dài với "HH:mm dd/MM/yyyy" */
const SIGNED_AT_PLACEHOLDER = "hh:mm dd/mm/yyyy";

/** Các dòng chữ của khung chờ ký (màn đặt vị trí ký) */
export function placeholderSignatureLines(signer: string, departmentName?: string) {
	const department = departmentName && departmentName.length > MAX_DEPARTMENT_LENGTH
		? `${departmentName.slice(0, MAX_DEPARTMENT_LENGTH - 1).trimEnd()}…`
		: departmentName;
	return [`Ký bởi: ${signer}`, ...(department ? [`Đơn vị: ${department}`] : []), `Thời gian: ${SIGNED_AT_PLACEHOLDER}`];
}
