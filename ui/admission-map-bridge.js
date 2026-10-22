/* Project the local admission story onto the existing ward illustration.
 * DOM presentation only: never writes S, source fixtures, storage or patient data.
 */
(function(root){
  'use strict';
  if(root.SICUAdmissionMap)return;
  const NS='http://www.w3.org/2000/svg';
  const current=()=>typeof S!=='undefined'&&S?S:null;
  const ko=()=>String(document.documentElement.lang||'ko').startsWith('ko');
  const t=(a,b)=>ko()?a:b;
  let scene=null,active=false,portal=null,layer=null,banner=null,guide=null,pin=null,proposal=null,proposalFirst=null,proposalSecond=null,arrow=null,callout=null;
  let signature='',reason='',transitioning=false,proposalKey='';
  const labelled=new Map();
  function svg(name,attrs,parent){const el=document.createElementNS(NS,name);Object.entries(attrs||{}).forEach(([k,v])=>el.setAttribute(k,String(v)));if(parent)parent.appendChild(el);return el;}
  function key(){const model=current();return JSON.stringify([document.querySelector('#hospitalScope')?.value,document.querySelector('#wardScope')?.value,model?.seed,model?.demo_month?.day,model?.demo_month?.minute]);}
  function findPortal(){
    const model=current();if(!model?.floors||!document.querySelector('#floors'))return null;
    const all=root.SICUWardSpaces?.contexts?.()||[];
    const selected=document.querySelector('#wardScope')?.value;
    const found=all.find(x=>x.id===selected)||all.find(x=>x.unit?.id?.endsWith('SICU')&&!/NSICU|CSICU|TSICU/.test(x.unit.id))||all[0];
    return found||null;
  }
  function describe(){return {active,ward:portal?.unit?.id||null,phase:scene?.phase||null,bedNumber:scene?.candidate?.bedNumber||null,reason,sourceDataChanged:false};}
  function detach(){
    if(portal){portal.svg.classList.remove('admission-map-scene');portal.row?.classList.remove('admission-map-row');portal.svg.querySelectorAll('[data-admission-status]').forEach(el=>el.removeAttribute('data-admission-status'));}
    labelled.forEach((label,el)=>{if(el.isConnected){if(label===null)el.removeAttribute('aria-label');else el.setAttribute('aria-label',label);}});labelled.clear();
    layer?.remove();banner?.remove();layer=banner=guide=pin=proposal=proposalFirst=proposalSecond=arrow=callout=null;portal=null;proposalKey='';
    delete document.body.dataset.admissionMapActive;
  }
  function clear(){active=false;scene=null;signature='';reason='';detach();}
  function contextChanged(){if(!active)return;clear();document.dispatchEvent(new CustomEvent('sicu-admission-context-changed'));}
  function makePortal(found){
    portal=found;portal.svg.classList.add('admission-map-scene');portal.row?.classList.add('admission-map-row');
    document.body.dataset.admissionMapActive='true';
    banner=document.createElement('div');banner.className='admission-map-banner';banner.dataset.noTranslate='';banner.setAttribute('role','status');
    // Keep the banner inside the existing map cell. Inserting a sibling
    // before the cell would become a third item in the ward row's two-column grid.
    portal.svg.before(banner);
    layer=svg('g',{class:'admission-map-overlay','pointer-events':'none'},portal.svg);
    svg('g',{class:'admission-sim-occupants','aria-hidden':'true'},layer);
    svg('g',{class:'admission-sim-care-icons','aria-hidden':'true'},layer);
    svg('g',{class:'admission-map-forecasts','aria-hidden':'true'},layer);
    arrow=svg('g',{class:'admission-map-target'},layer);
    svg('path',{d:'M0-.65V.6m-.24-.25L0 .64l.24-.29'},arrow);
    callout=svg('text',{class:'admission-map-callout','text-anchor':'middle',y:1.13},arrow);
    // The guide and its speech are one moving object. Child offsets are fixed.
    guide=svg('g',{class:'admission-map-guide','data-ready':'false',role:'button',tabindex:'0','aria-haspopup':'dialog','aria-controls':'admissionAssistantDialog','aria-expanded':'false'},layer);
    proposal=svg('g',{class:'admission-map-proposal',transform:'translate(.95 -.77)'},guide);
    svg('rect',{x:0,y:0,width:1,height:1.58,rx:.3,class:'admission-proposal-surface'},proposal);
    svg('path',{d:'M.02 .58l-.32 .21.32 .21',class:'admission-proposal-tail'},proposal);
    svg('text',{x:.37,y:.36,class:'admission-proposal-heading'},proposal);
    proposalFirst=svg('text',{x:.37,y:.86,class:'admission-proposal-action admission-proposal-first'},proposal);
    proposalSecond=svg('text',{x:.37,y:1.37,class:'admission-proposal-action admission-proposal-second'},proposal);
    pin=svg('g',{class:'admission-map-agent'},guide);
    svg('rect',{x:-.57,y:-.55,width:1.14,height:1.14,rx:.5,class:'admission-agent-background'},pin);
    svg('path',{d:'M0-.42V-.6m-.12 0h.24M-.38-.08h-.13v.4h.13m.76-.4h.13v.4H.38M-.33.33h.66V-.19h-.66ZM-.16.06h.02m.28 0h.02M-.13.22h.26',class:'admission-agent-drawing'},pin);
  }
  function renderOccupants(){
    const occupants=layer.querySelector('.admission-sim-occupants');
    const beds=scene?.coreView?.beds||scene?.beds||[];
    const existing=new Map([...occupants.children].map(el=>[el.getAttribute('data-admission-bed'),el]));
    const factory=root.SICUTransportVisuals?.bedPatient;
    portal.unit.beds.forEach((bed,index)=>{
      const number=String(bed.id).split('-').pop().padStart(2,'0');
      const training=beds.find(item=>String(item.number).padStart(2,'0')===number)||beds[index];
      const el=typeof bedEl!=='undefined'?bedEl[bed.id]:null;if(!training||!el)return;
      el.r.setAttribute('data-admission-status',training.status);
      const target=el.r.parentElement;
      if(!labelled.has(target))labelled.set(target,target.getAttribute('aria-label'));
      target.setAttribute('aria-label',t('입실 준비 시연 · 병상 ','Admission simulation · bed ')+number+' · '+({occupied:t('재실','occupied'),cleaning:t('정리 중','cleaning'),reserved:t('입실 준비 중','reserved'),available:t('사용 가능','available')})[training.status]);
      let art=existing.get(number);existing.delete(number);
      if(training.status!=='occupied'||!training.patientId){art?.remove();return;}
      if(!art){art=svg('g',{'data-admission-bed':number,class:'admission-sim-patient'},occupants);if(typeof factory==='function')art.innerHTML=factory({deceased:false});}
      const upper=Number(bed.y)<Number(portal.unit.h)/2;
      art.setAttribute('transform','translate('+(Number(bed.x)+2.25)+' '+(upper?2.3:11.5)+')'+(upper?'':' rotate(180)'));
    });
    existing.forEach(el=>el.remove());
  }
  function renderCareIcons(){
    const container=layer.querySelector('.admission-sim-care-icons');
    const previous=new Map([...container.children].map(el=>[el.getAttribute('data-admission-care-bed'),el]));
    const beds=scene?.coreView?.beds||scene?.beds||[];
    const factory=typeof Network!=='undefined'?Network.careMapIcons:null;
    portal.unit.beds.forEach((bed,index)=>{
      const number=String(bed.id).split('-').pop().padStart(2,'0');
      const training=beds.find(item=>String(item.number).padStart(2,'0')===number)||beds[index];
      let group=previous.get(number);previous.delete(number);
      if(training?.status!=='occupied'||!training.patientId){group?.remove();return;}
      if(!group)group=svg('g',{class:'admission-sim-care','data-admission-care-bed':number,'data-care-evidence':'not-linked'},container);
      const language=ko()?'ko':'en';
      if(group.getAttribute('data-care-language')!==language){
        group.replaceChildren();
        // Training patients are separate from the source ward patients. Preserve
        // the six familiar symbols without copying another patient's care state.
        if(typeof factory==='function'){try{group.innerHTML=factory(null);}catch(_){}}
        if(!group.children.length){
          for(let i=0;i<6;i++){
            const icon=svg('g',{class:'sicu-map-care','data-care-state':'null'},group);
            svg('rect',{x:0,y:.04,width:.69,height:.72,rx:.1,fill:'#f5f7fa',stroke:'#8291a2','stroke-width':.035,'stroke-dasharray':'.08 .06'},icon);
            const question=svg('text',{x:.345,y:.56,'text-anchor':'middle','font-size':.42,fill:'#8291a2'},icon);question.textContent='?';
          }
        }
        group.querySelectorAll('.sicu-map-care').forEach((icon,i)=>{
          icon.setAttribute('transform','translate('+((i%3)*.75)+' '+(Math.floor(i/3)*.84)+')');
          icon.setAttribute('data-care-state','null');
          icon.setAttribute('aria-label',t('시연 환자 간호 상태 미확인','Training patient care state unknown'));
        });
        group.setAttribute('data-care-language',language);
      }
      group.setAttribute('data-patient-id',training.patientId);
      group.setAttribute('transform','translate('+(Number(bed.x)-2.85)+' '+(Number(bed.y)-1.18)+') scale(1.3)');
    });
    previous.forEach(el=>el.remove());
  }
  function predictionForBed(training){
    const predictions=scene.coreView?.predictions||[];
    const patient=(scene.coreView?.patients||[]).find(p=>p.id===training.patientId);
    const prediction=predictions.find(p=>p.patientId===training.patientId)||patient?.prediction||patient?.predictions;
    const value=prediction?.current;
    const current=training.status==='occupied'&&!!training.patientId&&prediction?.patientId===training.patientId&&prediction.status==='active-icu'&&prediction.isCurrent===true&&value?.hour===scene.hour;
    const metric=key=>current&&typeof value?.[key]==='number'&&Number.isFinite(value[key])&&value[key]>=0&&value[key]<=100?value[key]:null;
    return {current,mortality:metric('mortalityPercent'),transfer:metric('transfer72hPercent'),assessmentHour:current?value.hour:null,assessmentTime:current?value.time:null};
  }
  function renderPredictions(){
    const container=layer.querySelector('.admission-map-forecasts');
    const previous=new Map([...container.children].map(el=>[el.getAttribute('data-forecast-bed'),el]));
    const beds=scene.coreView?.beds||scene.beds||[];
    portal.unit.beds.forEach((bed,index)=>{
      const number=String(bed.id).split('-').pop().padStart(2,'0');
      const training=beds.find(b=>String(b.number).padStart(2,'0')===number)||beds[index];if(!training)return;
      let badge=previous.get(number);previous.delete(number);
      if(!badge){
        badge=svg('g',{class:'admission-map-forecast','data-forecast-bed':number},container);
        svg('rect',{x:0,y:0,width:2.45,height:.9,rx:.23,class:'admission-forecast-surface admission-mortality-surface'},badge);
        svg('text',{x:.15,y:.56,class:'admission-prediction-label admission-mortality-label'},badge);
        svg('text',{x:2.30,y:.58,'text-anchor':'end',class:'admission-prediction-value admission-mortality-value'},badge);
        svg('rect',{x:4.85,y:0,width:2.45,height:.9,rx:.23,class:'admission-forecast-surface admission-transfer-surface'},badge);
        svg('text',{x:5,y:.56,class:'admission-prediction-label admission-transfer-label'},badge);
        svg('text',{x:7.15,y:.58,'text-anchor':'end',class:'admission-prediction-value admission-transfer-value'},badge);
        svg('title',{},badge);
      }
      const prediction=predictionForBed(training),percent=value=>value===null?'—':value.toFixed(1)+'%';
      const upper=Number(bed.y)<Number(portal.unit.h)/2;
      const numberY=upper?-.65:Number(portal.unit.h)+.65;
      badge.setAttribute('transform','translate('+(Number(bed.x)-3.65)+' '+(numberY-.46)+')');
      badge.setAttribute('data-patient-id',training.patientId||'');
      badge.setAttribute('data-assessment-hour',prediction.assessmentHour===null?'':prediction.assessmentHour);
      badge.setAttribute('data-forecast-state',prediction.current?'current':training.status==='occupied'?'missing':training.status);
      badge.querySelector('.admission-mortality-label').textContent=t('사망','Death');
      badge.querySelector('.admission-transfer-label').textContent=t('전과','Ward');
      badge.querySelector('.admission-mortality-value').textContent=percent(prediction.mortality);
      badge.querySelector('.admission-transfer-value').textContent=percent(prediction.transfer);
      badge.querySelector('title').textContent=t('사망: 원내 사망 위험 · 전과: 72시간 내 생존 전과 · ','Death: in-hospital mortality risk · Ward: alive ICU-to-ward transfer within 72h · ')+(prediction.current?t('가상 예측 · ','Authored forecast · ')+prediction.assessmentTime+t(' 평가 · 실제 모델 추론 아님',' assessment · not model inference'):training.status==='occupied'?t('현재 시각의 예측값 없음','No current-hour forecast'):t('ICU 재실 환자 없음 · 입실 전에는 예측하지 않습니다','No current ICU occupant · no prediction before admission'));
    });
    previous.forEach(el=>el.remove());
  }
  function proposalForScene(number){
    const missing=(scene.missing||[]).length>0;
    const occupied=scene.coreView?.snapshot?.occupied??scene.snapshot?.occupied??0;
    const cancelled=/취소/.test(scene.headline||'');
    const confirmed=/새 확인 기록/.test(scene.headline||'');
    const presets={
      request:[scene.coreView?.request?.type==='readmission'?t('ICU 재입실 요청 1건이 도착했습니다','One ICU readmission was requested'):t('새 ICU 입실 요청 1건이 도착했습니다','One new ICU admission was requested'),t('병상 현황 조회가 필요합니다','Bed occupancy needs to be checked')],
      snapshot:[t('현재 8병상 중 '+occupied+'병상 사용 중','Currently '+occupied+' of 8 beds are occupied'),t('입실 요청 1건이 대기 중입니다','One admission request is waiting')],
      forecast:[t('예측만으로 이동하지 말고','Before arranging any movement,'),t('수용·이송 조건을 확인하세요','check acceptance and transport')],
      'check-start':cancelled?[t('수용 병동 확인이 취소됐습니다','Ward acceptance was cancelled'),t('제안: 수용 조건을 재확인하세요','Next: recheck ward acceptance')]:confirmed?[t('새 확인 기록이 도착했습니다','A new confirmation record arrived'),t('제안: 준비 조건을 다시 조회하세요','Next: recheck the prerequisites')]:[t('새 확인 기록을 기다리고 있습니다','A confirmation record is pending'),t('제안: 미확인 조건을 재조회하세요','Next: recheck outstanding conditions')],
      readiness:missing?[t(number+'번 전실을 잠시 보류하고','Pause transfer from bed '+number),t('미확인 조건부터 확인하세요','and verify unmet conditions')]:[t('확인된 조건을 바탕으로','With the checked prerequisites,'),t('이동·정리 순서를 검토하세요','review transfer and turnover')],
      refreshed:[t('갱신된 근거를 바탕으로','Use the refreshed evidence'),t('운영 보고를 준비하세요','to prepare the handover')],
      planned:[t(number+'번 전실 → 정리 → 새 입실', 'Bed '+number+' transfer → turnover → admit'),t('이 순서로 진행을 제안합니다','I suggest this checked sequence')],
      report:[t('현재 시점의 확인 결과를 모았습니다','Current checks are now in one report'),t('운영 승인 요청 초안이 준비됐습니다','The operational approval draft is ready')],
      'human-review':[t('운영 순서 승인을 요청합니다','Please review the operating plan'),t('승인 전에는 이동하지 않습니다','Movement waits for approval')],
      approved:[t('담당자의 운영 승인을 확인했습니다','Operational approval is confirmed'),t('전실 완료 확인을 기다립니다','Awaiting confirmed patient transfer')],
      completed:[t(number+'번 새 환자의 ICU 입실을 확인했습니다','The new patient is in ICU bed '+number),t('처음의 입실 요청이 완료됐습니다','The original admission request is complete')],
      'workflow-blocked':[t('미확인 조건으로 진행을 멈췄습니다','An unresolved condition stopped progress'),t('담당자의 재확인을 기다립니다','Awaiting the responsible reviewer’s check')]
    };
    if(scene.phase==='workflow'){
      const bed=(scene.coreView?.beds||scene.beds||[]).find(b=>String(b.number).padStart(2,'0')===number);
      return bed?.status==='cleaning'?[t(number+'번 전실 완료를 확인했습니다','Transfer from bed '+number+' is confirmed'),t('병상 정리 작업이 진행 중입니다','Bed turnover is in progress')]:[t('병상 정리·입실 예약을 확인했습니다','Turnover and reservation are confirmed'),t('입실 직전 조건을 확인합니다','Checking the admission prerequisites')];
    }
    return presets[scene.phase]||[t('현재 기록을 확인하고','Review the current records'),t('다음 준비를 이어가세요','and continue the next preparation')];
  }
  function messageCategory(){
    const categories={
      request:[t('상황 보고','STATUS'), 'report'],snapshot:[t('상황 보고','STATUS'),'report'],'check-start':[t('상황 보고','STATUS'),'report'],
      forecast:[t('다음 제안','NEXT SUGGESTION'),'suggest'],readiness:[t('다음 제안','NEXT SUGGESTION'),'suggest'],refreshed:[t('다음 제안','NEXT SUGGESTION'),'suggest'],planned:[t('다음 제안','NEXT SUGGESTION'),'suggest'],
      report:[t('보고 준비','REPORT READY'),'report'],'human-review':[t('승인 요청','APPROVAL REQUEST'),'approval'],
      approved:[t('진행 상황','PROGRESS'),'progress'],workflow:[t('진행 상황','PROGRESS'),'progress'],
      completed:[t('완료 보고','COMPLETED'),'complete'],'workflow-blocked':[t('진행 보류','ON HOLD'),'hold']
    };
    const category=categories[scene.phase]||[t('상황 보고','STATUS'),'report'];
    const held=scene.phase==='readiness'&&(scene.missing||[]).length;
    return {label:held?t('진행 보류','ON HOLD'):category[0],tone:held?'hold':category[1]};
  }
  function fitProposal(label){
    const heading=proposal.querySelector('.admission-proposal-heading');
    heading.textContent='LINK · '+label+t(' · 보기 ›',' · Open ›');
    const padding=.37,maxWidth=10.7,maxTextWidth=maxWidth-padding*2;
    const lines=[heading,proposalFirst,proposalSecond];
    let longest=0;
    lines.forEach((el,index)=>{
      // Measure the natural SVG text in map units before fitting long translations.
      el.removeAttribute('textLength');el.removeAttribute('lengthAdjust');
      let width=0;
      try{width=el.getComputedTextLength?.()||0;}catch(_){}
      if(!Number.isFinite(width)||width<=0){try{width=el.getBBox?.().width||0;}catch(_){width=0;}}
      if(!Number.isFinite(width)||width<=0){
        const size=index===0?.3:.425;
        width=Array.from(el.textContent||'').reduce((sum,char)=>sum+size*(/\s/.test(char)?.3:/[\u0000-\u00ff]/.test(char)?.55:1),0);
      }
      if(width>maxTextWidth){el.setAttribute('textLength',maxTextWidth);el.setAttribute('lengthAdjust','spacingAndGlyphs');width=maxTextWidth;}
      longest=Math.max(longest,width);
    });
    const width=Math.min(maxWidth,Math.ceil((longest+padding*2)*100)/100);
    proposal.querySelector('.admission-proposal-surface').setAttribute('width',width);
    return width;
  }
  function renderPin(){
    const unit=portal.unit,number=String(scene.candidate?.bedNumber||'03').padStart(2,'0');
    const bed=unit.beds.find(b=>String(b.id).split('-').pop().padStart(2,'0')===number);if(!bed)return;
    const stage=Number(scene.stageIndex)||0,category=messageCategory();
    const lines=proposalForScene(number);proposalFirst.textContent=lines[0];proposalSecond.textContent=lines[1];
    guide.setAttribute('aria-label','LINK · '+category.label+' · '+lines.join(' · ')+t(' · 상세 보기',' · Open details'));
    const width=fitProposal(category.label);
    // One parent transform keeps the guide attached to its speech. The upper
    // corridor leaves staff, beds, care symbols and forecast badges unobscured.
    let x=Number(unit.x)+5.75;
    if(stage===1)x=Number(unit.x)+6.7;
    if(stage===3)x=Number(unit.x)+7.7;
    if(stage===4)x=Number(unit.x)+23;
    if(stage===5)x=Number(unit.x)+7;
    x=Math.max(Number(unit.x)+.6,Math.min(x,Number(unit.x)+Number(unit.w)-width-.95-.6));
    guide.style.transform='translate('+x+'px, 5.22px)';guide.dataset.ready='true';
    proposal.setAttribute('data-tone',category.tone);guide.setAttribute('data-tone',category.tone);
    const nextKey=[scene.scenario?.id,scene.phase,scene.hour].join(':');
    if(proposalKey!==nextKey){proposal.classList.remove('is-new');proposal.getBoundingClientRect?.();proposal.classList.add('is-new');proposalKey=nextKey;}
    const upper=Number(bed.y)<Number(unit.h)/2;
    arrow.setAttribute('transform','translate('+(Number(bed.x)-2.6)+' '+(upper?3.6:10.25)+')'+(upper?'':' rotate(180)'));
    // The proposal contains the action. Keep only a small locator at the bed.
    callout.textContent='';arrow.dataset.stage=String(stage);
  }
  function updateBanner(){
    const snapshot=scene.coreView?.snapshot||scene.snapshot||{};
    const occupied=snapshot.occupied??(scene.beds||[]).filter(b=>b.status==='occupied').length;
    const preparing=Number(snapshot.cleaning||0)+Number(snapshot.reserved||0);
    const request=scene.coreView?.request||scene.request||{};
    const incoming=scene.completed?t(scene.candidate.bedNumber+'번 ICU 입실 완료','Admitted to ICU bed '+scene.candidate.bedNumber):request.type==='readmission'?t('일반병동 → ICU 재입실 요청 1건','Ward → ICU · 1 readmission request'):t('응급실 → ICU 입실 요청 1건','ED → ICU · 1 admission request');
    banner.replaceChildren();
    const title=document.createElement('strong');title.textContent=t('입실 준비 시연','Admission story');
    const message=document.createElement('span');message.textContent=incoming;
    const counts=document.createElement('small');counts.textContent=t('가상 예측 · 매시간 갱신','Authored forecasts · hourly updates')+' · '+t('재실 ','Occupied ')+occupied+'/8'+(preparing?' · '+t('준비 중 ','Preparing ')+preparing:'')+' · '+String(scene.time||'');
    const legend=document.createElement('small');legend.className='admission-map-legend';legend.textContent=t('사망: 원내 사망 위험 · 전과: 72시간 내 생존 전과 · 간호 아이콘: 미확인','Death: in-hospital mortality risk · Ward: alive ICU-to-ward transfer within 72h · Care symbols: unknown');
    banner.append(title,message,counts,legend);
  }
  function render(detail){
    if(detail?.view)scene=detail.view;
    const wants=detail?.active===undefined?active:Boolean(detail.active);
    if(!wants||!scene){clear();return describe();}
    const found=findPortal();
    if(!found){clear();reason='no-main-ward';return describe();}
    if(found.unit.beds.length!==8){clear();reason=t('이 시연은 8병상 병동에서 볼 수 있습니다.','Use an eight-bed ward for this story.');document.dispatchEvent(new CustomEvent('sicu-admission-context-changed',{detail:{reason}}));return describe();}
    if(active&&signature!==key()){contextChanged();return describe();}
    if(!active){signature=key();active=true;reason='';transitioning=true;root.SICUDemoMonth?.pause?.();transitioning=false;}
    if(!portal||portal.svg!==found.svg||!layer?.isConnected){detach();makePortal(found);}
    labelled.forEach((label,el)=>{if(el.isConnected&&!el.getAttribute('aria-label')?.startsWith(t('입실 준비 시연','Admission simulation')))labelled.set(el,el.getAttribute('aria-label'));});
    renderOccupants();renderCareIcons();renderPredictions();renderPin();updateBanner();
    return describe();
  }
  document.addEventListener('sicu-admission-scene',event=>render(event.detail));
  document.addEventListener('sicu-demo-month',()=>{if(active&&!transitioning&&signature!==key())contextChanged();});
  document.addEventListener('change',event=>{if(active&&event.target.matches('#hospitalScope,#wardScope,#sandboxProfile,#profile,[data-month-action]'))contextChanged();},true);
  document.addEventListener('click',event=>{
    if(!active)return;
    const assistant=event.target.closest('.admission-map-guide');
    if(assistant&&portal?.svg.contains(assistant)){event.preventDefault();event.stopImmediatePropagation();document.dispatchEvent(new CustomEvent('sicu-admission-open-assistant'));return;}
    if(event.target.closest('#workspaceHome,[data-hospital],[data-ward]')){contextChanged();return;}
    const bed=event.target.closest('#floors g[role="button"][data-bed-id]');
    if(bed&&portal?.svg.contains(bed)){event.preventDefault();event.stopImmediatePropagation();document.dispatchEvent(new CustomEvent('sicu-admission-focus-proposal',{detail:{bedId:bed.dataset.bedId}}));}
  },true);
  document.addEventListener('keydown',event=>{if(!active||!['Enter',' '].includes(event.key))return;const assistant=event.target.closest('.admission-map-guide');if(assistant&&portal?.svg.contains(assistant)){event.preventDefault();event.stopImmediatePropagation();document.dispatchEvent(new CustomEvent('sicu-admission-open-assistant'));return;}const bed=event.target.closest('#floors g[role="button"][data-bed-id]');if(bed&&portal?.svg.contains(bed)){event.preventDefault();event.stopImmediatePropagation();document.dispatchEvent(new CustomEvent('sicu-admission-focus-proposal',{detail:{bedId:bed.dataset.bedId}}));}},true);
  const original=root.draw;
  if(typeof original==='function')root.draw=function(){const result=original.apply(this,arguments);if(active)render({view:scene,active:true});return result;};
  root.SICUAdmissionMap=Object.freeze({render,clear,describe});
  if(root.SICUBedOpsSimUI?.isMapActive?.())render({view:root.SICUBedOpsSimUI.describe(),active:true});
})(window);
