import {clone,normalizeText} from './domain.js?v=v1.7';
export const ICONS=[['wifi','Wi-Fi'],['bluetooth','蓝牙'],['warning','提醒'],['settings','设置'],['check','检查'],['info','信息']];
export const emptyContent=()=>({title:'',summary:'',blocks:[]});
export const blankBlock=(id,order)=>({id,order,prefixType:'number',icon:'',number:String(order),primary:'',secondary:''});
export const hasContent=c=>!!c&&(!!normalizeText(c.title).trim()||!!normalizeText(c.summary).trim()||!!c.blocks?.some(b=>normalizeText(b.primary).trim()||normalizeText(b.secondary).trim()));
export const structureOf=code=>(code?.structure||[]).map(({id,order,prefixType,icon='',number=''})=>({id,order,prefixType,icon,number}));
export const structureSignature=code=>JSON.stringify(structureOf(code));
export function contentFor(code,locale){
 const c=code?.content?.[locale]||emptyContent();
 return {title:c.title||'',summary:c.summary||'',blocks:structureOf(code).map(b=>{const copy=c.blocks?.find(x=>x.id===b.id);return {...b,primary:copy?.primary||'',secondary:copy?.secondary||''};})};
}
export function translationOnly(c){return {title:normalizeText(c.title),summary:normalizeText(c.summary),blocks:c.blocks.map(({id,primary,secondary})=>({id,primary:normalizeText(primary),secondary:normalizeText(secondary)}))};}
export function syncTranslations(code){for(const locale of Object.keys(code.content))code.content[locale]=translationOnly(contentFor(code,locale));}
export function languageStatus(code,locale){const c=contentFor(code,locale);return !hasContent(c)?'unconfigured':completeContent(c)?'complete':'pending';}
export function resolveContent(code,locale){for(const id of [...new Set([locale,'en'])]){const c=contentFor(code,id);if(completeContent(c))return {locale:id,content:c};}return {locale:null,content:null};}
export function allocateBlock(code){const used=new Set([...(code.usedBlockIds||[]),...code.structure.map(b=>b.id)]);let n=1;while(used.has('step'+n))n++;const id='step'+n;code.usedBlockIds=[...used,id];const {primary,secondary,...block}=blankBlock(id,code.structure.length+1);code.structure.push(block);syncTranslations(code);return block;}
export function validateEdit(base,draft){
 const errors={},structural=structureSignature(base)!==structureSignature(draft);
 for(const locale of new Set(['en',...Object.keys(draft.content),...Object.keys(base.content)])){
  const c=contentFor(draft,locale),changed=JSON.stringify(translationOnly(contentFor(base,locale)))!==JSON.stringify(translationOnly(c));
  if(locale==='en'||(!structural&&changed&&hasContent(c))){const list=validateContent(c);if(list.length)errors[locale]=list;}
 }
 return {errors,structural};
}
export function textTokens(value){
 const text=normalizeText(value),parts=text.split(/(\*\*[^*]+\*\*)/g);
 return parts.filter(Boolean).map(part=>({text:/^\*\*[^*]+\*\*$/.test(part)?part.slice(2,-2):part,bold:/^\*\*[^*]+\*\*$/.test(part)}));
}
export function validateContent(c){
 const errors=[];
 for(const [key,label] of [['title','标题'],['summary','摘要']])if(typeof c?.[key]!=='string'||!c[key].trim())errors.push(label+'不能为空。');
 if(!Array.isArray(c?.blocks)||!c.blocks.length){errors.push('正文至少包含一个 Block。');return errors;}
 const ids=new Set(),orders=new Set();
 for(const [i,b] of c.blocks.entries()){
  const name='Block '+(i+1)+'：';
  if(typeof b.id!=='string'||!b.id.trim()||ids.has(b.id))errors.push(name+'标识不能为空或重复。');ids.add(b.id);
  if(!Number.isSafeInteger(b.order)||b.order<1||orders.has(b.order))errors.push(name+'排序需要不重复的正整数。');orders.add(b.order);
  if(!['icon','number'].includes(b.prefixType))errors.push(name+'请选择图标或数字前缀。');
  if(b.prefixType==='icon'&&!ICONS.some(([id])=>id===b.icon))errors.push(name+'请选择支持的图标。');
  if(b.prefixType==='number'&&!/^[1-9]\d*$/.test(String(b.number)))errors.push(name+'数字前缀需要正整数。');
  for(const [key,label] of [['primary','主文案'],['secondary','副文案']]){
   if(typeof b[key]!=='string'||!b[key].trim())errors.push(name+label+'不能为空。');
   else if(textTokens(b[key]).some(t=>!t.bold&&t.text.includes('**')))errors.push(name+label+'的加粗标记 ** 必须成对。');
  }
 }
 return errors;
}
export const completeContent=c=>hasContent(c)&&validateContent(c).length===0;
export function normalizeContent(c){const next=clone(c);next.title=normalizeText(next.title);next.summary=normalizeText(next.summary);next.blocks=next.blocks.map(b=>({...b,primary:normalizeText(b.primary),secondary:normalizeText(b.secondary)})).sort((a,b)=>a.order-b.order);return next;}
export function migrateState(saved){
 if(saved.schema===5)return saved;
 const next=clone(saved);
 if(saved.schema<4)for(const c of Object.values(next.codes)){
  if(saved.schema<3){c.content={};for(const [locale,msg] of Object.entries(c.messages||{}))if(normalizeText(msg).trim())c.content[locale]={title:'',summary:'',blocks:[{...blankBlock('step1',1),primary:normalizeText(msg)}]};}
  c.content??={};
  c.structure=(c.content.en?.blocks||[]).map(({id,order,prefixType,icon='',number=''})=>({id,order,prefixType,icon,number}));
  c.usedBlockIds=[...new Set([...(c.usedBlockIds||[]),...Object.values(c.content).flatMap(x=>(x.blocks||[]).map(b=>b.id))])];
  syncTranslations(c);
  delete c.messages;delete c.overrides;
 }
 next.schema=5;
 delete next.mappings;
 delete next.snapshots;
 return next;
}
