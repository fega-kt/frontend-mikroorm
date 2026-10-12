import type { ApprovalRequestDetail, CreatableRequestType } from "#src/api/approval-request";
import type { AttachmentEntity } from "#src/api/attachment";
import { ApprovalHistoryAction, approvalRequestService, ApprovalRequestStatus } from "#src/api/approval-request";
import { AttachmentUpload } from "#src/components/attachment-upload";
import { BasicContent } from "#src/components/basic-content";
import { SectionCard } from "#src/components/section-card";
import { STORAGE_PATH } from "#src/constants/storage-path";
import { ArrowLeftOutlined, FileTextOutlined, FormOutlined, PaperClipOutlined, SaveOutlined, SendOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Form, Input, Result, Skeleton, Space, Tag, theme, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { PayloadFormItems } from "../components/form-fields";
import { formValuesToPayload, payloadToFormValues } from "../lib/payload";

const { Text, Title } = Typography;

interface FormValues {
	title: string
	payload: Record<string, any>
	attachments: AttachmentEntity[]
}

/** Tạo đơn mới (/approval/requests/new) hoặc sửa đơn nháp / bị trả lại (/approval/requests/:id/edit) */
export default function ApprovalRequestForm() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const [searchParams] = useSearchParams();
	const [form] = Form.useForm<FormValues>();

	const [types, setTypes] = useState<CreatableRequestType[]>();
	const [selectedTypeId, setSelectedTypeId] = useState<string>();
	const [existing, setExisting] = useState<ApprovalRequestDetail>();
	const [loadError, setLoadError] = useState(false);
	const [saving, setSaving] = useState<"draft" | "submit" | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const [typeList, detail] = await Promise.all([
					approvalRequestService.fetchRequestTypes(),
					id ? approvalRequestService.fetchDetail(id) : Promise.resolve(undefined),
				]);
				if (cancelled)
					return;
				setTypes(typeList);
				if (detail) {
					setExisting(detail);
					setSelectedTypeId(detail.requestType.id);
					form.setFieldsValue({
						title: detail.title,
						payload: payloadToFormValues(detail.requestType.formSchema, detail.payload),
						attachments: detail.attachments as AttachmentEntity[],
					});
				}
				else {
					const preset = searchParams.get("type");
					const match = typeList.find(item => item.id === preset || item.code === preset);
					if (match)
						setSelectedTypeId(match.id);
				}
			}
			catch {
				if (!cancelled)
					setLoadError(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [id, form, searchParams]);

	const selectedType = useMemo(() => {
		if (existing)
			return { ...existing.requestType, hasWorkflow: types?.find(item => item.id === existing.requestType.id)?.hasWorkflow ?? true };
		return types?.find(item => item.id === selectedTypeId);
	}, [existing, types, selectedTypeId]);
	const fields = selectedType?.formSchema ?? [];
	const editable = !existing || [ApprovalRequestStatus.Draft, ApprovalRequestStatus.Returned].includes(existing.status);
	const lastReturn = existing?.status === ApprovalRequestStatus.Returned
		? [...existing.histories].reverse().find(h => h.action === ApprovalHistoryAction.Return)
		: undefined;

	const save = async (submit: boolean) => {
		const values = await form.validateFields();
		const body = {
			title: values.title,
			payload: formValuesToPayload(fields, values.payload),
			attachments: (values.attachments ?? []).map(a => a.id),
		};
		setSaving(submit ? "submit" : "draft");
		try {
			let requestId = existing?.id;
			if (requestId) {
				await approvalRequestService.fetchUpdate(requestId, body);
				if (submit)
					await approvalRequestService.fetchSubmit(requestId);
			}
			else {
				requestId = (await approvalRequestService.fetchCreate({ ...body, requestType: selectedType!.id, submit })).id;
			}
			window.$message?.success(t(submit ? "approval.messages.submitted" : "approval.messages.saved"));
			navigate(`/approval/requests/${requestId}`, { replace: true });
		}
		catch {
			// lỗi đã được interceptor hiển thị
		}
		finally {
			setSaving(null);
		}
	};

	if (loadError)
		return <Result status="404" subTitle={t("approval.messages.notFound")} />;
	if (!types)
		return <BasicContent><Skeleton active /></BasicContent>;

	// Bước 1: chọn loại đơn
	if (!selectedType) {
		const groups = types.reduce<Record<string, CreatableRequestType[]>>((acc, item) => {
			const key = item.category?.name ?? "—";
			(acc[key] ??= []).push(item);
			return acc;
		}, {});
		return (
			<BasicContent>
				<Title level={4} className="!mb-4">{t("approval.form.chooseType")}</Title>
				{!types.length && <Empty description={t("approval.messages.noRequestTypes")} />}
				{Object.entries(groups).map(([category, items]) => (
					<div key={category} className="mb-6">
						<Text type="secondary" className="block mb-2 uppercase text-xs tracking-wide">{category}</Text>
						<div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{items.map(item => (
								<Card key={item.id} hoverable size="small" onClick={() => setSelectedTypeId(item.id)}>
									<div className="flex items-start gap-3">
										<div
											className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
											style={{ background: token.colorPrimaryBg, color: token.colorPrimary }}
										>
											<FileTextOutlined />
										</div>
										<div className="min-w-0">
											<Text strong className="block">{item.name}</Text>
											<Text type="secondary" className="text-xs">{item.prefix}</Text>
											{item.description && <Text type="secondary" className="block text-xs mt-1" ellipsis>{item.description}</Text>}
											{!item.hasWorkflow && <Tag color="warning" className="mt-1">{t("approval.workflow.noPublished")}</Tag>}
										</div>
									</div>
								</Card>
							))}
						</div>
					</div>
				))}
			</BasicContent>
		);
	}

	return (
		<BasicContent>
			<div className="max-w-4xl mx-auto flex flex-col gap-4">
				<div className="flex items-center justify-between gap-2 flex-wrap">
					<Space>
						<Button type="text" icon={<ArrowLeftOutlined />} onClick={() => (existing || searchParams.get("type") ? navigate(-1) : setSelectedTypeId(undefined))} />
						<Title level={4} className="!m-0">{selectedType.name}</Title>
						{existing?.code && <Tag>{existing.code}</Tag>}
					</Space>
					{!existing && <Button type="link" onClick={() => setSelectedTypeId(undefined)}>{t("approval.form.changeType")}</Button>}
				</div>

				{lastReturn && (
					<Alert
						type="warning"
						showIcon
						message={t("approval.form.returnedNotice")}
						description={lastReturn.comment && `${t("approval.form.lastComment")}: ${lastReturn.comment}`}
					/>
				)}
				{!selectedType.hasWorkflow && <Alert type="info" showIcon message={t("approval.messages.noWorkflow")} />}

				<Form<FormValues> form={form} layout="vertical" disabled={!editable} initialValues={{ attachments: [], payload: {} }}>
					<SectionCard icon={<FormOutlined />} title={t("approval.form.formData")} className="mb-4">
						<Form.Item name="title" label={t("approval.fields.title")} rules={[{ required: true, whitespace: true, message: t("form.required") }]}>
							<Input maxLength={255} placeholder={t("approval.form.titlePlaceholder")} />
						</Form.Item>
						{fields.length
							? (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 [&>.ant-form-item:has(textarea)]:md:col-span-2">
									<PayloadFormItems fields={fields} />
								</div>
							)
							: <Text type="secondary">{t("approval.form.noFields")}</Text>}
					</SectionCard>
					<SectionCard icon={<PaperClipOutlined />} title={t("approval.fields.attachments")}>
						<Form.Item name="attachments" noStyle>
							<AttachmentUpload storagePath={STORAGE_PATH.ATTACHMENTS} maxCount={20} />
						</Form.Item>
					</SectionCard>
				</Form>

				{editable && (
					<div className="flex justify-end gap-2 sticky bottom-0 py-3" style={{ background: token.colorBgLayout }}>
						<Button icon={<SaveOutlined />} loading={saving === "draft"} disabled={!!saving} onClick={() => save(false)}>
							{t("approval.actions.saveDraft")}
						</Button>
						<Button
							type="primary"
							icon={<SendOutlined />}
							loading={saving === "submit"}
							disabled={!!saving || !selectedType.hasWorkflow}
							onClick={() => save(true)}
						>
							{t(existing?.status === ApprovalRequestStatus.Returned ? "approval.actions.resubmit" : "approval.actions.submit")}
						</Button>
					</div>
				)}
			</div>
		</BasicContent>
	);
}
