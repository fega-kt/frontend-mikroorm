import type { RequestTypeCode } from "../mock";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";
import { categoryColor, REQUEST_TYPE_COLOR } from "../constants";

/** Tag nhóm tờ trình (dữ liệu thật, màu khớp icon); tờ trình chưa có nhóm thì quay về loại đoán theo tên như trước */
export function CategoryTag({ category, type }: { category?: { id: string, name: string } | null, type: RequestTypeCode }) {
	const { t } = useTranslation();
	return (
		<Tag bordered={false} color={category ? categoryColor(category.id) : REQUEST_TYPE_COLOR[type]} className="m-0 shrink-0">
			{category?.name ?? t(`home.requestType.${type}`)}
		</Tag>
	);
}
