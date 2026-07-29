export const rules=[
  {id:"R-2048",name:"设备溢奶紧急提醒",product:"S12 Pro 吸乳器",category:"安全",priority:"P0",trigger:"设备：溢奶事件",title:"检测到溢奶风险",languages:"3/4",regions:"美国、德国",throttle:"实时",lifecycle:"连续提醒",status:"启用",updated:"2026-07-29 14:10"},
  {id:"R-2047",name:"滤芯寿命不足提醒",product:"Cozy Air P3",category:"耗材",priority:"P1",trigger:"耗材：滤芯不足",title:"滤芯寿命不足",languages:"4/4",regions:"全部市场",throttle:"日节流",lifecycle:"单次通知",status:"启用",updated:"2026-07-28 16:10"},
  {id:"R-2046",name:"固件升级完成通知",product:"S12 Pro 吸乳器",category:"固件",priority:"P2",trigger:"事件：firmware.upgrade.completed",title:"固件升级完成",languages:"2/4",regions:"美国、日本",throttle:"实时",lifecycle:"单次通知",status:"草稿",updated:"2026-07-28 14:26"},
  {id:"R-2045",name:"长时间吸乳提醒",product:"S12 Pro 吸乳器",category:"维护",priority:"P1",trigger:"设备：吸乳时长",title:"请注意使用时长",languages:"4/4",regions:"全部市场",throttle:"小时节流",lifecycle:"连续提醒",status:"停用",updated:"2026-07-27 20:08"}
];

// 事件由本页「授权事件」管理：先注册 Schema，再授权到当前 productId，规则只可选择已发布且已授权的事件。
export const events=[
  {id:"device.milk_overflow.v1",name:"设备溢奶事件",caller:"device-cloud",source:"设备云",scope:"S12 Pro",status:"已授权",schema:'{\n  "deviceId": "string",\n  "userIds": ["string"],\n  "level": "integer",\n  "occurredAt": "date-time"\n}'},
  {id:"device.milk_overflow.recovered.v1",name:"设备溢奶恢复",caller:"device-cloud",source:"设备云",scope:"S12 Pro",status:"已授权",schema:'{\n  "deviceId": "string",\n  "userIds": ["string"],\n  "recoveredAt": "date-time"\n}'},
  {id:"firmware.upgrade.completed.v1",name:"固件升级完成",caller:"firmware-service",source:"固件服务",scope:"S12 Pro",status:"已授权",schema:'{\n  "deviceId": "string",\n  "userIds": ["string"],\n  "version": "string",\n  "result": "success | failed"\n}'}
];

export const appState={
  tab:"rules",scenario:"normal",readOnly:false,annotationOpen:true,context:"rules",ruleStep:1,
  rule:{name:"设备溢奶紧急提醒",category:"安全",priority:"P0",triggerType:"device",eventId:"device.milk_overflow.v1",deviceCondition:"溢奶事件 · level ≥ 2",cloudCondition:"喂养提醒倒计时 ≤ 30 分钟",consumableCondition:"滤芯余量不足",regions:["美国","德国"],filters:["活跃用户","绑定状态：已绑定"],start:"2026-08-01 00:00",end:"",recurrence:"每日",timezone:"市场时区",throttle:"实时",customInterval:5,lifecycle:"continuous",recoveryEvent:"device.milk_overflow.recovered.v1",limited:false,maxHours:72,maxCount:100},
  message:{cozyLink:"cozy://device/{id}/safety",language:"zh-CN",values:{
    "en-US":{title:"Milk overflow detected",body:"{{deviceName}} detected overflow. Please check immediately."},
    "zh-CN":{title:"检测到溢奶风险",body:"{{deviceName}} 检测到溢奶，请立即检查。"},
    "de-DE":{title:"",body:""},
    "ja-JP":{title:"ミルク漏れを検知",body:"{{deviceName}} で漏れを検知しました。すぐに確認してください。"}
  }}
};

export const languages=[
  ["en-US","英文","美国主语言"],["zh-CN","简体中文",""],["de-DE","德语","德国主语言"],["ja-JP","日语","日本主语言"]
];
