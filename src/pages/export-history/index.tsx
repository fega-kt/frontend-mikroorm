import type { ExportJob } from "#src/api/export";
import type { TableColumnsType } from "antd";
import { ExportEmailStatus, ExportJobStatus, exportService } from "#src/api/export";
import { BasicContent } from "#src/components/basic-content";
import { formatBytes } from "#src/utils/format-bytes";
import { formatNumber } from "#src/utils/format-number";
import { DownloadOutlined, ReloadOutlined, StopOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Alert, Button, Card, Empty, Popconfirm, Progress, Space, Table, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DATE_TIME_FORMAT } from "../approval/lib/payload";

const PAGE_SIZE = 20;
/** Số ngày backend giữ file (EXPORT_RETENTION_DAYS) — chỉ để nhắc người dùng */
const RETENTION_DAYS = 7;
/** Có lượt đang chờ / chạy thì hỏi lại backend theo chu kỳ này để thấy tiến độ */
const POLL_MS = 5000;

const STATUS_COLOR: Record<ExportJobStatus, string> = {
	[ExportJobStatus.Queued]: "default",
	[ExportJobStatus.Processing]: "processing",
	[ExportJobStatus.Done]: "success",
	[ExportJobStatus.Failed]: "error",
	[ExportJobStatus.Cancelled]: "default",
	[ExportJobStatus.Expired]: "default",
};

const isActive = (job: ExportJob) => job.status === ExportJobStatus.Queued || job.status === ExportJobStatus.Processing;

/** Lịch sử xuất Excel chạy nền của tôi: theo dõi tiến độ, tải file đã xong, hủy lượt đang chạy */
export default function ExportHistory() {
	const { t, i18n } = useTranslation();
	const [page, setPage] = useState(1);
	// Chỉ hỏi lại theo chu kỳ khi còn lượt đang chờ / chạy (đặt từ kết quả lần tải gần nhất; không gọi gì trong lúc render)
	const [polling, setPolling] = useState(true);
	const { data, loading, refresh } = useRequest(
		() => exportService.fetchJobs({ page, limit: PAGE_SIZE }),
		{
			refreshDeps: [page],
			pollingInterval: polling ? POLL_MS : 0,
			pollingWhenHidden: false,
			onSuccess: result => setPolling(result.data.some(isActive)),
		},
	);
	const jobs = data?.data ?? [];

	const download = async (job: ExportJob) => {
		try {
			const { url } = await exportService.fetchJobDownload(job.id);
			window.location.assign(url);
		}
		catch {
			// lỗi đã được interceptor hiển thị; làm mới để thấy trạng thái đúng (vd: vừa hết hạn)
			refresh();
		}
	};

	const stop = async (job: ExportJob) => {
		try {
			await exportService.fetchCancelJob(job.id);
			window.$message?.success(t("export.history.cancelled"));
		}
		catch {
			// lỗi đã được interceptor hiển thị
		}
		refresh();
	};

	const columns: TableColumnsType<ExportJob> = [
		{
			title: t("export.history.file"),
			dataIndex: "filename",
			ellipsis: true,
			render: (_, job) => (
				<div className="flex flex-col min-w-0">
					<Typography.Text ellipsis strong>{job.filename}</Typography.Text>
					<Typography.Text type="secondary" className="text-xs">
						{t(`export.history.resource.${job.resource}`, { defaultValue: job.resource })}
						{job.parts > 1 ? ` · ${t("export.history.parts", { count: job.parts })}` : ""}
					</Typography.Text>
				</div>
			),
		},
		{
			title: t("export.history.statusColumn"),
			dataIndex: "status",
			width: 230,
			render: (_, job) => (
				<div className="flex flex-col gap-1">
					<Space size={6}>
						<Tag color={STATUS_COLOR[job.status]} className="m-0">{t(`export.history.status.${job.status}`)}</Tag>
						{job.sendEmail && (
							<Tooltip title={t(`export.history.email.${job.emailStatus === ExportEmailStatus.None ? "pending" : job.emailStatus}`)}>
								<Tag bordered={false} color={job.emailStatus === ExportEmailStatus.Failed ? "error" : undefined} className="m-0">@</Tag>
							</Tooltip>
						)}
					</Space>
					{job.status === ExportJobStatus.Processing && (
						<Progress size="small" percent={job.total ? Math.min(99, Math.floor((job.processed / job.total) * 100)) : 0} />
					)}
					{job.status === ExportJobStatus.Failed && job.error && (
						<Typography.Text type="danger" className="text-xs">
							{t(`export.history.error.${job.error}`, { defaultValue: t("export.history.error.FAILED") })}
						</Typography.Text>
					)}
				</div>
			),
		},
		{
			title: t("export.history.rows"),
			dataIndex: "total",
			width: 170,
			align: "right",
			render: (_, job) => (job.status === ExportJobStatus.Processing
				? t("export.history.progress", { processed: formatNumber(job.processed, i18n.language), total: formatNumber(job.total, i18n.language) })
				: formatNumber(job.total, i18n.language)),
		},
		{
			title: t("export.history.size"),
			dataIndex: "size",
			width: 110,
			align: "right",
			render: (_, job) => (job.size ? formatBytes(job.size) : "—"),
		},
		{
			title: t("export.history.createdAt"),
			dataIndex: "createdAt",
			width: 150,
			render: (_, job) => dayjs(job.createdAt).format(DATE_TIME_FORMAT),
		},
		{
			title: t("export.history.expiresAt"),
			dataIndex: "expiresAt",
			width: 150,
			render: (_, job) => (job.expiresAt && job.status === ExportJobStatus.Done ? dayjs(job.expiresAt).format(DATE_TIME_FORMAT) : "—"),
		},
		{
			title: t("export.history.actions"),
			key: "actions",
			width: 130,
			fixed: "right",
			render: (_, job) => (
				<Space size={4}>
					{job.downloadable && (
						<Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => download(job)}>
							{t("export.history.download")}
						</Button>
					)}
					{isActive(job) && (
						<Popconfirm
							title={t("export.history.confirmCancel")}
							okText={t("common.confirm")}
							cancelText={t("common.cancel")}
							onConfirm={() => stop(job)}
						>
							<Button type="link" size="small" danger icon={<StopOutlined />}>{t("export.history.cancel")}</Button>
						</Popconfirm>
					)}
				</Space>
			),
		},
	];

	return (
		<BasicContent>
			<Card
				title={t("export.history.title")}
				extra={<Button icon={<ReloadOutlined />} loading={loading} onClick={refresh}>{t("export.history.refresh")}</Button>}
			>
				<Alert type="info" showIcon className="mb-4" message={t("export.history.hint", { days: RETENTION_DAYS })} />
				<Table<ExportJob>
					rowKey="id"
					size="middle"
					loading={loading && !data}
					columns={columns}
					dataSource={jobs}
					scroll={{ x: 900 }}
					locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("export.history.empty")} /> }}
					pagination={{ current: page, pageSize: PAGE_SIZE, total: data?.total ?? 0, showSizeChanger: false, hideOnSinglePage: true, onChange: setPage }}
				/>
			</Card>
		</BasicContent>
	);
}
