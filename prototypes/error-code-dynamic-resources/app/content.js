import {clone,normalizeText} from './domain.js';
export const ICONS=[['wifi','Wi-Fi'],['bluetooth','蓝牙'],['warning','提醒'],['settings','设置'],['check','检查'],['info','信息']];
export const emptyContent=()=>({title:'',summary:'',blocks:[]});
export const blankBlock=(id,order)=>({id,order,prefixType:'number',icon:'',number:String(order),primary:'',secondary:''});
export const hasContent=c=>!!c&&(!!normalizeText(c.title).trim()||!!normalizeText(c.summary).trim()||!!c.blocks?.length);
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
 if(saved.schema===3)return saved;
 const next=clone(saved);next.schema=3;
 for(const c of Object.values(next.codes)){
  c.content={};for(const [locale,msg] of Object.entries(c.messages||{}))if(normalizeText(msg).trim())c.content[locale]={title:'',summary:'',blocks:[{...blankBlock('step1',1),primary:normalizeText(msg)}]};
  delete c.messages;delete c.overrides;
 }
 delete next.snapshots;
 return next;
}
