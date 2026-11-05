import type { ApprovalComment, UserBrief } from "#src/api/approval-request";
import { useTranslation } from "react-i18next";
import { CommentInput } from "./comment-input";
import { CommentItem } from "./comment-item";

/** Số cấp tối đa (gốc = cấp 1, khớp backend); bình luận ở cấp này không có nút "Trả lời" */
const MAX_COMMENT_DEPTH = 3;

interface CommentNodeProps {
	comment: ApprovalComment
	/** Cấp của bình luận này: gốc = 1 */
	depth: number
	canComment: boolean
	candidates: UserBrief[]
	/** Id bình luận đang mở ô trả lời */
	replyingTo: string | null
	onReplyingTo: (id: string | null) => void
	onAdd: (content: string, mentionIds: string[], parentId: string) => Promise<boolean>
	onUpdate: (id: string, content: string) => Promise<boolean>
	onRemove: (id: string) => Promise<void>
}

/** Một bình luận và cây phản hồi bên dưới nó; ô trả lời mở ngay dưới bình luận được bấm "Trả lời" */
export function CommentNode({ comment, depth, canComment, candidates, replyingTo, onReplyingTo, onAdd, onUpdate, onRemove }: CommentNodeProps) {
	const { t } = useTranslation();
	const replying = replyingTo === comment.id;
	const canReply = canComment && !comment.deleted && depth < MAX_COMMENT_DEPTH;

	return (
		<div className="flex flex-col gap-3">
			<CommentItem
				comment={comment}
				onReply={canReply ? () => onReplyingTo(comment.id) : undefined}
				onUpdate={content => onUpdate(comment.id, content)}
				onRemove={() => onRemove(comment.id)}
			/>
			{(comment.replies.length > 0 || replying) && (
				<div className="ml-11 flex flex-col gap-3 border-0 border-l-2 border-solid border-[var(--ant-color-border-secondary)] pl-3">
					{comment.replies.map(reply => (
						<CommentNode
							key={reply.id}
							comment={reply}
							depth={depth + 1}
							canComment={canComment}
							candidates={candidates}
							replyingTo={replyingTo}
							onReplyingTo={onReplyingTo}
							onAdd={onAdd}
							onUpdate={onUpdate}
							onRemove={onRemove}
						/>
					))}
					{replying && (
						<CommentInput
							autoFocus
							candidates={candidates}
							placeholder={t("approval.comment.replyPlaceholder")}
							submitText={t("approval.comment.reply")}
							onSubmit={(content, ids) => onAdd(content, ids, comment.id)}
							onCancel={() => onReplyingTo(null)}
						/>
					)}
				</div>
			)}
		</div>
	);
}
