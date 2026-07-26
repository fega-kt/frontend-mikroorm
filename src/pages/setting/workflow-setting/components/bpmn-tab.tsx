import type { WfApprovalData, WorkflowSettingEntity } from "#src/api/setting/workflow-setting";
import type { FormInstance } from "antd";
import type { BpmnElement } from "bpmn-js/lib/Modeler";
import type { SequenceFlowMode } from "./wf-panel/sequence-flow-panel";
import { ApprovalType, SelfApproval, workflowSettingService } from "#src/api/setting/workflow-setting";
import { Spin } from "antd";
import MinimapModule from "diagram-js-minimap";
import * as React from "react";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { WfPanel } from "./wf-panel";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "diagram-js-minimap/assets/diagram-js-minimap.css";

const DEFAULT_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="160" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const DEFAULT_APPROVAL_DATA: WfApprovalData = {
	title: "Bước phê duyệt",
	approvers: [],
	approvalType: ApprovalType.All,
	selfApproval: SelfApproval.Skip,
};

// Flowable derives the process definition key straight from <bpmn:process id="...">, so the
// exported diagram's id must be rewritten to match our chosen processDefinitionKey before upload
// (mirrors v5's frontend-rfa prepareBpmnXml regex approach) — otherwise the key we save to our own
// DB would silently diverge from the key Flowable actually deployed under.
function applyProcessDefinitionKey(xml: string, processDefinitionKey: string): string {
	const tagMatch = xml.match(/<bpmn:process\b[^>]*>/);
	if (!tagMatch)
		return xml;

	const openTag = tagMatch[0];
	const idMatch = openTag.match(/\sid="([^"]*)"/);
	const oldId = idMatch?.[1];

	let newTag = oldId ? openTag.replace(/\sid="[^"]*"/, ` id="${processDefinitionKey}"`) : openTag.replace(/>$/, ` id="${processDefinitionKey}">`);
	newTag = newTag.includes("isExecutable=")
		? newTag.replace(/isExecutable="[^"]*"/, "isExecutable=\"true\"")
		: newTag.replace(/>$/, " isExecutable=\"true\">");

	let result = xml.replace(openTag, newTag);
	if (oldId) {
		const escapedOldId = oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		result = result.replace(new RegExp(`(<bpmndi:BPMNPlane\\b[^>]*\\sbpmnElement=")${escapedOldId}(")`), `$1${processDefinitionKey}$2`);
	}
	return result;
}

function getSequenceFlowMode(element: BpmnElement | null): SequenceFlowMode {
	if (!element || element.type !== "bpmn:SequenceFlow")
		return "always";
	const conditionExpression = element.businessObject.conditionExpression as { body?: string } | undefined;
	const body = conditionExpression?.body;
	// eslint-disable-next-line no-template-curly-in-string -- literal Flowable FEL expression, not JS interpolation
	if (body === "${decision == 'APPROVE'}")
		return "approve";
	// eslint-disable-next-line no-template-curly-in-string -- literal Flowable FEL expression, not JS interpolation
	if (body === "${decision != 'APPROVE'}")
		return "not-approve";
	return "always";
}

export interface BpmnTabRef {
	/**
	 * Prunes stale approvalConfig entries and writes them onto the form — bpmnXml is never
	 *  written to the form/DB (see exportXml).
	 */
	flushConfigToForm: () => void
	// Exports the live diagram's current XML, rewritten so its <bpmn:process id> matches
	// processDefinitionKey — used only for the Deploy action, never persisted here.
	exportXml: (processDefinitionKey: string) => Promise<string>
}

interface BpmnTabProps {
	form: FormInstance<WorkflowSettingEntity>
	/** Undefined for a not-yet-saved template — the diagram starts from DEFAULT_BPMN_XML in that case. */
	workflowSettingId?: string
	ref: React.Ref<BpmnTabRef>
}

export function BpmnTab({ form, workflowSettingId, ref }: BpmnTabProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const modelerRef = useRef<InstanceType<typeof import("bpmn-js/lib/Modeler").default> | null>(null);
	const approvalConfigRef = useRef<Record<string, WfApprovalData>>({});
	const [loading, setLoading] = useState(true);
	const [selectedElement, setSelectedElement] = useState<BpmnElement | null>(null);
	const [, forceRerender] = useState(0);

	useEffect(() => {
		let destroyed = false;

		(async () => {
			const { default: Modeler } = await import("bpmn-js/lib/Modeler");
			if (destroyed || !containerRef.current)
				return;

			const modeler = new Modeler({ container: containerRef.current, additionalModules: [MinimapModule] });
			modelerRef.current = modeler;

			approvalConfigRef.current = form.getFieldValue("approvalConfig") ?? {};

			let xml = DEFAULT_BPMN_XML;
			if (workflowSettingId) {
				try {
					const fetched = await workflowSettingService.fetchWorkflowSettingBpmnXml(workflowSettingId);
					if (fetched.xml)
						xml = fetched.xml;
				}
				catch {
					window.$message?.error("Không tải được sơ đồ BPMN đã deploy — bắt đầu từ sơ đồ trống");
				}
			}
			if (destroyed)
				return;
			await modeler.importXML(xml);
			(modeler.get("canvas") as { zoom: (mode: string) => void }).zoom("fit-viewport");

			modeler.get("eventBus").on("selection.changed", (e) => {
				setSelectedElement(e.newSelection?.[0] ?? null);
			});

			setLoading(false);
		})();

		return () => {
			destroyed = true;
			modelerRef.current?.destroy();
			modelerRef.current = null;
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useImperativeHandle(ref, () => ({
		flushConfigToForm: () => {
			const modeler = modelerRef.current;
			if (!modeler)
				return;

			const liveIds = new Set(modeler.get("elementRegistry").getAll().map(el => el.id));
			const approvalConfig = Object.fromEntries(
				Object.entries(approvalConfigRef.current).filter(([id]) => liveIds.has(id)),
			);
			form.setFieldsValue({ approvalConfig });
		},
		exportXml: async (processDefinitionKey: string) => {
			const modeler = modelerRef.current;
			if (!modeler)
				throw new Error("Modeler chưa sẵn sàng");
			const { xml } = await modeler.saveXML({ format: true });
			return applyProcessDefinitionKey(xml, processDefinitionKey);
		},
	}));

	const handleApprovalChange = (data: WfApprovalData) => {
		if (!selectedElement)
			return;
		approvalConfigRef.current = { ...approvalConfigRef.current, [selectedElement.id]: data };
		forceRerender(n => n + 1);
	};

	const handleSequenceFlowChange = (mode: SequenceFlowMode) => {
		const modeler = modelerRef.current;
		if (!selectedElement || !modeler)
			return;
		const modeling = modeler.get("modeling");
		if (mode === "always") {
			modeling.updateProperties(selectedElement, { conditionExpression: undefined });
		}
		else {
			// eslint-disable-next-line no-template-curly-in-string -- literal Flowable FEL expression, not JS interpolation
			const body = mode === "approve" ? "${decision == 'APPROVE'}" : "${decision != 'APPROVE'}";
			const conditionExpression = modeler.get("bpmnFactory").create("bpmn:FormalExpression", { body });
			modeling.updateProperties(selectedElement, { conditionExpression });
		}
		forceRerender(n => n + 1);
	};

	return (
		// bpmn-js has no dark-mode support of its own (strokes/text are styled for a light canvas) —
		// the canvas area is deliberately pinned to a light color-scheme regardless of the app theme,
		// rather than fighting its SVG styling to invert it.
		<div className="flex h-full" style={{ backgroundColor: "#fff", colorScheme: "light" }}>
			<div className="flex-1 relative min-w-0">
				{loading && (
					<div className="absolute inset-0 z-10 flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
						<Spin size="large" />
					</div>
				)}
				<div ref={containerRef} className="h-full w-full" />
			</div>

			<WfPanel
				element={selectedElement}
				onClose={() => setSelectedElement(null)}
				approvalData={selectedElement ? approvalConfigRef.current[selectedElement.id] ?? DEFAULT_APPROVAL_DATA : DEFAULT_APPROVAL_DATA}
				onApprovalChange={handleApprovalChange}
				sequenceFlowMode={getSequenceFlowMode(selectedElement)}
				onSequenceFlowChange={handleSequenceFlowChange}
			/>
		</div>
	);
}
