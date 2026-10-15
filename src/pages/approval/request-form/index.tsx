import type { ApprovalRequestDetail, PreviewFlowResult } from "#src/api/approval-request";
import type { AttachmentEntity } from "#src/api/attachment";
import type { AttachmentConfig } from "#src/api/setting/request-type/types";
import type { AttachmentUploadRef } from "#src/components/attachment-upload";
import { ApprovalHistoryAction, ApprovalPriority, approvalRequestService, ApprovalRequestStatus } from "#src/api/approval-request";
import { DEFAULT_ATTACHMENT_CONFIG } from "#src/api/setting/request-type/types";
import { BasicContent } from "#src/components/basic-content";
import { UserAvatar } from "#src/components/user-avatar";
import { approvalRequestPath } from "#src/router/extra-info";
import { useUserStore } from "#src/store/user";
import { SaveOutlined, SendOutlined } from "@ant-design/icons";
import { useDebounceFn, useRequest } from "ahooks";
import { Alert, Button, Descriptions, Form, Input, Radio, Result, Select, Tag, theme, Typography } from "antd";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { PayloadFormItems } from "../components/form-fields";
import { RequestFormSkeleton } from "../components/page-skeleton";
import { checkFileBlock } from "../lib/files";
import { formValuesToPayload, PAYLOAD_FORM_LAYOUT, PAYLOAD_GRID_CLASS, payloadToFormValues } from "../lib/payload";
import { PRIORITIES, PRIORITY_META } from "../lib/status";
import { FileBlock } from "./components/file-block";
import { FlowPreview } from "./components/flow-preview";
import { NumberedCard } from "./components/numbered-card";

const { Text, Title } = Typography;

interface FormValues {
	category?: string
	requestType?: string
	priority: ApprovalPriority
	department?: string
	title: string
	payload: Record<string, any>
	documents: AttachmentEntity[]
	attachments: AttachmentEntity[]
}

/** Tạo tờ trình (/approval/requests/new) hoặc sửa tờ trình nháp / bị trả lại (/approval/requests/:id/edit) */
export default function ApprovalRequestForm({ id: idProp, initialDetail, onExit }: {
	/** Truyền khi nhúng trong trang chi tiết (chế độ sửa); mặc định lấy từ route */
	id?: string
	/** Dữ liệu phiếu trang chi tiết đã tải sẵn, dùng ngay để khỏi fetch lại */
	initialDetail?: ApprovalRequestDetail
	/** Có khi nhúng: Hủy / gửi duyệt xong thì thoát chế độ sửa thay vì điều hướng */
	onExit?: () => void
} = {}) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	// Tiêu đề dính khi cuộn: mốc ngay trên tiêu đề ra khỏi vùng nhìn thấy → hiện viền dưới để tách khỏi nội dung
	const [headerSentinel, setHeaderSentinel] = useState<HTMLDivElement | null>(null);
	const [headerStuck, setHeaderStuck] = useState(false);
	useEffect(() => {
		if (!headerSentinel)
			return;
		const observer = new IntersectionObserver(([entry]) => setHeaderStuck(!entry.isIntersecting));
		observer.observe(headerSentinel);
		return () => observer.disconnect();
	}, [headerSentinel]);
	const navigate = useNavigate();
	const params = useParams<{ id: string }>();
	const id = idProp ?? params.id;
	const [searchParams] = useSearchParams();
	const [form] = Form.useForm<FormValues>();
	const currentUser = useUserStore();

	// Loại tờ trình / đơn vị trình ít đổi: cache để mở lại form là có ngay, dữ liệu mới về thì cập nhật ngầm
	const { data: types, error: typesError } = useRequest(() => approvalRequestService.fetchRequestTypes(), { cacheKey: "approval-request-types", staleTime: 60_000 });
	const { data: unitList, error: unitsError } = useRequest(() => approvalRequestService.fetchSubmitUnits(), { cacheKey: "approval-submit-units", staleTime: 60_000 });
	const units = useMemo(() => unitList ?? [], [unitList]);
	// Nhúng trong trang chi tiết đã có sẵn dữ liệu thì không fetch lại
	const { data: fetchedDetail, error: detailError } = useRequest(() => approvalRequestService.fetchDetail(id!), { ready: !!id && !initialDetail, refreshDeps: [id] });
	// Bản vừa lưu của chính form (trạng thái, mã…) ưu tiên hơn dữ liệu tải ban đầu
	const [saved, setSaved] = useState<ApprovalRequestDetail>();
	const existing = saved ?? initialDetail ?? fetchedDetail;
	// Phiếu mới chưa có id: sinh sẵn để tệp upload vào đúng thư mục Attachments/{id}/... và dùng lại khi tạo phiếu
	const [draftId] = useState(() => crypto.randomUUID());
	const requestFileId = existing?.id ?? draftId;
	const loadError = !!(typesError || unitsError || detailError);
	const initializedFor = useRef<string>(undefined);
	const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
	const [preview, setPreview] = useState<PreviewFlowResult | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const documentsRef = useRef<AttachmentUploadRef>(null);
	const attachmentsRef = useRef<AttachmentUploadRef>(null);

	const categoryId = Form.useWatch("category", form);
	const requestTypeId = Form.useWatch("requestType", form);
	const priority = Form.useWatch("priority", form);
	const department = Form.useWatch("department", form);
	const payloadValues = Form.useWatch("payload", form);
	const documents = Form.useWatch("documents", form) ?? [];
	const attachments = Form.useWatch("attachments", form) ?? [];

	// Đổ dữ liệu vào form đúng một lần cho mỗi phiếu — dữ liệu cache làm mới ngầm sau đó không được ghi đè phần đang nhập
	useLayoutEffect(() => {
		const detail = initialDetail ?? fetchedDetail;
		if (!types || !unitList || (id && !detail))
			return;
		const key = id ?? "new";
		if (initializedFor.current === key)
			return;
		initializedFor.current = key;
		if (detail) {
			const type = types.find(item => item.id === detail.requestType.id);
			form.setFieldsValue({
				category: type?.category?.id,
				requestType: detail.requestType.id,
				priority: detail.priority,
				department: detail.department.id,
				title: detail.title,
				payload: payloadToFormValues(detail.requestType.formSchema, detail.payload),
				documents: detail.documents as AttachmentEntity[],
				attachments: detail.attachments as AttachmentEntity[],
			});
		}
		else {
			const preset = searchParams.get("type");
			const type = types.find(item => item.id === preset || item.code === preset);
			form.setFieldsValue({
				category: type?.category?.id ?? types[0]?.category?.id,
				requestType: type?.id,
				department: unitList.find(u => u.isOwn)?.id,
			});
		}
	}, [id, form, searchParams, types, unitList, initialDetail, fetchedDetail]);

	/** Nhóm tờ trình = danh mục của loại tờ trình */
	const categories = useMemo(() => {
		const map = new Map<string, string>();
		for (const item of types ?? []) {
			if (item.category)
				map.set(item.category.id, item.category.name);
		}
		return [...map].map(([value, label]) => ({ value, label }));
	}, [types]);
	const typesInCategory = useMemo(() => (types ?? []).filter(item => !categoryId || item.category?.id === categoryId), [types, categoryId]);

	const selectedType = useMemo(() => {
		if (existing)
			return { ...existing.requestType, hasWorkflow: types?.find(item => item.id === existing.requestType.id)?.hasWorkflow ?? true };
		return types?.find(item => item.id === requestTypeId);
	}, [existing, types, requestTypeId]);
	const fields = selectedType?.formSchema ?? [];
	const fileConfig: AttachmentConfig = selectedType?.attachmentConfig ?? DEFAULT_ATTACHMENT_CONFIG;
	const editable = !existing || [ApprovalRequestStatus.Draft, ApprovalRequestStatus.Returned].includes(existing.status);
	const lastReturn = existing?.status === ApprovalRequestStatus.Returned
		? [...existing.histories].reverse().find(h => h.action === ApprovalHistoryAction.Return)
		: undefined;

	// Xem trước luồng: chạy lại khi đổi loại / đơn vị trình / dữ liệu form (trễ 500ms)
	const { run: refreshPreview } = useDebounceFn(async () => {
		if (!selectedType?.hasWorkflow) {
			setPreview(null);
			return;
		}
		setPreviewLoading(true);
		try {
			setPreview(await approvalRequestService.fetchPreview({
				requestType: selectedType.id,
				department,
				payload: formValuesToPayload(fields, form.getFieldValue("payload") ?? {}),
			}));
		}
		catch {
			setPreview(null);
		}
		finally {
			setPreviewLoading(false);
		}
	}, { wait: 500 });
	useEffect(() => {
		refreshPreview();
	}, [selectedType?.id, department, payloadValues, refreshPreview]);

	const save = async (submit: boolean) => {
		const values = await form.validateFields();
		setSaving(submit ? "submit" : "draft");
		try {
			// Tệp chỉ được tải lên lúc này (chế độ manual) — bấm Hủy / đóng trang thì không có tệp nào lên storage
			const files = {
				documents: fileConfig.documents.enabled ? (await documentsRef.current?.sync()) ?? values.documents ?? [] : [],
				attachments: fileConfig.attachments.enabled ? (await attachmentsRef.current?.sync()) ?? values.attachments ?? [] : [],
			};
			if (submit) {
				for (const block of ["documents", "attachments"] as const) {
					const error = checkFileBlock(fileConfig[block], files[block]);
					if (error) {
						window.$message?.error(`${t(`approval.files.${block}`)}: ${t(`approval.files.errors.${error.code}`, error)}`);
						return;
					}
				}
			}
			const body = {
				title: values.title,
				payload: formValuesToPayload(fields, values.payload),
				priority: values.priority,
				department: values.department,
				documents: files.documents.map(a => a.id),
				attachments: files.attachments.map(a => a.id),
			};
			let requestId = existing?.id;
			if (requestId) {
				await approvalRequestService.fetchUpdate(requestId, body);
				if (submit)
					await approvalRequestService.fetchSubmit(requestId);
			}
			else {
				requestId = (await approvalRequestService.fetchCreate({ ...body, id: draftId, requestType: selectedType!.id, submit })).id;
			}
			window.$message?.success(t(submit ? "approval.messages.submitted" : "approval.messages.saved"));
			if (submit) {
				if (onExit)
					onExit();
				else
					navigate(approvalRequestPath.detail(requestId), { replace: true });
			}
			else if (existing) {
				// Lưu nháp: ở lại form để sửa tiếp nhiều lần, chỉ làm mới thông tin phiếu (trạng thái, mã…)
				setSaved(await approvalRequestService.fetchDetail(requestId));
			}
			else {
				// Phiếu vừa được tạo: chuyển sang màn sửa của chính nó để các lần lưu sau là cập nhật
				navigate(approvalRequestPath.edit(requestId), { replace: true });
			}
		}
		catch {
			// lỗi upload / API đã được báo (AttachmentUpload hoặc interceptor)
		}
		finally {
			setSaving(null);
		}
	};

	if (loadError)
		return <Result status="404" subTitle={t("approval.messages.notFound")} />;
	// Chờ đủ dữ liệu và đã đổ vào form (existing có sau effect) để không nháy form trống
	if (!types || !unitList || (id && !existing))
		return <RequestFormSkeleton />;

	const unitName = units.find(u => u.id === department)?.name ?? existing?.department.name;
	const card = { background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadiusLG };

	return (
		<BasicContent>
			<Form<FormValues>
				form={form}
				layout={PAYLOAD_FORM_LAYOUT}
				disabled={!editable}
				initialValues={{ priority: ApprovalPriority.Normal, payload: {}, documents: [], attachments: [] }}
				className="mx-auto flex max-w-[1280px] flex-col gap-5"
			>
				{/* Mốc để biết tiêu đề đã dính lên trên chưa (hết nhìn thấy mốc = đang dính) */}
				<div ref={setHeaderSentinel} className="-mb-5 h-0" />
				{/* Tiêu đề trang + hành động — dính trên cùng khi cuộn; nền trùng nền trang để che nội dung cuộn qua */}
				<div
					className="sticky top-0 z-10 -mx-4 -mt-4 flex flex-wrap items-center justify-between gap-4 px-4 pb-3 pt-4"
					style={{
						background: token.colorBgLayout,
						borderBottom: `1px solid ${headerStuck ? token.colorSplit : "transparent"}`,
					}}
				>
					<div className="flex flex-col gap-1">
						<Title level={3} className="!m-0">{t(existing ? "approval.form.editTitle" : "approval.form.createTitle")}</Title>
						<div className="flex flex-wrap items-center gap-2 text-[13px]" style={{ color: token.colorTextSecondary }}>
							<Tag bordered={false} className="m-0">{t(`approval.status.${existing?.status ?? ApprovalRequestStatus.Draft}`)}</Tag>
							<span>{existing?.code ?? t("approval.form.codeHint")}</span>
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button disabled={false} onClick={() => (onExit ? onExit() : navigate(-1))}>{t("common.cancel")}</Button>
						{editable && (
							<>
								<Button icon={<SaveOutlined />} loading={saving === "draft"} disabled={!!saving || !selectedType} onClick={() => save(false)}>
									{t("approval.actions.saveDraft")}
								</Button>
								<Button
									type="primary"
									icon={<SendOutlined />}
									loading={saving === "submit"}
									disabled={!!saving || !selectedType?.hasWorkflow}
									onClick={() => save(true)}
								>
									{t(existing?.status === ApprovalRequestStatus.Returned ? "approval.actions.resubmit" : "approval.form.submit")}
								</Button>
							</>
						)}
					</div>
				</div>

				{lastReturn && (
					<Alert
						type="warning"
						showIcon
						message={t("approval.form.returnedNotice")}
						description={lastReturn.comment && `${t("approval.form.lastComment")}: ${lastReturn.comment}`}
					/>
				)}
				{!types.length && <Alert type="info" showIcon message={t("approval.messages.noRequestTypes")} />}

				<div className="flex flex-wrap items-start gap-5">
					{/* Cột trái: form */}
					<div className="flex min-w-0 flex-col gap-5" style={{ flex: "999 1 560px" }}>
						<NumberedCard index={1} title={t("approval.form.general")}>
							<div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
								<Form.Item name="category" label={t("approval.form.category")} rules={[{ required: true, message: t("form.required") }]}>
									<Select
										options={categories}
										placeholder={t("common.pleaseSelect")}
										disabled={!!existing || !editable}
										onChange={() => form.setFieldValue("requestType", undefined)}
									/>
								</Form.Item>
								<Form.Item
									name="requestType"
									label={t("approval.fields.requestType")}
									rules={[{ required: true, message: t("form.required") }]}
									extra={t("approval.form.typeHint")}
								>
									<Select
										placeholder={t("common.pleaseSelect")}
										disabled={!!existing || !editable}
										options={typesInCategory.map(item => ({
											value: item.id,
											label: item.hasWorkflow ? item.name : `${item.name} (${t("approval.workflow.noPublished")})`,
										}))}
										onChange={() => form.setFieldValue("payload", {})}
									/>
								</Form.Item>

								<Form.Item
									name="priority"
									label={t("approval.form.priority")}
									className="md:col-span-2"
									extra={t("approval.form.priorityHint")}
								>
									<Radio.Group className="!grid w-full grid-cols-2 gap-2 md:grid-cols-4">
										{PRIORITIES.map((value) => {
											const selected = priority === value;
											return (
												<Radio
													key={value}
													value={value}
													className="!m-0 flex h-11 items-center rounded-lg px-3"
													style={{
														border: selected ? `2px solid ${token.colorPrimary}` : `1px solid ${token.colorBorder}`,
														background: selected ? token.colorPrimaryBg : undefined,
														fontWeight: selected ? 600 : undefined,
													}}
												>
													<span className="inline-flex items-center gap-2">
														<span className="h-2 w-2 rounded-full" style={{ background: PRIORITY_META[value].dot }} />
														{t(`approval.priority.${value}`)}
													</span>
												</Radio>
											);
										})}
									</Radio.Group>
								</Form.Item>

								<Form.Item
									name="department"
									label={t("approval.form.submitUnit")}
									rules={[{ required: true, message: t("form.required") }]}
									extra={t("approval.form.submitUnitHint")}
								>
									<Select
										options={units.map(u => ({
											value: u.id,
											label: u.isOwn ? `${u.name} (${t("approval.form.ownUnit")})` : u.name,
										}))}
									/>
								</Form.Item>
								<Form.Item label={t("approval.form.submitter")}>
									<div
										className="flex h-8 items-center gap-2 rounded-md px-3"
										style={{ border: `1px solid ${token.colorBorderSecondary}`, background: token.colorFillQuaternary }}
									>
										<UserAvatar size={20} user={existing?.requester ?? currentUser} />
										<span>{existing?.requester.fullName ?? currentUser.fullName}</span>
									</div>
								</Form.Item>

								<Form.Item
									name="title"
									label={t("approval.fields.title")}
									className="md:col-span-2"
									rules={[{ required: true, whitespace: true, message: t("form.required") }]}
								>
									<Input maxLength={255} placeholder={t("approval.form.titlePlaceholder")} />
								</Form.Item>
							</div>
						</NumberedCard>

						<NumberedCard
							index={2}
							title={t("approval.form.content")}
							extra={selectedType && t("approval.form.contentHint", { name: selectedType.name })}
						>
							{!selectedType && <Text type="secondary">{t("approval.flow.chooseType")}</Text>}
							{selectedType && !fields.length && <Text type="secondary">{t("approval.form.noFields")}</Text>}
							{fields.length > 0 && (
								<div className={`${PAYLOAD_GRID_CLASS} [&>.ant-form-item:has(textarea)]:md:col-span-2`}>
									<PayloadFormItems fields={fields} />
								</div>
							)}
						</NumberedCard>

						{fileConfig.documents.enabled && <FileBlock index={3} name="documents" requestId={requestFileId} config={fileConfig.documents} disabled={!editable} uploadRef={documentsRef} />}
						{fileConfig.attachments.enabled && (
							<FileBlock
								index={fileConfig.documents.enabled ? 4 : 3}
								name="attachments"
								requestId={requestFileId}
								config={fileConfig.attachments}
								disabled={!editable}
								uploadRef={attachmentsRef}
							/>
						)}
					</div>

					{/* Cột phải: xem trước luồng + tóm tắt */}
					<aside className="flex min-w-0 flex-col gap-5" style={{ flex: "1 1 320px", maxWidth: 380 }}>
						<section style={card}>
							<div className="px-5 py-4" style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
								<h2 className="m-0 text-base font-semibold">{t("approval.flow.title")}</h2>
							</div>
							<div className="p-5">
								<FlowPreview preview={preview} loading={previewLoading} empty={!selectedType} />
							</div>
						</section>

						<section style={card} className="px-5 py-4">
							<h2 className="m-0 mb-3 text-base font-semibold">{t("approval.form.summary")}</h2>
							<Descriptions
								size="small"
								column={1}
								colon={false}
								labelStyle={{ color: token.colorTextSecondary }}
								contentStyle={{ justifyContent: "flex-end", textAlign: "right" }}
								items={[
									{ key: "c", label: t("approval.form.category"), children: categories.find(c => c.value === categoryId)?.label ?? "—" },
									{ key: "t", label: t("approval.fields.requestType"), children: selectedType?.name ?? "—" },
									{
										key: "p",
										label: t("approval.form.priority"),
										children: priority !== undefined
											? <span style={{ color: PRIORITY_META[priority as ApprovalPriority].dot, fontWeight: 600 }}>{t(`approval.priority.${priority}`)}</span>
											: "—",
									},
									{ key: "u", label: t("approval.form.submitUnit"), children: unitName ?? "—" },
									...(fileConfig.documents.enabled ? [{ key: "d", label: t("approval.files.documents"), children: t("approval.files.count", { count: documents.length }) }] : []),
									...(fileConfig.attachments.enabled ? [{ key: "a", label: t("approval.files.attachments"), children: t("approval.files.count", { count: attachments.length }) }] : []),
								]}
							/>
						</section>
					</aside>
				</div>
			</Form>
		</BasicContent>
	);
}
