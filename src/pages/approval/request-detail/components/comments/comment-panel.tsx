import type { ApprovalComment, UserBrief } from "#src/api/approval-request";
import { approvalRequestService } from "#src/api/approval-request";
import { Alert, Button, Divider, Empty, Skeleton } from "antd";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CommentInput } from "./comment-input";
import { CommentNode } from "./comment-node";

const PAGE_SIZE = 20;
/** Giới hạn một lượt tải của backend */
const MAX_LIMIT = 100;

interface CommentPanelProps {
	requestId: string
	/** Được viết bình luận (người chỉ được chia sẻ chỉ xem) */
	canComment: boolean
	/** Người có thể @mention */
	candidates: UserBrief[]
	/** Số bình luận đổi (thêm / xóa) — để màn chi tiết làm mới bộ đếm trên tab */
	onChanged: () => void
}

/**
 * Tab bình luận của tờ trình: luồng bình luận gốc (mới nhất lên đầu) + phản hồi (cũ trước, mới sau), ô nhập có @mention,
 * sửa / xóa bình luận của mình. Cuộn tới cuối thì tự tải thêm (có nút "Xem thêm" dự phòng).
 */
export function CommentPanel({ requestId, canComment, candidates, onChanged }: CommentPanelProps) {
	const { t } = useTranslation();
	const [threads, setThreads] = useState<ApprovalComment[]>([]);
	const [total, setTotal] = useState(0);
	const [loaded, setLoaded] = useState(false);
	const [loading, setLoading] = useState(false);
	// Bình luận gốc đang mở ô trả lời
	const [replyingTo, setReplyingTo] = useState<string | null>(null);
	const busy = useRef(false);
	const sentinel = useRef<HTMLDivElement>(null);
	const hasMore = threads.length < total;

	/** Kết quả trả về muộn của tờ trình khác (đã đổi trang) thì bỏ qua; đổi tờ trình thì màn chi tiết mount lại panel theo `key` */
	const current = useRef(requestId);
	current.current = requestId;

	/** Tải lại từ đầu `limit` bình luận gốc (sau khi thêm / sửa / xóa) */
	const reload = useCallback(async (limit: number) => {
		const result = await approvalRequestService.fetchComments(requestId, { page: 1, limit: Math.min(Math.max(limit, PAGE_SIZE), MAX_LIMIT) });
		if (current.current !== requestId)
			return;
		setThreads(result.data);
		setTotal(result.total);
		setLoaded(true);
	}, [requestId]);

	/** Tải trang kế tiếp (sau khi thêm bình luận số đã có có thể lệch PAGE_SIZE 1 đơn vị: trang kế gối lên và đã lọc trùng theo id) */
	const loadMore = useCallback(async () => {
		if (busy.current)
			return;
		busy.current = true;
		setLoading(true);
		try {
			const page = Math.floor(threads.length / PAGE_SIZE) + 1;
			const result = await approvalRequestService.fetchComments(requestId, { page, limit: PAGE_SIZE });
			if (current.current !== requestId)
				return;
			setThreads(prev => (page === 1 ? result.data : [...prev, ...result.data.filter(item => !prev.some(old => old.id === item.id))]));
			setTotal(result.total);
			setLoaded(true);
		}
		catch {
			// lỗi đã được interceptor hiển thị
		}
		finally {
			busy.current = false;
			setLoading(false);
		}
	}, [requestId, threads.length]);

	// Lần đầu (chưa có gì) tải trang 1
	useEffect(() => {
		if (!loaded && !busy.current)
			void loadMore();
	}, [loaded, loadMore]);

	// Cuộn tới gần cuối danh sách thì tự tải trang kế
	useEffect(() => {
		const node = sentinel.current;
		if (!node || !loaded || !hasMore)
			return;
		const observer = new IntersectionObserver((entries) => {
			if (entries.some(entry => entry.isIntersecting))
				void loadMore();
		}, { rootMargin: "200px" });
		observer.observe(node);
		return () => observer.disconnect();
	}, [loaded, hasMore, loadMore]);

	/**
	 * Chạy một thao tác ghi rồi tải lại phần đã hiện. Lỗi đã được interceptor hiển thị nên chỉ báo thất bại
	 * để giữ lại nội dung đang nhập. Bình luận gốc mới nằm đầu danh sách nên tải lại đúng số đã hiện là thấy ngay.
	 */
	const write = async (action: () => Promise<unknown>, countChanged: boolean) => {
		try {
			await action();
		}
		catch {
			return false;
		}
		await reload(threads.length + 1).catch(() => undefined);
		if (countChanged)
			onChanged();
		return true;
	};

	const add = async (content: string, mentionIds: string[], parentId?: string) => {
		const ok = await write(() => approvalRequestService.fetchAddComment(requestId, { content, mentionIds, parentId }), true);
		if (ok && parentId)
			setReplyingTo(null);
		return ok;
	};

	return (
		<div className="flex flex-col gap-4">
			{canComment
				? <CommentInput candidates={candidates} placeholder={t("approval.comment.placeholder")} submitText={t("approval.comment.send")} onSubmit={(content, ids) => add(content, ids)} />
				: <Alert type="info" showIcon message={t("approval.comment.readOnly")} />}

			{!loaded && loading && <Skeleton active avatar paragraph={{ rows: 2 }} />}
			{loaded && !threads.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("approval.comment.empty")} />}

			{threads.map((thread, index) => (
				<Fragment key={thread.id}>
					{index > 0 && <Divider className="my-0" />}
					<CommentNode
						comment={thread}
						depth={1}
						canComment={canComment}
						candidates={candidates}
						replyingTo={replyingTo}
						onReplyingTo={setReplyingTo}
						onAdd={add}
						onUpdate={(id, content) => write(() => approvalRequestService.fetchUpdateComment(requestId, id, content), false)}
						onRemove={async id => void await write(() => approvalRequestService.fetchRemoveComment(requestId, id), true)}
					/>
				</Fragment>
			))}

			{/* Mốc để tự tải thêm khi cuộn tới; nút để bấm tay (hoặc khi không cuộn được) */}
			{loaded && hasMore && (
				<div ref={sentinel} className="flex justify-center py-2">
					<Button type="link" loading={loading} onClick={() => void loadMore()}>
						{t("approval.comment.loadMore", { count: total - threads.length })}
					</Button>
				</div>
			)}
		</div>
	);
}
