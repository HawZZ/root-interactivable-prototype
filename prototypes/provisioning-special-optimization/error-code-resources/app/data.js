export const LANGUAGES=[['en','英语（默认）'],['zh','中文'],['de','德语'],['fr','法语'],['zh-Hant','繁体中文'],['it','意大利语'],['pt','葡萄牙语'],['es','西班牙语'],['ar','阿拉伯语'],['vi','越南语'],['id','印尼语'],['th','泰语'],['ms','马来语'],['ja','日语'],['ru','俄语'],['fil','菲律宾语']];
export const EXAMPLE_CODES=['AA-002-0x01','AA-002-0x03','AA-002-0x04','AA-002-0x05','AA-002-0x06','AA-002-0x07','AA-003-0x02','AB-001-10004156','AB-004-10004163','AB-008-10004154','AB-009-10004153','AB-009-10004159','AB-009-10004607','AB-009-10004608','AB-009-10004700','AB-009-10004701','AB-009-403','AB-009-503','AB-012-10001002','AB-016-10004162','AB-999-10004000','BC-001-1003','BC-002-2010','BC-002-2011'];
export const STORAGE_KEY='provisioning-special-optimization-error-resource-v1';
export const blankCode=description=>({description,structure:[],usedBlockIds:[],content:{},updated:''});
export function initialState(){
 const codes=Object.fromEntries(EXAMPLE_CODES.map(id=>[id,{...blankCode('待提供'),updated:'2026-10-19 10:00'}]));
 // These generic copies demonstrate editing only; they do not assign real meanings to the supplied codes.
 codes[EXAMPLE_CODES[0]].structure=[{id:'step1',order:1,prefixType:'number',icon:'',number:'1'},{id:'step2',order:2,prefixType:'icon',icon:'info',number:''}];
 codes[EXAMPLE_CODES[0]].usedBlockIds=['step1','step2'];
 codes[EXAMPLE_CODES[0]].content=structuredClone(DEMO_CONTENT);
 return {schema:5,demoCopyRevision:2,version:1,codes,lastChange:'初始化24个编码样例；语义待提供，文案仅供演示',updated:'2026-10-19 10:00'};
}
export function sampleRows(kind='normal'){
 if(kind==='conflict')return [{normalizedCode:'DEMO-001-1',description:'码表演示语义A'},{normalizedCode:'DEMO-001-1',description:'码表演示语义B'}];
 return [{normalizedCode:'DEMO-001-1',description:'码表演示：新增错误码'},{normalizedCode:EXAMPLE_CODES[0],description:'码表演示：更新标准语义'}];
}

export const LEGACY_DEMO_CONTENT={
  en:{title:'Example: unable to complete pairing',summary:'Example copy only. These instructions demonstrate multilingual configuration and are not the confirmed meaning of this error code. Please follow the guidance provided for your device.',blocks:[{id:'step1',primary:'Example: **check the device**',secondary:'Example instruction line one.\nExample instruction line two.'},{id:'step2',primary:'Example: get assistance',secondary:'Example supplementary instruction.'}]},
  zh:{title:'示例：配网未完成',summary:'此处仅为交互演示文案，并非该错误码的真实含义。可在各语言下分别维护标题、摘要及正文，具体指导内容由业务确认后填写。',blocks:[{id:'step1',primary:'示例：**检查设备**',secondary:'示例说明第一行。\n示例说明第二行。'},{id:'step2',primary:'示例：获取帮助',secondary:'示例补充说明。'}]},
  de:{title:'Beispiel: Einrichtung nicht abgeschlossen',summary:'Nur ein Beispieltext für die Konfiguration.',blocks:[{id:'step1',primary:'Beispiel: Gerät prüfen',secondary:'Beispielhinweis.'},{id:'step2',primary:'',secondary:''}]}
 };
export const DEMO_CONTENT={
  en:{title:'Unable to complete pairing',summary:'Pairing could not be completed. Check your device and network connection, then try again. Contact support if you still need help.',blocks:[{id:'step1',primary:'**Check the device**',secondary:'Make sure the device is powered on.\nKeep your phone close to the device.'},{id:'step2',primary:'Get assistance',secondary:'If pairing still fails, contact support for help.'}]},
  zh:{title:'配网未完成',summary:'暂时无法完成配网。请检查设备和网络连接后重试，如仍需帮助，请联系支持人员。',blocks:[{id:'step1',primary:'**检查设备**',secondary:'请确认设备已通电。\n将手机靠近设备。'},{id:'step2',primary:'获取帮助',secondary:'如果仍无法完成配网，请联系支持人员。'}]},
  de:{title:'Einrichtung nicht abgeschlossen',summary:'Prüfen Sie das Gerät und die Netzwerkverbindung und versuchen Sie es erneut.',blocks:[{id:'step1',primary:'Gerät prüfen',secondary:'Stellen Sie sicher, dass das Gerät eingeschaltet ist.'},{id:'step2',primary:'',secondary:''}]}
 };
export function upgradeDemoCopy(saved){
 if(saved.demoCopyRevision===2)return saved;
 const next=structuredClone(saved),code=next.codes?.[EXAMPLE_CODES[0]];
 if(code?.content)for(const locale of Object.keys(LEGACY_DEMO_CONTENT))if(JSON.stringify(code.content[locale])===JSON.stringify(LEGACY_DEMO_CONTENT[locale]))code.content[locale]=structuredClone(DEMO_CONTENT[locale]);
 next.demoCopyRevision=2;return next;
}
