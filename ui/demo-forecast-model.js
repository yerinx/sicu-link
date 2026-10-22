/* Authored presentation percentages, separate from every clinical/risk field.
 * Each array explicitly supplies hours 00–23. These are fictional daily display
 * schedules, never model inference, interpolation or a clinical risk calculator.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SICUDemoForecastModel=api;})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const profiles=[
    {id:'steady-recovery',death:[6.8,6.6,6.5,6.4,6.2,6.1,6.0,5.8,5.6,5.4,5.2,5.0,4.9,4.8,4.6,4.5,4.3,4.2,4.0,3.9,3.8,3.6,3.5,3.4],transfer:[28,29,30,31,33,34,36,38,40,43,45,47,49,51,54,56,59,61,64,66,68,70,72,74]},
    {id:'additional-review',death:[11.0,11.2,11.4,11.7,12.0,12.2,12.5,12.9,13.2,13.6,14.0,14.4,14.8,15.0,14.7,14.2,13.8,13.4,13.0,12.6,12.2,11.9,11.5,11.2],transfer:[18,18,17,17,16,16,15,15,14,14,13,13,12,12,13,14,15,16,17,18,19,20,21,22]},
    {id:'transfer-discussion',death:[4.8,4.7,4.6,4.5,4.3,4.2,4.1,4.0,3.8,3.7,3.6,3.5,3.4,3.3,3.1,3.0,2.9,2.8,2.7,2.6,2.5,2.4,2.3,2.2],transfer:[52,53,54,55,56,57,58,60,62,64,66,68,70,72,74,75,76,77,78,79,80,81,82,83]},
    {id:'extended-monitoring',death:[17.1,17.3,17.5,17.7,18.0,18.2,18.4,18.7,18.9,19.1,19.3,19.5,19.6,19.4,19.2,18.9,18.6,18.3,18.0,17.7,17.4,17.1,16.8,16.5],transfer:[9,9,8,8,7,7,6,6,5,5,4,4,4,5,6,7,8,9,10,11,12,13,14,15]},
    {id:'gradual-progress',death:[9.8,9.6,9.5,9.3,9.1,8.9,8.7,8.5,8.4,8.2,8.0,7.8,7.6,7.5,7.3,7.1,6.9,6.7,6.5,6.3,6.1,5.9,5.7,5.5],transfer:[34,35,36,37,38,39,40,41,43,45,47,49,51,53,55,57,59,61,63,65,67,69,71,73]},
    {id:'stable-observation',death:[7.2,7.4,7.6,7.5,7.3,7.1,7.0,6.8,6.9,7.1,7.3,7.5,7.4,7.2,7.0,6.8,6.7,6.6,6.5,6.4,6.3,6.2,6.1,6.0],transfer:[40,39,38,39,40,41,42,43,42,41,40,39,40,41,42,43,44,45,46,47,48,49,50,51]}
  ];
  const horizons=Object.freeze({mortality:'hospital-stay',transfer:'72h-alive-icu-to-ward'});
  profiles.forEach(p=>{Object.freeze(p.death);Object.freeze(p.transfer);Object.freeze(p);});Object.freeze(profiles);
  const numeric=value=>typeof value==='number'&&Number.isFinite(value);
  const same=(a,b)=>String(a??'')===String(b??'');
  function unavailable(reason,extra={}){return Object.freeze({available:false,reason,sourceKind:'authored-synthetic-hourly',modelInference:false,notModelInference:true,...extra});}
  function identity(bed,hospital='A',ward=''){
    const p=bed?.patient;if(!p||p.source!=='synthetic'||typeof p.pid!=='string'||!/^SIM-[A-Za-z0-9-]+$/.test(p.pid)||!numeric(p.admit_t))return null;
    const slotKey=String(p.demo_month?.slotKey||'');
    return JSON.stringify([String(hospital),String(ward),p.pid,p.admit_t,slotKey]);
  }
  function hash(value){let n=2166136261;for(const char of value){n^=char.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
  function clockMinute(clock){const m=/^(\d{1,2}):(\d{2})$/.exec(String(clock||''));if(!m)return null;const h=Number(m[1]),n=Number(m[2]);return h<24&&n<60?h*60+n:null;}
  const hhmm=minute=>String(Math.floor(minute/60)%24).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');
  function getForBed({state,bed,hospital='A',ward='',currentBed}={}){
    if(!state||!bed)return unavailable('missing-context');
    let p=bed.patient;const key=identity(bed,hospital,ward);
    if(!key)return unavailable('unsupported-patient');
    if(currentBed&&(!same(currentBed.id,bed.id)||identity(currentBed,hospital,ward)!==key))return unavailable('stale-episode');
    // A caller may retain an older rendering of this same admission. Validate
    // identity first, then read only the current admission's assessment clock.
    if(currentBed){bed=currentBed;p=bed.patient;}
    const monthly=bed.demo_month,month=p.demo_month;
    if(!p||bed.unavailable===true||bed.reservation||bed.flow?.kind==='icu_death'||['turnover','reserved','empty','vacant','deceased'].includes(bed.flow?.status?.key)||monthly&&monthly.occupied!==true)return unavailable('not-current-icu-occupant',{episodeKey:key,patientId:p.pid});
    let assessment;
    if(month||monthly){
      if(!month?.fictionalAssignment||!month.slotKey||!numeric(month.day)||!numeric(month.minute)||!numeric(monthly?.admitDay)||!same(monthly.slotKey,month.slotKey.split('-').slice(-2).join('-')))return unavailable('missing-allocation-clock');
      if(month.day<1||month.day>31||month.minute<0||month.minute>=1440)return unavailable('invalid-allocation-clock');
      const now=(month.day-1)*1440+month.minute,minute=Math.floor(now/60)*60;
      const entered=(monthly.admitDay-1)*1440+(monthly.admitDay===1?0:540);
      if(minute<entered)return unavailable('before-admission-assessment');
      const day=Math.floor(minute/1440)+1;
      assessment=Object.freeze({basis:'fictional-allocation-clock',hour:Math.floor(minute/60),minute,stamp:'D'+day+' '+hhmm(minute%1440),elapsedHour:Math.floor((minute-entered)/60),sourceMinute:numeric(month.sourceMinute)?month.sourceMinute:null});
    }else{
      if(!numeric(state.t)||state.t<0)return unavailable('missing-source-clock');
      const clock=clockMinute(state.clock);if(clock===null)return unavailable('missing-source-clock');
      const minute=Math.floor(state.t/60)*60;if(minute<p.admit_t)return unavailable('before-admission-assessment');
      const wall=((clock-(state.t-minute))%1440+1440)%1440;
      assessment=Object.freeze({basis:'source-clock',hour:Math.floor(minute/60),minute,stamp:hhmm(wall),elapsedHour:Math.floor((minute-p.admit_t)/60),sourceMinute:state.t});
    }
    // Hash selects a named authored fixture only; it never estimates a risk.
    const profile=profiles[hash(key)%profiles.length],hourIndex=Math.floor((assessment.minute+(assessment.basis==='source-clock'?(clockMinute(state.clock)-state.t):0))/60);
    const index=((hourIndex%24)+24)%24;
    return Object.freeze({available:true,reason:null,sourceKind:'authored-synthetic-hourly',modelInference:false,notModelInference:true,patientId:p.pid,episodeKey:key,admissionMinute:p.admit_t,scope:Object.freeze({hospital:String(hospital),ward:String(ward),slotKey:month?.slotKey||null}),assessment,assessmentHour:assessment.hour,assessmentLabel:assessment.stamp,mortalityPercent:profile.death[index],transfer72hPercent:profile.transfer[index],horizons,profileId:profile.id});
  }
  return Object.freeze({getForBed,identity,profiles,horizons});
});
