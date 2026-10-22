/* Public fictional allocation calendar. Clinical source fixtures stay unchanged. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SICUDemoMonthModel=api;})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const PLAN=[{"day":1,"sourceRow":2,"beds":[{"status":"red","event":"ER"},{"status":"red","event":"OP"},{"status":"red","event":"OP"},{"status":"red","event":"CPR"},{"status":"red","event":"OP"},{"status":"red","event":"AE"},{"status":"yellow","event":""},{"status":"empty","event":""}]},{"day":2,"sourceRow":3,"beds":[{"status":"red","event":""},{"status":"red","event":""},{"status":"blue","event":""},{"status":"red","event":"Death"},{"status":"blue","event":""},{"status":"red","event":""},{"status":"red","event":"OP"},{"status":"red","event":"OP"}]},{"day":3,"sourceRow":4,"beds":[{"status":"red","event":""},{"status":"blue","event":""},{"status":"green","event":"GW"},{"status":"empty","event":""},{"status":"blue","event":""},{"status":"red","event":""},{"status":"red","event":""},{"status":"blue","event":""}]},{"day":4,"sourceRow":5,"beds":[{"status":"blue","event":""},{"status":"blue","event":""},{"status":"empty","event":""},{"status":"red","event":"CPR"},{"status":"blue","event":""},{"status":"red","event":""},{"status":"blue","event":""},{"status":"blue","event":""}]},{"day":5,"sourceRow":6,"beds":[{"status":"blue","event":""},{"status":"green","event":"GW"},{"status":"empty","event":""},{"status":"red","event":"Death"},{"status":"green","event":"GW"},{"status":"red","event":"Death"},{"status":"green","event":"GW"},{"status":"green","event":""}]},{"day":6,"sourceRow":7,"beds":[{"status":"blue","event":""},{"status":"yellow","event":""},{"status":"empty","event":""},{"status":"empty","event":""},{"status":"empty","event":""},{"status":"red","event":"OP"},{"status":"empty","event":""},{"status":"green","event":"GW"}]},{"day":7,"sourceRow":8,"beds":[{"status":"green","event":"GW"},{"status":"red","event":"CPR"},{"status":"red","event":"OP"},{"status":"yellow","event":""},{"status":"empty","event":""},{"status":"blue","event":""},{"status":"empty","event":""},{"status":"empty","event":""}]},{"day":8,"sourceRow":9,"beds":[{"status":"empty","event":""},{"status":"red","event":"Death"},{"status":"blue","event":""},{"status":"red","event":"OP"},{"status":"empty","event":""},{"status":"blue","event":""},{"status":"yellow","event":""},{"status":"empty","event":""}]},{"day":9,"sourceRow":10,"beds":[{"status":"red","event":"OP"},{"status":"empty","event":""},{"status":"green","event":"GW"},{"status":"blue","event":""},{"status":"red","event":"OP"},{"status":"blue","event":""},{"status":"red","event":"OP"},{"status":"empty","event":""}]},{"day":10,"sourceRow":11,"beds":[{"status":"blue","event":""},{"status":"red","event":"OP"},{"status":"empty","event":""},{"status":"green","event":"GW"},{"status":"blue","event":""},{"status":"green","event":"GW"},{"status":"blue","event":""},{"status":"red","event":"OR"}]},{"day":11,"sourceRow":12,"beds":[{"status":"blue","event":""},{"status":"blue","event":""},{"status":"red","event":"OP"},{"status":"red","event":"OP"},{"status":"green","event":"GW"},{"status":"empty","event":""},{"status":"green","event":"GW"},{"status":"red","event":""}]},{"day":12,"sourceRow":13,"beds":[{"status":"blue","event":""},{"status":"green","event":"GW"},{"status":"blue","event":""},{"status":"blue","event":""},{"status":"empty","event":""},{"status":"red","event":"OP"},{"status":"red","event":"OP"},{"status":"red","event":""}]},{"day":13,"sourceRow":14,"beds":[{"status":"green","event":"GW"},{"status":"empty","event":""},{"status":"blue","event":""},{"status":"blue","event":""},{"status":"red","event":"CPR"},{"status":"blue","event":""},{"status":"blue","event":""},{"status":"blue","event":""}]},{"day":14,"sourceRow":15,"beds":[{"status":"empty","event":""},{"status":"red","event":"OP"},{"status":"blue","event":""},{"status":"green","event":""},{"status":"red","event":""},{"status":"blue","event":""},{"status":"blue","event":""},{"status":"blue","event":""}]},{"day":15,"sourceRow":16,"beds":[{"status":"red","event":"OP"},{"status":"blue","event":""},{"status":"green","event":"GW"},{"status":"green","event":"GW"},{"status":"red","event":"Death"},{"status":"blue","event":""},{"status":"green","event":""},{"status":"blue","event":""}]},{"day":16,"sourceRow":17,"beds":[{"status":"blue","event":""},{"status":"blue","event":""},{"status":"yellow","event":""},{"status":"empty","event":""},{"status":"yellow","event":""},{"status":"green","event":"GW"},{"status":"green","event":"GW"},{"status":"green","event":"GW"}]},{"day":17,"sourceRow":18,"beds":[{"status":"green","event":"GW"},{"status":"green","event":""},{"status":"red","event":"OP"},{"status":"empty","event":""},{"status":"red","event":"OP"},{"status":"empty","event":""},{"status":"empty","event":""},{"status":"empty","event":""}]},{"day":18,"sourceRow":19,"beds":[{"status":"empty","event":""},{"status":"green","event":"GW"},{"status":"blue","event":""},{"status":"red","event":"OR"},{"status":"blue","event":""},{"status":"yellow","event":""},{"status":"red","event":"OP"},{"status":"red","event":"CPR"}]},{"day":19,"sourceRow":20,"beds":[{"status":"empty","event":""},{"status":"empty","event":""},{"status":"blue","event":""},{"status":"red","event":""},{"status":"green","event":"GW"},{"status":"red","event":"OP"},{"status":"blue","event":""},{"status":"red","event":""}]},{"day":20,"sourceRow":21,"beds":[{"status":"red","event":"OR"},{"status":"red","event":"OP"},{"status":"green","event":""},{"status":"red","event":""},{"status":"red","event":"OP"},{"status":"blue","event":""},{"status":"blue","event":""},{"status":"red","event":"Death"}]},{"day":21,"sourceRow":22,"beds":[{"status":"red","event":""},{"status":"blue","event":""},{"status":"green","event":"GW"},{"status":"blue","event":""},{"status":"blue","event":""},{"status":"green","event":"GW"},{"status":"blue","event":""},{"status":"empty","event":""}]},{"day":22,"sourceRow":23,"beds":[{"status":"red","event":""},{"status":"green","event":"GW"},{"status":"empty","event":""},{"status":"blue","event":""},{"status":"blue","event":""},{"status":"empty","event":""},{"status":"green","event":"GW"},{"status":"red","event":"OP"}]},{"day":23,"sourceRow":24,"beds":[{"status":"blue","event":""},{"status":"empty","event":""},{"status":"red","event":"OP"},{"status":"blue","event":""},{"status":"blue","event":""},{"status":"red","event":"OP"},{"status":"empty","event":""},{"status":"blue","event":""}]},{"day":24,"sourceRow":25,"beds":[{"status":"blue","event":""},{"status":"empty","event":""},{"status":"blue","event":""},{"status":"green","event":"GW"},{"status":"green","event":"GW"},{"status":"blue","event":""},{"status":"red","event":"OP"},{"status":"green","event":"GW"}]},{"day":25,"sourceRow":26,"beds":[{"status":"blue","event":""},{"status":"empty","event":""},{"status":"green","event":"GW"},{"status":"empty","event":""},{"status":"empty","event":""},{"status":"green","event":"GW"},{"status":"blue","event":""},{"status":"empty","event":""}]},{"day":26,"sourceRow":27,"beds":[{"status":"green","event":"GW"},{"status":"red","event":"OP"},{"status":"empty","event":""},{"status":"empty","event":""},{"status":"empty","event":""},{"status":"red","event":"CPR"},{"status":"blue","event":""},{"status":"empty","event":""}]},{"day":27,"sourceRow":28,"beds":[{"status":"red","event":"CPR"},{"status":"blue","event":""},{"status":"red","event":"OP"},{"status":"red","event":"OP"},{"status":"red","event":"OP"},{"status":"red","event":"Death"},{"status":"green","event":""},{"status":"red","event":"OP"}]},{"day":28,"sourceRow":29,"beds":[{"status":"red","event":"Death"},{"status":"blue","event":""},{"status":"blue","event":""},{"status":"blue","event":""},{"status":"blue","event":""},{"status":"empty","event":""},{"status":"green","event":"GW"},{"status":"blue","event":""}]},{"day":29,"sourceRow":30,"beds":[{"status":"empty","event":""},{"status":"green","event":""},{"status":"blue","event":""},{"status":"blue","event":""},{"status":"green","event":"GW"},{"status":"red","event":"OP"},{"status":"empty","event":""},{"status":"green","event":"GW"}]},{"day":30,"sourceRow":31,"beds":[{"status":"red","event":"OP"},{"status":"green","event":"GW"},{"status":"blue","event":""},{"status":"green","event":""},{"status":"empty","event":""},{"status":"blue","event":""},{"status":"empty","event":""},{"status":"empty","event":""}]},{"day":31,"sourceRow":32,"beds":[{"status":"blue","event":""},{"status":"empty","event":""},{"status":"green","event":"GW"},{"status":"green","event":"GW"},{"status":"empty","event":""},{"status":"blue","event":""},{"status":"red","event":"OP"},{"status":"empty","event":""}]}];
  const occupied=s=>s==='red'||s==='blue'||s==='green';
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number(n)||0));
  function sample(day=1,minute=540){
    day=clamp(Math.round(day),1,31);minute=clamp(Math.round(minute/180)*180,0,1260);
    const row=PLAN[day-1],previous=PLAN[Math.max(0,day-2)];
    const beds=row.beds.map((current,index)=>{
      const before=day===1?current:previous.beds[index];
      const wasOccupied=occupied(before.status)&&before.event!=='GW'&&before.event!=='Death';
      const willOccupy=occupied(current.status);
      let state=current.status,event='',phase='ongoing';
      if(!wasOccupied&&willOccupy&&day>1&&minute<540){state=minute>=360?'yellow':'empty';phase=minute>=360?'reserved':'vacant';event=minute>=360?'arrival_reserved':'';}
      else if(willOccupy&&!wasOccupied&&minute===540){phase='arrival';event='arrival';}
      else if(current.event==='GW'&&minute>=1080){state=minute===1080?'turnover':'empty';phase=minute===1080?'transfer':'vacant';event=minute===1080?'ward_transfer':'';}
      else if(current.event==='Death'&&minute>=1260){state='turnover';phase='post_mortem';event='post_mortem';}
      else if(current.event==='CPR'&&minute===720){phase='response';event='cpr';}
      else if(current.event==='OP'&&minute===540){phase='postop';event='postop';}
      else if(state==='yellow'){phase='reserved';event='arrival_reserved';}
      let admitDay=day;
      while(admitDay>1){const prior=PLAN[admitDay-2].beds[index];if(!occupied(prior.status)||prior.event==='GW'||prior.event==='Death')break;admitDay--;}
      const priorEpisodes=PLAN.slice(0,Math.max(0,admitDay-1)).filter(r=>r.beds[index].event==='GW').length;
      if(event==='arrival'&&priorEpisodes>0){event='readmission';phase='readmission';}
      return {index,status:state,occupied:occupied(state),event,phase,rawEvent:current.event,admitDay,slotKey:'D'+admitDay+'-B'+(index+1),readmission:priorEpisodes>0};
    });
    return {day,minute,step:(day-1)*8+minute/180,beds,clock:String(Math.floor(minute/60)).padStart(2,'0')+':00'};
  }
  return Object.freeze({plan:PLAN,sample,occupied,totalSteps:248});
});

if(typeof window!=='undefined'&&typeof document!=='undefined')(()=>{
  'use strict';
  const M=window.SICUDemoMonthModel,q=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
  const ko=()=>document.documentElement.lang.startsWith('ko'),t=(a,b)=>ko()?a:b;
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state=()=>typeof S==='undefined'?null:S;
  const bedsOf=s=>s?.floors?.flatMap(f=>f.units.flatMap(u=>u.beds))||[];
  let active=false,playing=false,timer=0,day=1,minute=540,raw=null,source=null,ready=false,changing=false,automaticStarted=false,selectedBed=0;
  const statuses=()=>({red:{key:'critical',label:t('집중관리','Intensive care'),color:'#bf4659'},blue:{key:'watch',label:t('ICU 관찰','ICU monitoring'),color:'#4384c2'},green:{key:'stable',label:t('전동 검토','Transfer review'),color:'#438b73'},yellow:{key:'reserved',label:t('입실 예약','Reserved'),color:'#e1b84f',ink:'#67521c'},empty:{key:'empty',label:t('공실','Vacant'),color:'#e7edf2',ink:'#52677e'},turnover:{key:'turnover',label:t('정리 중','Turnover'),color:'#dce6ef',ink:'#52677e'}});
  const eventName=key=>({arrival:t('새 환자 입실','Admission'),readmission:t('재입실 시연','Readmission example'),ward_transfer:t('일반병동 전동 · 병상 정리','Ward transfer · turnover'),post_mortem:t('사후 이송 시연','Post-mortem example'),cpr:t('CPR 대응 시연','CPR response example'),postop:t('수술 후 입실','Postoperative admission'),arrival_reserved:t('입실 준비','Arrival preparation')})[key]||'';
  function scopeUnit(){const units=state()?.floors?.flatMap(f=>f.units)||[],ward=q('#wardScope')?.value;return units.find(u=>u.id===ward)||units.find(u=>u.id.endsWith('SICU')&&!u.id.endsWith('NSICU')&&!u.id.endsWith('CSICU')&&!u.id.endsWith('TSICU'))||units[0];}
  function describe(){const frame=M.sample(day,minute);return {active,playing,day,minute,clock:frame.clock,step:frame.step,sourceMinute:Number(source?.t??state()?.t??0),scope:scopeUnit()?.id||'',selectedBed,beds:frame.beds.map(b=>({...b}))};}
  function emit(){document.dispatchEvent(new CustomEvent('sicu-demo-month',{detail:describe()}));}
  function stop(){if(timer)clearInterval(timer);timer=0;playing=false;}
  function stopLegacy(){window.SICUUnifiedReplay?.pause();const button=q('#sandboxPlay');if(/^(Pause|일시정지)$/.test(button?.textContent.trim()||''))button.click();window.SICUTransportScenes?.reset();window.SICUNativeTransport?.clear();}
  function sourcePool(unit){
    const candidates=bedsOf(raw||source),used=new Set(),templates=[];
    for(let i=0;i<8;i++){const own=candidates.find(b=>b.id===unit.beds[i]?.id&&b.patient);const record=own&&!used.has(own.patient.pid)?own:candidates.find(b=>b.patient&&!used.has(b.patient.pid)&&b.id.split('-')[0]===unit.id.split('-')[0])||candidates.find(b=>b.patient&&!used.has(b.patient.pid));templates.push(record||null);if(record)used.add(record.patient.pid);}
    return templates;
  }
  function project(input){
    if(!active||!input?.floors)return input;
    const projected=structuredClone(input),unit=projected.floors.flatMap(f=>f.units).find(u=>u.id===scopeUnit()?.id);
    if(!unit)return input;
    const frame=M.sample(day,minute),templates=sourcePool(unit),targetIds=new Set(unit.beds.map(b=>b.id));
    unit.beds.forEach((bed,index)=>{
      const plan=frame.beds[index];if(!plan)return;
      delete bed.flow;bed.unavailable=plan.status==='turnover';bed.reservation=plan.status==='yellow'?{source:'fictional-month-plan',expected_t:null}:null;
      bed.demo_month={...plan,day,minute,fictionalAssignment:true};
      bed.patient=plan.occupied&&templates[index]?.patient?structuredClone(templates[index].patient):null;
      if(bed.patient)bed.patient.demo_month={day,minute,slotKey:unit.id+'-'+plan.slotKey,sourceBed:templates[index].id,sourceMinute:Number(input.t)||0,fictionalAssignment:true};
    });
    // Source responses do not describe these fictional allocation episodes.
    projected.incidents=(projected.incidents||[]).filter(i=>!targetIds.has(i.bed));
    projected.demo_month={day,minute,scope:unit.id,sourceMinute:Number(input.t)||0};
    return projected;
  }
  function drawCurrent(){if(!state())return;if(source)S=structuredClone(source);window.draw();}
  function setActive(value){
    const wanted=Boolean(value);if(wanted===active){sync();return;}
    stop();changing=true;
    if(wanted){stopLegacy();source=structuredClone(state());active=true;}
    else{active=false;if(source)S=structuredClone(source);}
    changing=false;drawCurrent();emit();
  }
  function seek(nextDay,nextMinute=minute){
    stop();if(!active)setActive(true);const next=M.sample(nextDay,nextMinute);day=next.day;minute=next.minute;window.SICUNativeTransport?.clear();drawCurrent();emit();return describe();
  }
  function advance(){const current=M.sample(day,minute);if(current.step>=247){stop();sync();emit();return;}const next=current.step+1;day=Math.floor(next/8)+1;minute=(next%8)*180;drawCurrent();emit();if(next===247){stop();sync();}}
  function play(){if(!active)setActive(true);if(playing)return;if(M.sample(day,minute).step===247){day=1;minute=0;drawCurrent();}stopLegacy();playing=true;timer=setInterval(advance,1600);sync();emit();}
  function pause(){stop();sync();emit();}
  function toggle(){playing?pause():play();}
  function reset(){seek(1,0);}
  // The shared top controls always delegate to the selected clock owner.
  function control(action,value){
    if(active){
      if(action==='toggle')return toggle();
      if(action==='reset')return reset();
      if(action==='range'){const step=Number(value);return seek(Math.floor(step/8)+1,(step%8)*180);}
      if(action==='day')return seek(Number(value));
      if(action==='minute')return seek(day,Number(value));
    }else{
      const owner=window.SICUUnifiedReplay;
      if(action==='toggle')return owner?.toggle();
      if(action==='reset')return owner?.reset();
      if(action==='range')return owner?.seek(Number(value)/100);
    }
  }
  function makePanel(id){
    const section=document.createElement('section');section.id=id;section.className='demo-month-panel';section.dataset.noTranslate='';
    section.innerHTML='<div class="demo-month-heading"><div><h3 data-month-title></h3><p data-month-basis></p></div><label class="demo-month-mode"><span data-month-mode-label></span><select data-month-action="mode"><option value="month"></option><option value="minute"></option></select></label></div><div class="demo-month-player"><output data-month-clock></output><label><span data-month-day-label></span><select data-month-action="day">'+Array.from({length:31},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+'</option>').join('')+'</select></label><label><span data-month-time-label></span><select data-month-action="minute">'+Array.from({length:8},(_,i)=>'<option value="'+i*180+'">'+String(i*3).padStart(2,'0')+':00</option>').join('')+'</select></label><button type="button" data-month-action="toggle"></button><button type="button" data-month-action="reset" aria-label="Reset">↺</button></div><input data-month-action="range" class="demo-month-range" type="range" min="0" max="247" step="1" value="3"><div data-month-events role="status" class="demo-month-events"></div>';
    section.addEventListener('change',event=>{const action=event.target.dataset.monthAction;if(action==='mode')setActive(event.target.value==='month');else control(action,event.target.value);});
    section.addEventListener('input',event=>{if(event.target.dataset.monthAction==='range')control('range',event.target.value);});
    section.addEventListener('click',event=>{const action=event.target.closest('[data-month-action]')?.dataset.monthAction;if(action==='toggle'||action==='reset')control(action);});
    return section;
  }
  function renderCalendar(){
    let panel=q('#demoMonthCalendar');if(!panel){const target=q('#operationsTimeline');if(!target)return;panel=document.createElement('section');panel.id='demoMonthCalendar';panel.dataset.noTranslate='';target.before(panel);panel.addEventListener('click',event=>{const button=event.target.closest('[data-month-day]');if(!button)return;selectedBed=Number(button.dataset.monthBed);seek(Number(button.dataset.monthDay),540);sync();});}
    const language=ko()?'ko':'en';if(panel.dataset.language!==language){panel.dataset.language=language;panel.innerHTML='<div class="demo-month-calendar-heading"><h3>'+t('31일 병상 흐름','31-day bed flow')+'</h3><span>'+t('칸을 누르면 해당 일 09:00로 이동','Select a cell to seek to 09:00')+'</span></div><div class="demo-month-legend">'+Object.entries(statuses()).filter(([key])=>key!=='turnover').map(([key,s])=>'<span><i data-month-status="'+key+'"></i>'+E(s.label)+'</span>').join('')+'</div><div class="demo-month-calendar-scroll"><table><thead><tr><th>'+t('일차','Day')+'</th>'+Array.from({length:8},(_,i)=>'<th>'+t('병상 ','Bed ')+(i+1)+'</th>').join('')+'</tr></thead><tbody>'+M.plan.map(row=>'<tr data-month-row="'+row.day+'"><th scope="row">'+row.day+'</th>'+row.beds.map((bed,index)=>'<td><button type="button" data-month-day="'+row.day+'" data-month-bed="'+index+'" data-month-status="'+bed.status+'" aria-label="'+E(t(row.day+'일 · 병상 '+(index+1), 'Day '+row.day+' · bed '+(index+1)))+' · '+E(statuses()[bed.status].label)+'">'+E(bed.event||(bed.status==='empty'?'—':'·'))+'</button></td>').join('')+'</tr>').join('')+'</tbody></table></div><p class="demo-month-note">'+t('제공한 8병상 계획표의 가상 배치입니다. 09:00 입실·18:00 전동 등 시각은 공개 시연용으로 구성했으며 환자 관측값의 경과를 뜻하지 않습니다.','Fictional allocation from the supplied eight-bed plan. Times such as 09:00 admission and 18:00 transfer are presentation examples, not a patient observation trajectory.')+'</p>';}
    panel.hidden=!active;panel.querySelectorAll('[data-month-row]').forEach(row=>row.classList.toggle('is-active',Number(row.dataset.monthRow)===day));panel.querySelectorAll('[data-month-day]').forEach(button=>{const selected=active&&Number(button.dataset.monthDay)===day&&Number(button.dataset.monthBed)===selectedBed;button.setAttribute('aria-pressed',String(selected));});
  }
  function sync(){
    if(!ready)return;const d=describe(),frame=M.sample(day,minute),unit=scopeUnit(),short=window.SICUUnifiedReplay?.describe?.(),shortLoading=Boolean(short?.loading),isPlaying=active?playing:Boolean(short?.playing);document.body.dataset.demoMonth=String(active);
    all('.demo-month-panel').forEach(panel=>{
      panel.querySelector('[data-month-title]').textContent=active?t('한 달 병상 시나리오','Monthly bed scenario'):t('상태 변화 · 이송 시나리오','Status and transport scenario');panel.querySelector('[data-month-basis]').textContent=active?t('가상 병상 배치 · 31일 · 3시간 단위','Fictional allocation · 31 days · 3-hour steps'):t('30분 가상 기록 · 선택한 이송 예시','30-minute fictional records and selected transport example');
      panel.querySelector('[data-month-mode-label]').textContent=t('재생 모드','Replay mode');const mode=panel.querySelector('[data-month-action=mode]');mode.value=active?'month':'minute';mode.options[0].textContent=t('31일 · 3시간','31 days · 3 hours');mode.options[1].textContent=t('30분 · 상태·이송','30 min · status & transport');
      panel.querySelector('[data-month-clock]').textContent=active?t(day+'일차','Day '+day)+' · '+d.clock:short?.clock||'07:00';
      panel.querySelector('[data-month-day-label]').textContent=t('일차','Day');panel.querySelector('[data-month-time-label]').textContent=t('시각','Time');panel.querySelector('[data-month-action=day]').value=String(day);panel.querySelector('[data-month-action=minute]').value=String(minute);
      for(const action of ['day','minute']){const select=panel.querySelector('[data-month-action='+action+']');select.disabled=!active;select.parentElement.hidden=!active;}
      const toggle=panel.querySelector('[data-month-action=toggle]');toggle.textContent=shortLoading&&!active?t('불러오는 중…','Loading…'):isPlaying?t('Ⅱ 일시정지','Ⅱ Pause'):!active&&short?.complete?t('↻ 다시 재생','↻ Replay'):t('▶ 재생','▶ Play');toggle.setAttribute('aria-pressed',String(isPlaying));toggle.disabled=!active&&(shortLoading||!window.SICUUnifiedReplay);
      panel.querySelector('[data-month-action=reset]').disabled=!active&&(shortLoading||!window.SICUUnifiedReplay);
      const range=panel.querySelector('[data-month-action=range]');range.min='0';range.max=active?'247':'100';range.step=active?'1':'.1';range.value=String(active?frame.step:(short?.progress||0)*100);range.disabled=!active&&(shortLoading||!window.SICUUnifiedReplay);range.setAttribute('aria-label',active?t('한 달 재생 시점','Monthly replay position'):t('30분 상태·이송 재생 시점','30-minute status and transport position'));range.setAttribute('aria-valuetext',active?day+' · '+d.clock:short?.clock||'07:00');
      const notes=frame.beds.filter(b=>b.event&&b.event!=='arrival_reserved').map(b=>t('병상 ','Bed ')+(b.index+1)+' '+eventName(b.event));panel.querySelector('[data-month-events]').textContent=!active?(short?.error||t('선택한 이송 예시와 환자 상태를 함께 재생합니다.','Replaying patient status and the selected transport example.')):unit?.id+' · '+(notes.join(' / ')||t('배치 유지','Allocation unchanged'));
    });
    const timelineTab=q('[data-operations-tab=timeline]');if(timelineTab)timelineTab.textContent=active?t('31일 병상 흐름','31-day bed flow'):t('다음 6시간','Next six hours');
    if(active){const clock=q('#clock');if(clock)clock.textContent=t(day+'일차','Day '+day)+' · '+d.clock;}
    renderCalendar();
    if(active&&unit)unit.beds.forEach((bed,index)=>{const entry=typeof bedEl!=='undefined'?bedEl[bed.id]:null;if(entry){entry.r.parentNode.dataset.monthSelected=String(index===selectedBed);entry.r.parentNode.dataset.monthStatus=frame.beds[index]?.status||'';entry.r.parentNode.dataset.monthDay=String(day);}});
  }
  function setup(){if(ready||!q('#unifiedReplay')||!q('#planningReplay'))return;q('#unifiedReplay').before(makePanel('demoMonthWard'));q('#planningReplay').before(makePanel('demoMonthPlanning'));ready=true;sync();}
  const nativeStatus=window.bedStatus;window.bedStatus=function(bed){return active&&bed.demo_month?statuses()[bed.demo_month.status]||nativeStatus.apply(this,arguments):nativeStatus.apply(this,arguments);};
  const nativeAccept=window.acceptState;window.acceptState=function(data){if(!data?.demo_month)raw=structuredClone(data);return nativeAccept.apply(this,arguments);};
  const nativeDraw=window.draw;window.draw=function(){if(!changing&&state()&&!state().demo_month)source=structuredClone(state());if(active&&source)S=project(source);const result=nativeDraw.apply(this,arguments);if(state()&&typeof Network!=='undefined')Network.render();setup();sync();if(!automaticStarted&&ready&&state()){automaticStarted=true;if(new URLSearchParams(location.search).get('monthly')!=='0')queueMicrotask(()=>setActive(true));}return result;};
  document.addEventListener('click',event=>{if(!active||changing)return;if(event.target.closest('#unifiedReplayToggle,#planningReplayToggle,#unifiedReplayReset,#planningReplayReset,#sandboxPlay,#sandboxReset,#sandboxApply,#staffReplayToggle,#transportScenePlay,#transportSceneReset,[data-transport-kind],#transferStart,#transferNext,#transferPlay,#transferClear,#workspaceHome,[data-hospital],[data-ward]'))setActive(false);},true);
  document.addEventListener('change',event=>{if(active&&event.target.matches('#hospitalScope,#wardScope,#sandboxProfile,#profile'))setActive(false);},true);
  document.addEventListener('input',event=>{if(active&&event.target.matches('#sandboxTime,#unifiedReplayTime,#planningReplayTime'))setActive(false);},true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause();});document.addEventListener('icu-language',()=>queueMicrotask(()=>{drawCurrent();sync();}));
  document.addEventListener('sicu-unified-replay',sync);
  window.SICUDemoMonth=Object.freeze({describe,play,pause,toggle,reset,seek,setActive,control,sample:M.sample});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
