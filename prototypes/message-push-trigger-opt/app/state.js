export const fixedEnvelopeFields=[
  {key:"eventType",type:"string",required:true,description:"当前产品内唯一事件类型"},
  {key:"schemaVersion",type:"string",required:true,description:"事件 Schema 版本"},
  {key:"productId",type:"string",required:true,description:"产生事件的产品"},
  {key:"occurredAt",type:"date-time",required:true,description:"UTC 发生时间"},
  {key:"deviceId",type:"string",required:true,description:"唯一消息主体"},
  {key:"occurrenceId",type:"string",required:false,description:"周期/来源实例标识；云计时器必填"},
  {key:"idempotencyKey",type:"string",required:true,description:"请求重试去重键"},
  {key:"payload",type:"object",required:true,description:"自定义 Payload"}
];
export const fixedEnvelopeSchema=JSON.stringify({type:"object",additionalProperties:false,required:["eventType","schemaVersion","productId","occurredAt","deviceId","idempotencyKey","payload"],properties:{eventType:{type:"string"},schemaVersion:{type:"string"},productId:{type:"string"},occurredAt:{type:"string",format:"date-time"},deviceId:{type:"string"},occurrenceId:{type:"string"},idempotencyKey:{type:"string"},payload:{type:"object"}}},null,2);

export const products=[
  {id:"prod-s12",name:"S12 Pro 吸乳器",model:"S12 Pro",deviceCount:18420,presetLinks:[{id:"home",label:"设备首页",uri:"cozy://device/{deviceId}/home"},{id:"safety",label:"安全提醒页",uri:"cozy://device/{deviceId}/safety"}]},
  {id:"prod-air-p3",name:"Cozy Air P3",model:"Air P3",deviceCount:9280,presetLinks:[{id:"home",label:"设备首页",uri:"cozy://device/{deviceId}/home"},{id:"filter",label:"滤芯管理",uri:"cozy://device/{deviceId}/consumable/filter"}]}
];
export const productSources={
  "prod-s12":{properties:[{id:"milkLevel",name:"储奶量",type:"number",unit:"ml",operators:[">=",">","=","<=","<"],example:"180"},{id:"pumpMode",name:"吸乳模式",type:"enum",options:["standard","stimulation","quiet"],operators:["=","!="]},{id:"paused",name:"设备暂停",type:"boolean",operators:["=","!="]}],countdowns:[{id:"feed-reminder",name:"喂养提醒",status:"enabled",deviceCapability:"verified",cycleContract:"verified",timerInstanceId:"timer-feed-01",cycleId:"cycle-2026-08-03-01",threshold:0}],consumables:[]},
  "prod-air-p3":{properties:[{id:"pm25",name:"PM2.5",type:"number",unit:"μg/m³",operators:[">=",">","=","<=","<"],example:"75"}],countdowns:[{id:"filter-dry",name:"滤芯干燥倒计时",status:"enabled",deviceCapability:"pending",cycleContract:"missing",threshold:0}],consumables:[{id:"filter",name:"HEPA 滤芯",unit:"%",deviceCapability:"verified"},{id:"carbon",name:"活性炭滤芯",unit:"%",deviceCapability:"pending"}]}
};
export const supportedLanguages=[["en-US","English"],["zh-CN","简体中文"],["de-DE","Deutsch"],["fr-FR","Français"],["zh-TW","繁體中文"],["it-IT","Italiano"],["pt-PT","Português"],["es-ES","Español"],["ar-SA","العربية"],["vi-VN","Tiếng Việt"],["id-ID","Bahasa Indonesia"],["th-TH","ไทย"],["ms-MY","Bahasa Melayu"],["ja-JP","日本語"],["ru-RU","Русский"],["fil-PH","Filipino"],["ko-KR","한국어"],["nl-NL","Nederlands"]];
const allTriggers=["device","cloud","consumable","event"];
const triggerSupport={cozyCountdownTimer:["cloud"],cozyDeviceConsumableName:["consumable"],cozyConsumableUseValue:["consumable"],cozyConsumableRemainValue:["consumable"],cozyConsumableUnit:["consumable"]};
export const placeholders=["cozyDeviceName","cozyDeviceModel","cozyUserEmail","cozyUserFirstName","cozyUserLastName","cozyCountdownTimer","cozyDeviceConsumableName","cozyConsumableUseValue","cozyConsumableRemainValue","cozyConsumableUnit"].map(token=>({token:`\${${token}}`,label:token,supported:triggerSupport[token]||allTriggers}));
const sample={"en-US":{title:"Milk overflow detected",body:"${cozyDeviceName} needs your attention."},"zh-CN":{title:"检测到溢奶风险",body:"${cozyDeviceName} 需要你的关注。"}};
export const emptyLanguageValues=()=>Object.fromEntries(supportedLanguages.map(([code])=>[code,{title:sample[code]?.title||"",body:sample[code]?.body||""}]));
export const emptyStateValues=()=>({on:emptyLanguageValues(),off:emptyLanguageValues()});

export const rules=[
  {id:"R-2048",productId:"prod-s12",name:"储奶量过高提醒",product:"S12 Pro 吸乳器",category:"安全",priority:"P0",trigger:"设备：储奶量 ≥ 180 ml",title:"Milk overflow detected",languages:"2/18",strategy:"逐条发送",lifecycle:"单次提醒",status:"启用",updated:"2026-08-03 14:10"},
  {id:"R-2047",productId:"prod-air-p3",name:"滤芯寿命不足提醒",product:"Cozy Air P3",category:"耗材",priority:"P1",trigger:"耗材：HEPA 滤芯不足",title:"Filter life is low",languages:"2/18",strategy:"合并发送（取最后一次）",lifecycle:"单次提醒",status:"启用",updated:"2026-08-03 13:10"},
  {id:"R-2046",productId:"prod-s12",name:"固件状态切换通知",product:"S12 Pro 吸乳器",category:"系统",priority:"P2",trigger:"事件：firmware.sync",title:"Firmware sync",languages:"2/18",strategy:"状态切换提醒",lifecycle:"状态切换",status:"草稿",updated:"2026-08-03 11:26"}
];
export const events=[
  {id:"firmware.sync.v1",eventType:"firmware.sync",schemaVersion:"1.0",name:"固件同步事件",productId:"prod-s12",product:"S12 Pro 吸乳器",status:"已发布",webhookEndpointId:"wh-s12-firmware",webhookUrl:"https://hooks.example.test/e/wh-s12-firmware",securityStatus:"已配置",securityConfigVersion:"v3",payloadSchema:'{\n  "type":"object",\n  "properties":{"result":{"type":"string"}},\n  "additionalProperties":false\n}',linkedRules:["R-2046"],updated:"2026-08-03 10:40"},
  {id:"device.alert.v1",eventType:"device.alert",schemaVersion:"1.0",name:"设备告警事件",productId:"prod-s12",product:"S12 Pro 吸乳器",status:"草稿",webhookEndpointId:"wh-s12-alert",webhookUrl:"https://hooks.example.test/e/wh-s12-alert",securityStatus:"待配置",securityConfigVersion:"—",payloadSchema:'{\n  "type":"object",\n  "properties":{},\n  "additionalProperties":false\n}',linkedRules:[],updated:"2026-08-02 16:20"}
];
export const appState={tab:"rules",scenario:"normal",readOnly:false,annotationOpen:true,ruleStep:1,selectedProductId:"prod-s12",selectedLocales:["en-US","zh-CN"],editingRule:false,editingEvent:null,activeMessageState:"on",cloudCycleDemo:false,fuseState:{status:"closed",uniqueTriggersPerMinute:0,silenceMinutes:0},copyReport:[],rule:{id:"R-2048",productId:"prod-s12",name:"储奶量过高提醒",category:"安全",priority:"P0",triggerType:"device",propertyId:"milkLevel",operator:">=",propertyValue:"180",cloudCountdownId:"feed-reminder",consumableId:"",consumableEvent:"low",eventId:"firmware.sync.v1",reminderMode:"each",minIntervalMinutes:30,initialState:"off"},message:{cozyLinkMode:"preset",presetLinkId:"safety",cozyLink:"cozy://device/{deviceId}/safety",values:emptyLanguageValues(),stateValues:emptyStateValues()}};
