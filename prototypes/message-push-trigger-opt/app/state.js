export const fixedEnvelopeFields=[
  {key:"eventType",type:"string",required:true,description:"产品内唯一的事件类型"},
  {key:"schemaVersion",type:"string",required:true,description:"事件 Schema 版本，例如 1.0"},
  {key:"productId",type:"string",required:true,description:"产生事件的产品"},
  {key:"occurredAt",type:"date-time",required:true,description:"事件发生时间（UTC）"},
  {key:"deviceId",type:"string",required:true,description:"消息推送事件必须携带；所有触发按设备实例处理"},
  {key:"userIds",type:"string[]",required:false,description:"可限定设备绑定用户；为空时使用该设备全部绑定用户"},
  {key:"idempotencyKey",type:"string",required:true,description:"幂等去重键"},
  {key:"payload",type:"object",required:true,description:"产品自定义 Payload"}
];

export const fixedEnvelopeSchema=JSON.stringify({
  type:"object",
  additionalProperties:false,
  required:["eventType","schemaVersion","productId","occurredAt","deviceId","idempotencyKey","payload"],
  properties:{
    eventType:{type:"string",minLength:1,maxLength:120},
    schemaVersion:{type:"string",pattern:"^[0-9]+\\.[0-9]+$"},
    productId:{type:"string",minLength:1,maxLength:64},
    occurredAt:{type:"string",format:"date-time"},
    deviceId:{type:"string",maxLength:128},
    userIds:{type:"array",items:{type:"string",maxLength:128},maxItems:500},
    idempotencyKey:{type:"string",minLength:8,maxLength:200},
    payload:{type:"object"}
  }
},null,2);

export const products=[
  {id:"prod-s12",name:"S12 Pro 吸乳器",model:"S12 Pro",deviceCount:18420,presetLinks:[
    {id:"home",label:"设备首页",uri:"cozy://device/{deviceId}/home"},
    {id:"safety",label:"安全提醒页",uri:"cozy://device/{deviceId}/safety"},
    {id:"session",label:"吸乳记录",uri:"cozy://device/{deviceId}/session"}
  ]},
  {id:"prod-air-p3",name:"Cozy Air P3",model:"Air P3",deviceCount:9280,presetLinks:[
    {id:"home",label:"设备首页",uri:"cozy://device/{deviceId}/home"},
    {id:"filter",label:"滤芯管理",uri:"cozy://device/{deviceId}/consumable/filter"},
    {id:"maintenance",label:"维护中心",uri:"cozy://device/{deviceId}/maintenance"}
  ]},
  {id:"prod-s1",name:"S1 单边吸乳器",model:"S1",deviceCount:6040,presetLinks:[
    {id:"home",label:"设备首页",uri:"cozy://device/{deviceId}/home"},
    {id:"session",label:"吸乳记录",uri:"cozy://device/{deviceId}/session"}
  ]}
];

// 调用方由研发预置；消息推送页面只能从当前产品允许的调用方中选择。
export const callers=[
  {id:"caller.device-cloud",name:"Device Cloud",source:"设备云",status:"启用",allowedProducts:["prod-s12","prod-air-p3"],rateLimit:"600 req/min"},
  {id:"caller.firmware-service",name:"Firmware Service",source:"固件服务",status:"启用",allowedProducts:["prod-s12","prod-s1"],rateLimit:"300 req/min"},
  {id:"caller.consumable-service",name:"Consumable Service",source:"耗材服务",status:"启用",allowedProducts:["prod-air-p3"],rateLimit:"300 req/min"}
];

// 语言目录来自平台配置；locale code 避免同名语言在旧目录中出现歧义。
export const supportedLanguages=[
  ["en-US","English"],["zh-CN","简体中文"],["de-DE","Deutsch"],["fr-FR","Français"],
  ["zh-TW","繁體中文"],["it-IT","Italiano"],["pt-PT","Português"],["es-ES","Español"],
  ["ar-SA","العربية"],["vi-VN","Tiếng Việt"],["id-ID","Bahasa Indonesia"],["th-TH","ไทย"],
  ["ms-MY","Bahasa Melayu"],["ja-JP","日本語"],["ru-RU","Русский"],["fil-PH","Filipino"],
  ["ko-KR","한국어"],["nl-NL","Nederlands"]
];

export const placeholders=[
  {token:"${cozyDeviceName}",label:"设备名称",supported:["device","cloud","consumable","event"]},
  {token:"${cozyDeviceModel}",label:"设备型号",supported:["device","cloud","consumable","event"]},
  {token:"${cozyUserEmail}",label:"用户邮箱",supported:["device","cloud","consumable","event"]},
  {token:"${cozyUserFirstName}",label:"用户名",supported:["device","cloud","consumable","event"]},
  {token:"${cozyUserLastName}",label:"用户姓",supported:["device","cloud","consumable","event"]},
  {token:"${cozyCountdownTimer}",label:"倒计时",supported:["cloud","event"]},
  {token:"${cozyDeviceConsumableName}",label:"耗材名称",supported:["consumable","event"]},
  {token:"${cozyConsumableUseValue}",label:"耗材已用值",supported:["consumable","event"]},
  {token:"${cozyConsumableRemainValue}",label:"耗材剩余值",supported:["consumable","event"]},
  {token:"${cozyConsumableUnit}",label:"耗材单位",supported:["consumable","event"]}
];

const baseValues={
  "en-US":{title:"Milk overflow detected",body:"${cozyDeviceName} detected an overflow risk. Please check immediately."},
  "zh-CN":{title:"检测到溢奶风险",body:"${cozyDeviceName} 检测到溢奶，请立即检查。"},
  "de-DE":{title:"Milchüberlauf erkannt",body:"Bei ${cozyDeviceName} wurde ein Überlaufrisiko erkannt. Bitte sofort prüfen。"},
  "ja-JP":{title:"ミルク漏れを検知",body:"${cozyDeviceName} で漏れのリスクを検知しました。すぐに確認してください。"}
};
export const emptyLanguageValues=()=>Object.fromEntries(supportedLanguages.map(([code])=>[code,{title:baseValues[code]?.title||"",body:baseValues[code]?.body||""}]));

export const rules=[
  {id:"R-2048",productId:"prod-s12",name:"设备溢奶紧急提醒",product:"S12 Pro 吸乳器",category:"安全",priority:"P0",trigger:"设备：溢奶事件",title:"检测到溢奶风险",languages:"4/18",strategy:"全量直发",lifecycle:"连续提醒",status:"启用",updated:"2026-07-29 14:10"},
  {id:"R-2047",productId:"prod-air-p3",name:"滤芯寿命不足提醒",product:"Cozy Air P3",category:"耗材",priority:"P1",trigger:"耗材：滤芯不足",title:"滤芯寿命不足",languages:"2/18",strategy:"窗口合并（取最后一次）",lifecycle:"单次提醒",status:"启用",updated:"2026-07-28 16:10"},
  {id:"R-2046",productId:"prod-s12",name:"固件升级完成通知",product:"S12 Pro 吸乳器",category:"固件",priority:"P2",trigger:"事件：firmware.upgrade.completed",title:"固件升级完成",languages:"2/18",strategy:"后续丢弃",lifecycle:"单次提醒",status:"草稿",updated:"2026-07-28 14:26"},
  {id:"R-2045",productId:"prod-s12",name:"长时间吸乳提醒",product:"S12 Pro 吸乳器",category:"维护",priority:"P1",trigger:"设备：吸乳时长",title:"请注意使用时长",languages:"4/18",strategy:"提醒间隔 30 分钟",lifecycle:"连续提醒",status:"停用",updated:"2026-07-27 20:08"}
];

export const events=[
  {id:"device.milk_overflow.v1",eventType:"device.milk_overflow",schemaVersion:"1.0",name:"设备溢奶事件",callerId:"caller.device-cloud",source:"设备云",productId:"prod-s12",product:"S12 Pro 吸乳器",status:"已发布",payloadSchema:'{\n  "type": "object",\n  "required": ["level"],\n  "properties": {\n    "level": { "type": "integer", "minimum": 1, "maximum": 3 }\n  },\n  "additionalProperties": false\n}',linkedRules:["R-2048"],triggerKind:"device",endEventId:"device.milk_overflow.recovered.v1",updated:"2026-07-29 13:40"},
  {id:"device.milk_overflow.recovered.v1",eventType:"device.milk_overflow.recovered",schemaVersion:"1.0",name:"设备溢奶恢复",callerId:"caller.device-cloud",source:"设备云",productId:"prod-s12",product:"S12 Pro 吸乳器",status:"已发布",payloadSchema:'{\n  "type": "object",\n  "required": ["recoveredAt"],\n  "properties": { "recoveredAt": { "type": "string", "format": "date-time" } },\n  "additionalProperties": false\n}',linkedRules:[],triggerKind:"device",endEventId:"",updated:"2026-07-29 13:40"},
  {id:"firmware.upgrade.completed.v1",eventType:"firmware.upgrade.completed",schemaVersion:"1.0",name:"固件升级完成",callerId:"caller.firmware-service",source:"固件服务",productId:"prod-s12",product:"S12 Pro 吸乳器",status:"已发布",payloadSchema:'{\n  "type": "object",\n  "required": ["version", "result"],\n  "properties": {\n    "version": { "type": "string" },\n    "result": { "enum": ["success", "failed"] }\n  },\n  "additionalProperties": false\n}',linkedRules:["R-2046"],triggerKind:"event",endEventId:"",updated:"2026-07-28 14:26"},
  {id:"consumable.filter.low.v1",eventType:"consumable.filter.low",schemaVersion:"1.0",name:"滤芯余量不足",callerId:"caller.consumable-service",source:"耗材服务",productId:"prod-air-p3",product:"Cozy Air P3",status:"已发布",payloadSchema:'{\n  "type": "object",\n  "required": ["remainValue", "unit"],\n  "properties": {\n    "remainValue": { "type": "number" },\n    "unit": { "type": "string" }\n  },\n  "additionalProperties": false\n}',linkedRules:["R-2047"],triggerKind:"consumable",endEventId:"consumable.filter.replaced.v1",updated:"2026-07-28 11:05"},
  {id:"consumable.filter.replaced.v1",eventType:"consumable.filter.replaced",schemaVersion:"1.0",name:"滤芯已更换",callerId:"caller.consumable-service",source:"耗材服务",productId:"prod-air-p3",product:"Cozy Air P3",status:"已发布",payloadSchema:'{\n  "type": "object",\n  "required": ["replacedAt"],\n  "properties": { "replacedAt": { "type": "string", "format": "date-time" } },\n  "additionalProperties": false\n}',linkedRules:[],triggerKind:"consumable",endEventId:"",updated:"2026-07-28 11:05"}
];

export const appState={
  tab:"rules",scenario:"normal",readOnly:false,annotationOpen:true,context:"rules",ruleStep:1,
  selectedProductId:"prod-s12",selectedLocales:["en-US","zh-CN","de-DE","ja-JP"],
  fuseState:{status:"closed",uniquePerMinute:38,quietMinutes:0,lastAlert:"—"},
  copyReport:null,
  editingRule:false,editingEvent:null,
  rule:{id:"R-2048",productId:"prod-s12",name:"设备溢奶紧急提醒",category:"安全",priority:"P0",triggerType:"device",eventId:"device.milk_overflow.v1",deviceCondition:"溢奶事件 · level ≥ 2",cloudCondition:"喂养提醒倒计时 ≤ 30 分钟",consumableCondition:"滤芯余量不足",strategy:"direct",minIntervalMinutes:5,lifecycle:"continuous",reminderIntervalMinutes:30,endEventId:"device.milk_overflow.recovered.v1",limited:false,maxHours:72,maxCount:100},
  message:{cozyLinkMode:"preset",cozyLink:"cozy://device/{deviceId}/safety",presetLinkId:"safety",language:"en-US",values:emptyLanguageValues()}
};
