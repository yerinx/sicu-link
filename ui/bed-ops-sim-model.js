/* Isolated, authored bed-operation training simulation. No network or LLM calls.
 * Prediction values are scenario-authored, not CalMRL/v19 inference.
 * Clinical approval is recorded independently from forecasts and operational approval.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.SICUBedOpsSim = api; root.SICUBedOpsModel = api; }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const fail = (code, message) => { const error = new Error(message); error.code = code; throw error; };
  const time = hour => String(14 + hour).padStart(2, '0') + ':00';
  const scenarios = [
    {id:'full-capacity',title:'만실 · 새 입실 요청',titleEn:'Full capacity · new admission',summary:'8병상 만실에서 승인된 전실과 정리·예약·입실을 순서대로 조정합니다.',summaryEn:'Coordinate approved transfer, cleaning, reservation and admission while all eight beds are occupied.'},
    {id:'transfer-delay',title:'전실 지연 · 대안 재계획',titleEn:'Transfer delay · replan',summary:'수용 병동 취소 사건을 확인하고, 승인된 다른 경로를 다시 검토합니다.',summaryEn:'A receiving ward cancels; reassess an independently approved alternative.'},
    {id:'readmission',title:'재입실 · 격리 병상 조건',titleEn:'Readmission · isolation constraint',summary:'빈 병상과 필요한 병상이 다를 때 격리·장비·인력 조건을 확인합니다.',summaryEn:'A vacant bed does not meet the returning patient’s isolation requirements.'}
  ];
  const info = id => scenarios.find(s => s.id === id) || fail('UNKNOWN_SCENARIO','알 수 없는 운영 시나리오입니다.');
  const scopeKey = scope => 'OPS-SIM:' + scope.hospital + ':' + scope.ward;
  function validate(state, suppliedScope) {
    if (!state || state.kind !== 'bed-operation-training' || !Number.isInteger(state.hour) || state.hour < 0 || state.hour > 6) fail('INVALID_STATE','운영 시뮬레이션 상태가 올바르지 않습니다.');
    info(state.scenarioId);
    if (state.scope.key !== scopeKey(state.scope) || (suppliedScope && scopeKey(suppliedScope) !== state.scope.key)) fail('SCOPE_MISMATCH','선택한 병원·병동과 시뮬레이션 범위가 다릅니다.');
    const ids = new Set();
    for (const p of state.patients) {
      if (p.scopeKey !== state.scope.key || p.admissionId !== p.id + '-ADM01' || p.caseId !== p.id + '-CASE01' || !p.id.startsWith('OPS-SIM-')) fail('PATIENT_LINK_MISMATCH','환자·입원·훈련 범위 연결이 일치하지 않습니다.');
      if (p.icuStayId && (!p.icuStayId.startsWith(p.id+'-ICU') || !Number.isInteger(p.icuEnteredHour) || p.icuEnteredHour<0 || p.icuEnteredHour>state.hour || (p.icuExitedHour!==null && (!Number.isInteger(p.icuExitedHour) || p.icuExitedHour<p.icuEnteredHour || p.icuExitedHour>state.hour)))) fail('PATIENT_LINK_MISMATCH','ICU 재원 회차 또는 평가 시점 연결이 올바르지 않습니다.');
      if (p.location==='ICU' && (!p.icuStayId || p.icuExitedHour!==null)) fail('PATIENT_LINK_MISMATCH','현재 ICU 재원과 평가 회차가 일치하지 않습니다.');
      if (ids.has(p.id)) fail('DUPLICATE_PATIENT','환자 ID가 중복됩니다.');
      ids.add(p.id);
    }
    if (!Array.isArray(state.beds) || state.beds.length !== 8) fail('INVALID_BEDS','훈련 병상은 정확히 8개여야 합니다.');
    const occupied = new Set(), reserved = new Set(), bedIds = new Set();
    for (const b of state.beds) {
      if (bedIds.has(b.id) || !['occupied','available','cleaning','reserved'].includes(b.status)) fail('INVALID_BEDS','병상 ID가 중복되거나 상태가 올바르지 않습니다.');
      bedIds.add(b.id);
      if (b.scopeKey !== state.scope.key || (b.patientId && !ids.has(b.patientId))) fail('PATIENT_LINK_MISMATCH','병상과 환자 연결이 일치하지 않습니다.');
      if (b.patientId) { if (b.status !== 'occupied' || occupied.has(b.patientId)) fail('INVALID_OCCUPANCY','환자 중복 배치 또는 병상 상태 오류입니다.'); occupied.add(b.patientId); }
      if (b.status === 'occupied' && !b.patientId) fail('INVALID_OCCUPANCY','사용 중 병상에 환자 연결이 없습니다.');
      if (b.reservedFor) { if (b.status !== 'reserved' || b.reservedFor !== state.request.patientId || reserved.has(b.reservedFor)) fail('DUPLICATE_BOOKING','요청 환자의 예약 병상이 중복되거나 상태가 다릅니다.'); reserved.add(b.reservedFor); }
      if (b.status === 'reserved' && !b.reservedFor) fail('INVALID_OCCUPANCY','예약 병상에 요청 환자 연결이 없습니다.');
    }
    if (!ids.has(state.request.patientId) || state.request.admissionId !== state.request.patientId + '-ADM01' || state.request.scopeKey !== state.scope.key) fail('PATIENT_LINK_MISMATCH','입실 요청과 환자 연결이 일치하지 않습니다.');
    return state;
  }
  function patient(state,id) { validate(state); return state.patients.find(p=>p.id===id) || fail('PATIENT_LINK_MISMATCH','이 훈련에 연결되지 않은 환자입니다.'); }
  function history(index, returning) {
    return Array.from({length:7},(_,hour)=>({hour,time:time(hour),mortalityPercent:Number((returning ? 15.2 + hour * .4 : 3.6 + index * 1.8 - hour * .15).toFixed(1)),transfer72hPercent:Math.min(96,Math.max(3,(returning ? 12 : 18 + index * 8) + hour * 2)),sourceKind:'authored_scenario',isSimulated:true,notModelInference:true,mortalityHorizon:'hospital',transferHorizonHours:72}));
  }
  function create(scenarioId, suppliedScope) {
    const chosen=info(scenarioId || 'full-capacity');
    const scope={hospital:String(suppliedScope?.hospital || 'A'),ward:String(suppliedScope?.ward || 'A-SICU'),isFictional:true};
    scope.key=scopeKey(scope);
    const prefix={'full-capacity':'FC','transfer-delay':'TD',readmission:'RA'}[chosen.id];
    const state={kind:'bed-operation-training',version:1,scenarioId:chosen.id,scope,hour:0,revision:0,beds:[],patients:[],request:null,plan:null,trace:[],events:[],actions:[],approvalKeys:[]};
    for(let i=1;i<=8;i++) {
      const id='OPS-SIM-'+prefix+'-P'+String(i).padStart(2,'0');
      const empty=chosen.id==='readmission' && i===8;
      if(!empty) state.patients.push({id,name:'훈련 환자 '+String(i).padStart(2,'0'),nameEn:'Training patient '+String(i).padStart(2,'0'),admissionId:id+'-ADM01',caseId:id+'-CASE01',scopeKey:scope.key,isSimulated:true,location:'ICU',icuStayId:id+'-ICU01',icuEnteredHour:0,icuExitedHour:null,predictionHistory:history(i,false),readiness:{clinicalApproval:(i===3 && chosen.id!=='readmission') || (i===6 && chosen.id==='transfer-delay'),clinicalApprovalDocument:((i===3 && chosen.id!=='readmission') || (i===6 && chosen.id==='transfer-delay'))?'TRAINING-CLINICAL-APPROVAL-'+i:null,receivingWardConfirmed:true,receivingWard:'TRAINING-WARD-'+i,transportReady:true,cleaningTeamReady:true}});
      state.beds.push({id:'OPS-SIM-'+prefix+'-B'+String(i).padStart(2,'0'),number:String(i).padStart(2,'0'),scopeKey:scope.key,status:empty?'available':'occupied',patientId:empty?null:id,reservedFor:null,staffingReady:true,equipmentReady:true,ventilator:true,isolation:i===2});
    }
    const requestId='OPS-SIM-'+prefix+'-REQUEST';
    state.patients.push({id:requestId,name:chosen.id==='readmission'?'훈련 재입실 환자':'훈련 신규 환자',nameEn:chosen.id==='readmission'?'Training returning patient':'Training incoming patient',admissionId:requestId+'-ADM01',caseId:requestId+'-CASE01',scopeKey:scope.key,isSimulated:true,location:chosen.id==='readmission'?'WARD':'ED',icuStayId:null,icuEnteredHour:null,icuExitedHour:null,previousIcuStayId:chosen.id==='readmission'?requestId+'-PREV-ICU':null,previousIcuAdmissionId:chosen.id==='readmission'?requestId+'-PREV-ICU':null,predictionHistory:history(0,true),readiness:null});
    state.request={id:'OPS-SIM-'+prefix+'-REQ01',patientId:requestId,admissionId:requestId+'-ADM01',scopeKey:scope.key,type:chosen.id==='readmission'?'readmission':'new-admission',status:'waiting',needs:{ventilator:true,isolation:chosen.id==='readmission'},createdHour:0};
    state.events.push({id:'event-0',time:time(0),hour:0,title:chosen.title,titleEn:chosen.titleEn,detail:'독립된 가상 8병상 훈련을 시작했습니다.',detailEn:'An isolated fictional eight-bed exercise has started.'});
    return validate(state);
  }
  function getSnapshot(state, suppliedScope) {
    validate(state,suppliedScope);
    return {scope:clone(state.scope),hour:state.hour,time:time(state.hour),revision:state.revision,beds:clone(state.beds),request:clone(state.request),occupied:state.beds.filter(b=>b.status==='occupied').length,available:state.beds.filter(b=>b.status==='available').length,reserved:state.beds.filter(b=>b.status==='reserved').length,cleaning:state.beds.filter(b=>b.status==='cleaning').length,total:8};
  }
  function getPredictions(state, patientId, suppliedScope) {
    validate(state,suppliedScope);
    const target=patient(state,patientId);
    const entered=target.icuEnteredHour;
    const hasEpisode=Number.isInteger(entered) && !!target.icuStayId;
    const active=hasEpisode && target.location==='ICU' && target.icuExitedHour===null;
    const status=active?'active-icu':hasEpisode?'transferred':'pre-admission';
    // A transfer at this hour closes the ICU forecast context before this hour's
    // assessment. Incoming patients receive an ICU forecast only after actual entry.
    const lastAllowedHour=active?state.hour:hasEpisode?Math.min(state.hour,target.icuExitedHour-1):-1;
    const visible=hasEpisode?target.predictionHistory.filter(p=>p.hour>=entered && p.hour<=lastAllowedHour).map(p=>({...p,patientId:target.id,admissionId:target.admissionId,caseId:target.caseId,icuStayId:target.icuStayId,scopeKey:state.scope.key,assessmentContext:'ICU',hoursSinceIcuAdmission:p.hour-entered})):[];
    const current=visible.at(-1)||null;
    const isCurrent=active && !!current && current.hour===state.hour;
    return {patientId:target.id,admissionId:target.admissionId,caseId:target.caseId,icuStayId:target.icuStayId,currentIcuStayId:active?target.icuStayId:null,icuEnteredHour:entered,icuExitedHour:target.icuExitedHour,scopeKey:state.scope.key,sourceKind:'authored_scenario',isSimulated:true,notModelInference:true,mortalityHorizon:'hospital',transferHorizonHours:72,status,isCurrent,currentLocation:target.location,lastAssessmentHour:current?.hour??null,lastAssessmentTime:current?.time??null,mortalityForecastAvailable:isCurrent,transferForecastAvailable:isCurrent,historicalForecastAvailable:!!current,statusLabel:status==='active-icu'?'현재 ICU 평가':status==='transferred'?'전실 완료 · 마지막 ICU 평가':'입실 후 평가',statusLabelEn:status==='active-icu'?'Current ICU assessment':status==='transferred'?'Transferred · last ICU assessment':'Assess after ICU admission',current:clone(current),history:clone(visible),label:'시나리오에 작성한 값 · v19 추론 아님',labelEn:'Scenario-authored values · not v19 inference'};
  }
  const requirement=(key,label,labelEn,met,owner,ownerEn)=>({key,label,labelEn,met:!!met,owner,ownerEn,reviewer:owner});
  function getReadiness(state, patientId, bedId, suppliedScope) {
    validate(state,suppliedScope);
    const p=patient(state,patientId),bed=state.beds.find(b=>b.id===bedId);
    if(!bed || (bed.patientId!==p.id && !state.actions.some(a=>a.bedId===bed.id && a.patientId===p.id && a.phase!=='awaiting-transfer'))) fail('PATIENT_LINK_MISMATCH','검토 대상 환자와 병상이 연결되지 않습니다.');
    const r=p.readiness;
    if(!r) fail('NO_TRANSFER_RECORD','이 환자에게 전실 검토 기록이 없습니다.');
    return {patientId:p.id,bedId:bed.id,scopeKey:state.scope.key,requirements:[
      requirement('clinical','담당의 전실 결정 기록','Documented clinical transfer approval',r.clinicalApproval && !!r.clinicalApprovalDocument,'담당의','Treating clinician'),
      requirement('receiving','수용 병동 확인','Receiving ward acceptance',r.receivingWardConfirmed,'수용 병동 간호사','Receiving ward nurse'),
      requirement('transport','이송 준비 확인','Transport readiness',r.transportReady,'이송 담당','Transport coordinator'),
      requirement('cleaning','전실 후 정리 인력 확보','Cleaning team available after transfer',r.cleaningTeamReady,'정리 담당','Cleaning team'),
      requirement('staffing','새 환자 수용 인력 확인','Staffing for incoming patient',bed.staffingReady,'책임 간호사','Charge nurse'),
      requirement('equipment','필요 장비 사용 가능','Required equipment available',bed.equipmentReady && (!state.request.needs.ventilator || bed.ventilator),'장비 담당','Equipment coordinator'),
      requirement('isolation','격리 조건 일치','Isolation requirement match',!state.request.needs.isolation || bed.isolation,'책임 간호사','Charge nurse')
    ],clinicalApprovalDocument:r.clinicalApprovalDocument,receivingWard:r.receivingWard};
  }
  function evaluateOptions(state, revision) {
    validate(state);
    const active=state.actions.find(a=>['approved','running'].includes(a.status));
    if(state.request.status==='admitted') return [{id:'r'+revision+':completed',title:'입실 완료 · 결과 확인',titleEn:'Admission complete · review outcome',status:'blocked',reason:'요청 환자가 이미 입실했습니다. 중복 배치를 만들지 않습니다.',reasonEn:'The requested patient is already admitted; duplicate allocation is blocked.',requirements:[],steps:[],kind:'completed'}];
    if(active) return [{id:'r'+revision+':in-progress',title:'승인된 작업 진행 중',titleEn:'Approved workflow in progress',status:'blocked',reason:'기존 작업을 완료하거나 변경 사건을 확인한 뒤 재검토합니다.',reasonEn:'Complete the existing workflow or review a blocking event before replanning.',requirements:[],steps:[],kind:'in-progress'}];
    if(state.beds.some(b=>b.reservedFor===state.request.patientId)) return [{id:'r'+revision+':reserved-request',title:'기존 예약 확인 필요',titleEn:'Existing reservation requires review',status:'blocked',reason:'요청 환자에게 이미 예약된 병상이 있습니다. 중복 예약하지 않습니다.',reasonEn:'The requested patient already has a reserved bed; duplicate reservation is blocked.',requirements:[],steps:[],kind:'existing-reservation'}];
    const options=[];
    for(const bed of state.beds) {
      if(bed.status==='available') {
        const req=[requirement('staffing','수용 인력 확인','Staffing ready',bed.staffingReady,'책임 간호사','Charge nurse'),requirement('equipment','필요 장비 사용 가능','Equipment ready',bed.equipmentReady && (!state.request.needs.ventilator||bed.ventilator),'장비 담당','Equipment coordinator'),requirement('isolation','격리 조건 일치','Isolation requirement match',!state.request.needs.isolation||bed.isolation,'책임 간호사','Charge nurse')];
        const ok=req.every(r=>r.met);
        options.push({id:'r'+revision+':direct:'+bed.id,title:bed.number+'번 병상 직접 예약',titleEn:'Reserve bed '+bed.number+' directly',status:ok?'feasible':'blocked',reason:ok?'빈 병상과 요청 조건이 일치합니다. 운영 승인 후 예약합니다.':'빈 병상이어도 요청 환자의 조건이 충족되지 않습니다.',reasonEn:ok?'A vacant bed meets request constraints; reserve after operational approval.':'The vacant bed does not meet the incoming patient’s requirements.',requirements:req,steps:['운영 승인','요청 환자용 예약','입실 완료 확인'],stepsEn:['Operational approval','Reserve for requested patient','Confirm admission'],kind:'direct',bedId:bed.id,patientId:null,requestPatientId:state.request.patientId});
      }
      if(bed.status!=='occupied') continue;
      const p=patient(state,bed.patientId);
      const candidate=state.scenarioId==='readmission'?bed.number==='02':bed.number==='03'||(state.scenarioId==='transfer-delay' && bed.number==='06');
      if(!candidate) continue;
      const readiness=getReadiness(state,p.id,bed.id), req=readiness.requirements;
      const ok=req.every(r=>r.met);
      const hardMismatch=req.some(r=>!r.met && ['isolation','staffing','equipment'].includes(r.key));
      const unmet=req.filter(r=>!r.met).map(r=>r.label).join(' · ');
      options.push({id:'r'+revision+':transfer:'+p.id,title:bed.number+'번 전실 후 신규 입실',titleEn:'Transfer from bed '+bed.number+', then admit',status:ok?'feasible':hardMismatch?'blocked':'conditional',reason:ok?'전실 결정과 수용·이송 준비가 기록되어 있습니다. 이동 완료 후 정리와 예약을 진행합니다.':'미확인 조건: '+unmet+'. 예측값만으로 전실하지 않습니다.',reasonEn:ok?'Clinical approval and receiving/transport readiness are documented. Cleaning and reservation follow actual transfer completion.':'Outstanding prerequisites remain. Forecasts alone never authorize transfer.',requirements:req,steps:['담당자 운영 승인','전실 완료 확인','병상 정리 완료','입실 예약','새 환자 입실'],stepsEn:['Operational approval','Confirm transfer completion','Complete cleaning','Reserve bed','Admit incoming patient'],kind:'transfer',bedId:bed.id,patientId:p.id,requestPatientId:state.request.patientId});
    }
    options.push({id:'r'+revision+':alternate-review',title:'다른 ICU 수용 경로 검토',titleEn:'Review another ICU receiving pathway',status:'conditional',reason:'다른 ICU의 수용 동의·담당 인력·필요 장비가 아직 확인되지 않았습니다. 실제 요청을 보내지 않는 검토 단계입니다.',reasonEn:'Receiving acceptance, staffing and required equipment at another ICU remain unconfirmed. This is a review step; no real request is sent.',requirements:[requirement('alternateAcceptance','다른 ICU 수용 확인','Other ICU acceptance confirmed',false,'수용 ICU 책임자','Receiving ICU lead'),requirement('alternateStaffing','수용 인력 확인','Receiving staffing confirmed',false,'수용 ICU 책임 간호사','Receiving ICU charge nurse'),requirement('alternateEquipment','필요 장비 확인','Required equipment confirmed',false,'수용 ICU 장비 담당','Receiving equipment coordinator')],steps:['다른 ICU 조건 확인 후 재검토'],stepsEn:['Reassess after confirming the other ICU constraints'],kind:'alternate-review'});
    return options;
  }
  function trace(state,tool,summary,summaryEn,status) { state.trace.push({id:'trace-'+state.trace.length,time:time(state.hour),hour:state.hour,tool,status:status||'completed',summary,summaryEn,source:'deterministic-local-function'}); }
  function assess(input) {
    validate(input);
    const state=clone(input); state.revision++;
    const snapshot=getSnapshot(state);
    trace(state,'getSnapshot',snapshot.occupied+'/8 사용 · 공실 '+snapshot.available+' · 정리 '+snapshot.cleaning+' · 예약 '+snapshot.reserved,snapshot.occupied+'/8 occupied · '+snapshot.available+' vacant · '+snapshot.cleaning+' cleaning · '+snapshot.reserved+' reserved');
    const linked=state.beds.filter(b=>b.patientId).map(b=>getPredictions(state,b.patientId));
    trace(state,'getPredictions',linked.length+'명 · '+time(state.hour)+'까지의 가상 예측만 조회',linked.length+' patients · authored forecasts only through '+time(state.hour));
    const candidates=state.beds.filter(b=>b.patientId && patient(state,b.patientId).readiness && (state.scenarioId==='readmission'?b.number==='02':b.number==='03'||(state.scenarioId==='transfer-delay'&&b.number==='06'))).map(b=>getReadiness(state,b.patientId,b.id));
    trace(state,'getReadiness',candidates.length+'명 전실 결정·수용·이송·장비·인력 조건 대조',candidates.length+' candidates checked for documented approval, acceptance, transport, equipment and staffing');
    const options=evaluateOptions(state,state.revision);
    trace(state,'evaluateOptions',options.filter(o=>o.status==='feasible').length+'개 실행 가능안 · 예측값으로 임상 자격을 결정하지 않음',options.filter(o=>o.status==='feasible').length+' feasible options · predictions never determine clinical eligibility');
    state.plan={id:'plan-r'+state.revision,revision:state.revision,hour:state.hour,status:'awaiting-approval',summary:'현재 조건에 맞는 운영안을 비교했습니다. 승인 전에는 이동·예약하지 않습니다.',summaryEn:'Operational options were compared against current constraints. No movement or reservation occurs before approval.',options};
    return state;
  }
  function approve(input,optionId,expectedRevision) {
    validate(input);
    if(input.approvalKeys.includes(optionId)) fail('DUPLICATE_APPROVAL','이미 승인한 작업입니다. 중복 예약하지 않습니다.');
    if(expectedRevision!==undefined && expectedRevision!==input.revision) fail('STALE_APPROVAL','상태가 바뀌었습니다. 최신 조건을 다시 검토한 뒤 승인하세요.');
    if(!input.plan || input.plan.revision!==input.revision || input.plan.status!=='awaiting-approval') fail('STALE_APPROVAL','최신 검토안이 없습니다. 운영안을 다시 검토하세요.');
    const chosen=input.plan.options.find(o=>o.id===optionId);
    if(!chosen) fail('STALE_APPROVAL','오래되었거나 이 검토안에 없는 선택입니다.');
    if(chosen.status!=='feasible') fail('PREREQUISITES_NOT_MET','미충족 조건이 있습니다. 승인할 수 없습니다.');
    if(input.actions.some(a=>['approved','running'].includes(a.status))) fail('DUPLICATE_ACTION','이미 진행 중인 배치 작업이 있습니다.');
    const fresh=evaluateOptions(input,input.revision).find(o=>o.id===chosen.id);
    if(!fresh || fresh.status!=='feasible' || fresh.patientId!==chosen.patientId || fresh.bedId!==chosen.bedId) fail('STALE_APPROVAL','검토 후 운영 조건이 바뀌었습니다. 다시 검토하세요.');
    const state=clone(input);state.revision++;state.approvalKeys.push(optionId);state.plan.status='approved';
    const action={id:'action-'+state.actions.length,optionId,title:chosen.title,titleEn:chosen.titleEn,kind:chosen.kind,status:'approved',phase:chosen.kind==='direct'?'reserved':'awaiting-transfer',bedId:chosen.bedId,patientId:chosen.patientId,requestPatientId:state.request.patientId,approvedHour:state.hour,lastPhaseHour:state.hour,reviewer:'운영 담당자 · 시뮬레이션 승인',reviewerEn:'Operations reviewer · simulation approval',steps:clone(chosen.steps),clinicalApprovalDerivedFromPrediction:false};
    state.actions.push(action);
    if(chosen.kind==='direct') {const bed=state.beds.find(b=>b.id===chosen.bedId);bed.status='reserved';bed.reservedFor=state.request.patientId;state.request.status='reserved';}
    trace(state,'approveOperationalPlan','운영안 승인 · 실제 이동 전까지 기존 점유 유지','Operational plan approved · existing occupancy retained until transfer completion');
    return validate(state);
  }
  function event(state,title,titleEn,detail,detailEn) { state.events.push({id:'event-'+state.events.length,time:time(state.hour),hour:state.hour,title,titleEn,detail,detailEn}); }
  function scenarioEvents(state) {
    if(state.scenarioId==='transfer-delay' && state.hour===1) {
      const p=state.patients.find(p=>p.id.endsWith('-P03'));p.readiness.receivingWardConfirmed=false;
      event(state,'수용 병동 취소','Receiving ward cancels','03번 환자의 수용 확인이 취소되었습니다. 기존 계획의 실행을 중지하고 대안을 검토합니다.','Acceptance for bed 03 is cancelled. Stop the affected workflow and review alternatives.');
    }
    if(state.scenarioId==='transfer-delay' && state.hour===3) {
      const p=state.patients.find(p=>p.id.endsWith('-P03'));p.readiness.receivingWardConfirmed=true;
      event(state,'다른 수용 병동 확인','Alternative ward confirmed','03번 환자의 수용 병동이 새로 확인되었습니다. 진행 중 작업과 중복 배치하지 않습니다.','A new receiving ward is confirmed for patient 03. Do not duplicate an existing allocation.');
    }
    if(state.scenarioId==='readmission' && state.hour===1) {
      const p=state.patients.find(p=>p.id.endsWith('-P02'));p.readiness.clinicalApproval=true;p.readiness.clinicalApprovalDocument='TRAINING-CLINICAL-APPROVAL-15H';
      event(state,'담당의 전실 결정 기록 도착','Clinical transfer approval recorded','02번 환자의 전실 결정이 시나리오 기록으로 도착했습니다. 예측값으로 생성한 승인이 아닙니다.','The scenario supplies a documented decision for patient 02; it was not inferred from a prediction.');
    }
  }
  function blockAction(state,action,reason,reasonEn) {action.status='blocked';action.blocker=reason;action.blockerEn=reasonEn;event(state,'작업 보류 · 재검토 필요','Workflow blocked · reassessment needed',reason,reasonEn);trace(state,'recheckConstraints',reason,reasonEn,'blocked');}
  function advance(input) {
    validate(input);
    if(input.hour===6) return clone(input);
    const state=clone(input);state.hour++;state.revision++;state.plan=null;
    scenarioEvents(state);
    for(const action of state.actions) {
      if(!['approved','running'].includes(action.status)) continue;
      const bed=state.beds.find(b=>b.id===action.bedId);
      if(action.phase==='awaiting-transfer') {
        if(bed.patientId!==action.patientId) {blockAction(state,action,'병상 점유 환자가 변경되었습니다.','Bed occupancy changed.');continue;}
        const ready=getReadiness(state,action.patientId,bed.id);
        if(!ready.requirements.every(r=>r.met)) {blockAction(state,action,ready.requirements.filter(r=>!r.met).map(r=>r.label).join(' · ')+' 미충족','A documented transfer or operational prerequisite is no longer satisfied.');continue;}
        const transferredPatient=patient(state,action.patientId);transferredPatient.location='WARD';transferredPatient.icuExitedHour=state.hour;bed.patientId=null;bed.status='cleaning';bed.reservedFor=null;action.phase='cleaning';action.status='running';
        event(state,'전실 완료 · 병상 정리 중','Transfer completed · cleaning',bed.number+'번 환자가 이동했습니다. 정리 전에는 공실로 사용할 수 없습니다.','The patient moved from bed '+bed.number+'. It is unavailable until cleaning is complete.');
      } else if(action.phase==='cleaning') {
        const p=patient(state,action.patientId);
        if(!p.readiness.cleaningTeamReady || !bed.staffingReady || !bed.equipmentReady || (state.request.needs.isolation&&!bed.isolation)) {blockAction(state,action,'정리·수용 조건이 바뀌었습니다.','Cleaning or receiving constraints changed.');continue;}
        if(bed.status!=='cleaning' || bed.patientId || bed.reservedFor) fail('DUPLICATE_BOOKING','정리 중 병상에 다른 배치가 기록되었습니다.');
        bed.status='reserved';bed.reservedFor=state.request.patientId;state.request.status='reserved';action.phase='reserved';
        event(state,'정리 완료 · 요청 환자 예약','Cleaning completed · reserved',bed.number+'번 병상을 요청 환자용으로 예약했습니다. 아직 점유는 아닙니다.','Bed '+bed.number+' is reserved for the requested patient; it is not yet occupied.');
      } else if(action.phase==='reserved') {
        if(bed.status!=='reserved' || bed.reservedFor!==state.request.patientId || bed.patientId) fail('DUPLICATE_BOOKING','예약 환자와 입실 대상이 일치하지 않습니다.');
        if(!bed.staffingReady||!bed.equipmentReady||(!bed.ventilator&&state.request.needs.ventilator)||(!bed.isolation&&state.request.needs.isolation)) {blockAction(state,action,'입실 직전 인력·장비·격리 조건을 다시 확인해야 합니다.','Recheck staffing, equipment and isolation before admission.');continue;}
        const admittedPatient=patient(state,state.request.patientId);bed.patientId=state.request.patientId;bed.reservedFor=null;bed.status='occupied';state.request.status='admitted';admittedPatient.location='ICU';admittedPatient.icuStayId=admittedPatient.id+(admittedPatient.previousIcuStayId?'-ICU02':'-ICU01');admittedPatient.icuEnteredHour=state.hour;admittedPatient.icuExitedHour=null;action.phase='admitted';action.status='completed';
        event(state,'입실 완료','Admission completed',bed.number+'번 병상의 요청 환자 입실을 확인했습니다.','Admission of the requested patient to bed '+bed.number+' is confirmed.');
      }
      action.lastPhaseHour=state.hour;
      trace(state,'advanceApprovedWorkflow',action.title+' · '+action.phase,action.titleEn+' · '+action.phase);
    }
    trace(state,'advanceSimulationClock','가상 시계를 '+time(state.hour)+'로 이동 · 새 운영안은 재검토 필요','Simulation clock advanced to '+time(state.hour)+' · reassess before approving a new plan');
    return validate(state);
  }
  function view(state) {
    validate(state);
    const snapshot=getSnapshot(state);
    const predictions=state.patients.map(p=>getPredictions(state,p.id));
    const patients=state.patients.map(p=>{const pred=predictions.find(x=>x.patientId===p.id);return {id:p.id,name:p.name,nameEn:p.nameEn,admissionId:p.admissionId,caseId:p.caseId,location:p.location,icuStayId:p.icuStayId,icuEnteredHour:p.icuEnteredHour,icuExitedHour:p.icuExitedHour,previousIcuStayId:p.previousIcuStayId||null,previousIcuAdmissionId:p.previousIcuAdmissionId||null,isSimulated:true,bedId:state.beds.find(b=>b.patientId===p.id)?.id||null,current:pred.current,prediction:pred,predictions:pred,history:pred.history,readiness:p.readiness?clone(p.readiness):null};});
    const readiness=state.beds.filter(b=>b.patientId && patient(state,b.patientId).readiness).map(b=>getReadiness(state,b.patientId,b.id));
    const expected=state.beds.filter(b=>b.patientId).reduce((sum,b)=>sum+getPredictions(state,b.patientId).current.transfer72hPercent/100,0);
    return {scenario:clone(info(state.scenarioId)),hour:state.hour,time:time(state.hour),revision:state.revision,maxHour:6,scope:clone(state.scope),beds:clone(state.beds),patients,request:clone(state.request),predictions,readiness,plan:clone(state.plan),trace:clone(state.trace),events:clone(state.events),actions:clone(state.actions),snapshot,forecast:{expected72hTransfers:Number(expected.toFixed(1)),availableNow:snapshot.available,occupied:snapshot.occupied,total:8,reserved:snapshot.reserved,cleaning:snapshot.cleaning,isSimulated:true,isVacancy:false,label:'72시간 내 전과 기대 건수 · 공실 아님',labelEn:'Expected transfers within 72 hours · not vacant beds',note:'가상 확률의 합계이며 실제 전실·공실 확보를 보장하지 않습니다.',noteEn:'A sum of fictional probabilities; it does not guarantee transfers or available beds.'},notice:'독립된 가상 8병상 운영 훈련 · 실제 LLM·모델 추론·의료 행위 없음',noticeEn:'Isolated fictional eight-bed exercise · no live LLM, model inference or clinical action',predictionSource:'시나리오에 작성한 값 · v19 추론 아님',predictionSourceEn:'Scenario-authored values · not v19 inference'};
  }
  return Object.freeze({scenarios:clone(scenarios),getScenarios:()=>clone(scenarios),create,createSession:create,validate,getSnapshot,getPredictions,getReadiness,evaluateOptions,assess,approve,advance,advanceHour:advance,view,getView:view});
});
