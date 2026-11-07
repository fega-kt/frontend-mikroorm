/* eslint-disable import/no-mutable-exports */
import type { MessageInstance } from "antd/es/message/interface";
import type { ModalStaticFunctions } from "antd/es/modal/confirm";
import type { NotificationInstance } from "antd/es/notification/interface";

import {
	message as antdMessage,
	Modal as antdModal,
	notification as antdNotification,
	App,
} from "antd";

let message: MessageInstance = antdMessage;
let notification: NotificationInstance = antdNotification;

const { ...resetFns } = antdModal;
let modal: Omit<ModalStaticFunctions, "warn"> = resetFns;

/**
 * message / modal / notification cho code NGOÀI component (interceptor gọi API, hàm tiện ích…).
 * Biến module: lúc đầu là bản tĩnh của antd, được `StaticAntd` thay bằng bản theo theme / ngôn ngữ của ứng dụng ngay khi mount
 * (luôn import `message`, đừng destructure một lần rồi giữ lại). Trong component dùng `App.useApp()`, xem CLAUDE.md.
 *
 * @see https://ant.design/components/app
 * @see https://ant.design/docs/blog/why-not-static
 */
export function StaticAntd() {
	const staticFunctions = App.useApp();

	// Cập nhật các biến module bên dưới: code ngoài component import `message` / `modal` / `notification` từ file này
	message = staticFunctions.message;
	notification = staticFunctions.notification;
	modal = staticFunctions.modal;

	return null;
}

export {
	message,
	modal,
	notification,
};
