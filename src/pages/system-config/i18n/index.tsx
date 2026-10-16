import { BasicContent } from "#src/components/basic-content";
import { AppTranslations } from "./components/app-translations";

/**
 * Quản lý bản dịch trong database, chọn nguồn ngay trên danh sách:
 * - Giao diện: đè chuỗi của file JSON (bản trong database được ưu tiên, JSON chỉ là mặc định)
 * - Biểu mẫu: dịch nhãn / gợi ý / lựa chọn do admin nhập trong formSchema
 */
export default function I18nManagement() {
	return (
		<BasicContent className="h-full">
			<AppTranslations />
		</BasicContent>
	);
}
