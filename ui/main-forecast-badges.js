/* Normal-map authored percentages live in the exterior bed-number lane.
 * The six care icons and bed artwork are deliberately left untouched.
 */
(function(root){
  'use strict';
  if(root.SICUMainForecasts)return;
  const NS='http://www.w3.org/2000/svg',layers=new Map();
  const state=()=>typeof S!=='undefined'?S:null;
  const ko=()=>String(document.documentElement.lang||'ko').startsWith('ko');
  const t=(a,b)=>ko()?a:b;
  const contexts=()=>root.SICUWardSpaces?.contexts?.()||[];
  const active=()=>root.SICUAdmissionMap?.describe?.().active===true||document.body.dataset.admissionMapActive==='true';
  const svg=(name,attrs,parent)=>{const el=document.createElementNS(NS,name);Object.entries(attrs||{}).forEach(([k,v])=>el.setAttribute(k,String(v)));parent?.appendChild(el);return el;};
  function findBed(id){for(const context of contexts()){const bed=context.unit.beds.find(b=>String(b.id)===String(id));if(bed)return {bed,context};}return null;}
  function currentForBed(input){
    const found=findBed(typeof input==='object'?input?.id:input);
    if(!found)return Object.freeze({available:false,reason:'not-in-current-ward'});
    if(active())return Object.freeze({available:false,reason:'admission-simulation-active'});
    const {bed,context}=found;
    return root.SICUDemoForecastModel.getForBed({state:state(),bed:typeof input==='object'?input:bed,currentBed:bed,hospital:context.unit.hospital_id||'A',ward:context.unit.id});
  }
  function clear(){layers.forEach(({layer,legend})=>{layer.remove();legend.remove();});layers.clear();}
  function create(context){
    const layer=svg('g',{class:'main-forecast-badges','pointer-events':'none','data-no-translate':''},context.svg);
    const legend=document.createElement('p');legend.className='main-forecast-legend';legend.dataset.noTranslate='';context.svg.after(legend);
    const record={layer,legend,badges:new Map()};layers.set(context.svg,record);return record;
  }
  function badgeNode(layer,bed){
    const group=svg('g',{class:'main-forecast-bed','data-forecast-bed':bed.id},layer);
    ['death','transfer'].forEach(kind=>{
      const chip=svg('g',{class:'main-forecast-chip main-forecast-'+kind},group);
      svg('rect',{x:0,y:0,width:2.45,height:.9,rx:.27},chip);
      svg('text',{x:.16,y:.53,class:'main-forecast-label'},chip);
      svg('text',{x:2.3,y:.54,'text-anchor':'end',class:'main-forecast-value'},chip);
    });
    svg('title',{},group);return group;
  }
  function render(){
    if(active()){clear();return;}
    const all=contexts(),live=new Set(all.map(context=>context.svg));
    for(const [canvas,record]of layers)if(!live.has(canvas)||!canvas.isConnected){record.layer.remove();record.legend.remove();layers.delete(canvas);}
    all.forEach(context=>{
      const record=layers.get(context.svg)||create(context),seen=new Set();
      let hasSynthetic=false;
      context.unit.beds.forEach(bed=>{
        seen.add(String(bed.id));let group=record.badges.get(String(bed.id));
        if(!group){group=badgeNode(record.layer,bed);record.badges.set(String(bed.id),group);}
        const value=currentForBed(bed),upper=Number(bed.y)<Number(context.unit.h)/2,numberY=upper?-.65:Number(context.unit.h)+.65;
        hasSynthetic=hasSynthetic||bed.patient?.source==='synthetic';
        group.setAttribute('data-forecast-state',value.available?'current':value.reason||'missing');
        group.setAttribute('data-patient-id',value.patientId||'');group.setAttribute('data-episode-key',value.episodeKey||'');
        group.setAttribute('data-assessment-hour',value.available?value.assessment.hour:'');
        const death=group.querySelector('.main-forecast-death'),transfer=group.querySelector('.main-forecast-transfer');
        death.setAttribute('transform','translate('+(Number(bed.x)-3.65)+' '+(numberY-.46)+')');
        transfer.setAttribute('transform','translate('+(Number(bed.x)+1.2)+' '+(numberY-.46)+')');
        death.querySelector('.main-forecast-label').textContent=t('사망','Death');transfer.querySelector('.main-forecast-label').textContent=t('전과','72h');
        death.querySelector('.main-forecast-value').textContent=value.available?value.mortalityPercent.toFixed(1)+'%':'—';
        transfer.querySelector('.main-forecast-value').textContent=value.available?value.transfer72hPercent.toFixed(1)+'%':'—';
        group.querySelector('title').textContent=value.available?t('가상 예측 · 원내 사망 / 72시간 내 생존 일반병동 전과 · ','Authored forecast · hospital death / alive ICU-to-ward transfer within 72h · ')+value.assessment.stamp+t(' 평가 · 실제 모델 추론 아님',' assessment · not model inference'):t('현재 ICU 재실 환자의 예측값 없음','No forecast for a current ICU occupant');
      });
      for(const [id,group]of record.badges)if(!seen.has(id)){group.remove();record.badges.delete(id);}
      record.legend.hidden=!hasSynthetic;
      const allocated=state()?.demo_month;
      record.legend.textContent=t('가상 예측 · 매시간 갱신 · 사망: 원내 사망 · 전과: 72시간 내 생존 일반병동 전과 · 모델 추론 아님','Authored forecasts · hourly updates · Death: in-hospital · Ward: alive ICU-to-ward transfer within 72h · not model inference')+(allocated?t(' · 배치 시연 시각 기준',' · allocation-demo clock'):t(' · 환자 기록 재생 시각 기준',' · patient-replay clock'));
    });
  }
  function later(){queueMicrotask(render);}
  for(const name of ['draw','build'])if(typeof root[name]==='function'){const native=root[name];root[name]=function(){const result=native.apply(this,arguments);render();return result;};}
  ['icu-language','sicu-demo-month','sicu-admission-scene','sicu-admission-context-changed','sicu-workspace-mode'].forEach(name=>document.addEventListener(name,later));
  root.SICUMainForecasts=Object.freeze({currentForBed,render,clear});render();
})(window);
