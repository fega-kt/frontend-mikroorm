export const DEFAULT_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:flowable="http://flowable.org/bpmn"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI"
             targetNamespace="http://approval.company.com">
  <process id="approvalProcess" name="Approval Process" isExecutable="true">
    <startEvent id="start" name="Start"/>
    <userTask id="task1" name="Approval Step">
      <extensionElements>
        <flowable:taskListener event="create" delegateExpression="\${assignApproverListener}"/>
      </extensionElements>
    </userTask>
    <exclusiveGateway id="gw1" name="Decision"/>
    <endEvent id="endApproved" name="Approved"/>
    <endEvent id="endRejected" name="Rejected"/>
    <sequenceFlow id="flow1" sourceRef="start" targetRef="task1"/>
    <sequenceFlow id="flow2" sourceRef="task1" targetRef="gw1"/>
    <sequenceFlow id="flow3" sourceRef="gw1" targetRef="endApproved">
      <conditionExpression xsi:type="tFormalExpression">\${decision == 'APPROVE'}</conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="flow4" sourceRef="gw1" targetRef="endRejected">
      <conditionExpression xsi:type="tFormalExpression">\${decision == 'REJECT'}</conditionExpression>
    </sequenceFlow>
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="approvalProcess">
      <bpmndi:BPMNShape id="start_di" bpmnElement="start">
        <omgdc:Bounds x="152" y="82" width="36" height="36"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="task1_di" bpmnElement="task1">
        <omgdc:Bounds x="240" y="60" width="100" height="80"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="gw1_di" bpmnElement="gw1" isMarkerVisible="true">
        <omgdc:Bounds x="395" y="75" width="50" height="50"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="endApproved_di" bpmnElement="endApproved">
        <omgdc:Bounds x="502" y="32" width="36" height="36"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="endRejected_di" bpmnElement="endRejected">
        <omgdc:Bounds x="502" y="132" width="36" height="36"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="flow1_di" bpmnElement="flow1">
        <omgdi:waypoint x="188" y="100"/>
        <omgdi:waypoint x="240" y="100"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="flow2_di" bpmnElement="flow2">
        <omgdi:waypoint x="340" y="100"/>
        <omgdi:waypoint x="395" y="100"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="flow3_di" bpmnElement="flow3">
        <omgdi:waypoint x="420" y="75"/>
        <omgdi:waypoint x="420" y="50"/>
        <omgdi:waypoint x="502" y="50"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="flow4_di" bpmnElement="flow4">
        <omgdi:waypoint x="420" y="125"/>
        <omgdi:waypoint x="420" y="150"/>
        <omgdi:waypoint x="502" y="150"/>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;
