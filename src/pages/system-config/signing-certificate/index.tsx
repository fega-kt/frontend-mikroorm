import type { SigningCertificate } from "#src/api/signing-certificate";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { signingCertificateService, SigningCertificateStatus } from "#src/api/signing-certificate";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { PeoplePicker } from "#src/components/people-picker";
import { CheckOutlined, CloseOutlined, StopOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Popconfirm, Segmented, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const DATE_FORMAT = "DD/MM/YYYY";
const DATE_TIME_FORMAT = "DD/MM/YYYY HH:mm";

type StatusTab = SigningCertificateStatus | "all";

const STATUS_COLOR: Record<SigningCertificateStatus, string> = {
	[SigningCertificateStatus.Pending]: "processing",
	[SigningCertificateStatus.Active]: "success",
	[SigningCertificateStatus.Rejected]: "error",
	[SigningCertificateStatus.Revoked]: "default",
};

/** Từ chối / thu hồi: hỏi lý do (người dùng thấy lý do ở trang chữ ký số của họ) */
interface NoteDialog {
	kind: "reject" | "revoke"
	item: SigningCertificate
}

/** Quản trị chứng thư ký số: duyệt đăng ký lần đầu, từ chối, thu hồi */
export default function SigningCertificates() {
	const { t } = useTranslation();
	const actionRef = useRef<ActionType>(null);
	const [status, setStatus] = useState<StatusTab>(SigningCertificateStatus.Pending);
	const [search, setSearch] = useState("");
	const [dialog, setDialog] = useState<NoteDialog>();
	const [note, setNote] = useState("");
	const [busyId, setBusyId] = useState<string>();

	const run = async (id: string, fn: () => Promise<unknown>, successKey: string) => {
		setBusyId(id);
		try {
			await fn();
			window.$message?.success(t(successKey));
			actionRef.current?.reload();
			return true;
		}
		catch {
			// Lỗi đã được interceptor hiển thị
			return false;
		}
		finally {
			setBusyId(undefined);
		}
	};

	const submitNote = async () => {
		if (!dialog)
			return;
		const { kind, item } = dialog;
		const ok = kind === "reject"
			? await run(item.id, () => signingCertificateService.fetchReject(item.id, note.trim() || undefined), "system.signingCertificate.rejected")
			: await run(item.id, () => signingCertificateService.fetchRevoke(item.id, note.trim() || undefined), "system.signingCertificate.revoked");
		if (ok)
			setDialog(undefined);
	};

	const columns: ProColumns<SigningCertificate>[] = [
		{
			title: t("system.signingCertificate.user"),
			dataIndex: "user",
			width: 240,
			render: (_, item) => <PeoplePicker readonly user={item.user} showEmail={false} />,
		},
		{ title: t("system.signingCertificate.department"), dataIndex: ["user", "department", "name"], width: 180, ellipsis: true },
		{
			title: t("system.signingCertificate.status"),
			dataIndex: "status",
			width: 130,
			render: (_, item) => item.expired
				? <Tag color="warning" className="m-0">{t("personal-center.signature.status.expired")}</Tag>
				: <Tag color={STATUS_COLOR[item.status]} className="m-0">{t(`personal-center.signature.status.${item.status}`)}</Tag>,
		},
		{
			title: t("system.signingCertificate.registeredAt"),
			dataIndex: "createdAt",
			width: 150,
			render: (_, item) => dayjs(item.createdAt).format(DATE_TIME_FORMAT),
		},
		{
			title: t("system.signingCertificate.validity"),
			dataIndex: "notAfter",
			width: 200,
			render: (_, item) => item.notBefore && item.notAfter ? `${dayjs(item.notBefore).format(DATE_FORMAT)} – ${dayjs(item.notAfter).format(DATE_FORMAT)}` : "—",
		},
		{
			title: t("system.signingCertificate.reviewedBy"),
			dataIndex: "reviewedBy",
			width: 220,
			render: (_, item) => item.reviewedBy
				? (
					<div className="flex flex-col">
						<span>{item.reviewedBy.fullName}</span>
						<Typography.Text type="secondary" className="text-xs">{dayjs(item.reviewedAt).format(DATE_TIME_FORMAT)}</Typography.Text>
					</div>
				)
				: "—",
		},
		{ title: t("system.signingCertificate.note"), dataIndex: "reviewNote", ellipsis: true },
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 110,
			fixed: "right",
			render: (_, item) => {
				if (item.status === SigningCertificateStatus.Pending) {
					return [
						<Popconfirm
							key="approve"
							title={t("system.signingCertificate.approveConfirm", { name: item.user.fullName })}
							onConfirm={() => run(item.id, () => signingCertificateService.fetchApprove(item.id), "system.signingCertificate.approved")}
						>
							<Tooltip title={t("system.signingCertificate.approve")}>
								<Button type="text" size="small" icon={<CheckOutlined />} loading={busyId === item.id} style={{ color: "var(--ant-color-success)" }} />
							</Tooltip>
						</Popconfirm>,
						<Tooltip key="reject" title={t("system.signingCertificate.reject")}>
							<Button type="text" size="small" danger icon={<CloseOutlined />} onClick={() => setDialog({ kind: "reject", item })} />
						</Tooltip>,
					];
				}
				if (item.status === SigningCertificateStatus.Active) {
					return [
						<Tooltip key="revoke" title={t("system.signingCertificate.revoke")}>
							<Button type="text" size="small" danger icon={<StopOutlined />} onClick={() => setDialog({ kind: "revoke", item })} />
						</Tooltip>,
					];
				}
				return [];
			},
		},
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<SigningCertificate>
				columns={columns}
				actionRef={actionRef}
				rowKey="id"
				search={false}
				params={{ status, search }}
				request={async (params) => {
					const { data, total } = await signingCertificateService.fetchList({
						page: params.page,
						limit: params.limit,
						status: status === "all" ? undefined : status,
						search: search || undefined,
					});
					return { data, total, success: true };
				}}
				headerTitle={(
					<Segmented<StatusTab>
						value={status}
						onChange={setStatus}
						options={[
							{ value: SigningCertificateStatus.Pending, label: t("personal-center.signature.status.pending") },
							{ value: SigningCertificateStatus.Active, label: t("personal-center.signature.status.active") },
							{ value: SigningCertificateStatus.Rejected, label: t("personal-center.signature.status.rejected") },
							{ value: SigningCertificateStatus.Revoked, label: t("personal-center.signature.status.revoked") },
							{ value: "all", label: t("system.signingCertificate.all") },
						]}
					/>
				)}
				toolBarRender={() => [
					<Input.Search key="search" allowClear placeholder={t("system.signingCertificate.search")} onSearch={setSearch} className="w-64" />,
				]}
			/>
			<Modal
				open={!!dialog}
				title={dialog && t(`system.signingCertificate.${dialog.kind}Title`, { name: dialog.item.user.fullName })}
				okText={dialog && t(`system.signingCertificate.${dialog.kind}`)}
				okButtonProps={{ danger: true, loading: !!dialog && busyId === dialog.item.id }}
				onOk={submitNote}
				onCancel={() => setDialog(undefined)}
				afterOpenChange={open => open && setNote("")}
				destroyOnHidden
			>
				{dialog?.kind === "revoke" && <Typography.Paragraph type="secondary">{t("system.signingCertificate.revokeHint")}</Typography.Paragraph>}
				<Input.TextArea
					value={note}
					onChange={event => setNote(event.target.value)}
					maxLength={1000}
					autoSize={{ minRows: 3, maxRows: 6 }}
					placeholder={t("system.signingCertificate.notePlaceholder")}
				/>
			</Modal>
		</BasicContent>
	);
}
