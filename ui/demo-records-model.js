/* Public demonstration records. Every value produced here is fictional.
 * No K-MIMIC records, identifiers, endpoints, images or credentials are used.
 * Patient/admission identity and selected-time filtering are shared with AI.
 */
(function (root, factory) {
  'use strict';
  let supplements = null;
  if (typeof module === 'object' && module.exports) {
    try { supplements = require('./clinical-demo-records.js'); } catch (_) { /* Optional authored supplement. */ }
  }
  const api = factory(() => root?.SICUClinicalDemo || supplements);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SICUDemoRecords = api;
})(typeof window !== 'undefined' ? window : null, function (getSupplements) {
  'use strict';
  const SOURCE = 'TEAM 4 · 공개 시연용 가상 기록';
  const SOURCE_EN = 'TEAM 4 · Authored fictional demonstration records';
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const localized = value => typeof value === 'string' ? value : value?.ko || value?.en || '';
  const hash = value => {
    let result = 2166136261;
    for (const char of String(value)) { result ^= char.charCodeAt(0); result = Math.imul(result, 16777619); }
    return result >>> 0;
  };
  const identity = patient => patient && typeof patient.pid === 'string' && finite(patient.admit_t)
    ? patient.pid + ':' + patient.admit_t : null;
  const round = (value, precision = 1) => Number(value.toFixed(precision));
  const DEFINITIONS = Object.freeze({
    hr: {name: 'HR', nameKo: '심박수', unit: 'bpm'},
    map: {name: 'MAP', nameKo: '평균동맥압', unit: 'mmHg'},
    spo2: {name: 'SpO₂', nameKo: '산소포화도', unit: '%'},
    rr: {name: 'RR', nameKo: '호흡수', unit: '/min'},
    sbp: {name: 'SBP', nameKo: '수축기혈압', unit: 'mmHg'},
    temperature: {name: 'Temperature', nameKo: '체온', unit: '°C'}
  });
  const DEVICE_NAMES = Object.freeze({
    oxygen: ['산소 공급', 'Oxygen support'], ventilator: ['인공호흡기', 'Ventilator'],
    iv: ['정맥주입', 'Peripheral IV'], central_line: ['중심정맥관', 'Central venous catheter'],
    arterial_line: ['동맥관', 'Arterial catheter'], urinary_catheter: ['유치도뇨관', 'Urinary catheter'],
    drain: ['배액관', 'Drain'], ecmo: ['ECMO', 'ECMO'], crrt: ['CRRT', 'CRRT']
  });
  // Labels describe fictional backgrounds, not recommendations or prediction labels.
  const BACKGROUNDS = Object.freeze({
    SICU: [
      ['간 종양', 'Liver tumour', '간 부분 절제술', 'Partial hepatectomy'],
      ['결장암', 'Colon cancer', '복강경 결장 절제술', 'Laparoscopic colectomy'],
      ['위 종양', 'Gastric tumour', '위 아전절제술', 'Subtotal gastrectomy'],
      ['췌장 종양', 'Pancreatic tumour', '췌장 절제술', 'Pancreatic resection']
    ],
    CSICU: [
      ['관상동맥질환', 'Coronary artery disease', '관상동맥 우회술', 'Coronary artery bypass grafting'],
      ['승모판 폐쇄부전증', 'Mitral regurgitation', '승모판 성형술', 'Mitral valve repair']
    ],
    NSICU: [
      ['뇌종양', 'Brain tumour', '개두 종양 절제술', 'Craniotomy and tumour resection'],
      ['뇌동맥류', 'Cerebral aneurysm', '뇌동맥류 결찰술', 'Aneurysm clipping']
    ],
    TSICU: [
      ['흉부 외상', 'Chest trauma', '흉강경 수술', 'Video-assisted thoracic surgery'],
      ['복부 다발성 손상', 'Multiple abdominal injuries', '탐색적 개복술', 'Exploratory laparotomy']
    ]
  });
  const LABS = Object.freeze([
    {code: 'DEMO-HB', name: 'Hemoglobin', nameKo: '혈색소', unit: 'g/dL', referenceRange: '12.0–16.0', values: [10.7, 11.1, 11.5, 10.9, 12.4, 9.8, 12.1, 11.8]},
    {code: 'DEMO-WBC', name: 'WBC', nameKo: '백혈구', unit: '10³/µL', referenceRange: '4.0–10.0', values: [10.4, 11.8, 9.5, 12.2, 8.9, 13.0, 10.1, 9.3]},
    {code: 'DEMO-PLT', name: 'Platelet', nameKo: '혈소판', unit: '10³/µL', referenceRange: '150–400', values: [174, 210, 162, 190, 225, 151, 198, 240]},
    {code: 'DEMO-CR', name: 'Creatinine', nameKo: '크레아티닌', unit: 'mg/dL', referenceRange: '0.6–1.2', values: [0.9, 1.1, 0.8, 1.4, 1.0, 1.6, 0.9, 1.2]},
    {code: 'DEMO-K', name: 'Potassium', nameKo: '칼륨', unit: 'mmol/L', referenceRange: '3.5–5.1', values: [4.1, 3.8, 4.3, 4.6, 4.0, 4.7, 3.9, 4.2]},
    {code: 'DEMO-NA', name: 'Sodium', nameKo: '나트륨', unit: 'mmol/L', referenceRange: '135–145', values: [138, 140, 137, 136, 141, 134, 139, 138]},
    {code: 'DEMO-GLU', name: 'Glucose', nameKo: '혈당', unit: 'mg/dL', referenceRange: '70–110', values: [142, 135, 128, 156, 119, 168, 133, 145]},
    {code: 'DEMO-LAC', name: 'Lactate', nameKo: '젖산', unit: 'mmol/L', referenceRange: '0.5–2.0', values: [1.8, 2.1, 1.5, 2.7, 1.3, 3.0, 1.7, 2.0]}
  ]);

  // Canonical, unhashed context fingerprint: identical in browsers and Node.
  // Explicit field order and normalized missing values avoid object-key-order drift.
  // This is a fixture selector, not authentication or a clinical identifier.
  function fingerprint(patient) {
    const key = identity(patient);
    if (!key) throw new TypeError('A patient and admission identity are required for the demo fingerprint.');
    const vitals = {};
    for (const vitalKey of Object.keys(DEFINITIONS)) {
      const value = vitalKey === 'temperature' ? patient.extra_observations?.temperature : patient.vitals?.[vitalKey];
      vitals[vitalKey] = finite(value) ? value : null;
    }
    const devices = {};
    for (const deviceKey of Object.keys(DEVICE_NAMES)) {
      const value = patient.devices?.[deviceKey];
      devices[deviceKey] = value === true ? true : value === false ? false : null;
    }
    return JSON.stringify({version: 'demo-context-1', key, vitals, devices});
  }

  function patientFromHistory(entry, expected) {
    if (!entry || typeof entry !== 'object') return null;
    const time = finite(entry.minute) ? entry.minute : finite(entry.t) ? entry.t : finite(entry.asOfMinute) ? entry.asOfMinute : null;
    if (time === null) return null;
    let candidates = [];
    if (entry.patient) candidates.push(entry.patient);
    if (Array.isArray(entry.patients)) candidates.push(...entry.patients);
    if (Array.isArray(entry.floors)) candidates.push(...entry.floors.flatMap(floor => (floor.units || []).flatMap(unit => (unit.beds || []).map(bed => bed.patient).filter(Boolean))));
    if (identity(entry)) candidates.push(entry);
    const patient = candidates.find(item => item?.source === 'synthetic' && identity(item) === expected);
    return patient ? {minute: time, patient} : null;
  }

  function build(options = {}) {
    let patient = options.patient;
    const key = identity(patient);
    if (!key || !/^SIM[-_]/.test(patient.pid) || patient.source !== 'synthetic') {
      throw new TypeError('Public demo records require a synthetic SIM patient and an explicit admission time.');
    }
    const bed = typeof options.bed === 'object' && options.bed ? options.bed : null;
    if (bed?.patient && identity(bed.patient) !== key) throw new TypeError('Patient and bed admission identities do not match.');
    const bedId = typeof options.bed === 'string' ? options.bed : bed?.id || '';
    const hospitalId = typeof options.hospital === 'string' ? options.hospital : options.hospital?.id || options.hospital?.hospital_id || bedId.split('-')[0] || 'A';
    const asOfMinute = finite(options.asOfMinute) ? options.asOfMinute : finite(options.t) ? options.t : Math.max(0, patient.admit_t);
    const admitMinute = patient.admit_t;
    const samples = (Array.isArray(options.history) ? options.history : []).map(entry => patientFromHistory(entry, key))
      .filter(sample => sample && sample.minute <= asOfMinute && sample.minute >= admitMinute)
      .sort((a, b) => a.minute - b.minute);
    // Resolve the selected patient's complete fictional state from matching timestamped history.
    if (samples.length) patient = samples.at(-1).patient;
    const selectedMinute = samples.at(-1)?.minute ?? asOfMinute;
    const seed = hash(key), suffix = seed.toString(36).toUpperCase();
    const id = label => 'DEMO-' + suffix + '-' + label;
    const ward = String(bedId || patient.pid).match(/(?:^|-)(CSICU|NSICU|TSICU|SICU)(?:-|$)/)?.[1] || 'SICU';
    const background = BACKGROUNDS[ward][seed % BACKGROUNDS[ward].length];
    const supplement = getSupplements()?.find?.(patient) || null;
    const primaryDiagnosis = localized(supplement?.primary_diagnosis) || localized(patient.primary_diagnosis) || background[0];
    const primaryProcedure = localized(supplement?.primary_procedure) || localized(patient.primary_procedure) || background[2];
    const scope = {
      key, patientId: patient.pid, admissionId: id('ADM'), bedId, hospitalId, ward, asOfMinute,
      isFictional: true, sourceKind: 'fictional_example', sourceLabel: SOURCE, sourceLabelEn: SOURCE_EN
    };
    const admission = {
      id: id('ADM'), admitMinute, type: seed % 4 === 0 ? '응급 입원' : '계획 수술 후 입원',
      route: seed % 4 === 0 ? '응급실 → 수술실 → ICU' : '수술실 → ICU',
      primaryDiagnosis, primaryDiagnosisEn: supplement?.primary_diagnosis?.en || background[1],
      primaryProcedure, primaryProcedureEn: supplement?.primary_procedure?.en || background[3],
      source: SOURCE, sourceKind: 'fictional_example', isFictional: true
    };
    const record = {scope, admission, vitals: {}, labs: [], devices: [], procedures: [], tests: [], facts: []};
    const visible = row => finite(row.minute) && finite(row.availableMinute) && row.minute <= asOfMinute && row.availableMinute <= asOfMinute;
    const stamp = (row, minute, delay = 0) => ({...row, minute, availableMinute: minute + delay, source: SOURCE, sourceKind: 'fictional_example', isFictional: true});
    const addFact = (kind, label, value, minute, recordId, unit = '', extra = {}) => {
      if (minute > asOfMinute || !finite(minute)) return;
      record.facts.push({id: id('F-' + kind + '-' + hash(recordId + '|' + label).toString(36)), kind, label, value: value == null ? '미확인' : String(value), unit, minute, source: SOURCE, recordId, sourceKind: 'fictional_example', isFictional: true, ...extra});
    };
    if (admitMinute <= asOfMinute) {
      addFact('admission', '입원 경로', admission.route, admitMinute, admission.id);
      addFact('diagnosis', '가상 주진단', primaryDiagnosis, admitMinute, admission.id);
      addFact('procedure', '가상 주수술', primaryProcedure, admitMinute, admission.id);
    }

    // Timestamped matching history takes precedence over an untimestamped patient object.
    // A user may seek backwards while the dashboard object still contains a later state.
    // Without matching history, the caller declares this patient to be the selected state.
    if (!samples.length && asOfMinute >= admitMinute) samples.push({minute: asOfMinute, patient});
    for (const [vitalKey, definition] of Object.entries(DEFINITIONS)) {
      const byMinute = new Map();
      for (const sample of samples) {
        const value = vitalKey === 'temperature' ? sample.patient.extra_observations?.temperature : sample.patient.vitals?.[vitalKey];
        if (!finite(value)) continue;
        byMinute.set(sample.minute, stamp({id: id('V-' + vitalKey + '-' + String(sample.minute).replace(/[^\w-]/g, '_')), key: vitalKey, name: definition.name, nameKo: definition.nameKo, value, unit: definition.unit}, sample.minute));
      }
      record.vitals[vitalKey] = [...byMinute.values()].sort((a, b) => a.minute - b.minute);
      const latest = record.vitals[vitalKey].at(-1);
      if (latest) addFact('vital', definition.nameKo, latest.value, latest.minute, latest.id, latest.unit);
    }

    // Pre-ICU, arrival, and subsequent panels are authored examples. Availability delay is explicit.
    const panels = [
      {minute: admitMinute - 60, delay: 12, phase: 0},
      {minute: admitMinute + 5, delay: 4, phase: 1},
      {minute: admitMinute + 15, delay: 3, phase: 2},
      {minute: admitMinute + 6 * 60, delay: 20, phase: 3},
      {minute: admitMinute + 24 * 60, delay: 20, phase: 4},
      {minute: admitMinute + 48 * 60, delay: 20, phase: 5}
    ];
    for (const panel of panels) for (let index = 0; index < LABS.length; index++) {
      const definition = LABS[index];
      const base = definition.values[(seed + index) % definition.values.length];
      const precision = ['DEMO-PLT', 'DEMO-NA', 'DEMO-GLU'].includes(definition.code) ? 0 : 1;
      const shift = panel.phase === 0 ? 0 : ((seed + panel.phase + index) % 3 - 1) * (precision === 0 ? 2 : 0.1);
      const row = stamp({id: id('L-' + index + '-' + panel.phase), code: definition.code, name: definition.name, nameKo: definition.nameKo,
        value: round(base + shift, precision), unit: definition.unit, referenceRange: definition.referenceRange,
        referenceKind: 'fictional_example', panel: '가상 검사 패널 ' + (panel.phase + 1)}, panel.minute, panel.delay);
      if (visible(row)) record.labs.push(row);
    }
    record.labs.sort((a, b) => b.minute - a.minute || a.code.localeCompare(b.code));
    for (const definition of LABS) {
      const latest = record.labs.find(row => row.code === definition.code);
      if (latest) addFact('lab', latest.nameKo + ' · ' + latest.name, latest.value, latest.minute, latest.id, latest.unit, {availableMinute: latest.availableMinute});
    }

    for (const [deviceKey, names] of Object.entries(DEVICE_NAMES)) {
      const value = patient.devices?.[deviceKey];
      const state = value === true ? 'active' : value === false ? 'inactive' : 'unknown';
      const detail = localized(supplement?.device_details?.[deviceKey]?.type) || localized(supplement?.device_details?.[deviceKey]?.site) ||
        (state === 'active' ? '선택 시점에 사용 중으로 설정된 가상 장비' : state === 'inactive' ? '선택 시점에 사용하지 않음' : '가상 상태값 미제공');
      if (state === 'active') {
        const placed = stamp({id: id('D-' + deviceKey + '-placed'), deviceKey, name: names[0], nameEn: names[1], state: 'placed', detail: '시연용 삽입·연결 기록'}, admitMinute - 15);
        if (visible(placed)) record.devices.push(placed);
      }
      const current = stamp({id: id('D-' + deviceKey + '-current'), deviceKey, name: names[0], nameEn: names[1], state, detail}, selectedMinute);
      if (visible(current) && asOfMinute >= admitMinute) {
        record.devices.push(current);
        addFact('device', names[0], state === 'active' ? '사용 중' : state === 'inactive' ? '미사용' : '미확인', current.minute, current.id);
      }
    }
    record.devices.sort((a, b) => b.minute - a.minute || a.deviceKey.localeCompare(b.deviceKey));

    const procedures = [
      stamp({id: id('P-operation'), name: primaryProcedure, status: '완료 · 가상', detail: '시연을 위해 작성한 수술 기록'}, admitMinute - 90),
      stamp({id: id('P-admission'), name: 'ICU 입실·인계', status: '완료 · 가상', detail: '수술실 또는 응급실에서 ICU로 이어지는 가상 인계'}, admitMinute),
      stamp({id: id('P-check'), name: '활력·장비 확인', status: '완료 · 가상', detail: '시나리오에 작성된 관찰 기록'}, admitMinute + 5),
      stamp({id: id('P-lab'), name: '검사 채혈', status: '완료 · 가상', detail: '공개 시연용 검사 패널 채혈'}, admitMinute + 15)
    ];
    record.procedures = procedures.filter(visible).sort((a, b) => b.minute - a.minute);
    for (const row of record.procedures) addFact('procedure', row.name, row.status, row.minute, row.id);

    const chest = stamp({id: id('T-CXR'), type: 'cxr', name: 'Portable chest AP · 가상 검사', status: '가상 결과 등록',
      report: seed % 2 ? '공개 시연용 판독 예시: 수술 후 추적 촬영으로 설정했습니다. 실제 환자 영상이나 판독이 아닙니다.' : '공개 시연용 판독 예시: 이동식 흉부 촬영 이력을 보여줍니다. 실제 환자 영상이나 판독이 아닙니다.',
      illustration: 'chest-xray', patientLinked: false, imageSource: 'authored_illustration'}, admitMinute + 5, 5);
    const ct = stamp({id: id('T-CT'), type: 'ct', name: ward === 'NSICU' ? 'Brain CT · 가상 검사' : 'Abdomen CT · 가상 검사', status: '가상 결과 등록',
      report: '시연용 검사 이력입니다. 영상 파일을 분석하거나 실제 소견을 제시한 결과가 아닙니다.',
      patientLinked: false}, admitMinute - 120, 20);
    record.tests = [chest, ct].filter(visible).sort((a, b) => b.minute - a.minute);
    for (const row of record.tests) addFact('test', row.name, row.status, row.minute, row.id);
    // Exclude illustrative images/reports from AI evidence. Test history itself may be cited.
    return clone(record);
  }
  return Object.freeze({build, identity, fingerprint, sourceLabel: SOURCE, sourceLabelEn: SOURCE_EN, vitalDefinitions: DEFINITIONS, version: 'public-demo-1'});
});
