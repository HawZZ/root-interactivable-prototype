export const products=[
  {id:"prod-s12",name:"S12 Pro 吸乳器",model:"S12 Pro",presetLinks:[{id:"home",label:"设备首页",uri:"cozy://device/{deviceId}/home"},{id:"safety",label:"安全提醒页",uri:"cozy://device/{deviceId}/safety"}]},
  {id:"prod-air-p3",name:"Cozy Air P3",model:"Air P3",presetLinks:[{id:"home",label:"设备首页",uri:"cozy://device/{deviceId}/home"},{id:"filter",label:"滤芯管理",uri:"cozy://device/{deviceId}/consumable/filter"}]}
];

const numberOperators=[">=",">","=","<=","<"];
const numeric=(id,name,unit,example,description)=>({id,name,type:"number",unit,example,description,operators:numberOperators});
const enumValue=(id,name,options,description)=>({id,name,type:"enum",options,description,operators:["=","!="]});
const boolean=(id,name,description)=>({id,name,type:"boolean",description,operators:["=","!="]});

// S12 用 36 个已配置物模型属性演示大目录选择；真实环境直接读取当前产品的功能设计目录。
const s12Properties=[
  numeric("milkLevel","储奶量","ml","180","储奶容器实时液位"),
  enumValue("overflowRiskLevel","溢奶风险等级",["low","medium","high"],"基于液位和姿态计算的风险等级"),
  numeric("milkTemperature","奶液温度","°C","38","储奶容器温度"),
  boolean("leakDetected","漏液检测","传感器检测到漏液"),
  enumValue("cupSealStatus","罩杯密封状态",["sealed","loose","unknown"],"罩杯与皮肤的密封状态"),
  numeric("motorTemperature","电机温度","°C","65","电机热保护监测"),
  enumValue("tubeBlockageRisk","导管堵塞风险",["none","suspected","confirmed"],"导管通路诊断结果"),
  numeric("batteryLevel","电池电量","%","20","设备当前剩余电量"),
  enumValue("chargeStatus","充电状态",["charging","full","discharging"],"充电与放电状态"),
  boolean("deviceOnline","设备在线","设备与云端连接状态"),
  numeric("bluetoothRssi","蓝牙信号强度","dBm","-70","最近一次蓝牙 RSSI"),
  numeric("storageUsage","本地存储占用","%","85","设备本地存储使用率"),
  boolean("childLock","童锁状态","童锁是否已启用"),
  boolean("sleepMode","休眠模式","节能休眠是否已启用"),
  numeric("screenBrightness","屏幕亮度","%","60","屏幕当前亮度"),
  numeric("autoShutdownMinutes","自动关机时长","min","30","无操作自动关机时长"),
  enumValue("pumpMode","吸乳模式",["standard","stimulation","quiet"],"当前吸乳模式"),
  numeric("pumpDuration","本次吸乳时长","min","30","当前会话已持续时长"),
  numeric("suctionLevel","吸力档位","level","6","当前负压档位"),
  numeric("cycleRate","吸乳频率","rpm","50","当前周期频率"),
  numeric("leftMotorSpeed","左侧电机转速","rpm","1800","左侧电机实时转速"),
  numeric("rightMotorSpeed","右侧电机转速","rpm","1800","右侧电机实时转速"),
  numeric("leftPressure","左侧负压","kPa","16","左侧实时负压"),
  numeric("rightPressure","右侧负压","kPa","16","右侧实时负压"),
  numeric("flowRate","流速","ml/min","12","当前泵乳流速"),
  numeric("sessionCount","今日吸乳次数","次","6","自然日内完成次数"),
  numeric("stimulationDuration","刺激模式时长","min","8","当前会话刺激模式时长"),
  boolean("paused","设备暂停","当前会话是否暂停"),
  numeric("motorRuntime","电机累计运行时长","h","300","出厂以来电机累计运行时长"),
  numeric("cleaningCycle","距上次清洁次数","次","8","最近一次清洁后的运行次数"),
  numeric("chargingCycles","累计充电循环","次","120","电池累计充放电循环"),
  enumValue("valveHealth","阀门健康度",["normal","degraded","replace"],"阀门自检结果"),
  enumValue("temperatureSensorStatus","温度传感器状态",["normal","fault","calibrating"],"温度传感器诊断状态"),
  enumValue("selfCheckStatus","最近一次自检",["passed","warning","failed"],"上一次系统自检结论"),
  numeric("firmwareUpdateProgress","固件更新进度","%","100","固件升级任务进度"),
  numeric("errorRetryCount","故障重试次数","次","3","当前故障恢复重试次数")
];

export const recentPropertyIds={"prod-s12":["milkLevel","overflowRiskLevel","pumpDuration","batteryLevel"],"prod-air-p3":["pm25"]};

export const productSources={
  "prod-s12":{properties:s12Properties,countdowns:[{id:"feed-reminder",name:"喂养提醒",deviceCapability:"verified",cycleContract:"verified",durationMinutes:60}],consumables:[]},
  "prod-air-p3":{properties:[numeric("pm25","PM2.5","μg/m³","75","室内颗粒物浓度"),numeric("co2","CO₂","ppm","1000","室内二氧化碳浓度"),numeric("humidity","环境湿度","%","70","室内相对湿度"),numeric("temperature","环境温度","°C","28","室内环境温度"),enumValue("fanMode","风机模式",["auto","sleep","turbo"],"净化器当前风机模式"),boolean("deviceOnline","设备在线","设备与云端连接状态")],countdowns:[{id:"filter-dry",name:"滤芯干燥倒计时",deviceCapability:"verified",cycleContract:"verified",durationMinutes:120}],consumables:[{id:"filter",name:"HEPA 滤芯",unit:"%",deviceCapability:"verified"},{id:"carbon",name:"活性炭滤芯",unit:"%",deviceCapability:"verified"}]}
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
