/* Clickable LINK evidence panel. Opening only pauses; explicit buttons advance. */
(()=>{
  'use strict';
  const ID='admissionAssistantDialog',E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ko=()=>String(document.documentElement.lang||'ko').startsWith('ko'),t=(a,b)=>ko()?a:b;
  const loc=(x,k)=>String(x?.[ko()?k:k+'En']??x?.[k]??'');
  let scene=null,active=false,dialog=null,opened=false,tab='records',returnFocus=null;
  const model=()=>window.SICUAdmissionAssistantModel?.build(scene);
  const token=m=>[m?.scopeKey,m?.phase,m?.hour,m?.evidenceCount].join('|');
  const shortLabels={clinical:['담당의 결정','Clinical decision'],receiving:['수용 병동','Receiving ward'],transport:['이송 준비','Transport'],cleaning:['정리 인력','Turnover team'],staffing:['수용 인력','Receiving staff'],equipment:['장비','Equipment'],isolation:['격리 조건','Isolation']};
  function action(){
    const button=document.querySelector('#bedOpsSimulation .ops-proposal-bottom [data-ops-action]');
    return button&&!button.disabled?{kind:button.dataset.opsAction,label:button.textContent.trim()}:null;
  }
  function setExpanded(value){document.querySelectorAll('.admission-map-guide').forEach(el=>el.setAttribute('aria-expanded',String(value)));}
  function close(){if(!opened)return;opened=false;if(dialog?.open)dialog.close();setExpanded(false);if(returnFocus?.isConnected)returnFocus.focus?.();else document.querySelector('.admission-map-guide')?.focus?.();returnFocus=null;}
  function ensure(){
    if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id=ID;dialog.setAttribute('aria-labelledby','admissionAssistantTitle');document.body.append(dialog);
    dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
    dialog.addEventListener('close',()=>{opened=false;setExpanded(false);});
    dialog.addEventListener('click',event=>{
      if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();return;}
      const button=event.target.closest('[data-assistant-action]');if(!button)return;
      if(button.dataset.assistantAction==='close'){close();return;}
      if(button.dataset.assistantAction==='tab'){tab=button.dataset.tab;render();dialog.querySelector('[data-tab="'+tab+'"]')?.focus();return;}
      if(button.dataset.assistantAction==='continue'){
        const m=model();if(!active||!m||button.dataset.sceneToken!==token(m))return;
        const next=action();if(!next)return;
        tab='conditions';
        if(next.kind==='approve')window.SICUBedOpsSimUI?.approve();
        else if(next.kind==='next')window.SICUBedOpsSimUI?.next();
        dialog.querySelector('[data-assistant-action="continue"]')?.focus();
      }
    });
    dialog.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight'].includes(event.key)||!event.target.matches('[role="tab"]'))return;
      event.preventDefault();tab=tab==='records'?'conditions':'records';render();dialog.querySelector('[data-tab="'+tab+'"]')?.focus();
    });
    return dialog;
  }
  function render(){
    if(!opened)return;
    const m=model();if(!active||!m){close();return;}
    const historical=scene.candidate?.location!=='ICU';
    const a=action(),readiness=m.readiness,events=m.currentEvents.length?m.currentEvents:m.events.slice(-1);
    const headline=document.querySelector('#bedOpsSimulation .ops-current-sentence')?.textContent||'';
    const phaseLabel=m.completed?t('완료 보고','Complete'):m.phase==='human-review'?t('승인 요청','Approval requested'):m.phase==='check-start'?t('새 기록 도착','New record'):readiness.stale?t('재확인 필요','Recheck needed'):t('LINK 확인','LINK review');
    const records=events.length?events.map(ev=>'<article class="assistant-record"><span class="assistant-record-time">'+E(ev.time)+'</span><div><strong>'+E(loc(ev,'title'))+'</strong><p>'+E(loc(ev,'detail'))+'</p><small>'+E(t('시나리오 기록 · ','Scenario event · ')+ev.id)+(ev.hour!==m.hour?E(t(' · 이전에 도착한 기록',' · previously received')):'')+'</small></div></article>').join(''):'<div class="assistant-empty"><strong>'+E(t('아직 새 변경 기록이 없습니다','No change event has arrived'))+'</strong><p>'+E(t('현재 단계의 환자·병상 확인을 이어가세요.','Continue the current patient and bed review.'))+'</p></div>';
    const change=readiness.changes.length&&!readiness.stale?'<div class="assistant-changes">'+readiness.changes.map(r=>'<div><strong>'+E(shortLabels[r.key]?t(...shortLabels[r.key]):loc(r,'label'))+'</strong><span>'+E(r.previousMet?t('확인','Confirmed'):t('미확인','Unconfirmed'))+' <b>→</b> '+E(r.met?t('확인됨','Confirmed'):t('미확인','Unconfirmed'))+'</span></div>').join('')+'</div>':'';
    const conditions=readiness.queried?'<div class="assistant-readiness-stamp '+(readiness.stale?'is-stale':'')+'">'+E(readiness.time+t(' 조회 결과',' query'))+'<strong>'+E(historical?t('입실 준비에 사용한 확인 기록','Evidence used for the completed preparation'):readiness.stale?t('현재 '+m.time+' · 다시 조회해야 합니다','Now '+m.time+' · recheck required'):t('현재 시점 확인','Current-hour query'))+'</strong></div>'+change+'<div class="assistant-conditions">'+readiness.requirements.map(r=>'<div class="assistant-condition '+(readiness.stale?'is-stale':r.met?'is-met':'is-pending')+'"><span class="assistant-condition-icon">'+(readiness.stale?'◷':r.met?'✓':'!')+'</span><div><strong>'+E(shortLabels[r.key]?t(...shortLabels[r.key]):loc(r,'label'))+'</strong><small>'+E(loc(r,'owner'))+'</small></div><span>'+E(readiness.stale?t('이전 '+(r.met?'확인':'미확인'),'Prior '+(r.met?'confirmed':'unconfirmed')):r.met?t('확인됨','Confirmed'):t('미확인','Unconfirmed'))+'</span></div>').join('')+'</div><p class="assistant-evidence">'+E(t('조회 근거 ','Evidence ')+readiness.evidenceId)+'</p>':'<div class="assistant-empty"><strong>'+E(t('준비 조건을 아직 조회하지 않았습니다','Readiness has not been queried'))+'</strong><p>'+E(t('아래 행동 버튼으로 현재 단계의 확인을 진행하세요.','Use the action below to continue the current check.'))+'</p></div>';
    ensure().innerHTML='<header><span class="assistant-avatar" aria-hidden="true">LINK</span><div><span class="assistant-kicker">'+E(phaseLabel)+'</span><h2 id="admissionAssistantTitle">'+E(t(m.bedNumber+'번 병상 · '+m.time,'Bed '+m.bedNumber+' · '+m.time))+'</h2></div><button data-assistant-action="close" aria-label="'+E(t('LINK 상세 닫기','Close LINK details'))+'">×</button></header><div class="assistant-tabs" role="tablist" aria-label="'+E(t('확인할 내용','Review content'))+'"><button role="tab" id="assistant-records-tab" data-assistant-action="tab" data-tab="records" aria-selected="'+(tab==='records')+'" aria-controls="assistant-tab-content" tabindex="'+(tab==='records'?0:-1)+'">'+E(t('들어온 기록','Received records'))+(m.currentEvents.length?' <span>'+m.currentEvents.length+'</span>':'')+'</button><button role="tab" id="assistant-conditions-tab" data-assistant-action="tab" data-tab="conditions" aria-selected="'+(tab==='conditions')+'" aria-controls="assistant-tab-content" tabindex="'+(tab==='conditions'?0:-1)+'">'+E(t('확인 조건','Readiness checks'))+'</button></div><section id="assistant-tab-content" role="tabpanel" aria-labelledby="assistant-'+tab+'-tab">'+(tab==='records'?records:conditions)+'</section><footer><small>'+E(t('LINK의 다음 제안','LINK’s next step'))+'</small><p role="status" aria-live="polite">'+E(headline)+'</p>'+(a?'<button class="assistant-continue '+(a.kind==='approve'?'is-approval':'')+'" data-assistant-action="continue" data-scene-token="'+E(token(m))+'">'+E(a.label)+'</button>':'<span class="assistant-done">'+E(m.completed?t('✓ 입실 준비 완료','✓ Admission complete'):t('진행 보류 · 담당자 확인 필요','On hold · responsible review required'))+'</span>')+'<span class="assistant-note">'+E(t('살펴보는 동안 자동 재생 일시정지 · 가상 시연','Autoplay paused while reviewing · fictional simulation'))+'</span></footer>';
    setExpanded(true);
  }
  function open(){
    if(!active||!window.SICUBedOpsSimUI?.isMapActive?.())return;
    returnFocus=document.querySelector('.admission-map-guide')||document.activeElement;window.SICUBedOpsSimUI?.pause();opened=true;
    const m=model();tab=m?.currentEvents.length?'records':'conditions';render();
    if(dialog&&!dialog.open)dialog.showModal();dialog?.querySelector('[data-assistant-action="close"]')?.focus();
  }
  document.addEventListener('sicu-admission-scene',event=>{const prior=model()?.scopeKey;scene=event.detail?.view||null;active=!!event.detail?.active;if(!active||(prior&&model()?.scopeKey!==prior))close();else if(opened)render();});
  document.addEventListener('sicu-admission-open-assistant',open);
  document.addEventListener('icu-language',()=>{if(opened)render();});
  window.addEventListener('pagehide',close);
  window.SICUAdmissionAssistant=Object.freeze({open,close,isOpen:()=>opened,describe:()=>opened?model():null});
})();
