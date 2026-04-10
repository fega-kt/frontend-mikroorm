import type { AttachmentEntity } from "#src/api/attachment/types";
import type { ProjectEntity } from "#src/api/project/types";
import type { AttachmentUploadRef } from "#src/components/attachment-upload/types";
import { projectService } from "#src/api/project";
import { buildProjectStoragePath } from "#src/constants/storage-path";
import { ModalForm } from "@ant-design/pro-components";
import { Col, Form, Row, Spin } from "antd";
import * as React from "react";
import { useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DetailMain } from "./detail-main";
import { DetailNavbar } from "./detail-navbar";
import { DetailSidebar } from "./detail-sidebar";
import { DetailTabs } from "./detail-tabs";

export interface DetailRef {
	show: (id?: string) => Promise<{ isChange: boolean } | undefined>
}

interface DetailProps {
	ref: React.Ref<DetailRef>
}

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<ProjectEntity>();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [editingId, setEditingId] = useState<string>("");
	const [folderId, setFolderId] = useState<string>(() => crypto.randomUUID());
	const attachmentRef = useRef<AttachmentUploadRef>(null);
	const hasChangedRef = useRef(false);
	const resolveRef = useRef<((res?: { isChange: boolean }) => void) | undefined>(undefined);

	const storagePath = useMemo(() => buildProjectStoragePath(folderId), [folderId]);

	useImperativeHandle(ref, () => ({
		show: async (id?: string) => {
			form.resetFields();
			hasChangedRef.current = false;
			setEditingId(id ?? "");
			if (!id)
				setFolderId(crypto.randomUUID());
			setOpen(true);

			if (id) {
				setLoading(true);
				try {
					const data = await projectService.fetchProjectDetail(id);
					form.setFieldsValue(data);
					setFolderId(data.folderId);
				}
				catch (error) {
					console.error("[ProjectDetail] Failed to fetch project info:", error);
				}
				finally {
					setLoading(false);
				}
			}

			return new Promise<{ isChange: boolean } | undefined>((resolve) => {
				resolveRef.current = resolve;
			});
		},
	}));

	const onFinish = async (values: any) => {
		setSaving(true);
		try {
			let attachments: AttachmentEntity[];
			try {
				attachments = await attachmentRef.current?.sync() ?? (values.attachments as AttachmentEntity[] | undefined) ?? [];
			}
			catch {
				return false;
			}

			const attachmentIds = attachments.map((a: AttachmentEntity) => a.id);

			if (editingId) {
				await projectService.fetchUpdateProject(editingId, { ...values, attachments: attachmentIds });
				window.$message?.success(t("common.updateSuccess"));
			}
			else {
				const created = await projectService.fetchCreateProject({ ...values, folderId, attachments: attachmentIds });
				setEditingId(created.id);
				window.$message?.success(t("common.addSuccess"));
			}

			hasChangedRef.current = true;
			return false; // giữ modal mở sau khi save
		}
		finally {
			setSaving(false);
		}
	};

	const onCancel = () => {
		setOpen(false);
		form.resetFields();
		setEditingId("");
		resolveRef.current?.({ isChange: hasChangedRef.current });
		hasChangedRef.current = false;
	};

	return (
		<ModalForm<ProjectEntity>
			title={null}
			open={open}
			onOpenChange={visible => !visible && onCancel()}
			layout="vertical"
			form={form}
			autoFocusFirstInput
			modalProps={{
				destroyOnClose: true,
				maskClosable: false,
				width: 1400,
				styles: {
					header: { display: "none" },
					body: { height: "80vh", overflow: "hidden", padding: 0 },
				},
				closeIcon: null,
			}}
			submitter={{ render: () => null }}
			onFinish={onFinish}
		>
			<DetailNavbar
				isEditing={!!editingId}
				saving={saving}
				onCancel={onCancel}
				onSave={() => form.submit()}
			/>

			<Spin spinning={loading}>
				<div
					className="overflow-y-auto px-8 py-8 h-[calc(80vh-64px)] scroll-smooth"
					style={{ background: "var(--ant-color-bg-layout)" }}
				>
					<Row gutter={32} className="max-w-full mx-auto mb-6">
						<Col span={16}>
							<DetailMain
								attachmentRef={attachmentRef}
								storagePath={storagePath}
							/>
						</Col>
						<Col span={8}>
							<DetailSidebar />
						</Col>
					</Row>

					<DetailTabs
						isEditing={!!editingId}
						projectId={editingId || undefined}
					/>
				</div>
			</Spin>
		</ModalForm>
	);
}
