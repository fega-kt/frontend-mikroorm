import type { FormInstance } from "antd";
import { FormFieldType } from "#src/api/setting/request-type/types";
import { PayloadFormItems } from "#src/pages/approval/components/form-fields";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Form } from "antd";

// Hồi quy: ô nhập phải nhận value/onChange từ Form.Item, nếu không Form không có giá trị và cảnh báo bắt buộc không tắt
describe("payload form items", () => {
	it("passes typed values to the form and clears the required error", async () => {
		let form: FormInstance | undefined;
		function Harness() {
			const [instance] = Form.useForm();
			form = instance;
			return (
				<Form form={instance}>
					<PayloadFormItems fields={[{ key: "reason", label: "Lý do", type: FormFieldType.Textarea, required: true }]} />
				</Form>
			);
		}
		render(<Harness />);

		await form!.validateFields().catch(() => {});
		await waitFor(() => expect(screen.getByText("form.required")).toBeInTheDocument());

		fireEvent.change(screen.getByRole("textbox"), { target: { value: "Về quê" } });
		await waitFor(() => expect(form!.getFieldValue(["payload", "reason"])).toBe("Về quê"));
		await waitFor(() => expect(screen.queryByText("form.required")).not.toBeInTheDocument());
	});
});
