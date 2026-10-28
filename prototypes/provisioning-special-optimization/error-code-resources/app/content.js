import {upgradeDemoCopy,LANGUAGES} from './data.js?v=v1.7.3';
import {clone,normalizeText} from './domain.js?v=v1.7.3';
export const ICONS=[['wifi','Wi-Fi'],['bluetooth','蓝牙'],['warning','提醒'],['settings','设置'],['check','检查'],['info','信息']];
export const emptyContent=()=>({title:'',summary:'',blocks:[]});
export const blankBlock=(id,order)=>({id,order,prefixType:'number',icon:'',number:String(order),primary:'',secondary:''});
export const hasContent=c=>!!c&&(!!normalizeText(c.title).trim()||!!normalizeText(c.summary).trim()||c.bodyType==='media'||!!c.blocks?.some(b=>normalizeText(b.primary).trim()||normalizeText(b.secondary).trim()));
export const structureOf=code=>(code?.structure||[]).map(({id,order,prefixType,icon='',number=''})=>({id,order,prefixType,icon,number}));
export const structureSignature=code=>JSON.stringify(structureOf(code));
export function bodyTypeOf(code){return code?.bodyType||((Object.values(code?.content||{}).some(c=>c.bodyType==='media'))?'media':'blocks');}
export function contentFor(code,locale){
 const c=code?.content?.[locale]||emptyContent(),media=bodyTypeOf(code)==='media';
 return {title:c.title||'',summary:c.summary||'',...(media?{bodyType:'media',media:c.media||null,mediaOrigin:c.mediaOrigin||'local'}:{}),blocks:media?[]:structureOf(code).map(b=>{const copy=c.blocks?.find(x=>x.id===b.id);return {...b,primary:copy?.primary||'',secondary:copy?.secondary||''};})};
}
export function applyEnglishMedia(code,media){
 code.bodyType='media';
 for(const [locale] of LANGUAGES){const c=code.content[locale]||emptyContent();code.content[locale]={title:c.title||'',summary:c.summary||'',bodyType:'media',media:media?clone(media):null,mediaOrigin:locale==='en'?'source':'english',blocks:[]};}
 return code;
}
export function setBodyType(code,next,cached={}){
 const locales=new Set([...LANGUAGES.map(([id])=>id),...Object.keys(code.content)]);
 const current=clone(code.content);code.bodyType=next;
 for(const locale of locales){const c=current[locale]||emptyContent(),body=cached[locale]||{};code.content[locale]=next==='media'?{title:c.title||'',summary:c.summary||'',bodyType:'media',media:body.media||null,mediaOrigin:body.mediaOrigin||'local',blocks:[]}:{title:c.title||'',summary:c.summary||'',blocks:body.blocks||code.structure.map(b=>({id:b.id,primary:'',secondary:''}))};}
 return code;
}
export function normalizeBodyFormats(state){
 const next=clone(state);
 for(const code of Object.values(next.codes))if(bodyTypeOf(code)==='media'){
  code.bodyType='media';for(const [locale] of LANGUAGES){const c=code.content[locale]||emptyContent();code.content[locale]={title:c.title||'',summary:c.summary||'',bodyType:'media',media:c.media||null,mediaOrigin:c.mediaOrigin||'local',blocks:[]};}
 }
 next.sharedBodyFormatRevision=1;return next;
}
export function translationOnly(c){return {title:normalizeText(c.title),summary:normalizeText(c.summary),...(c.bodyType==='media'?{bodyType:'media',media:c.media?clone(c.media):null,mediaOrigin:c.mediaOrigin||'local'}:{}),blocks:c.bodyType==='media'?[]:c.blocks.map(({id,primary,secondary})=>({id,primary:normalizeText(primary),secondary:normalizeText(secondary)}))};}
export function syncTranslations(code){for(const locale of Object.keys(code.content))code.content[locale]=translationOnly(contentFor(code,locale));}
export function languageStatus(code,locale){const c=contentFor(code,locale);if(c.bodyType==='media'&&!normalizeText(c.title).trim()&&!normalizeText(c.summary).trim())return 'unconfigured';return !hasContent(c)?'unconfigured':completeContent(c)?'complete':'pending';}
export function resolveContent(code,locale){for(const id of [...new Set([locale,'en'])]){const c=contentFor(code,id);if(completeContent(c))return {locale:id,content:c};}return {locale:null,content:null};}
export function allocateBlock(code){const used=new Set([...(code.usedBlockIds||[]),...code.structure.map(b=>b.id)]);let n=1;while(used.has('step'+n))n++;const id='step'+n;code.usedBlockIds=[...used,id];const {primary,secondary,...block}=blankBlock(id,code.structure.length+1);code.structure.push(block);syncTranslations(code);return block;}
export function validateEdit(base,draft,{englishMediaSync=false}={}){
 const errors={},structural=structureSignature(base)!==structureSignature(draft)||bodyTypeOf(base)!==bodyTypeOf(draft);
 for(const locale of new Set(['en',...Object.keys(draft.content),...Object.keys(base.content)])){
  const c=contentFor(draft,locale),before=contentFor(base,locale),changed=JSON.stringify(translationOnly(before))!==JSON.stringify(translationOnly(c));
  const textChanged=c.title!==before.title||c.summary!==before.summary,hasText=!!c.title.trim()||!!c.summary.trim();
  const localMediaChanged=c.bodyType==='media'&&c.mediaOrigin!=='english'&&JSON.stringify(c.media)!==JSON.stringify(before.media);
  const mustValidate=locale==='en'||((structural||englishMediaSync)?(textChanged&&hasText)||localMediaChanged:changed&&hasContent(c));
  if(mustValidate){const list=validateContent(c);if(list.length)errors[locale]=list;}
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
 if(c?.bodyType==='media'){
  const media=c.media;
  if(!media)errors.push('请上传媒体文件。');
  else {if(!/\.mp4$/i.test(media.name||''))errors.push('媒体文件仅支持 mp4 格式。');if(!Number.isFinite(media.size)||media.size<=0||media.size>200*1024*1024)errors.push('媒体文件大小须大于 0 且不超过 200M。');}
  if(c.blocks?.length)errors.push('媒体与文本 Block 不能同时生效。');
  return errors;
 }
 if(!Array.isArray(c?.blocks)||!c.blocks.length){errors.push('正文至少包含一个 Block。');return errors;}
 const ids=new Set(),orders=new Set();
 for(const [i,b] of c.blocks.entries()){
  const name='Block '+(i+1)+'：';
  if(typeof b.id!=='string'||!b.id.trim()||ids.has(b.id))errors.push(name+'标识不能为空或重复。');ids.add(b.id);
  if(!Number.isSafeInteger(b.order)||b.order<1||orders.has(b.order))errors.push(name+'排序需要不重复的正整数。');orders.add(b.order);
  if(!['none','icon','number'].includes(b.prefixType))errors.push(name+'请选择无、图标或数字前缀。');
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
 if(saved.schema===5)return normalizeBodyFormats(upgradeDemoCopy(saved));
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
 return normalizeBodyFormats(upgradeDemoCopy(next));
}
