import type { WorkflowSettingEntity } from "#src/api/setting/workflow-setting";
import type { FormInstance } from "antd";
import type BpmnModelerType from "bpmn-js/lib/Modeler";
import { FullscreenExitOutlined, FullscreenOutlined, MinusOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { theme as antdTheme, Button, Space, Tooltip } from "antd";
import { useEffect, useRef } from "react";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";

const EMPTY_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  targetNamespace="http://bpmn.io/schema/bpmn"
  id="Definitions_1">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Bắt đầu" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="160" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="163" y="203" width="70" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

interface WorkflowTabProps {
	form: FormInstance<WorkflowSettingEntity>
}

export function WorkflowTab({ form }: WorkflowTabProps) {
	const { token } = antdTheme.useToken();
	const isDark = token.colorBgBase === "#000" || token.colorBgBase === "#000000";
	const containerRef = useRef<HTMLDivElement>(null);
	const modelerRef = useRef<BpmnModelerType | null>(null);

	useEffect(() => {
		if (!containerRef.current)
			return;

		let modeler: BpmnModelerType;

		async function init() {
			const BpmnModeler = (await import("bpmn-js/lib/Modeler")).default as typeof BpmnModelerType;
			modeler = new BpmnModeler({ container: containerRef.current! });
			modelerRef.current = modeler;

			const xml = form.getFieldValue("bpmnXml") as string | undefined;
			await modeler.importXML(xml || EMPTY_BPMN);
			(modeler as any).get("canvas")?.zoom("fit-viewport", "auto");

			(modeler as any).on("commandStack.changed", async () => {
				try {
					const { xml: savedXml } = await modeler.saveXML({ format: true });
					form.setFieldValue("bpmnXml", savedXml);
				}
				catch {
					console.error("error saving BPMN XML");
				}
			});
		}

		init();

		return () => {
			modeler?.destroy();
			modelerRef.current = null;
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fitView = () => {
		(modelerRef.current as any)?.get("canvas")?.zoom("fit-viewport", "auto");
	};

	const zoomIn = () => {
		const canvas = (modelerRef.current as any)?.get("canvas");
		if (canvas)
			canvas.zoom(canvas.zoom() * 1.2);
	};

	const zoomOut = () => {
		const canvas = (modelerRef.current as any)?.get("canvas");
		if (canvas)
			canvas.zoom(canvas.zoom() / 1.2);
	};

	const resetZoom = () => {
		(modelerRef.current as any)?.get("canvas")?.zoom(1, "auto");
	};

	return (
		<div
			className="flex flex-col h-full"
			style={{
				border: `1px solid ${token.colorBorderSecondary}`,
				borderRadius: token.borderRadius,
				overflow: "hidden",
			}}
		>
			<div
				className="flex items-center justify-between px-3 py-2 flex-none"
				style={{
					borderBottom: `1px solid ${token.colorBorderSecondary}`,
					backgroundColor: token.colorBgLayout,
				}}
			>
				<Space size="small">
					<Tooltip title="Phóng to">
						<Button size="small" icon={<PlusOutlined />} onClick={zoomIn} />
					</Tooltip>
					<Tooltip title="Thu nhỏ">
						<Button size="small" icon={<MinusOutlined />} onClick={zoomOut} />
					</Tooltip>
					<Tooltip title="Mặc định (100%)">
						<Button size="small" icon={<ReloadOutlined />} onClick={resetZoom} />
					</Tooltip>
					<Tooltip title="Fit toàn màn hình">
						<Button size="small" icon={<FullscreenOutlined />} onClick={fitView} />
					</Tooltip>
				</Space>
				<Tooltip title="Đặt lại">
					<Button size="small" icon={<FullscreenExitOutlined />} onClick={fitView} />
				</Tooltip>
			</div>
			<div className="relative flex-1 overflow-hidden">
				<div
					ref={containerRef}
					className="absolute inset-0"
					style={{
						backgroundColor: "#fff",
						color: "#000",
						colorScheme: "light",
						filter: isDark ? "invert(1)" : "none",
					}}
				/>
			</div>
		</div>
	);
}
