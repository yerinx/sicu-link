/* A moving, deterministic admission story. No network calls, LLM, or real patient data. */
(()=>{
  'use strict';
  const PANEL='bedOpsSimulation';
  const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ko=()=>String(document.documentElement.lang||window.I18n?.language||'ko').startsWith('ko');
  const t=(kr,en)=>ko()?kr:en;
  const M=()=>window.SICUAdmissionStory;
  const list=x=>Array.isArray(x)?x:[];
  const localized=(x,key='label')=>typeof x==='string'?x:String(x?.[ko()?key:key+'En']??x?.[key]??x?.[key+'En']??'');
  const standalone=()=>document.body?.dataset.admissionStory==='standalone';
  let hasStarted=false,mapEnabled=true;
  let session=null,expanded=true,playing=false,timer=null,observer=null,rendering=false,error='',resumeAfterApproval=false,lastStage=0,raf=null;
  const current=()=>session&&M()?M().view(session):null;
  const clock=v=>v.time||String(14+Number(v.hour||0)).padStart(2,'0')+':00';
  const bedStatus=x=>({occupied:t('재실','Occupied'),transferring:t('이동 중','Moving'),transfer:t('이동 중','Moving'),cleaning:t('정리 중','Cleaning'),reserved:t('준비 중','Preparing'),available:t('사용 가능','Ready'),vacant:t('사용 가능','Ready')})[x]||x;
  const stageLabels=()=>[t('입실 요청','Request'),t('환자·예측','Forecast'),t('추가 확인','Agent check'),t('보고 준비','Handover'),t('의료진 검토','Human review'),t('입실 준비','Bed readiness')];
  const botIcon='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5V2m-2 0h4M6 13H3v9h3m20-9h3v9h-3"/><rect x="6" y="7" width="20" height="21" rx="7"/><circle cx="12" cy="16" r="1.5"/><circle cx="20" cy="16" r="1.5"/><path d="M12 22h8"/></svg>';
  function stopTimer(){if(timer!==null){clearTimeout(timer);timer=null;}}
  function pause(){playing=false;resumeAfterApproval=false;stopTimer();render();}
  function schedule(){stopTimer();const v=current();if(!playing||!expanded||document.hidden||!v||v.completed||v.canApprove||!v.canNext)return;timer=setTimeout(()=>{timer=null;advance(true);},2850);}
  function commit(fn){try{session=fn(session);error='';const v=current();if(v.canApprove){resumeAfterApproval=playing;playing=false;}if(v.completed||(!v.canNext&&!v.canApprove)){playing=false;resumeAfterApproval=false;}render();schedule();}catch(err){error=err?.message||t('현재 장면을 확인해 주세요.','Check the current scene.');playing=false;stopTimer();render();}}
  function advance(fromTimer=false){const v=current();if(!v||v.completed||v.canApprove)return;hasStarted=true;mapEnabled=true;if(!fromTimer){playing=false;resumeAfterApproval=false;stopTimer();}commit(s=>M().next(s));}
  function play(){const v=current();if(!v)return;if(!v.canNext&&!v.completed&&!v.canApprove)return;if(v.canApprove){resumeAfterApproval=true;render();return;}if(v.completed)reset(v.scenarioId||session.scenarioId||'transfer-delay');expanded=true;hasStarted=true;mapEnabled=true;playing=true;resumeAfterApproval=false;render();schedule();}
  function approve(){const v=current();if(!v?.canApprove)return;hasStarted=true;mapEnabled=true;const resume=resumeAfterApproval;resumeAfterApproval=false;commit(s=>M().approve(s));playing=resume&&!current().completed;render();schedule();}
  function reset(id='transfer-delay'){stopTimer();hasStarted=false;mapEnabled=true;playing=false;resumeAfterApproval=false;error='';session=M().create(id,{hospital:'OPS-SIM',ward:'OPS-SIM-SICU'});lastStage=0;render();}
  function isMapActive(){return !standalone()&&expanded&&hasStarted&&mapEnabled;}
  function stopMap(){mapEnabled=false;if(!standalone())expanded=false;playing=false;resumeAfterApproval=false;stopTimer();if(rendering)queueMicrotask(render);else render();}
  function setExpanded(value){expanded=Boolean(value)||standalone();if(!expanded){playing=false;resumeAfterApproval=false;stopTimer();}render();}
  function percent(x){const n=Number(x);return x===null||x===undefined||!Number.isFinite(n)?'—':(n<=1?n*100:n).toFixed(1)+'%';}
  function predictionMetric(p,type){if(!p?.current)return t('조회 전','Not checked');p=p.current;if(type==='mortality')return p.mortalityPercent!==undefined?Number(p.mortalityPercent).toFixed(1)+'%':percent(p.mortalityProbability??p.mortality??p.hospitalMortality??p.mortalityRisk);return Number.isFinite(p.wardTransferRemainingDays)?p.wardTransferRemainingDays.toFixed(1)+t('일',' days'):t('미확인','Unknown');}
  function scenarios(){const m=M();return typeof m?.getScenarios==='function'?m.getScenarios():list(m?.scenarios);}
  function infoText(value){if(value===null||value===undefined)return '';if(typeof value==='string'||typeof value==='number')return String(value);if(Array.isArray(value))return value.map(infoText).filter(Boolean).join(' · ');return localized(value,'summary')||localized(value,'message')||localized(value,'detail')||localized(value,'text')||Object.entries(value).filter(([k])=>!k.endsWith('En')).slice(0,8).map(([k,v])=>k+': '+infoText(v)).join(' · ');}
  function human(value,v){
    const bed=v?.candidate?.bedNumber||'03';
    return String(value??'').replace(/대기 환자 R|환자 R|Waiting patient R|patient R/gi,t('입실 대기 환자','incoming patient')).replace(/검토 환자 A|환자 A|Patient A/gi,t(bed+'번 병상 환자','patient in bed '+bed)).replace(/A의/g,t(bed+'번 환자의','the patient’s')).replace(/R의/g,t('새 환자의','the incoming patient’s')).replace(/\bA\b/g,t(bed+'번 환자','bed '+bed+' patient')).replace(/\bR\b/g,t('새 환자','incoming patient'));
  }
  function forecastHTML(v){
    // Foreground values follow the simulation clock. Completed agent lookups stay
    // untouched in v.prediction and the evidence ledger; they are not fresh calls.
    if(!hasStarted||(!standalone()&&!isMapActive()))return '';
    const patientId=v.candidate?.patientId||v.candidate?.id;
    const p=list(v.coreView?.predictions).find(row=>row.patientId===patientId);
    if(!p?.current||p.currentLocation!=='ICU'||!p.isCurrent||Number(p.current.hour)!==Number(v.hour))return '';
    return '<div class="ops-forecast-strip" data-forecast-state="current" data-forecast-hour="'+E(v.hour)+'" data-forecast-patient="'+E(patientId)+'"><span class="ops-authored">'+E(t('가상 시연 예시','Fictional demo examples'))+'</span><span>'+E(t(v.candidate.bedNumber+'번 병상 · 원내 사망 위험','Bed '+v.candidate.bedNumber+' · In-hospital mortality'))+' <strong>'+E(predictionMetric(p,'mortality'))+'</strong></span><span>'+E(t('ICU 퇴실까지 남은 시간','Time remaining to ICU exit'))+' <strong>'+E(predictionMetric(p,'transfer'))+'</strong></span><small>'+E((p.lastAssessmentTime||clock(v))+t(' · 모델 추론 아님',' · not model inference'))+'</small></div>';
  }
  function railHTML(v){const index=Math.min(5,Math.max(0,Number(v.stageIndex)||0));return '<div class="ops-rail-scroll"><div class="ops-rail" aria-label="'+E(t('입실 준비 진행 흐름','Admission preparation workflow'))+'"><div class="ops-rail-line"></div><div class="ops-rail-progress" style="width:'+(index/6*100)+'%"></div>'+stageLabels().map((name,i)=>'<div class="ops-stage" data-stage="'+i+'" data-state="'+(v.completed?'done':i<index?'done':i===index?'active':'pending')+'"'+(i===index?' aria-current="step"':'')+'><span class="ops-stage-dot">'+(i<index||v.completed?'✓':String(i+1))+'</span><strong>'+E(name)+'</strong></div>').join('')+'<div class="ops-moving-agent" style="left:'+((lastStage+.5)/6*100)+'%" aria-hidden="true">'+botIcon+'<span>LINK</span></div></div></div>';}
  function proposal(v){
    const b=v.candidate?.bedNumber||'03',phase=v.phase,missing=list(v.missing),cancelled=localized(v,'headline').includes(ko()?'취소':'cancelled');
    if(v.completed)return {title:t('입실 요청을 마무리했습니다','The admission request is complete'),text:t(b+'번 병상에 새 환자의 입실까지 확인했습니다. 다음 요청이 오면 다시 병상과 준비 조건부터 확인하겠습니다.','The incoming patient is now admitted to bed '+b+'. Start again from occupancy and prerequisites for the next request.'),next:''};
    if(phase==='request')return {title:t('새 ICU 입실 요청이 도착했습니다','A new ICU admission request has arrived'),text:t((v.request?.type==='readmission'?'일반병동에서 ICU 재입실 요청 1건이 있습니다.':'응급실 입실 요청 1건이 있습니다.')+' 필요한 병상과 준비 조건부터 살펴보는 안을 제안합니다.',(v.request?.type==='readmission'?'One ward-to-ICU readmission request is waiting.':'One emergency admission request is waiting.')+' Start by checking the required bed and preparation conditions.'),next:t('병상부터 확인','Check occupancy')};
    if(phase==='snapshot')return {title:t((v.coreView?.snapshot?.occupied??v.snapshot?.occupied??0)+'/8병상이 사용 중입니다',String(v.coreView?.snapshot?.occupied??v.snapshot?.occupied??0)+' of 8 beds are occupied'),text:t('전실 가능성을 검토할 근거를 모으겠습니다. 아직 이동이나 병상 확보를 진행하지 않습니다.','Gather the evidence needed to review a transfer before starting movement or reserving a bed.'),next:t('환자·예측 확인','Review patient forecast')};
    if(phase==='forecast')return {title:t('일반병동 수용·이송 준비를 먼저 확인하겠습니다','Check ward acceptance and transport preparation'),text:t('예측만으로 전실을 결정하지 않습니다. 담당의 결정 기록과 수용 병동·인력·장비 조건을 함께 확인하겠습니다.','Check the recorded clinical decision, receiving ward, staffing and equipment alongside the forecast.'),next:t('전실 조건 확인','Check prerequisites')};
    if(phase==='check-start')return {title:cancelled?t('수용 병동 확인이 취소됐습니다','Receiving ward acceptance has been cancelled'):t('새 수용·이송 확인 기록이 도착했습니다','New acceptance and transport records have arrived'),text:cancelled?t(b+'번 병상은 사용 중으로 유지합니다. 새 환자도 대기 상태를 유지하고, 확인 결과에 따라 다음 준비를 바꾸겠습니다.','Keep bed '+b+' occupied and the incoming patient waiting. Adjust the next preparation step to the returned result.'):t('시간이 지나 확인 기록이 달라졌습니다. 같은 병상 환자의 조건을 다시 확인한 뒤 진행하겠습니다.','Records have changed with time. Recheck the same patient’s prerequisites before proceeding.'),next:t('준비 상태 다시 조회','Recheck readiness')};
    if(phase==='readiness'&&missing.length)return {title:t('미확인 조건이 해결될 때까지 전실을 보류하겠습니다','Hold the transfer until the outstanding condition is confirmed'),text:t(human(missing.map(x=>localized(x,'label')).join(' · '),v)+' 항목이 아직 확인되지 않았습니다. 다음 기록이 오면 다시 조회하겠습니다.','Outstanding: '+missing.map(x=>localized(x,'label')).join(' · ')+'. Wait for the next record, then check again.'),next:t('다음 확인 이어가기','Continue the next check')};
    if(phase==='readiness'||phase==='refreshed')return {title:t('확인된 조건으로 전실·입실 준비 순서를 만들겠습니다','Build a preparation sequence from the confirmed conditions'),text:t(b+'번 환자의 최신 자료를 다시 확인하고, 이동 완료 → 병상 정리 → 새 환자 입실 순서로 준비하겠습니다.','Recheck the current patient data, then prepare transfer confirmation, bed turnover and the incoming admission.'),next:t(phase==='refreshed'?'운영안 작성':'환자 자료 재확인',phase==='refreshed'?'Prepare work plan':'Recheck patient data')};
    if(phase==='planned')return {title:t(b+'번 전실 → 정리 → 새 환자 입실 순서를 제안합니다','Proposed sequence: transfer from bed '+b+' → turnover → new admission'),text:t('확인한 근거와 남은 작업을 한 장으로 모아 담당자에게 검토를 요청하겠습니다.','Collect the checked evidence and remaining work into one report for the responsible reviewer.'),next:t('검토 자료 모으기','Prepare review report')};
    if(phase==='report'||phase==='human-review')return {title:phase==='report'?t('담당자 검토를 위한 보고 자료를 모았습니다','The handover evidence is ready for review'):t(b+'번 전실 → 정리 → 새 환자 입실 순서를 검토해 주세요','Review the proposed transfer, turnover and admission sequence'),text:t('담당의 전실 결정은 시나리오에 이미 기록돼 있습니다. 여기서는 확인한 운영 순서만 승인하며, 승인 전에는 이동을 시작하지 않습니다.','The clinical transfer decision is already documented in this scenario. Approve only the checked operational sequence; movement waits for approval.'),next:t('담당자 검토로 이동','Move to human review')};
    if(phase==='approved')return {title:t('검토한 운영 순서가 승인됐습니다','The reviewed operational sequence is approved'),text:t('병상을 바로 비우지 않고, 실제 시연 이동이 끝난 다음 정리를 시작하겠습니다.','Keep the bed occupied until the simulated transfer is confirmed, then start turnover.'),next:t('이동 완료 확인','Confirm transfer completion')};
    if(phase==='workflow')return {title:localized(v,'headline').includes(ko()?'정리 완료':'Turnover complete')?t(b+'번 병상 정리가 끝났습니다','Bed '+b+' turnover is complete'):t(b+'번 환자의 전실이 완료됐습니다','The patient’s transfer from bed '+b+' is complete'),text:t('이동·정리·예약·입실을 차례로 확인합니다. 확인이 끝나기 전에 다음 단계로 넘기지 않겠습니다.','Verify transfer, turnover, reservation and admission in order before proceeding to the next step.'),next:localized(v,'headline').includes(ko()?'정리 완료':'Turnover complete')?t('입실 완료 확인','Confirm admission'):t('정리 완료 확인','Confirm turnover')};
    return {title:t('조건을 확인할 수 없어 진행을 보류합니다','Hold while the prerequisite remains unresolved'),text:human(localized(v,'message'),v),next:t('다음 준비 확인','Check next preparation')};
  }
  function messageIntent(v){
    if(!standalone()&&!isMapActive())return {kind:'report',label:t('에이전트 시연 준비','Agent demo ready')};
    if(v.phase==='readiness'&&list(v.missing).length)return {kind:'hold',label:t('진행 보류','On hold')};
    if(v.completed)return {kind:'complete',label:t('완료 보고','Completed')};
    if(v.phase==='human-review')return {kind:'approval',label:t('승인 요청','Approval request')};
    if(v.phase==='workflow-blocked')return {kind:'hold',label:t('진행 보류','On hold')};
    if(v.phase==='report')return {kind:'report',label:t('보고 준비','Handover ready')};
    if(['approved','workflow'].includes(v.phase))return {kind:'report',label:t('진행 상황','Progress report')};
    if(['request','snapshot','check-start'].includes(v.phase))return {kind:'report',label:t('상황 보고','Situation report')};
    return {kind:'proposal',label:t('다음 제안','Suggested next step')};
  }
  function compactProposal(v){
    const b=v.candidate?.bedNumber||'03';
    if(!standalone()&&!isMapActive())return t('시작하면 LINK가 기록을 확인하고 다음 행동을 제안합니다','Start LINK to review records and suggest the next action');
    if(v.completed)return t(b+'번 병상, 새 환자 입실 완료','New admission to bed '+b+' is complete');
    if(v.canApprove)return t(b+'번 전실·정리·입실 순서를 검토해 주세요','Review transfer, turnover and admission for bed '+b);
    const lines={request:['새 입실 요청을 확인합니다','Review the new admission request'],snapshot:['병상 현황을 확인했습니다. 환자 전망을 살펴보세요','Occupancy checked. Review the patient forecast'],forecast:['수용 병동과 이송 준비를 먼저 확인하세요','Check ward acceptance and transport first'],refreshed:['확인한 조건으로 운영안을 작성하세요','Prepare a work plan from the confirmed conditions'],planned:['전실 → 정리 → 새 입실 순서를 제안합니다','Suggested sequence: transfer → turnover → admission'],report:['검토 자료를 모았습니다','The review evidence is ready'],approved:['승인됐습니다. 이동 완료를 확인하세요','Approved. Confirm transfer completion']};
    if(v.phase==='check-start')return localized(v,'headline');
    if(v.phase==='readiness')return list(v.missing).length?t('미확인 조건이 해결될 때까지 전실을 보류하세요','Hold the transfer until the missing condition is confirmed'):t('같은 환자의 최신 자료를 다시 확인하세요','Recheck the same patient’s latest records');
    return lines[v.phase]?t(...lines[v.phase]):proposal(v).title;
  }
  const flowIcon=kind=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+({request:'<path d="M4 12h13m-5-5 5 5-5 5M19 5h2v14h-2"/>',bed:'<path d="M3 19V7m0 8h18v4M7 9h5v5H7zM13 11h8v4"/>',ready:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'})[kind]+'</svg>';
  function caseFlowHTML(v){
    const b=v.candidate?.bedNumber||'03',bed=list(v.coreView?.beds).find(x=>String(x.number).padStart(2,'0')===b),status=bed?.status;
    const live=standalone()||isMapActive();
    const moved=live&&(['cleaning','reserved'].includes(status)||v.completed);
    const target=!live?t('가상 시연 대상 병상','Fictional story target'):v.completed?t('전실·정리 완료','Transfer and turnover done'):status==='cleaning'?t('전실 완료 · 정리 중','Transferred · turnover'):status==='reserved'?t('정리 완료 · 입실 예약','Turnover done · reserved'):t('현재 재실 · 전실 확인','Occupied · review transfer');
    return '<div class="ops-case-flow" aria-label="'+E(t('한 입실 요청과 병상의 연결','One request and its bed'))+'"><div class="ops-flow-node" data-state="'+(v.completed?'done':'active')+'"><span class="ops-flow-icon">'+flowIcon('request')+'</span><div><small>'+E(v.request?.type==='readmission'?t('일반병동 → ICU','Ward → ICU'):t('응급실 → ICU','Emergency → ICU'))+'</small><strong>'+E(v.completed?t('입실 요청 완료','Request complete'):t('입실 요청 1건','One admission request'))+'</strong></div></div><span class="ops-flow-connector" aria-hidden="true">→</span><div class="ops-flow-node ops-flow-target" data-state="'+(moved?'done':'active')+'"><span class="ops-flow-bed">'+E(b)+'</span><div><small>'+E(t('ICU 병상','ICU bed'))+'</small><strong>'+E(target)+'</strong></div></div><span class="ops-flow-connector" aria-hidden="true">→</span><div class="ops-flow-node" data-state="'+(v.completed?'done':'pending')+'"><span class="ops-flow-icon">'+flowIcon('ready')+'</span><div><small>'+E(t('이번 요청의 목표','This request’s goal'))+'</small><strong>'+E(v.completed?t('새 환자 입실 확인','New admission confirmed'):t('새 환자 입실까지 확인','Confirm the new admission'))+'</strong></div></div></div>';
  }
  function actionHTML(v){
    const p=proposal(v),intent=messageIntent(v),b=v.candidate?.bedNumber||'03';
    const completed='<div class="ops-completion-flow"><span>✓ '+E(t('전실 확인','Transfer confirmed'))+'</span><i>→</i><span>✓ '+E(t('정리 완료','Turnover done'))+'</span><i>→</i><span>✓ '+E(t('새 입실','New admission'))+'</span></div>';
    return '<div class="ops-proposal-card" data-intent="'+intent.kind+'" data-kind="'+(v.completed?'complete':v.canApprove?'approval':'normal')+'"><div class="ops-proposal-top"><span class="ops-agent-avatar">'+botIcon+'</span><div><span class="ops-agent-label">LINK · '+E(intent.label)+'</span><small>'+E(!standalone()&&!isMapActive()?t('규칙 기반 운영 시뮬레이션','Rule-based operational simulation'):t(b+'번 병상과 연결됨','Connected to bed '+b))+'</small></div></div><h4 class="ops-current-sentence" role="status" aria-live="polite">'+E(compactProposal(v))+'</h4><div class="ops-proposal-bottom">'+(v.canApprove?'<button type="button" class="ops-primary ops-approve" data-ops-action="approve">'+E(t('검토·작업 승인 (시연)','Review and approve work (demo)'))+'</button>':v.completed?completed:'<button type="button" class="ops-primary" data-ops-action="next"'+(!v.canNext?' disabled':'')+'>'+E(p.next)+' →</button>')+'</div></div>';
  }
  function auditHTML(v,open){
    const rows=list(v.tooltrace||v.trace),report=v.report;
    const reportText=report?'<div class="ops-report"><p><b>'+E(t('요약','Summary'))+'</b><span>'+E(human(localized(report,'summary'),v))+'</span></p>'+list(report.sections).map(section=>'<p><b>'+E(localized(section,'label'))+'</b><span>'+E(human(localized(section,'text'),v))+'</span></p>').join('')+'<p><b>'+E(t('다음 작업','Next actions'))+'</b><span>'+E(human(list(ko()?report.nextSteps:report.nextStepsEn).join(' → '),v))+'</span></p><p><b>'+E(t('근거 연결','Evidence links'))+'</b><span>'+E(list(report.evidenceIds).join(' · '))+'</span></p></div>':'<p class="ops-empty-evidence">'+E(t('확인한 내용으로 보고를 준비하는 장면에서 생성됩니다.','Created in the handover scene using the checked evidence.'))+'</p>';
    return '<details class="ops-evidence"'+(open?' open':'')+'><summary>'+E(t('근거·보고 초안·AX 검토','Evidence, handover draft & AX review'))+' <span>'+E(rows.length)+E(t('건 확인',' checks'))+'</span></summary><div class="ops-evidence-inner"><section class="ops-current-context"><h4>'+E(t('현재 장면의 설명','Current scene context'))+'</h4><p>'+E(proposal(v).text)+'</p>'+(rows.length?'<p class="ops-last-check"><span>✓ '+E(t('최근 확인','Last checked'))+'</span>'+E(human(localized(rows.at(-1),'summary'),v))+'</p>':'')+'</section><p class="ops-evidence-notice">'+E(t('이 시연은 로컬 도구 조회와 규칙 분기로 진행합니다. 실제 LLM·병원 시스템을 호출하지 않습니다.','This story uses local tool lookups and rule-based branching, without calling an LLM or hospital system.'))+'</p><div class="ops-evidence-columns"><section><h4>'+E(t('완료한 도구 조회','Completed tool lookups'))+'</h4>'+(rows.length?'<ol class="ops-tooltrace">'+rows.map(row=>'<li><div><time>'+E(row.time||clock(row))+'</time><code>'+E(row.tool||row.action||'local_check')+'</code><small>'+E(row.id)+'</small></div><p>'+E(human(localized(row,'summary')||infoText(row.result),v))+'</p><details class="ops-raw-result"><summary>'+E(t('도구 반환값','Tool result'))+'</summary><pre>'+E(human(JSON.stringify(row.result,null,2),v))+'</pre></details></li>').join('')+'</ol>':'<p class="ops-empty-evidence">'+E(t('시연을 시작하면 실제 실행한 로컬 조회가 쌓입니다.','Start the story to record completed local checks.'))+'</p>')+'</section><section><h4>'+E(t('정해진 양식의 보고 초안','Template handover draft'))+'</h4>'+reportText+'<a class="ops-ax-link" href="ops-ax-review.html" target="_blank" rel="noopener">'+E(t('AX 팀 논의 메모 ↗','AX discussion notes ↗'))+'</a></section></div></div></details>';
  }
  function render(){
    const panel=document.getElementById(PANEL),v=current();if(!panel||!v||rendering)return;rendering=true;
    try{
      const auditOpen=panel.querySelector('.ops-evidence')?.open||false,id=v.scenario?.id||session.scenarioId||'transfer-delay';if(standalone())expanded=true;
      panel.innerHTML='<div class="ops-heading"><div><span class="ops-kicker">SICU LINK</span><h3>'+E(t('대기 환자 한 명의 ICU 입실 준비','Prepare ICU admission for one waiting patient'))+'</h3></div><div class="ops-heading-actions"><span class="ops-mode">'+E(t('규칙 기반 시연','Rule-based demo'))+'</span>'+(!standalone()?'<button type="button" data-ops-action="toggle" aria-expanded="'+expanded+'" aria-controls="opsStoryBody">'+E(expanded?t('접기 ▴','Collapse ▴'):t('LINK 에이전트 열기 ▾','Open LINK agent ▾'))+'</button>':'')+'</div></div><div id="opsStoryBody"'+(expanded?'':' hidden')+'><div class="ops-controls"><button type="button" data-ops-action="'+(playing?'pause':'play')+'"'+(v.canApprove?' disabled':'')+'>'+E(playing?t('Ⅱ 일시정지','Ⅱ Pause'):v.completed?t('↻ 다시 보기','↻ Replay'):!hasStarted?t('▶ LINK 에이전트 시연 시작','▶ Start LINK agent demo'):t('▶ 이어서 재생','▶ Resume demo'))+'</button><button type="button" class="ops-reset" data-ops-action="reset" aria-label="'+E(t('처음부터','Reset story'))+'">↺</button><label class="ops-scenario-label"><span>'+E(t('상황','Scenario'))+'</span><select id="opsStoryScenario" aria-label="'+E(t('시연 상황 선택','Choose a scenario'))+'">'+scenarios().map(s=>'<option value="'+E(s.id)+'"'+(s.id===id?' selected':'')+'>'+E(localized(s,'title')||s.id)+'</option>').join('')+'</select></label><div class="ops-training-clock"><small>'+E(t('시연 시각','Training time'))+'</small><output>'+E(clock(v))+'</output></div>'+(!standalone()?'<button type="button" data-ops-action="stop-map" class="ops-stop-map"'+(!isMapActive()?' hidden':'')+'>'+E(t('시연 종료 · 원래 병동으로','Exit demo · restore ward'))+'</button><a class="ops-large-link" href="admission-story.html" target="_blank" rel="noopener">'+E(t('크게 보기 ↗','Full view ↗'))+'</a>':'<a class="ops-large-link" href="index.html?lang=ko&hospital=A&ward=SICU&workspace=hospital#ward">'+E(t('기존 병동 지도에서 보기 ↗','View on the existing ward map ↗'))+'</a>')+'</div>'+railHTML(v)+caseFlowHTML(v)+forecastHTML(v)+(error?'<p class="ops-error" role="alert">'+E(error)+'</p>':'')+actionHTML(v)+auditHTML(v,auditOpen)+'<p class="ops-footnote">'+E(t('가상 환자·가상 예측값 · 기존 병동 지도에 시연 상태를 표시하며 실제 자료는 바꾸지 않습니다','Fictional patients and forecasts · temporary story state on the existing ward map · source data remain unchanged'))+'</p></div>';
      panel.dataset.standalone=String(standalone());panel.dataset.scenario=id;panel.dataset.phase=v.phase;panel.dataset.stage=String(v.stageIndex);panel.dataset.hour=String(v.hour);panel.dataset.playing=String(playing);
      const workspace=document.getElementById('sicuAdmissionWorkspace');if(workspace){workspace.dataset.expanded=String(expanded);workspace.dataset.intent=messageIntent(v).kind;workspace.dataset.complete=String(!!v.completed);workspace.dataset.active=String(isMapActive());}
      const marker=panel.querySelector('.ops-moving-agent'),stage=Math.min(5,Math.max(0,Number(v.stageIndex)||0));if(raf!==null)cancelAnimationFrame(raf);if(marker){marker.getBoundingClientRect();raf=requestAnimationFrame(()=>{marker.style.left=((stage+.5)/6*100)+'%';raf=null;});}lastStage=stage;
      if(typeof CustomEvent==='function'&&typeof document.dispatchEvent==='function')document.dispatchEvent(new CustomEvent('sicu-admission-scene',{detail:{view:v,active:isMapActive()}}));
    }finally{rendering=false;}
  }
  function bind(panel){if(panel.dataset.opsBound)return;panel.dataset.opsBound='true';panel.addEventListener('click',event=>{const b=event.target.closest('[data-ops-action]');if(!b||b.disabled)return;const action=b.dataset.opsAction;if(action==='toggle')setExpanded(!expanded);else if(action==='play')play();else if(action==='pause')pause();else if(action==='next')advance();else if(action==='approve')approve();else if(action==='stop-map')stopMap();else if(action==='reset')reset(current()?.scenarioId||session?.scenarioId||'transfer-delay');});panel.addEventListener('change',event=>{if(event.target.id==='opsStoryScenario')reset(event.target.value);});}
  function ensureWorkspace(panel,anchor){
    // A stable sibling shell: map nodes never enter the render-replaced panel.
    if(standalone())return;
    const floors=document.getElementById('floors');if(!floors||!panel.parentElement)return;
    let shell=document.getElementById('sicuAdmissionWorkspace');
    if(!shell){shell=document.createElement('div');shell.id='sicuAdmissionWorkspace';if(anchor)anchor.after(shell);else panel.before(shell);}
    if(panel.parentElement!==shell)shell.append(panel);
    if(floors.parentElement!==shell)shell.append(floors);
  }
  function ensureAgentEntry(){
    const nav=document.getElementById('workspaceNav');if(!nav)return;
    let button=document.getElementById('openLinkAgent');
    if(!button){
      button=document.createElement('button');button.id='openLinkAgent';button.type='button';
      button.dataset.noTranslate='';nav.append(button);
      button.addEventListener('click',()=>{
        document.querySelector('#workspaceNav [data-workspace-view="ward"]')?.click();
        setExpanded(true);
        if(!hasStarted)play();
        requestAnimationFrame(()=>document.getElementById(PANEL)?.scrollIntoView({behavior:'smooth',block:'start'}));
      });
    }
    button.innerHTML=botIcon+'<span>'+E(t('LINK 에이전트','LINK agent'))+'</span>';
    button.setAttribute('aria-label',t('LINK 에이전트 입실 준비 시연 열기','Open LINK agent admission demo'));
  }
  function mount(){if(!M())return false;let panel=document.getElementById(PANEL);const standaloneAnchor=document.getElementById('bedOpsSimulationAnchor'),anchor=document.getElementById('demoMonthWard'),fallback=document.getElementById('unifiedReplay');if(!panel){if(!standaloneAnchor&&!anchor&&!fallback)return false;panel=document.createElement('section');panel.id=PANEL;if(standaloneAnchor)standaloneAnchor.append(panel);else if(anchor)anchor.after(panel);else fallback.before(panel);}panel.setAttribute('aria-label',t('대기 환자의 ICU 입실 준비 시연','Waiting patient ICU admission story'));bind(panel);ensureWorkspace(panel,anchor);ensureAgentEntry();if(standalone())expanded=true;if(!session)reset();else render();if(observer){observer.disconnect();observer=null;}return true;}
  function setup(){if(mount())return;observer=new MutationObserver(()=>{if(!document.getElementById(PANEL))mount();});observer.observe(document.body,{childList:true,subtree:true});}
  document.addEventListener('sicu-admission-context-changed',event=>{if(event?.detail?.reason)error=String(event.detail.reason);stopMap();});
  document.addEventListener('sicu-admission-focus-proposal',()=>{document.querySelector('#bedOpsSimulation .ops-proposal-card')?.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  document.addEventListener('icu-language',()=>queueMicrotask(()=>mount()));
  document.addEventListener('sicu-demo-month',()=>{if(!document.getElementById(PANEL))mount();});
  window.addEventListener('pagehide',()=>{stopTimer();playing=false;resumeAfterApproval=false;});
  window.SICUBedOpsSimUI=Object.freeze({mount,render,describe:current,reset,setExpanded,play,pause,next:()=>advance(),approve,stopMap,isMapActive,isPlaying:()=>playing});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
