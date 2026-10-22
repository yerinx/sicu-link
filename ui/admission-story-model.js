/* One admission, followed step by step. Deterministic local simulation only.
 * Forecasts are authored examples. They never create clinical transfer approval.
 * The ledger records completed local calls, not language-model reasoning.
 */
(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./bed-ops-sim-model.js') : root.SICUBedOpsSim);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SICUAdmissionStory = api;
})(typeof window !== 'undefined' ? window : null, function (M) {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const fail = (code, message) => { const error = new Error(message); error.code = code; throw error; };
  const stages = [
    {id:'request',label:'입실 요청',labelEn:'Admission request'},
    {id:'review',label:'환자·예측 확인',labelEn:'Patient review'},
    {id:'check',label:'추가 확인',labelEn:'Agent check'},
    {id:'handover',label:'보고 준비',labelEn:'Handover'},
    {id:'human-review',label:'담당자 검토',labelEn:'Human review'},
    {id:'readiness',label:'입실 준비',labelEn:'Bed readiness'}
  ];
  const scenarios = [
    {id:'transfer-delay',title:'수용 병동이 바뀐다면?',titleEn:'What if the ward cancels?',summary:'같은 대기 환자 R의 입실을 준비하다 수용 확인 취소를 만나고 다시 확인합니다.',summaryEn:'Prepare admission for R, respond to a receiving-ward cancellation, and check again.'},
    {id:'full-capacity',title:'만실에서 다음 입실 준비',titleEn:'Prepare the next admission at capacity',summary:'환자 A의 전실 준비를 확인한 뒤 R의 입실까지 이어갑니다.',summaryEn:'Check A’s transfer prerequisites and continue through R’s admission.'},
    {id:'readmission',title:'빈 병상이 있어도 격리가 필요하다면?',titleEn:'An empty bed, but isolation is needed',summary:'격리가 필요한 R의 재입실을 위해 맞는 병상과 담당의 기록을 확인합니다.',summaryEn:'Check an appropriate bed and documented clinical approval for returning patient R.'}
  ];
  function validate(state) {
    if (!M || !state || state.kind !== 'admission-story-simulation' || !Array.isArray(state.tooltrace) || !Array.isArray(state.history)) fail('INVALID_STORY','입실 준비 시뮬레이션 상태가 올바르지 않습니다.');
    M.validate(state.core);
    if (state.missionPatientId !== state.core.request.patientId || !state.core.patients.some(p => p.id === state.candidatePatientId) || !state.core.beds.some(b => b.id === state.candidateBedId)) fail('STORY_LINK_MISMATCH','대기 환자·검토 환자·병상 연결을 확인하세요.');
    if (!Number.isInteger(state.stageIndex) || state.stageIndex < 0 || state.stageIndex > 5) fail('INVALID_STORY','진행 단계가 올바르지 않습니다.');
    const ids = new Set();
    for (const entry of state.tooltrace) {
      if (ids.has(entry.id) || entry.hour > state.core.hour || entry.status !== 'completed' || entry.source !== 'deterministic-local-function') fail('INVALID_EVIDENCE','완료된 해당 시점의 도구 결과만 사용할 수 있습니다.');
      ids.add(entry.id);
    }
    if (state.report && state.report.evidenceIds.some(id => !ids.has(id))) fail('INVALID_EVIDENCE','보고서의 근거 연결이 일치하지 않습니다.');
    return state;
  }
  function stamp(state) { return M.getSnapshot(state.core).time; }
  function scene(state, phase, stageIndex, headline, headlineEn, message, messageEn, tone) {
    state.phase = phase; state.stageIndex = stageIndex;
    state.headline = headline; state.headlineEn = headlineEn;
    state.message = message; state.messageEn = messageEn;
    const entry = {id:'story-'+state.history.length,hour:state.core.hour,time:stamp(state),phase,stageIndex,title:headline,titleEn:headlineEn,message,messageEn,tone:tone || 'info',tool:state.activeTool || null};
    state.history.push(entry);
    return validate(state);
  }
  function record(state, tool, result, summary, summaryEn) {
    const entry = {id:'evidence-'+String(state.tooltrace.length+1).padStart(3,'0'),tool,hour:state.core.hour,time:stamp(state),status:'completed',source:'deterministic-local-function',result:copy(result),summary,summaryEn};
    state.tooltrace.push(entry); state.activeTool = tool;
    return entry;
  }
  function create(scenarioId, scope) {
    scenarioId = scenarioId || 'transfer-delay';
    if (!scenarios.some(s=>s.id===scenarioId)) fail('UNKNOWN_SCENARIO','알 수 없는 입실 준비 이야기입니다.');
    const core = M.create(scenarioId,scope || {hospital:'OPS-SIM',ward:'OPS-SIM-SICU'});
    const bed = core.beds.find(b=>b.number===(scenarioId==='readmission'?'02':'03'));
    const state = {kind:'admission-story-simulation',version:1,scenarioId,core,missionPatientId:core.request.patientId,candidatePatientId:bed.patientId,candidateBedId:bed.id,stageIndex:0,phase:'request',activeTool:null,tooltrace:[],history:[],snapshot:null,prediction:null,readiness:null,report:null,planOptionId:null,planRevision:null,planEvidenceId:null};
    return scene(state,'request',0,'대기 환자 R의 ICU 입실을 준비합니다','Prepare ICU admission for patient R',scenarioId==='readmission'?'빈 08번 병상은 격리 조건이 맞지 않습니다. R이 입실할 수 있는 경로를 확인해 보겠습니다.':'현재 8병상은 모두 사용 중입니다. 대기 환자 R의 입실에 필요한 확인과 준비를 이어갑니다.',scenarioId==='readmission'?'Vacant bed 08 does not meet the isolation requirement. Find a suitable route for R.':'All eight beds are occupied. Follow the checks and preparation needed to admit patient R.');
  }
  function querySnapshot(state) {
    state.snapshot = M.getSnapshot(state.core);
    record(state,'getSnapshot',state.snapshot,'병상 점유와 요청 환자를 조회했습니다.','Retrieved occupancy and the waiting request.');
    return scene(state,'snapshot',0,'먼저, 병상과 입실 요청을 확인합니다','First, check occupancy and the request','대기 환자는 R 한 명입니다. 전실 전망이 있어도 실제 이동 전에는 병상을 비우지 않습니다.','R remains the same waiting patient. A transfer forecast does not release an occupied bed.');
  }
  function queryForecast(state) {
    state.prediction = M.getPredictions(state.core,state.candidatePatientId);
    record(state,'getPredictions',state.prediction,'검토 환자 A의 현재 시점 가상 예측을 조회했습니다.','Retrieved A’s authored forecast at the current time.');
    return scene(state,'forecast',1,'환자 A의 전망을 확인했습니다','Reviewed patient A’s forecast','예측은 검토 근거입니다. 다음에는 전실 결정 기록과 수용 병동·이송·인력·장비 조건을 확인합니다.','The forecast informs review. Next check the documented decision, ward acceptance, transport, staffing and equipment.');
  }
  function queryReadiness(state) {
    state.readiness = M.getReadiness(state.core,state.candidatePatientId,state.candidateBedId);
    const missing = state.readiness.requirements.filter(r=>!r.met);
    record(state,'getReadiness',state.readiness,missing.length?missing.map(r=>r.label).join(' · ')+' 미확인':'필요 조건이 모두 확인되었습니다.',missing.length?'Outstanding: '+missing.map(r=>r.labelEn).join(' · '):'All prerequisites are confirmed.');
    if (missing.length) {
      const receiving = missing.some(r=>r.key==='receiving');
      return scene(state,'readiness',2,receiving?'수용 확인이 취소됐습니다. 다시 확인할게요':'담당의 결정 기록을 기다립니다',receiving?'Ward acceptance was cancelled. Check again.':'Wait for the documented clinical decision',receiving?'A의 전실을 진행하지 않고 수용 병동 확인을 다시 조회합니다. R은 그대로 대기하고 병상도 점유 상태를 유지합니다.':'예측값으로 승인을 만들지 않습니다. 담당의 전실 결정 기록이 확인된 뒤 준비를 이어갑니다.',receiving?'Hold A’s transfer and recheck receiving acceptance. R continues waiting and the bed remains occupied.':'Forecasts do not generate clinical approval. Continue after the clinician’s recorded decision is available.','attention');
    }
    return scene(state,'readiness',2,'확인 완료. 보고할 운영안을 준비합니다','Checks complete. Prepare an operating plan','담당의 전실 결정과 수용·이송·인력·장비 조건이 확인됐습니다. 이 결과로 운영안을 다시 평가합니다.','The clinical decision and operational prerequisites are documented. Reassess the plan using these results.','success');
  }
  function advanceForCheck(state) {
    const before = state.core.hour;
    state.core = M.advance(state.core);
    state.snapshot = M.getSnapshot(state.core);
    const events = state.core.events.filter(event=>event.hour===state.core.hour && event.hour>before);
    record(state,'advanceSimulationClock',{snapshot:state.snapshot,events},'가상 시계 진행 · 새 운영 기록 확인','Advanced the simulation clock and checked newly available operational records.');
    const cancellation = events.some(event=>/취소/.test(event.title));
    const confirmed = events.some(event=>/수용 병동 확인|전실 결정 기록/.test(event.title));
    return scene(state,'check-start',2,cancellation?'새 정보: 수용 병동이 취소했습니다':confirmed?'새 확인 기록이 도착했습니다':'확인 요청 후, 다음 기록을 기다립니다',cancellation?'New information: the receiving ward cancelled':confirmed?'A new confirmation record arrived':'Wait for the next confirmation record',cancellation?'예정된 진행을 멈추고, 수용 조건부터 다시 조회합니다.':'같은 환자 A의 준비 조건을 다시 조회해 다음 행동을 선택합니다.',cancellation?'Pause the planned route and query receiving readiness again.':'Query A’s readiness again and choose the next action from the returned result.',cancellation?'attention':'info');
  }
  function preparePlan(state) {
    // Completed, synchronous model functions supply every displayed evidence record.
    state.snapshot = M.getSnapshot(state.core);
    record(state,'getSnapshot',state.snapshot,'최신 병상 상태를 다시 조회했습니다.','Rechecked the current occupancy.');
    state.prediction = M.getPredictions(state.core,state.candidatePatientId);
    record(state,'getPredictions',state.prediction,'보고 시점의 A 예측을 다시 조회했습니다.','Refreshed A’s forecast for the report time.');
    state.readiness = M.getReadiness(state.core,state.candidatePatientId,state.candidateBedId);
    record(state,'getReadiness',state.readiness,'운영안 평가 직전 조건을 다시 확인했습니다.','Rechecked prerequisites immediately before plan assessment.');
    state.core = M.assess(state.core);
    const selected = state.core.plan.options.find(option=>option.patientId===state.candidatePatientId && option.bedId===state.candidateBedId);
    const evidence = record(state,'assessOperationalPlan',{revision:state.core.revision,plan:state.core.plan,selectedOptionId:selected?.id || null},'확인된 조건으로 같은 환자 A의 운영안을 평가했습니다.','Assessed the same patient A’s pathway against the confirmed conditions.');
    state.planOptionId = selected?.id || null; state.planRevision = state.core.revision; state.planEvidenceId = evidence.id;
    if (!selected || selected.status!=='feasible') return scene(state,'readiness',2,'조건이 바뀌어 추가 확인이 필요합니다','Conditions changed; check again','승인 단계로 넘어가지 않습니다. 미확인 조건을 다시 확인합니다.','Do not advance to approval. Recheck the outstanding prerequisites.','attention');
    return scene(state,'planned',3,'운영안이 준비됐습니다','The operating plan is ready','A 전실 완료 → 병상 정리 → R 예약 → R 입실 순서입니다. 승인 전에는 이동이나 예약을 시작하지 않습니다.','Confirm A’s transfer, clean the bed, reserve it for R, then confirm R’s admission. No movement or reservation starts before operational approval.');
  }
  function refreshEvidence(state) {
    state.prediction=M.getPredictions(state.core,state.candidatePatientId);
    record(state,'getPredictions',state.prediction,'시간이 지나 현재 시점의 환자 예측을 다시 조회했습니다.','Time passed; rechecked the patient forecast at the current time.');
    state.readiness=M.getReadiness(state.core,state.candidatePatientId,state.candidateBedId);
    record(state,'getReadiness',state.readiness,'새 확인 기록과 환자 연결을 다시 확인했습니다.','Rechecked the new operational record and patient linkage.');
    return scene(state,'refreshed',1,'새 정보에 맞춰 환자 자료도 다시 확인합니다','Revisit the patient after the new information','수용 확인만 바꾸고 진행하지 않습니다. 같은 A의 현재 시점 예측과 준비 조건을 다시 조회한 뒤 보고를 준비합니다.','Do not proceed with acceptance alone. Recheck the same A’s current forecast and prerequisites before preparing the report.');
  }
  function latestEvidence(state,tool) { return [...state.tooltrace].reverse().find(entry=>entry.tool===tool); }
  function buildReport(state) {
    const snapshot = latestEvidence(state,'getSnapshot'), prediction = latestEvidence(state,'getPredictions'), readiness = latestEvidence(state,'getReadiness'), plan = latestEvidence(state,'assessOperationalPlan');
    if (![snapshot,prediction,readiness,plan].every(entry=>entry && entry.hour===state.core.hour)) fail('STALE_REPORT','현재 시점의 확인 결과로 보고를 다시 준비하세요.');
    const bed = state.core.beds.find(item=>item.id===state.candidateBedId);
    const clinical = readiness.result.requirements.find(r=>r.key==='clinical');
    state.report = {kind:'deterministic-handover-template',isLlmGenerated:false,hour:state.core.hour,time:stamp(state),patientId:state.missionPatientId,candidatePatientId:state.candidatePatientId,bedId:bed.id,bedNumber:bed.number,evidenceIds:[snapshot.id,prediction.id,readiness.id,plan.id],title:'R 입실 준비 · 확인 보고',titleEn:'R admission preparation · check report',summary:'검토 환자 A의 전실 결정 및 운영 조건을 확인했습니다. A 이동 완료 후 '+bed.number+'번 병상을 정리하고 R의 입실을 준비합니다.',summaryEn:'A’s documented transfer decision and operational prerequisites are confirmed. After A moves, prepare bed '+bed.number+' for R.',clinicalApprovalDocument:readiness.result.clinicalApprovalDocument,clinicalDecisionRecorded:!!clinical?.met,clinicalApprovalDerivedFromPrediction:false,forecast:copy(prediction.result.current),missing:readiness.result.requirements.filter(r=>!r.met),checks:copy(readiness.result.requirements),nextSteps:['A 전실 완료 확인','병상 정리 완료 확인','R 전용 예약','R 입실 완료 확인'],nextStepsEn:['Confirm A’s transfer','Confirm bed turnover','Reserve for R','Confirm R’s admission'],sections:[{label:'현재 상황',labelEn:'Situation',text:'대기 환자 R · '+snapshot.result.occupied+'/8병상 사용',textEn:'Waiting patient R · '+snapshot.result.occupied+'/8 beds occupied',evidenceIds:[snapshot.id]},{label:'예측 근거',labelEn:'Forecast evidence',text:'A의 시나리오 예측 · 임상 결정과 별도',textEn:'A’s authored forecast · separate from clinical approval',evidenceIds:[prediction.id]},{label:'확인 결과',labelEn:'Checks',text:'필수 조건 확인 완료 · 담당자 운영 승인 대기',textEn:'Prerequisites confirmed · awaiting operational approval',evidenceIds:[readiness.id,plan.id]}]};
    record(state,'buildHandoverTemplate',state.report,'완료된 조회 결과를 근거 ID와 함께 보고 형식으로 묶었습니다.','Built a fixed report template with IDs of completed evidence calls.');
    return scene(state,'report',3,'확인 결과를 한 장으로 모았습니다','The checked information is now in one report','같은 대기 환자 R, 같은 검토 환자 A의 근거와 남은 작업을 담당자에게 전달할 준비가 됐습니다.','The report keeps the same waiting patient R and candidate A, together with their evidence and remaining tasks.');
  }
  function moveWorkflow(state) {
    const before = state.core.hour;
    state.core = M.advance(state.core);
    state.snapshot = M.getSnapshot(state.core);
    const action = state.core.actions.find(item=>item.patientId===state.candidatePatientId);
    record(state,'advanceApprovedWorkflow',{snapshot:state.snapshot,action:copy(action || null),events:state.core.events.filter(event=>event.hour===state.core.hour && event.hour>before)},'승인된 작업 진행과 실제 시연 병상 상태를 확인했습니다.','Advanced the approved workflow and checked the simulated bed status.');
    if (action?.status==='blocked') return scene(state,'workflow-blocked',5,'조건이 바뀌어 이동을 멈췄습니다','A prerequisite changed; the workflow stopped',action.blocker || '담당자의 재확인이 필요합니다.',action.blockerEn || 'A responsible reviewer must recheck the conditions.','attention');
    if (state.core.request.status==='admitted') return scene(state,'completed',5,'대기 환자 R의 ICU 입실을 확인했습니다','Patient R’s ICU admission is confirmed','처음의 입실 요청이 실제 시연 병상 배치로 이어졌습니다. 이동·정리·예약·입실의 각 확인 기록을 남겼습니다.','The original request is now a simulated ICU admission. Transfer, turnover, reservation and admission were each confirmed.','success');
    if (action?.phase==='cleaning') return scene(state,'workflow',5,'A 전실 완료. 병상을 정리합니다','A has moved. Prepare the bed.','R은 아직 대기 중입니다. 정리가 끝나기 전에는 공실로 표시하거나 입실시키지 않습니다.','R is still waiting. Do not mark the bed ready or admit R before turnover is complete.');
    return scene(state,'workflow',5,'정리 완료. R을 위한 병상을 확보했습니다','Turnover complete. The bed is reserved for R.','R 전용 예약을 확인했습니다. 다음에는 입실 직전 수용 조건과 실제 입실 완료를 확인합니다.','The reservation belongs to R. Next recheck receiving conditions and confirm actual admission.');
  }
  function next(input) {
    validate(input); const state = copy(input);
    if (['human-review','completed','workflow-blocked'].includes(state.phase)) return state;
    if (state.phase==='request') return querySnapshot(state);
    if (state.phase==='snapshot') return queryForecast(state);
    if (state.phase==='forecast') return state.scenarioId==='transfer-delay'?advanceForCheck(state):queryReadiness(state);
    if (state.phase==='check-start') return queryReadiness(state);
    if (state.phase==='readiness') {
      const missing = state.readiness.requirements.filter(r=>!r.met);
      if (missing.length) {
        if (state.core.hour>=3 || missing.some(r=>['equipment','staffing','isolation','transport','cleaning'].includes(r.key))) return scene(state,'workflow-blocked',2,'확인되지 않은 조건으로 진행할 수 없습니다','Outstanding prerequisites prevent progress','조건을 확인할 수 없어 담당자에게 보류 사유를 전달합니다.','The unresolved prerequisite is reported to the responsible reviewer.','attention');
        return advanceForCheck(state);
      }
      return state.prediction?.lastAssessmentHour!==state.core.hour?refreshEvidence(state):preparePlan(state);
    }
    if (state.phase==='refreshed') return preparePlan(state);
    if (state.phase==='planned') return buildReport(state);
    if (state.phase==='report') { state.activeTool=null; return scene(state,'human-review',4,'담당자 검토를 기다립니다','Waiting for the responsible reviewer','담당의 전실 결정은 이미 시나리오에 기록돼 있습니다. 이 버튼은 확인한 운영 순서만 승인합니다.','The clinical transfer decision is already recorded in the scenario. This approval covers only the checked operational sequence.','review'); }
    if (state.phase==='approved' || state.phase==='workflow') return moveWorkflow(state);
    fail('INVALID_PHASE','진행할 수 없는 단계입니다.');
  }
  function approve(input) {
    validate(input);
    if (input.phase!=='human-review') fail('HUMAN_REVIEW_REQUIRED','확인 보고와 담당자 검토 단계가 먼저 필요합니다.');
    if (!input.report || input.report.hour!==input.core.hour || input.core.hour>3) fail('STALE_APPROVAL','현재 시점에서 완료할 수 있는 운영안을 다시 준비하세요.');
    const state=copy(input);
    state.core=M.approve(state.core,state.planOptionId,state.planRevision);
    record(state,'approveOperationalPlan',{action:state.core.actions.at(-1),reportEvidenceIds:state.report.evidenceIds,clinicalApprovalDerivedFromPrediction:false},'담당자가 운영 순서를 승인했습니다. 임상 결정을 새로 만들지 않습니다.','The reviewer approved the operational sequence, without creating a new clinical decision.');
    return scene(state,'approved',5,'운영 순서 승인. 이동 완료부터 확인합니다','Sequence approved. Start with transfer confirmation.','아직 병상은 점유 상태입니다. 다음 가상 시간에 이동 완료를 확인한 뒤 병상 정리를 시작합니다.','The bed remains occupied. At the next simulated time, confirm transfer completion before turnover.');
  }
  function view(input) {
    validate(input); const state=copy(input), coreView=M.view(state.core);
    const bed=state.core.beds.find(item=>item.id===state.candidateBedId), candidate=state.core.patients.find(p=>p.id===state.candidatePatientId);
    // Preserve only the forecast values actually queried in this story. Metadata
    // must still reflect elapsed time and actual movement, without pretending a
    // new model/tool call occurred or exposing a newly authored future value.
    const prediction=copy(state.prediction), actual=coreView.predictions.find(item=>item.patientId===state.candidatePatientId);
    if(prediction){
      const current=actual.status==='active-icu'&&prediction.lastAssessmentHour===state.core.hour;
      Object.assign(prediction,{status:actual.status,currentLocation:actual.currentLocation,currentIcuStayId:actual.currentIcuStayId,icuExitedHour:actual.icuExitedHour,isCurrent:current,mortalityForecastAvailable:current,transferForecastAvailable:current,historicalForecastAvailable:!!prediction.current,isStale:!current,viewHour:state.core.hour});
      prediction.statusLabel=actual.status==='transferred'?'전실 완료 · 마지막 조회 평가':current?'현재 ICU 평가':'마지막 조회 평가 · 재확인 필요';
      prediction.statusLabelEn=actual.status==='transferred'?'Transferred · last queried assessment':current?'Current ICU assessment':'Last queried assessment · recheck needed';
    }
    const missing=(state.readiness?.requirements || []).filter(r=>!r.met);
    const completed=state.phase==='completed', canApprove=state.phase==='human-review', paused=['human-review','workflow-blocked'].includes(state.phase);
    const mission={patientId:state.missionPatientId,name:'대기 환자 R',nameEn:'Waiting patient R',status:state.core.request.status,type:state.core.request.type,needs:copy(state.core.request.needs),bedNumber:state.core.request.status==='admitted'||state.core.request.status==='reserved'?bed.number:null};
    const candidateView={id:candidate.id,patientId:candidate.id,name:'검토 환자 A',nameEn:'Patient A',bedId:bed.id,bedNumber:bed.number,location:candidate.location,clinicalApproval:!!candidate.readiness.clinicalApproval,clinicalApprovalDocument:candidate.readiness.clinicalApprovalDocument};
    return {scenario:copy(scenarios.find(s=>s.id===state.scenarioId)),stages:copy(stages),stageIndex:state.stageIndex,phase:state.phase,headline:state.headline,headlineEn:state.headlineEn,title:state.headline,titleEn:state.headlineEn,message:state.message,messageEn:state.messageEn,activeTool:state.activeTool,latest:{title:state.headline,titleEn:state.headlineEn,message:state.message,messageEn:state.messageEn,tool:state.activeTool},hour:state.core.hour,time:coreView.time,mission,request:{...coreView.request,name:mission.name,nameEn:mission.nameEn},candidate:candidateView,snapshot:state.snapshot || coreView.snapshot,prediction,forecasts:copy(prediction),readiness:copy(state.readiness),missing:copy(missing),report:copy(state.report),suggestions:copy(state.history.slice(-3)),history:copy(state.history),tooltrace:copy(state.tooltrace),trace:copy(state.tooltrace),canNext:!paused&&!completed,canApprove,needsApproval:canApprove,completed,done:completed,pauseReason:state.phase==='human-review'?'human-review':state.phase==='workflow-blocked'?'unresolved-prerequisite':null,coreView,beds:coreView.beds,notice:'가상 환자·예측·운영 기록으로 진행하는 시뮬레이션 · 실제 LLM 호출 없음',noticeEn:'Simulation using authored patients, forecasts and operational records · no live LLM calls',predictionSource:'시나리오 예시 · 실제 모델 추론 아님',predictionSourceEn:'Authored example · not model inference'};
  }
  return Object.freeze({scenarios:copy(scenarios),getScenarios:()=>copy(scenarios),stages:copy(stages),create,createSession:create,validate,next,step:next,advance:next,approve,view,getView:view});
});
