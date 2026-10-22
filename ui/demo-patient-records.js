/* Fictional patient-record explorer. Public data only; no KHDP connection. */
(()=>{
  'use strict';
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const time=v=>'ICU '+(v>=0?'+':'−')+Math.abs(Math.round(v)).toLocaleString()+' min';
  const key=p=>p?.pid+':'+p?.admit_t;
  const cache=new Map();let current=null;
  const rawFetch=window.fetch.bind(window);
  const text=(a,b)=>document.documentElement.lang.startsWith('ko')?a:b;
  const node=(tag,cls,html)=>{const e=document.createElement(tag);e.className=cls;if(html!==undefined)e.innerHTML=html;return e;};
  const samePatient=(a,b)=>a&&b&&key(a)===key(b);
  const find=(s,p)=>s?.floors?.flatMap(f=>f.units.flatMap(u=>u.beds)).find(b=>samePatient(b.patient,p))?.patient;
  async function history(profile){
    if(!['calm','bleeding','surge'].includes(profile))return [];
    if(!cache.has(profile))cache.set(profile,rawFetch('scenarios/'+profile+'.json').then(r=>{if(!r.ok)throw Error('Record history unavailable');return r.json();}).catch(()=>[]));
    return cache.get(profile);
  }
  function line(rows,label,asOf){
    if(!rows.length)return '<div class="dr-empty">'+text('선택 시점까지 관측값 없음','No observation through the selected time')+'</div>';
    const minX=Math.min(0,...rows.map(x=>x.minute)),maxX=Math.max(30,asOf,...rows.map(x=>x.minute));
    const low=Math.min(...rows.map(x=>x.value)),high=Math.max(...rows.map(x=>x.value));
    const padding=Math.max((high-low)*.18,label==='Temp'?.2:2),bottom=low-padding,top=high+padding;
    const x=r=>44+(r.minute-minX)/(maxX-minX||1)*308,y=r=>91-(r.value-bottom)/(top-bottom)*66;
    const middle=(minX+maxX)/2;
    const axisText=v=>'+'+Math.round(v)+' min';
    return '<svg viewBox="0 0 370 130" role="img" aria-label="'+E(label+' '+text('가상 기록 추이','fictional record history'))+'"><path class="dr-trend-axis" d="M44 102H352"/><text class="dr-trend-y" x="36" y="29" text-anchor="end">'+E(high)+'</text><text class="dr-trend-y" x="36" y="96" text-anchor="end">'+E(low)+'</text>'+(rows.length>1?'<polyline points="'+rows.map(r=>x(r)+','+y(r)).join(' ')+'"/>':'')+rows.map(r=>'<circle cx="'+x(r)+'" cy="'+y(r)+'" r="3.6"><title>'+E(time(r.minute)+' · '+r.value+' '+r.unit)+'</title></circle>').join('')+'<text x="44" y="123">'+E(axisText(minX))+'</text><text x="198" y="123" text-anchor="middle">'+E(axisText(middle))+'</text><text x="352" y="123" text-anchor="end">'+E(axisText(maxX))+'</text></svg>';
  }
  function factHTML(f){return '<div class="dr-fact" id="'+E(f.id)+'"><b>['+E(f.id)+']</b> '+E(f.label)+': <strong>'+E(f.value)+' '+E(f.unit)+'</strong><small>'+E(time(f.minute)+' · '+f.source)+'</small></div>';}
  function demoReply(record,question){
    const vitals=record.facts.filter(f=>f.kind==='vital'),lab=record.facts.filter(f=>f.kind==='lab');
    const selected=[...vitals.slice(0,4),...lab.slice(0,3),...record.facts.filter(f=>f.kind==='device'&&f.value==='사용 중').slice(0,2)];
    return {mode:'scripted',model:null,summary:record.scope.patientId+' · '+time(record.scope.asOfMinute)+'의 가상 기록입니다. '+vitals.slice(0,4).map(f=>f.label+' '+f.value+' '+f.unit).join(', ')+'.',checks:['선택 환자와 평가 시점이 맞는지 확인합니다.','측정값의 변화와 미확인 항목을 함께 확인합니다.','전실 시에는 담당팀 검토와 병동의 수용 준비를 확인합니다.'],preparation:['최근 검사와 장비 상태를 인계 자료에 모읍니다.','환자 상태에 대한 판단과 실제 처치는 담당 의료진의 검토가 필요합니다.'],sbar:{s:record.admission.primaryDiagnosis+' · '+record.admission.primaryProcedure,b:record.admission.route,a:vitals.map(f=>f.label+' '+f.value+' '+f.unit).join(' / '),r:'미확인 사항·관찰 계획·수용 준비를 담당팀과 확인'},unknowns:['미리 작성한 시연 응답이며 질문을 해석해 생성한 LLM 답변이 아닙니다.'],evidence_ids:selected.map(f=>f.id),question};
  }
  function mount(bed,language,settings={}){
    current?.dispose();if(!bed.patient)return;
    const body=document.getElementById('publicPatientBody');if(!body)return;
    const lang=language==='en'?'en':'ko',t=(a,b)=>lang==='ko'?a:b;
    const model=typeof S!=='undefined'?S:null;
    const hospital=typeof Network!=='undefined'?Network.hospital:'A';
    const profile=model?.hospital_profiles?.[hospital]||model?.demo_profile||'calm';
    let asOf=Number(settings.minute??bed.patient.demo_month?.sourceMinute??model?.t??0);
    let selectedPatient=structuredClone(bed.patient),frames=[],record=null,pane=settings.pane||'records',epoch=0,controller=null,live=false,thread=[],busy=false;
    const host=node('section','demo-records');host.dataset.noTranslate='';host.id='demoPatientRecords';
    const shortcuts=node('div','dr-shortcuts','<span>'+E(bed.patient.pid)+' · '+t('가상 환자 기록','Fictional patient records')+'</span><div><button data-dr-go="records">'+t('기록·이력 ↗','Records ↗')+'</button><button data-dr-go="labs">'+t('검사 결과 ↗','Labs ↗')+'</button><button class="dr-primary" data-dr-go="chat">'+t('환자 기록으로 AI 상담 ↗','Consult with patient records ↗')+'</button></div>');
    body.querySelector('.patient-sheet-head')?.after(shortcuts);
    const vitalStrip=body.querySelector('.patient-vitals');if(vitalStrip)vitalStrip.after(host);else body.append(host);
    const source=body.querySelector('#patientSheetSource p');if(source)source.textContent=t('공개 시연용 가상 환자·검사·장비 기록','Fictional patient, laboratory and device records for public demonstration');
    const secondary=body.querySelector('#patientOperations');if(secondary){const details=node('details','dr-secondary','<summary>'+t('시연 업무','Simulation tasks')+'</summary>');secondary.before(details);details.append(secondary);}
    body.querySelector('#observationLocationNote')?.setAttribute('hidden','');
    const dispose=()=>{epoch++;controller?.abort();};current={dispose};
    function recordHistory(){const canonical=frames.find(s=>s.t===asOf),p=canonical&&find(canonical,selectedPatient);return p&&SICUDemoRecords.fingerprint(p)===SICUDemoRecords.fingerprint(selectedPatient)?frames:[{minute:asOf,patient:selectedPatient}];}
    function build(){record=SICUDemoRecords.build({patient:selectedPatient,bed:{...bed,patient:selectedPatient},hospital,asOfMinute:asOf,history:recordHistory()});}
    function controls(){
      const minutes=[...new Set([asOf,...frames.filter(s=>find(s,bed.patient)).map(s=>s.t)])].filter(n=>Number.isFinite(n)&&n>=bed.patient.admit_t).sort((a,b)=>a-b);
      return '<header class="dr-heading"><div><h3>'+t('환자 기록','Patient records')+'</h3><p>'+E(record.scope.patientId)+' · '+t('가상 사례','Fictional case')+'</p></div><span class="dr-tag">'+t('가상 데이터','FICTIONAL')+'</span></header><div class="dr-assessment"><label>'+t('환자 평가 시점','Assessment time')+'<select data-dr-time>'+minutes.map(n=>'<option value="'+n+'"'+(n===asOf?' selected':'')+'>'+E(time(n))+'</option>').join('')+'</select></label><small>'+t('시점 변경 시 새 상담','A new consultation after a time change')+'</small></div><div class="dr-tabs" role="tablist" aria-label="'+t('환자 기록 분류','Patient record categories')+'">'+[['records','기록·이력','Records'],['labs','검사실','Labs'],['images','영상·검사','Imaging'],['chat','AI 상담','AI consultation']].map(([id,ko,en])=>'<button role="tab" aria-selected="'+(pane===id)+'" data-dr-tab="'+id+'" id="dr-tab-'+id+'" aria-controls="dr-panel" tabindex="'+(pane===id?0:-1)+'">'+t(ko,en)+'</button>').join('')+'</div><div id="dr-panel" role="tabpanel" aria-labelledby="dr-tab-'+pane+'"></div>';
    }
    function select(next,scroll=false){pane=next;render();if(scroll)host.scrollIntoView({behavior:'smooth',block:'start'});}
    function render(){
      if(!host.isConnected)return;host.innerHTML=controls();
      host.querySelectorAll('[data-dr-tab]').forEach(b=>b.onclick=()=>select(b.dataset.drTab));
      host.querySelector('[data-dr-time]').onchange=e=>changeTime(Number(e.target.value));
      host.querySelector('[role=tablist]').onkeydown=e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const tabs=['records','labs','images','chat'],i=tabs.indexOf(pane);select(e.key==='Home'?tabs[0]:e.key==='End'?tabs[3]:tabs[(i+(e.key==='ArrowRight'?1:3))%4]);host.querySelector('[aria-selected=true]').focus();};
      if(pane==='records')renderRecords();if(pane==='labs')renderLabs();if(pane==='images')renderImages();if(pane==='chat')renderChat();
    }
    function calculator(){const c=selectedPatient.clinical?.calculator;if(!c)return '';return '<article class="dr-card"><h4>qSOFA <strong>'+(c.score==null?t('자료 부족 · 미산출','Incomplete inputs'):E(c.score)+' / 3')+'</strong></h4><details><summary>'+t('입력값·출처','Inputs and references')+'</summary><dl class="dr-meta">'+(c.components||[]).map(x=>'<div><dt>'+E(x.name)+'</dt><dd>'+E(x.value??'—')+' '+E(x.unit)+'</dd></div>').join('')+'</dl><p><a href="https://doi.org/10.1001/jama.2016.0287" target="_blank" rel="noopener">qSOFA</a> · <a href="https://www.nature.com/articles/s41467-025-64430-x" target="_blank" rel="noopener">AgentMD</a></p></details></article>';}
    function renderRecords(){
      const a=record.admission,p=host.querySelector('#dr-panel');
      const firstPoint=Math.max(...Object.values(record.vitals).map(rows=>rows.length))===1;
      const labels={hr:['HR','심박수','Heart rate'],map:['MAP','평균동맥압','Mean arterial pressure'],spo2:['SpO₂','산소포화도','Oxygen saturation'],rr:['RR','호흡수','Respiratory rate'],sbp:['SBP','수축기혈압','Systolic blood pressure'],temperature:['Temp','체온','Temperature']};
      p.innerHTML='<div class="dr-trend-heading"><h4>'+t('활력 기록 추이','Vital history')+'</h4><p>'+t(firstPoint?'첫 관측 · 위의 평가 시점을 바꾸면 기록이 누적됩니다.':'선택 시점까지의 관측 기록',firstPoint?'First observation · change the assessment time above to see the history grow.':'Observations through the selected time')+'</p></div><div class="dr-trends">'+Object.entries(record.vitals).map(([k,rows])=>{
        const latest=rows.at(-1),label=labels[k]||[k,k,k];
        const current=k==='temperature'?selectedPatient.extra_observations?.temperature:selectedPatient.vitals?.[k];
        const known=typeof current==='number'&&Number.isFinite(current);
        const unit=latest?.unit||SICUDemoRecords.vitalDefinitions[k]?.unit||'';
        return '<article class="dr-card dr-vital-trend" data-vital="'+E(k)+'"><header><div><h4>'+E(label[0])+'</h4><small>'+E(t(label[1],label[2]))+'</small></div><div class="dr-trend-current"><small>'+t('현재','Current')+'</small><strong>'+E(known?current:'—')+'</strong><span>'+E(known?unit:'')+'</span></div></header>'+line(rows,label[0],asOf)+'<p class="dr-trend-latest">'+(latest?t('최근 기록 ','Latest ')+'<b>'+E(latest.value+' '+latest.unit)+'</b> · '+E(time(latest.minute)):t('연결된 기록 없음','No linked record'))+'</p><small class="dr-trend-count">'+rows.length+t('개 관측',' observations')+'</small></article>';
      }).join('')+'</div><article class="dr-card"><h4>'+t('입원 정보','Admission')+'</h4><dl class="dr-meta">'+[[t('입원 시각','Admission time'),time(a.admitMinute)],[t('입원 유형','Type'),a.type],[t('입원 경로','Route'),a.route]].map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+E(v)+'</dd></div>').join('')+'</dl><details><summary>'+t('기록 정보','Record information')+'</summary><p>'+E(record.scope.patientId+' · '+record.scope.admissionId)+'</p><p>'+E(record.scope.sourceLabel)+'</p></details></article>'+calculator()+'<article class="dr-card"><h4>'+t('장비·처치 이력','Device and procedure history')+'</h4><div class="dr-table-scroll"><table><thead><tr><th>'+t('항목','Item')+'</th><th>'+t('상태','State')+'</th><th>'+t('기록 시각','Time')+'</th></tr></thead><tbody>'+[...record.devices.filter(x=>x.state!=='inactive'),...record.procedures].map(x=>'<tr><td>'+E(x.name)+'<small>'+E(x.detail)+'</small></td><td>'+E(({active:t('사용 중','Active'),placed:t('연결','Placed'),unknown:t('미확인','Unknown')})[x.state]||x.status||x.state)+'</td><td>'+E(time(x.minute))+'</td></tr>').join('')+'</tbody></table></div></article><details class="dr-card"><summary>'+t('기록 근거','Record evidence')+' ('+record.facts.length+')</summary>'+record.facts.map(factHTML).join('')+'</details>';
    }
    function renderLabs(){
      const p=host.querySelector('#dr-panel'),codes=[...new Map(record.labs.map(l=>[l.code,l])).values()];let page=0;
      p.innerHTML='<article class="dr-card"><h4>'+t('검사 결과','Laboratory results')+'</h4><form class="dr-search"><label>'+t('검사 항목','Test')+'<select data-dr-code><option value="">'+t('전체','All')+'</option>'+codes.map(l=>'<option value="'+E(l.code)+'">'+E(l.name+' · '+l.nameKo)+'</option>').join('')+'</select></label><label>'+t('검사명·코드 검색','Name or code')+'<input data-dr-search placeholder="Hemoglobin, Creatinine"></label><button>'+t('검색','Search')+'</button><button type="button" data-dr-reset>'+t('초기화','Reset')+'</button></form><div data-dr-lab-results></div><small class="dr-muted">'+t('검사·참고범위는 시연용 가상 값 · 선택 시점까지 확인된 결과','Fictional results and ranges · available at the selected time')+'</small></article>';
      function show(){const query=p.querySelector('[data-dr-search]').value.trim().toLowerCase(),code=p.querySelector('[data-dr-code]').value;const rows=record.labs.filter(l=>(!code||code===l.code)&&(!query||[l.name,l.nameKo,l.code].join(' ').toLowerCase().includes(query))),start=page*12;const target=p.querySelector('[data-dr-lab-results]');
        target.innerHTML='<p class="dr-muted">'+rows.length+' '+t('건','results')+'</p><div class="dr-table-scroll"><table><thead><tr><th>'+t('검사','Test')+'</th><th>'+t('결과·단위','Result / unit')+'</th><th>'+t('가상 참고범위','Fictional range')+'</th><th>'+t('관측·확인','Observed / available')+'</th></tr></thead><tbody>'+rows.slice(start,start+12).map(l=>'<tr><td>'+E(l.name)+'<small>'+E(l.nameKo+' · '+l.code)+'</small></td><td><strong>'+E(l.value)+'</strong> '+E(l.unit)+'</td><td>'+E(l.referenceRange)+'</td><td>'+E(time(l.minute))+'<small>'+E(time(l.availableMinute))+'</small></td></tr>').join('')+'</tbody></table>'+(!rows.length?'<p class="dr-empty">'+t('조건에 맞는 검사 없음','No matching results')+'</p>':'')+'</div><div class="dr-pager"><button data-dr-prev '+(page===0?'disabled':'')+'>'+t('이전','Previous')+'</button><span>'+(rows.length?start+1:0)+'–'+Math.min(start+12,rows.length)+'</span><button data-dr-next '+(start+12>=rows.length?'disabled':'')+'>'+t('다음','Next')+'</button></div>';
        target.querySelector('[data-dr-prev]').onclick=()=>{page--;show();};target.querySelector('[data-dr-next]').onclick=()=>{page++;show();};}
      p.querySelector('form').onsubmit=e=>{e.preventDefault();page=0;show();};p.querySelector('[data-dr-code]').onchange=()=>{page=0;show();};p.querySelector('[data-dr-reset]').onclick=()=>{p.querySelector('form').reset();page=0;show();};show();
    }
    function renderImages(){
      const p=host.querySelector('#dr-panel');
      p.innerHTML='<article class="dr-card"><h4>'+t('영상·검사 이력','Imaging and test history')+'</h4><p class="dr-muted">'+t('설명용 도식 · 실제 환자 영상 아님','Illustrative diagram · not a patient image')+'</p><div class="dr-image-layout"><div class="dr-image" role="img" aria-label="'+t('흉부 검사 설명용 도식','Illustrative chest diagram')+'"><svg viewBox="0 0 320 320" aria-hidden="true"><rect width="320" height="320" rx="12" fill="#142a39"/><path d="M153 55V250M167 55V250M134 91Q84 79 65 160Q51 223 120 255L143 248V112M186 91Q236 79 255 160Q269 223 200 255L177 248V112" fill="#5c8192" stroke="#aec7d2" stroke-width="3"/><path d="M110 122Q160 90 210 122M94 151Q160 111 226 151M80 184Q160 138 240 184M88 216Q160 177 232 216" stroke="#c1d7df" fill="none" stroke-width="2"/><text x="160" y="291" text-anchor="middle" fill="#e2edf2" font-size="12">ILLUSTRATION · NOT A RADIOGRAPH</text></svg></div><div>'+record.tests.map(x=>'<div class="dr-fact"><b>'+E(x.name)+'</b><p>'+E(x.report||x.status)+'</p><small>'+E(time(x.minute)+' · '+x.source)+'</small></div>').join('')+'</div></div></article>';
    }
    function renderChat(){
      const p=host.querySelector('#dr-panel');p.innerHTML='<article class="dr-card"><header class="dr-chat-title"><h4>'+t('환자 기록 기반 간호 지원 AI','Patient-record nursing support AI')+'</h4><span class="dr-tag">'+(live?t('LLM 상담','LLM CONSULTATION'):t('시연 응답','DEMO RESPONSE'))+'</span></header><p class="dr-muted">'+t('선택한 가상 환자·시점에 고정된 검토 초안','Review draft fixed to the selected fictional patient and time')+'</p><details><summary>'+t('환자 근거','Patient evidence')+' ('+record.facts.length+')</summary>'+record.facts.map(factHTML).join('')+'</details><div class="dr-transcript" aria-live="polite"></div><form class="dr-chat-form"><label>'+t('현재 관찰·질문','Observation / question')+'<textarea maxlength="1200" required placeholder="'+t('이 환자의 기록을 요약하고 인계에서 확인할 내용을 알려줘','Summarize this patient’s records and handover checks')+'"></textarea></label><div class="dr-chat-controls"><div><button type="button" data-dr-prompt="summary">'+t('상태 요약','Summary')+'</button><button type="button" data-dr-prompt="sbar">SBAR</button><button type="button" data-dr-prompt="transfer">'+t('전실 검토','Transfer review')+'</button></div><button type="button" data-dr-new>'+t('새 대화','New chat')+'</button><button class="dr-primary" type="submit">'+(live?t('AI에게 질문','Ask AI'):t('시연 응답 보기','Show demo response'))+'</button></div><p class="dr-chat-status" role="status">'+(live?t('가상 기록만 모델에 전달합니다.','Only fictional records are sent to the model.'):t('API 연결 전 · 미리 작성한 응답으로 상담 흐름을 체험할 수 있습니다.','API not connected · authored responses demonstrate the consultation flow.'))+'</p></form></article>';
      const transcript=p.querySelector('.dr-transcript');thread.forEach(item=>replyHTML(transcript,item));
      const form=p.querySelector('form'),question=form.querySelector('textarea');if(busy)form.querySelectorAll('button:not([data-dr-new]),textarea').forEach(x=>x.disabled=true);
      p.querySelectorAll('[data-dr-prompt]').forEach(b=>b.onclick=()=>{question.value=b.dataset.drPrompt==='summary'?t('선택 시점의 활력·검사·장비 기록을 근거와 함께 요약해줘.','Summarize the selected vital, laboratory and device records with evidence.'):b.dataset.drPrompt==='sbar'?t('이 환자의 인계용 SBAR 초안을 기록 근거와 함께 작성해줘.','Draft an SBAR handover with record evidence.'):t('이 환자를 전실 검토할 때 확인할 기록과 미확인 사항을 구분해줘.','Separate available records and unknowns to check during transfer review.');question.focus();});
      p.querySelector('[data-dr-new]').onclick=()=>{dispose();busy=false;thread=[];renderChat();};
      form.onsubmit=async e=>{e.preventDefault();if(busy)return;const value=question.value.trim();if(!value)return;const ticket=++epoch,requestRecord=record;busy=true;form.querySelectorAll('button,textarea').forEach(x=>x.disabled=true);const status=p.querySelector('.dr-chat-status');status.textContent=live?t('LLM 응답 생성 중…','Generating LLM response…'):t('시연 기록을 확인합니다.','Reviewing fictional records.');
        try{let result;if(live){controller=new AbortController();const response=await rawFetch('api/demo/consult',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({patientId:selectedPatient.pid,admitMinute:selectedPatient.admit_t,asOfMinute:asOf,hospital,bedId:bed.id,profile,patientFingerprint:SICUDemoRecords.fingerprint(selectedPatient),language:lang,question:value}),signal:controller.signal});const json=await response.json();if(!response.ok)throw Error(json.error||'AI request failed');if(json.patientKey!==requestRecord.scope.key||json.asOfMinute!==asOf)throw Error('Patient/time mismatch');result=json.reply;const ids=new Set(requestRecord.facts.map(f=>f.id));if(!result.evidence_ids?.length||result.evidence_ids.some(id=>!ids.has(id)))throw Error('Invalid evidence references');}else result=demoReply(record,value);if(ticket!==epoch||!host.isConnected)return;thread.push({question:value,result});if(pane==='chat')renderChat();}
        catch(error){if(ticket===epoch&&host.isConnected&&pane==='chat'&&error.name!=='AbortError'){status.textContent=t('연결 확인 필요: ','Connection needs checking: ')+error.message;form.querySelectorAll('button,textarea').forEach(x=>x.disabled=false);}}
        finally{if(ticket===epoch){busy=false;host.querySelectorAll('.dr-chat-form button,.dr-chat-form textarea').forEach(x=>x.disabled=false);}}
      };
    }
    function replyHTML(parent,item){const r=item.result,article=node('article','dr-reply');const ids=new Set(r.evidence_ids||[]);article.innerHTML='<header><b>'+E(r.mode==='live'?t('실제 LLM 응답','Live LLM response'):t('미리 작성한 시연 응답','Authored demonstration response'))+'</b><small>'+E(record.scope.patientId+' · '+time(asOf)+(r.model?' · '+r.model:''))+'</small></header><p class="dr-question">'+E(item.question)+'</p><h4>'+t('상태 요약','Summary')+'</h4><p>'+E(r.summary)+'</p><h4>'+t('확인할 내용','Checks')+'</h4><ul>'+r.checks.map(v=>'<li>'+E(v)+'</li>').join('')+'</ul><h4>'+t('준비·인계','Preparation / handover')+'</h4><ul>'+r.preparation.map(v=>'<li>'+E(v)+'</li>').join('')+'</ul><details open><summary>SBAR</summary>'+Object.entries(r.sbar).map(([k,v])=>'<p><b>'+E(k.toUpperCase())+'</b> '+E(v)+'</p>').join('')+'</details><details><summary>'+t('인용한 가상 기록','Cited fictional records')+' ('+ids.size+')</summary>'+record.facts.filter(f=>ids.has(f.id)).map(factHTML).join('')+'</details><p class="dr-muted">'+E((r.unknowns||[]).join(' '))+'</p>';parent.append(article);}
    function changeTime(minute){const sample=frames.find(s=>s.t===minute),p=sample&&find(sample,bed.patient);if(!p)return;const replacement={...bed,patient:structuredClone(p)};dispose();nativeOpen.call(window,replacement,lang);mount(replacement,lang,{minute,pane});const stamp=document.querySelector('#publicPatientBody .patient-sheet-asof>small');if(stamp)stamp.textContent=time(minute)+' · '+t('가상 기록','Fictional record');const basis=document.querySelector('#patientDataBasis');if(basis)basis.innerHTML='<strong>'+E(time(minute))+'</strong><span>'+t(' · 가상 기록 조회 시점',' · Fictional record assessment time')+'</span>';document.querySelector('#demoPatientRecords [data-dr-time]')?.focus({preventScroll:true});}
    shortcuts.querySelectorAll('button').forEach(b=>b.onclick=()=>select(b.dataset.drGo,true));
    build();render();
    history(profile).then(data=>{if(!host.isConnected)return;frames=data;build();if(pane!=='chat'||!thread.length)render();});
    rawFetch('api/demo/status').then(r=>r.ok?r.json():null).then(status=>{if(!host.isConnected)return;live=status?.available===true;if(pane==='chat'&&!busy&&!thread.length)renderChat();}).catch(()=>{});
  }
  const nativeOpen=window.openPublicBed;
  window.openPublicBed=function(bed,language){const result=nativeOpen.apply(this,arguments);mount(bed,language);return result;};
  document.getElementById('publicPatient')?.addEventListener('close',()=>{if(!document.getElementById('publicPatient').open){current?.dispose();current=null;}});
})();
