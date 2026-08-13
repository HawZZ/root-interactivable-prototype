export const products=[
  {id:"prod-s12",name:"S12 Pro 吸乳器",model:"S12 Pro",presetLinks:[{id:"message-center",label:"消息中心",uri:"cozy://message-center"},{id:"home",label:"设备首页",uri:"cozy://device/{deviceId}/home"},{id:"safety",label:"安全提醒页",uri:"cozy://device/{deviceId}/safety"}]},
  {id:"prod-air-p3",name:"Cozy Air P3",model:"Air P3",presetLinks:[{id:"message-center",label:"消息中心",uri:"cozy://message-center"},{id:"home",label:"设备首页",uri:"cozy://device/{deviceId}/home"},{id:"filter",label:"滤芯管理",uri:"cozy://device/{deviceId}/consumable/filter"}]}
];

const numberOperators=[">=",">","=","<=","<"];
const numeric=(id,name,group,unit,example,description)=>({id,name,group,type:"number",unit,example,description,operators:numberOperators});
const enumValue=(id,name,group,options,description)=>({id,name,group,type:"enum",options,description,operators:["=","!="]});
const boolean=(id,name,group,description)=>({id,name,group,type:"boolean",description,operators:["=","!="]});

// 原型用 36 个产品属性模拟大目录；真实数据来自当前产品的功能设计。
const s12Properties=[
  numeric("milkLevel","储奶量","安全与告警","ml","180","储奶容器实时液位"),enumValue("overflowRiskLevel","溢奶风险等级","安全与告警",["low","medium","high"],"溢奶风险结果"),numeric("milkTemperature","奶液温度","安全与告警","°C","38","储奶容器温度"),boolean("leakDetected","漏液检测","安全与告警","是否检测到漏液"),enumValue("cupSealStatus","罩杯密封状态","安全与告警",["sealed","loose","unknown"],"罩杯密封情况"),numeric("motorTemperature","电机温度","安全与告警","°C","65","电机温度"),enumValue("tubeBlockageRisk","导管堵塞风险","安全与告警",["none","suspected","confirmed"],"导管堵塞风险"),
  numeric("batteryLevel","电池电量","设备状态","%","20","设备当前电量"),enumValue("chargeStatus","充电状态","设备状态",["charging","full","discharging"],"设备充电状态"),boolean("deviceOnline","设备在线","设备状态","设备是否在线"),numeric("bluetoothRssi","蓝牙信号强度","设备状态","dBm","-70","蓝牙连接强度"),numeric("storageUsage","本地存储占用","设备状态","%","85","本地存储使用率"),boolean("childLock","童锁状态","设备状态","童锁是否开启"),boolean("sleepMode","休眠模式","设备状态","是否进入休眠"),numeric("screenBrightness","屏幕亮度","设备状态","%","60","屏幕亮度"),numeric("autoShutdownMinutes","自动关机时长","设备状态","分钟","30","自动关机时长"),
  enumValue("pumpMode","吸乳模式","泵乳过程",["standard","stimulation","quiet"],"当前吸乳模式"),numeric("pumpDuration","本次吸乳时长","泵乳过程","分钟","30","本次已吸乳时长"),numeric("suctionLevel","吸力档位","泵乳过程","档","6","当前吸力档位"),numeric("cycleRate","吸乳频率","泵乳过程","rpm","50","当前吸乳频率"),numeric("leftMotorSpeed","左侧电机转速","泵乳过程","rpm","1800","左侧电机转速"),numeric("rightMotorSpeed","右侧电机转速","泵乳过程","rpm","1800","右侧电机转速"),numeric("leftPressure","左侧负压","泵乳过程","kPa","16","左侧负压"),numeric("rightPressure","右侧负压","泵乳过程","kPa","16","右侧负压"),numeric("flowRate","流速","泵乳过程","ml/min","12","当前流速"),numeric("sessionCount","今日吸乳次数","泵乳过程","次","6","今天的完成次数"),numeric("stimulationDuration","刺激模式时长","泵乳过程","分钟","8","刺激模式时长"),boolean("paused","设备暂停","泵乳过程","是否暂停"),
  numeric("motorRuntime","电机累计运行时长","维护与诊断","小时","300","电机累计运行时长"),numeric("cleaningCycle","距上次清洁次数","维护与诊断","次","8","最近清洁后的运行次数"),numeric("chargingCycles","累计充电循环","维护与诊断","次","120","累计充电循环"),enumValue("valveHealth","阀门健康度","维护与诊断",["normal","degraded","replace"],"阀门状态"),enumValue("temperatureSensorStatus","温度传感器状态","维护与诊断",["normal","fault","calibrating"],"温度传感器状态"),enumValue("selfCheckStatus","最近一次自检","维护与诊断",["passed","warning","failed"],"最近一次自检结果"),numeric("firmwareUpdateProgress","固件更新进度","维护与诊断","%","100","固件更新进度"),numeric("errorRetryCount","故障重试次数","维护与诊断","次","3","故障重试次数")
];

export const recentPropertyIds={"prod-s12":["milkLevel","overflowRiskLevel","pumpDuration","batteryLevel"],"prod-air-p3":["pm25"]};
export const productSources={
  "prod-s12":{properties:s12Properties,countdowns:[{id:"feed-reminder",name:"喂养提醒",deviceCapability:"verified",cycleContract:"verified",duration:60,unit:"分钟"}],consumables:[]},
  "prod-air-p3":{properties:[numeric("pm25","PM2.5","空气质量","μg/m³","75","室内颗粒物浓度"),numeric("co2","CO₂","空气质量","ppm","1000","室内二氧化碳浓度"),numeric("humidity","环境湿度","环境监测","%","70","室内相对湿度"),numeric("temperature","环境温度","环境监测","°C","28","室内环境温度"),enumValue("fanMode","风机模式","设备状态",["auto","sleep","turbo"],"当前风机模式"),boolean("deviceOnline","设备在线","设备状态","设备是否在线")],countdowns:[{id:"filter-dry",name:"滤芯干燥提醒",deviceCapability:"verified",cycleContract:"verified",duration:30,unit:"天"}],consumables:[{id:"filter",name:"HEPA 滤芯",unit:"%",deviceCapability:"verified"},{id:"carbon",name:"活性炭滤芯",unit:"%",deviceCapability:"verified"}]}
};

export const supportedLanguages=[["en-US","English"],["zh-CN","简体中文"],["de-DE","Deutsch"],["fr-FR","Français"],["zh-TW","繁體中文"],["it-IT","Italiano"],["pt-PT","Português"],["es-ES","Español"],["ar-SA","العربية"],["vi-VN","Tiếng Việt"],["id-ID","Bahasa Indonesia"],["th-TH","ไทย"],["ms-MY","Bahasa Melayu"],["ja-JP","日本語"],["ru-RU","Русский"],["fil-PH","Filipino"],["ko-KR","한국어"],["nl-NL","Nederlands"]];
export const placeholders=["${cozyDeviceName}","${cozyDeviceModel}","${cozyUserEmail}","${cozyUserFirstName}","${cozyUserLastName}","${cozyCountdownTimer}","${cozyDeviceConsumableName}","${cozyConsumableUseValue}","${cozyConsumableRemainValue}","${cozyConsumableUnit}"];
export const emptyLanguageValues=()=>Object.fromEntries(supportedLanguages.map(([code])=>[code,{title:"",body:""}]));
export const newRule=()=>({id:"",productId:"prod-s12",name:"",category:"事件通知",triggerType:"device",propertyId:"milkLevel",operator:">=",propertyValue:"180",cloudCountdownId:"feed-reminder",cloudThresholdMinutes:"15",consumableId:"",consumableEvent:"low",timeStart:"00:00",timeEnd:"23:59",reminderMode:"each",minIntervalMinutes:"30",systemNotificationEnabled:false,presetLinkId:"message-center"});

export const rules=[
  {id:"R-2048",productId:"prod-s12",name:"储奶量过高提醒",product:"S12 Pro 吸乳器",category:"事件通知",trigger:"设备：储奶量 ≥ 180 ml",title:"Milk overflow detected",languages:"1",strategy:"逐条发送 · 消息中心",status:"启用",updated:"2026-08-12 14:10",triggerType:"device",propertyId:"milkLevel",operator:">=",propertyValue:"180",timeStart:"00:00",timeEnd:"23:59",reminderMode:"each",systemNotificationEnabled:false,presetLinkId:"message-center"},
  {id:"R-2047",productId:"prod-air-p3",name:"滤芯寿命不足提醒",product:"Cozy Air P3",category:"事件通知",trigger:"耗材：HEPA 滤芯不足",title:"Filter life is low",languages:"1",strategy:"仅发送首条 · 12 小时 · 消息中心 + 系统通知",status:"启用",updated:"2026-08-12 13:10",triggerType:"consumable",consumableId:"filter",consumableEvent:"low",timeStart:"08:00",timeEnd:"22:00",reminderMode:"discard",minIntervalMinutes:"720",systemNotificationEnabled:true,presetLinkId:"message-center"},
  {id:"R-2046",productId:"prod-s12",name:"喂养提醒即将到期",product:"S12 Pro 吸乳器",category:"云计时器通知",trigger:"云端：喂养提醒 ≤ 0 分钟",title:"Feeding reminder is due",languages:"1",strategy:"同日合并 · 消息中心",status:"草稿",updated:"2026-08-12 11:26",triggerType:"cloud",cloudCountdownId:"feed-reminder",cloudThresholdMinutes:"0",timeStart:"00:00",timeEnd:"23:59",reminderMode:"each",systemNotificationEnabled:false,presetLinkId:"message-center"}
];

// 每个产品维护一份语言选择；大表中的每行由当前规则的 title/body 自动生成。
export const productLanguageConfig={"prod-s12":{selectedLocales:["en-US"]},"prod-air-p3":{selectedLocales:["en-US"]}};
const languageValues=emptyLanguageValues();
languageValues["en-US"]={title:"Milk overflow detected",body:"Your S12 Pro needs attention."};
export const appState={scenario:"normal",readOnly:false,annotationOpen:true,ruleStep:1,selectedProductId:"prod-s12",editingRule:false,rule:newRule(),activeContentField:"title",message:{values:languageValues}};
