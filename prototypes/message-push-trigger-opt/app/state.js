export const products=[
  {id:"prod-s12",name:"S12 Pro 吸乳器",model:"S12 Pro",presetLinks:[{id:"home",label:"设备首页",uri:"cozy://device/{deviceId}/home"},{id:"safety",label:"安全提醒页",uri:"cozy://device/{deviceId}/safety"}]},
  {id:"prod-air-p3",name:"Cozy Air P3",model:"Air P3",presetLinks:[{id:"home",label:"设备首页",uri:"cozy://device/{deviceId}/home"},{id:"filter",label:"滤芯管理",uri:"cozy://device/{deviceId}/consumable/filter"}]}
];

export const productSources={
  "prod-s12":{properties:[{id:"milkLevel",name:"储奶量",type:"number",unit:"ml",operators:[">=",">","=","<=","<"],example:"180"},{id:"pumpMode",name:"吸乳模式",type:"enum",options:["standard","stimulation","quiet"],operators:["=","!="]},{id:"paused",name:"设备暂停",type:"boolean",operators:["=","!="]}],countdowns:[{id:"feed-reminder",name:"喂养提醒",deviceCapability:"verified",cycleContract:"verified",durationMinutes:60}],consumables:[]},
  "prod-air-p3":{properties:[{id:"pm25",name:"PM2.5",type:"number",unit:"μg/m³",operators:[">=",">","=","<=","<"],example:"75"}],countdowns:[{id:"filter-dry",name:"滤芯干燥倒计时",deviceCapability:"verified",cycleContract:"verified",durationMinutes:120}],consumables:[{id:"filter",name:"HEPA 滤芯",unit:"%",deviceCapability:"verified"},{id:"carbon",name:"活性炭滤芯",unit:"%",deviceCapability:"verified"}]}
};

export const supportedLanguages=[["en-US","English"],["zh-CN","简体中文"],["de-DE","Deutsch"],["fr-FR","Français"],["zh-TW","繁體中文"],["it-IT","Italiano"],["pt-PT","Português"],["es-ES","Español"],["ar-SA","العربية"],["vi-VN","Tiếng Việt"],["id-ID","Bahasa Indonesia"],["th-TH","ไทย"],["ms-MY","Bahasa Melayu"],["ja-JP","日本語"],["ru-RU","Русский"],["fil-PH","Filipino"],["ko-KR","한국어"],["nl-NL","Nederlands"]];

export const emptyLanguageValues=()=>Object.fromEntries(supportedLanguages.map(([code])=>[code,{title:"",body:""}]));
export const newRule=()=>({id:"",productId:"prod-s12",name:"",category:"维护",triggerType:"device",propertyId:"milkLevel",operator:">=",propertyValue:"180",cloudCountdownId:"feed-reminder",cloudThresholdMinutes:"15",consumableId:"",consumableEvent:"low",reminderMode:"each",minIntervalMinutes:"30",linkMode:"preset",presetLinkId:"safety"});

export const rules=[
  {id:"R-2048",productId:"prod-s12",name:"储奶量过高提醒",product:"S12 Pro 吸乳器",category:"安全",trigger:"设备：储奶量 ≥ 180 ml",title:"Milk overflow detected",languages:"2",strategy:"逐条发送",status:"启用",updated:"2026-08-05 14:10",triggerType:"device",propertyId:"milkLevel",operator:">=",propertyValue:"180",reminderMode:"each"},
  {id:"R-2047",productId:"prod-air-p3",name:"滤芯寿命不足提醒",product:"Cozy Air P3",category:"耗材",trigger:"耗材：HEPA 滤芯不足",title:"Filter life is low",languages:"2",strategy:"后续丢弃 · 12 小时",status:"启用",updated:"2026-08-05 13:10",triggerType:"consumable",consumableId:"filter",consumableEvent:"low",reminderMode:"discard",minIntervalMinutes:"720"},
  {id:"R-2046",productId:"prod-s12",name:"喂养提醒即将到期",product:"S12 Pro 吸乳器",category:"维护",trigger:"云端：喂养提醒 ≤ 15 分钟",title:"Feeding reminder is due soon",languages:"2",strategy:"后续丢弃 · 60 分钟",status:"草稿",updated:"2026-08-05 11:26",triggerType:"cloud",cloudCountdownId:"feed-reminder",cloudThresholdMinutes:"15",reminderMode:"discard",minIntervalMinutes:"60"}
];

const languageValues=emptyLanguageValues();
languageValues["en-US"]={title:"Milk overflow detected",body:"Your S12 Pro needs attention."};
languageValues["zh-CN"]={title:"检测到溢奶风险",body:"您的 S12 Pro 需要关注。"};

export const appState={scenario:"normal",readOnly:false,annotationOpen:true,ruleStep:1,selectedProductId:"prod-s12",selectedLocales:["en-US","zh-CN"],editingRule:false,rule:newRule(),message:{values:languageValues}};
