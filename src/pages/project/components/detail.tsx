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

export interface DetailRef {
	show: (id?: string) => Promise<{ isChange: boolean } | undefined>
}

interface DetailProps {
	ref: React.Ref<DetailRef>
}

let resolveGuard: (res?: { isChange: boolean }) => void;

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<ProjectEntity>();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [folderId, setFolderId] = useState<string>(() => crypto.randomUUID());
	const editingIdRef = useRef<string>("");
	const attachmentRef = useRef<AttachmentUploadRef>(null);

	const storagePath = useMemo(() => buildProjectStoragePath(folderId), [folderId]);

	useImperativeHandle(ref, () => ({
		show: async (id?: string) => {
			form.resetFields();
			editingIdRef.current = id ?? "";
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
				resolveGuard = resolve;
			});
		},
	}));

	const onFinish = async (values: any) => {
		let attachments: AttachmentEntity[];
		try {
			attachments = await attachmentRef.current?.sync() ?? (values.attachments as AttachmentEntity[] | undefined) ?? [];
		}
		catch {
			return false;
		}

		const attachmentIds = attachments.map((a: AttachmentEntity) => a.id);

		if (editingIdRef.current) {
			await projectService.fetchUpdateProject(editingIdRef.current, { ...values, attachments: attachmentIds });
			window.$message?.success(t("common.updateSuccess"));
		}
		else {
			const created = await projectService.fetchCreateProject({ ...values, folderId, attachments: attachmentIds });
			editingIdRef.current = created.id;
			window.$message?.success(t("common.addSuccess"));
		}
		resolveGuard?.({ isChange: true });
		return true;
	};

	const onCancel = () => {
		setOpen(false);
		form.resetFields();
		resolveGuard?.();
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
				width: 1200,
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
				isEditing={!!editingIdRef.current}
				onCancel={onCancel}
				onSave={() => form.submit()}
			/>

			<Spin spinning={loading}>
				<div
					className="overflow-y-auto px-8 py-8 h-[calc(80vh-64px)] scroll-smooth"
					style={{ background: "var(--ant-color-bg-layout)" }}
				>
					<Row gutter={32} className="max-w-full mx-auto">
						<Col span={16}>
							<DetailMain
								attachmentRef={attachmentRef}
								storagePath={storagePath}
								isEditing={!!editingIdRef.current}
							/>
						</Col>
						<Col span={8}>
							<DetailSidebar />
						</Col>
					</Row>
				</div>
			</Spin>
		</ModalForm>
	);
}
