/**
 * `bpmn-js` ships no TypeScript declarations — minimal ambient shim covering only the
 * Modeler APIs actually used by `src/pages/setting/workflow-setting/components/bpmn-tab.tsx`.
 */
declare module "bpmn-js/lib/Modeler" {
	export interface BpmnElement {
		id: string
		type: string
		businessObject: Record<string, unknown>
	}

	export interface ElementRegistry {
		getAll: () => BpmnElement[]
		get: (id: string) => BpmnElement | undefined
	}

	export interface EventBus {
		on: (event: string, callback: (event: { newSelection?: BpmnElement[] }) => void) => void
		off: (event: string, callback: (event: { newSelection?: BpmnElement[] }) => void) => void
	}

	export interface Modeling {
		updateProperties: (element: BpmnElement, properties: Record<string, unknown>) => void
	}

	export interface BpmnFactory {
		create: (type: string, properties?: Record<string, unknown>) => unknown
	}

	export interface BpmnModelerOptions {
		container?: Element | string
		additionalModules?: unknown[]
		moddleExtensions?: Record<string, unknown>
	}

	export default class BpmnModeler {
		constructor(options?: BpmnModelerOptions);
		importXML: (xml: string) => Promise<{ warnings: string[] }>;
		saveXML: (options?: { format?: boolean }) => Promise<{ xml: string }>;
		get(name: "elementRegistry"): ElementRegistry;
		get(name: "eventBus"): EventBus;
		get(name: "modeling"): Modeling;
		get(name: "bpmnFactory"): BpmnFactory;
		get(name: string): unknown;
		destroy: () => void;
	}
}

/** `diagram-js-minimap` also ships no TypeScript declarations — it's a plain diagram-js module array entry. */
declare module "diagram-js-minimap" {
	const MinimapModule: unknown;
	export default MinimapModule;
}
