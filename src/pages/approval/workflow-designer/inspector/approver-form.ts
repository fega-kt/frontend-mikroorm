import type { Approver } from "#src/api/approval-workflow/types";
import { ApproverType } from "#src/api/approval-workflow/types";
import { useTranslation } from "react-i18next";

/** Dạng giá trị trong form của một người duyệt */
export interface ApproverFormItem {
	type?: ApproverType
	/** SPECIFIC_USER (dữ liệu cũ) */
	userId?: string
	/** PRINCIPAL — người dùng hoặc nhóm */
	principalId?: string
}

export function toApproverForm(a: Approver): ApproverFormItem {
	if (a.type === ApproverType.SpecificUser)
		return { type: a.type, userId: a.userId };
	if (a.type === ApproverType.Principal)
		return { type: a.type, principalId: a.principalId };
	return { type: a.type };
}

/** Một dòng form → người duyệt; null nếu chưa hoàn chỉnh (chưa chọn loại, hoặc chưa chọn người/nhóm) */
export function fromApproverFormItem(i: ApproverFormItem | undefined): Approver | null {
	switch (i?.type) {
		case ApproverType.SpecificUser:
			return i.userId ? { type: ApproverType.SpecificUser, userId: i.userId } : null;
		case ApproverType.Principal:
			return i.principalId ? { type: ApproverType.Principal, principalId: i.principalId } : null;
		case ApproverType.DeptHead:
		case ApproverType.DeptDeputy:
			return { type: i.type };
		default:
			return null;
	}
}

/** Bỏ các dòng chưa hoàn chỉnh */
export function fromApproverForm(items: ApproverFormItem[] | undefined): Approver[] {
	return (items ?? []).map(fromApproverFormItem).filter((a): a is Approver => !!a);
}

/** Loại người duyệt chọn được; "Người cụ thể" (cũ) chỉ hiện khi định nghĩa đang dùng nó */
export function useApproverTypeOptions(includeLegacy = false) {
	const { t } = useTranslation();
	const types = [ApproverType.DeptHead, ApproverType.DeptDeputy, ApproverType.Principal];
	if (includeLegacy)
		types.push(ApproverType.SpecificUser);
	return types.map(type => ({
		value: type,
		label: t(`workflowDesigner.approverType.${type}`),
	}));
}
