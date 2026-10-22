/* Read-only view of the evidence actually queried in the local story. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SICUAdmissionAssistantModel=api;})(typeof window!=='undefined'?window:null,()=>{
  'use strict';
  const list=x=>Array.isArray(x)?x:[],copy=x=>JSON.parse(JSON.stringify(x));
  function build(v){
    if(!v?.candidate?.patientId||!v?.candidate?.bedId)return null;
    const patientId=v.candidate.patientId,bedId=v.candidate.bedId;
    const records=list(v.tooltrace).filter(r=>r.tool==='getReadiness'&&r.status==='completed'&&r.hour<=v.hour&&r.result?.patientId===patientId&&r.result?.bedId===bedId);
    const last=records.at(-1),previous=last?[...records].reverse().find(r=>r.hour<last.hour):null;
    const requirements=list(last?.result?.requirements).map(r=>{
      const before=list(previous?.result?.requirements).find(p=>p.key===r.key);
      return {...copy(r),previousMet:before?!!before.met:null,changed:!!before&&!!before.met!==!!r.met};
    });
    const events=list(v.coreView?.events).filter(e=>Number.isFinite(e.hour)&&e.hour<=v.hour).map(copy);
    return {scopeKey:[v.scenario?.id,patientId,bedId].join('|'),phase:v.phase,hour:v.hour,time:v.time,bedNumber:v.candidate.bedNumber,patientId,bedId,requestStatus:v.request?.status,completed:!!v.completed,
      readiness:{queried:!!last,stale:!!last&&last.hour!==v.hour,hour:last?.hour??null,time:last?.time??null,evidenceId:last?.id??null,requirements,changes:requirements.filter(r=>r.changed)},
      events,currentEvents:events.filter(e=>e.hour===v.hour),evidenceCount:list(v.tooltrace).length};
  }
  return Object.freeze({build});
});
