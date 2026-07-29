export const rules=[
  {id:"R-2048",name:"设备溢奶紧急提醒",product:"S12 Pro 吸乳器",category:"安全",priority:"P0",trigger:"设备溢奶事件",template:"溢奶安全提醒",regions:"美国、德国",throttle:"实时",lifecycle:"连续提醒",status:"启用",updated:"2026-07-28 18:42"},
  {id:"R-2047",name:"滤芯寿命不足提醒",product:"Cozy Air P3",category:"耗材",priority:"P1",trigger:"耗材不足",template:"滤芯更换提醒",regions:"全部市场",throttle:"日节流",lifecycle:"单次通知",status:"启用",updated:"2026-07-28 16:10"},
  {id:"R-2046",name:"固件升级完成通知",product:"S12 Pro 吸乳器",category:"固件",priority:"P2",trigger:"firmware.upgrade.completed",template:"固件升级结果",regions:"美国、日本",throttle:"实时",lifecycle:"单次通知",status:"草稿",updated:"2026-07-28 14:26"},
  {id:"R-2045",name:"长时间吸乳提醒",product:"S12 Pro 吸乳器",category:"维护",priority:"P1",trigger:"吸乳时长 > 30min",template:"使用时长提醒",regions:"全部市场",throttle:"小时节流",lifecycle:"连续提醒",status:"停用",updated:"2026-07-27 20:08"}
];

export const templates=[
  {id:"T-1024",name:"溢奶安全提醒",category:"安全",completion:100,languages:"16/16",refs:2,status:"启用",updated:"2026-07-28 17:30"},
  {id:"T-1023",name:"滤芯更换提醒",category:"耗材",completion:81,languages:"13/16",refs:4,status:"启用",updated:"2026-07-28 12:16"},
  {id:"T-1022",name:"固件升级结果",category:"固件",completion:63,languages:"10/16",refs:1,status:"草稿",updated:"2026-07-27 18:02"},
  {id:"T-1021",name:"使用时长提醒",category:"维护",completion:100,languages:"16/16",refs:3,status:"启用",updated:"2026-07-26 15:40"}
];

export const events=[
  {id:"device.milk_overflow.v1",name:"设备溢奶事件",caller:"device-cloud",scope:"S12 Pro",schema:'{\n  "deviceId": "string",\n  "userId": "string",\n  "level": "integer",\n  "occurredAt": "date-time"\n}'},
  {id:"device.milk_overflow.recovered.v1",name:"设备溢奶恢复",caller:"device-cloud",scope:"S12 Pro",schema:'{\n  "deviceId": "string",\n  "userId": "string",\n  "recoveredAt": "date-time"\n}'},
  {id:"firmware.upgrade.completed.v1",name:"固件升级完成",caller:"firmware-service",scope:"S12 Pro",schema:'{\n  "deviceId": "string",\n  "version": "string",\n  "result": "success | failed"\n}'}
];

export const appState={
  tab:"rules",scenario:"normal",readOnly:false,annotationOpen:true,context:"rules",ruleStep:1,
  rule:{name:"设备溢奶紧急提醒",category:"安全",priority:"P0",template:"溢奶安全提醒",triggerType:"event",eventId:"device.milk_overflow.v1",targetMode:"filter",regions:["美国","德国"],start:"2026-08-01 00:00",end:"",recurrence:"每日",timezone:"市场时区",throttle:"实时",customInterval:5,lifecycle:"continuous",recoveryEvent:"device.milk_overflow.recovered.v1",limited:false,maxHours:72,maxCount:100,targets:["U-90012 产品值班员","U-90118 安全负责人"]},
  template:{name:"溢奶安全提醒",category:"安全",cozyLink:"cozy://device/{id}/safety",priority:"P0",language:"zh-CN",values:{
    "en-US":{title:"Milk overflow detected",body:"{{deviceName}} detected overflow. Please check immediately."},
    "zh-CN":{title:"检测到溢奶风险",body:"{{deviceName}} 检测到溢奶，请立即检查。"},
    "de-DE":{title:"",body:""},
    "ja-JP":{title:"ミルク漏れを検知",body:"{{deviceName}} で漏れを検知しました。すぐに確認してください。"}
  }}
};

export const languages=[
  ["en-US","英文","美国主语言"],["zh-CN","简体中文",""],["de-DE","德语","德国主语言"],["ja-JP","日语","日本主语言"]
];

