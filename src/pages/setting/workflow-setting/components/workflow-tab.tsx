import type { WorkflowSettingEntity } from "#src/api/setting/workflow-setting";
import type { FormInstance } from "antd";
import { theme } from "antd";
import BpmnModeler from "bpmn-js/lib/Modeler";
import minimapModule from "diagram-js-minimap";
import * as React from "react";
import { useEffect, useRef } from "react";
import { DEFAULT_BPMN } from "./default-bpmn";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "diagram-js-minimap/assets/diagram-js-minimap.css";
import "./workflow-tab.css";

export function WorkflowTab({ form }: { form: FormInstance<WorkflowSettingEntity> }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const modelerRef = useRef<any>(null);
	const viewboxCacheRef = useRef<any>(null);

	const { token } = theme.useToken();
	const isDark = token.colorBgBase === "#000" || token.colorBgBase === "#000000";

	useEffect(() => {
		if (!containerRef.current)
			return;

		if (modelerRef.current) {
			try {
				viewboxCacheRef.current = modelerRef.current.get("canvas").viewbox();
			}
			catch {}
			modelerRef.current.destroy();
			modelerRef.current = null;
		}

		const colorOptions = isDark
			? { defaultFillColor: "#212121", defaultStrokeColor: "#fff" }
			: { defaultFillColor: "#fff", defaultStrokeColor: "#212121" };

		const modeler = new (BpmnModeler as any)({
			container: containerRef.current,
			bpmnRenderer: colorOptions,
			additionalModules: [minimapModule],
		});
		modelerRef.current = modeler;

		const xml: string = form.getFieldValue("bpmnXml") ?? DEFAULT_BPMN;
		modeler.importXML(xml)
			.then(() => {
				if (viewboxCacheRef.current) {
					modeler.get("canvas").viewbox(viewboxCacheRef.current);
				}
			})
			.catch(() => modeler.importXML(DEFAULT_BPMN));

		const eventBus = modeler.get("eventBus");
		const handler = async () => {
			try {
				const { xml: updatedXml } = await modeler.saveXML({ format: true });
				form.setFieldValue("bpmnXml", updatedXml);
			}
			catch {
				// ignore transient save errors
			}
		};
		eventBus.on("commandStack.changed", handler);

		return () => {
			eventBus.off("commandStack.changed", handler);
			modeler.destroy();
			modelerRef.current = null;
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isDark]);

	return (
		<div
			className={`h-full w-full${isDark ? " bpmn-dark" : ""}`}
			style={{ background: isDark ? "#141414" : "#fafafa", position: "relative", overflow: "hidden" }}
		>
			<div ref={containerRef} className="h-full w-full" />
		</div>
	);
}
