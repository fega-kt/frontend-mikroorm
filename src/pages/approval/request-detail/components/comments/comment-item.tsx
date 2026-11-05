import type { ApprovalCommentBase } from "#src/api/approval-request";
import { DeleteOutlined, EditOutlined, MessageOutlined } from "@ant-design/icons";
import { Avatar, Button, Input, Popconfirm, Space, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DATE_TIME_FORMAT } from "../../../lib/payload";
import { COMMENT_MAX_LENGTH, splitMentions } from "./mentions";

const { Text } = Typography;

interface CommentItemProps {
	comment: ApprovalCommentBase
	/** Bấm "Trả lời" (chỉ có khi được phép bình luận và bình luận chưa xóa) */
	onReply?: () => void
	onUpdate: (content: string) => Promise<boolean>
	onRemove: () => Promise<void>
}

/** Một bình luận: tác giả, giờ viết, nhãn "đã chỉnh sửa", nội dung có tô @mention; tác giả sửa / xóa được */
export function CommentItem({ comment, onReply, onUpdate, onRemove }: CommentItemProps) {
	const { t } = useTranslation();
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState("");
	const [saving, setSaving] = useState(false);

	const startEdit = () => {
		setDraft(comment.content ?? "");
		setEditing(true);
	};

	const save = async () => {
		const text = draft.trim();
		if (!text)
			return;
		setSaving(true);
		try {
			if (await onUpdate(text))
				setEditing(false);
		}
		finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex gap-3">
			<Avatar size={32} src={comment.author?.avatar}>{comment.author?.fullName.charAt(0)}</Avatar>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-x-2">
					<Text strong>{comment.author?.fullName ?? t("approval.comment.system")}</Text>
					<Text type="secondary" className="text-xs">{dayjs(comment.createdAt).format(DATE_TIME_FORMAT)}</Text>
					{/* editedAt có giá trị = đã từng sửa; giờ sửa gần nhất ở tooltip */}
					{comment.editedAt && !comment.deleted && (
						<Tooltip title={dayjs(comment.editedAt).format(DATE_TIME_FORMAT)}>
							<Text type="secondary" className="text-xs italic">{t("approval.comment.edited")}</Text>
						</Tooltip>
					)}
				</div>

				{comment.deleted && <Text type="secondary" italic>{t("approval.comment.deleted")}</Text>}

				{!comment.deleted && editing && (
					<div className="mt-1 flex flex-col gap-2">
						<Input.TextArea
							value={draft}
							onChange={event => setDraft(event.target.value)}
							autoFocus
							autoSize={{ minRows: 2, maxRows: 8 }}
							maxLength={COMMENT_MAX_LENGTH}
							disabled={saving}
						/>
						<div className="flex justify-end gap-2">
							<Button size="small" disabled={saving} onClick={() => setEditing(false)}>{t("common.cancel")}</Button>
							<Button type="primary" size="small" loading={saving} disabled={!draft.trim()} onClick={save}>{t("common.save")}</Button>
						</div>
					</div>
				)}

				{!comment.deleted && !editing && (
					<>
						<div className="whitespace-pre-wrap break-words">
							{(() => {
								// Khóa theo vị trí đoạn trong nội dung (không dùng chỉ số mảng)
								let offset = 0;
								return splitMentions(comment.content ?? "", comment.mentions).map((segment) => {
									const key = offset;
									offset += segment.text.length;
									return segment.mention
										? <Text key={key} strong className="text-[var(--ant-color-primary)]">{segment.text}</Text>
										: <span key={key}>{segment.text}</span>;
								});
							})()}
						</div>
						<Space size={4} className="mt-0.5">
							{onReply && <Button type="link" size="small" className="px-0" icon={<MessageOutlined />} onClick={onReply}>{t("approval.comment.reply")}</Button>}
							{comment.canEdit && <Button type="link" size="small" icon={<EditOutlined />} onClick={startEdit}>{t("common.edit")}</Button>}
							{comment.canEdit && (
								<Popconfirm
									title={t("approval.comment.confirmDelete")}
									okText={t("common.confirm")}
									cancelText={t("common.cancel")}
									onConfirm={onRemove}
								>
									<Button type="link" size="small" danger icon={<DeleteOutlined />}>{t("common.delete")}</Button>
								</Popconfirm>
							)}
						</Space>
					</>
				)}
			</div>
		</div>
	);
}
