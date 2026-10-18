import type { ApprovalRequestDetail, RoundFileItem } from "#src/api/approval-request";
import type { RequestFile } from "./request-file-list";
import { ApprovalRequestStatus } from "#src/api/approval-request";
import { SectionCard } from "#src/components/section-card";
import { PaperClipOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Button, Segmented, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { fileListSummary } from "../../lib/files";
import { DATE_TIME_FORMAT } from "../../lib/payload";
import { RequestFileList } from "./request-file-list";

const { Text } = Typography;

/** "draft" = bộ tệp người trình đang soạn (chưa gửi); số = vòng duyệt */
type RoundKey = "draft" | number;

interface RoundFilesProps {
	detail: ApprovalRequestDetail
	downloadingId?: string | null
	onView: (file: RequestFile) => void
	onDownload: (file: RequestFile) => void
	onSignatures: (file: RequestFile) => void
}

/**
 * Tab Tệp: mỗi vòng duyệt giữ đúng bộ tệp đã đưa đi duyệt (chụp lúc gửi), kèm bản PDF ký của vòng.
 * Đang soạn / bị trả lại thì có thêm "Đang soạn" là bộ tệp sẽ gửi ở vòng sau.
 * Tờ trình gửi trước khi lưu theo vòng (không có dữ liệu vòng) hiện danh sách hiện tại như cũ.
 */
export function RoundFiles({ detail, downloadingId, onView, onDownload, onSignatures }: RoundFilesProps) {
	const { t } = useTranslation();
	const rounds = detail.rounds ?? [];
	const editing = [ApprovalRequestStatus.Draft, ApprovalRequestStatus.Returned].includes(detail.status);
	const showDraft = editing || !rounds.length;
	const [picked, setPicked] = useState<RoundKey>();
	const selected: RoundKey = picked ?? (showDraft ? "draft" : rounds[0].round);

	const round = selected === "draft" ? undefined : rounds.find(item => item.round === selected);
	const items = (block: "documents" | "attachments"): RoundFileItem[] => round
		? round[block]
		: detail[block].map(source => ({ original: source, current: null, signatureCount: 0 }));
	// Bản PDF ký của vòng (bản chuyển đổi / đã ký): văn bản gốc vẫn giữ nguyên ở danh sách phía trên
	const signed = round?.documents.filter(item => item.current) ?? [];

	const fileList = (files: RequestFile[], block: "documents" | "attachments") => (
		<RequestFileList
			files={files}
			downloadingId={downloadingId}
			onView={onView}
			onDownload={onDownload}
			onSignatures={block === "documents" ? onSignatures : undefined}
		/>
	);

	return (
		<div className="flex flex-col gap-4">
			{rounds.length > 0 && (
				<Segmented<RoundKey>
					className="self-start"
					value={selected}
					onChange={setPicked}
					options={[
						...(showDraft ? [{ value: "draft" as const, label: t("approval.files.draft") }] : []),
						...rounds.map(item => ({
							value: item.round,
							label: item.round === detail.round && !editing
								? t("approval.files.currentRound", { round: item.round })
								: t("approval.files.round", { round: item.round }),
						})),
					]}
				/>
			)}

			{(["documents", "attachments"] as const).map((block) => {
				const sources = items(block).map(item => item.original);
				return (
					<SectionCard
						key={block}
						icon={<PaperClipOutlined />}
						title={t(`approval.files.${block}`)}
						extra={sources.length > 0 && <Text type="secondary" className="text-[13px]">{fileListSummary(sources, t)}</Text>}
						bodyClassName={sources.length ? "px-2 py-2" : undefined}
					>
						{sources.length ? fileList(sources, block) : <Text type="secondary">{t("common.noData")}</Text>}
					</SectionCard>
				);
			})}

			{signed.length > 0 && (
				<SectionCard
					icon={<SafetyCertificateOutlined />}
					title={t("approval.files.signedTitle", { round: round?.round })}
					extra={<Text type="secondary" className="text-[13px]">{t("approval.files.signedHint")}</Text>}
					bodyClassName="px-2 py-2"
				>
					<div className="flex flex-col">
						{signed.map(item => (
							<div key={item.original.id} className="flex flex-col">
								<div className="px-3 pt-1">
									<Tag bordered={false} color={item.signatureCount ? "success" : "default"} className="m-0">
										{item.signatureCount
											? t("approval.files.signatureCount", { count: item.signatureCount })
											: t("approval.files.convertedOnly")}
									</Tag>
								</div>
								{fileList([item.current!], "documents")}
								{/* Lịch sử ký: mỗi task một bản riêng ({taskId}-tên.pdf), lần cuối chính là bản chung ở trên */}
								{!!item.signatures?.length && (
									<ol className="m-0 ml-[60px] mb-2 flex list-none flex-col gap-1 p-0">
										{item.signatures.map((signature, index) => (
											<li key={signature.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
												<Text type="secondary">{`${index + 1}.`}</Text>
												<Text>{signature.signer.fullName}</Text>
												<Text type="secondary">
													{[signature.nodeName, dayjs(signature.signedAt).format(DATE_TIME_FORMAT)].filter(Boolean).join(" · ")}
												</Text>
												{signature.status === "rolled_back" && <Tag className="m-0" bordered={false}>{t("approval.files.rolledBack")}</Tag>}
												<Button type="link" size="small" className="h-auto p-0" onClick={() => onView(signature.file)}>
													{t("approval.files.viewVersion")}
												</Button>
											</li>
										))}
									</ol>
								)}
							</div>
						))}
					</div>
				</SectionCard>
			)}
		</div>
	);
}
