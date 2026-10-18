import type { Approver } from "#src/api/approval-workflow/types";
import { ApproverType, LeaderRole } from "#src/api/approval-workflow/types";
import { useTranslation } from "react-i18next";

/** Dạng giá trị trong form của một người duyệt */
export interface ApproverFormItem {
	type?: ApproverType
	/** SPECIFIC_USER (dữ liệu cũ) */
	userId?: string
	/** PRINCIPAL — người dùng hoặc nhóm */
	principalId?: string
	/** DEPARTMENT_LEADER — phòng được chọn (giá trị của DepartmentPicker) */
	department?: { id: string, name: string }
	role?: LeaderRole
	climbIfEmpty?: boolean
}

export function toApproverForm(a: Approver): ApproverFormItem {
	if (a.type === ApproverType.SpecificUser)
		return { type: a.type, userId: a.userId };
	if (a.type === ApproverType.Principal)
		return { type: a.type, principalId: a.principalId };
	if (a.type === ApproverType.DepartmentLeader) {
		return {
			type: a.type,
			department: { id: a.departmentId, name: a.departmentName ?? a.departmentId },
			role: a.role,
			climbIfEmpty: a.climbIfEmpty,
		};
	}
	return { type: a.type };
}

/** Một dòng form → người duyệt; null nếu chưa hoàn chỉnh (chưa chọn loại, hoặc chưa chọn người/nhóm) */
export function fromApproverFormItem(i: ApproverFormItem | undefined): Approver | null {
	switch (i?.type) {
		case ApproverType.SpecificUser:
			return i.userId ? { type: ApproverType.SpecificUser, userId: i.userId } : null;
		case ApproverType.Principal:
			return i.principalId ? { type: ApproverType.Principal, principalId: i.principalId } : null;
		case ApproverType.DepartmentLeader:
			return i.department?.id
				? {
					type: ApproverType.DepartmentLeader,
					departmentId: i.department.id,
					departmentName: i.department.name,
					role: i.role ?? LeaderRole.Head,
					climbIfEmpty: !!i.climbIfEmpty,
				}
				: null;
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
	const types = [ApproverType.DeptHead, ApproverType.DeptDeputy, ApproverType.Principal, ApproverType.DepartmentLeader];
	if (includeLegacy)
		types.push(ApproverType.SpecificUser);
	return types.map(type => ({
		value: type,
		label: t(`workflowDesigner.approverType.${type}`),
	}));
}
