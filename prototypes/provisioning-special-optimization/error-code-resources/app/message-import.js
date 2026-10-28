import {LANGUAGES,initialState} from './data.js?v=v1.7.3';
import {clone,normalizeText,parseCSV} from './domain.js?v=v1.7.3';
import {hasContent,validateContent,contentFor,translationOnly,structureOf,structureSignature} from './content.js?v=v1.7.3';
const locales=LANGUAGES.map(([id])=>id);
export const FIELDS=['title','summary','primary','secondary'];
export const COLUMNS=['normalizedCode','blockId','field',...locales];
const structuralFields=['blockOrder','prefixType','icon','number'];
const present=value=>value!==undefined&&value!==null&&String(value).trim()!=='';
export {structureOf};
export function parseMessageFile(text,name){
 let rows;
 if(name.toLowerCase().endsWith('.csv'))rows=parseCSV(text,['normalizedCode','field']);
 else if(name.toLowerCase().endsWith('.json')){const data=JSON.parse(text);rows=Array.isArray(data)?data:data?.rows;}
 else throw new Error('请选择 CSV 或 JSON 文案文件。');
 if(!Array.isArray(rows)||!rows.length)throw new Error('文案文件需要非空数据数组。');
 for(const row of rows){
  if(!row||typeof row!=='object'||Array.isArray(row))throw new Error('每条文案必须是对象。');
  if(Object.hasOwn(row,'locale'))throw new Error('模板按语言分列，请重新下载模板，将同一内容项的各语言文案填写在同一行。');
  for(const key of Object.keys(row))if(!COLUMNS.includes(key))throw new Error('不支持的列名：'+({blockOrder:'Block 排序',prefixType:'前缀类型',icon:'图标',number:'数字前缀'}[key]||key)+'。请使用下载模板，仅填写固定定位列和语言文案；结构请手动编辑。');
  if(structuralFields.includes(row.field))throw new Error('文案导入不支持'+({blockOrder:'Block 排序',prefixType:'前缀类型',icon:'图标',number:'数字前缀'}[row.field]||row.field)+'，请在“编辑文案”中手动调整结构。');
 }
 return rows;
}
export function inspectMessageImport(state,rows){
 if(!Array.isArray(rows)||!rows.length)throw new Error('文案文件为空。');
 const targets=new Map(),seen=new Map(),errors=[],changes=[],counts={added:0,updated:0,unchanged:0,conflict:0};
 const fail=(line,msg)=>errors.push('第 '+line+' 条：'+msg);
 for(const [index,row] of rows.entries()){
  const line=index+1;
  if(!row||typeof row!=='object'||Array.isArray(row)){fail(line,'数据行必须是对象。');continue;}
  if(Object.keys(row).some(k=>!COLUMNS.includes(k))){fail(line,'包含不支持的列；文案导入不能携带结构配置。');continue;}
  if(typeof row.normalizedCode!=='string'||!Object.hasOwn(state.codes,row.normalizedCode.trim())){fail(line,'错误码不存在，请先手动新增或导入错误码建立条目。');continue;}
  const code=row.normalizedCode.trim(),field=typeof row.field==='string'?row.field.trim():'';
  if(!FIELDS.includes(field)){fail(line,'仅支持标题、摘要、主文案和副文案；结构请手动编辑。');continue;}
  const blockId=typeof row.blockId==='string'?row.blockId.trim():'',isBlock=['primary','secondary'].includes(field);
  if(present(row.blockId)&&(!blockId||!/^[A-Za-z0-9_-]+$/.test(blockId))){fail(line,'Block 标识仅支持字母、数字、下划线和短横线。');continue;}
  if(isBlock&&!blockId){fail(line,'正文文案必须填写已配置的 Block 标识。');continue;}
  if(!isBlock&&blockId){fail(line,'标题和摘要的 Block 标识须留空。');continue;}
  if(isBlock&&!state.codes[code].structure.some(b=>b.id===blockId)){fail(line,'Block '+blockId+' 不存在；请重新下载模板，结构只能手动编辑。');continue;}
  if(!locales.some(locale=>present(row[locale])))continue;
  for(const locale of locales){
   const raw=row[locale];if(!present(raw))continue;
   if(typeof raw!=='string'){fail(line,locale+' 文案必须为文本。');continue;}
   const value=normalizeText(raw),identity=JSON.stringify([code,locale,blockId,field]);
   if(seen.has(identity)){if(seen.get(identity)!==value)fail(line,'同一内容项的 '+locale+' 存在不同文案：'+({title:'标题',summary:'摘要',primary:'主文案',secondary:'副文案'}[field]||field));continue;}
   seen.set(identity,value);
   const key=JSON.stringify([code,locale]);let target=targets.get(key);
   if(!target){
    const content=contentFor(state.codes[code],locale);
    target={code,locale,line,content,baseStructure:structureSignature(state.codes[code]),baseContent:JSON.stringify(state.codes[code].content)};targets.set(key,target);
   }
   const record=isBlock?target.content.blocks.find(b=>b.id===blockId):target.content;
   if(!record){fail(line,locale+' 的 Block '+blockId+' 不存在；请先手动编辑文案结构。');continue;}
   const before=record[field]??'',status=before===value?'unchanged':present(before)?'updated':'added';counts[status]++;
   changes.push({line,code,locale,blockId,field,before,after:value,status});record[field]=value;
  }
 }
 for(const target of targets.values()){
  if(changes.some(c=>c.code===target.code&&c.locale===target.locale&&c.status!=='unchanged'))for(const error of validateContent(target.content))fail(target.line,target.locale+' 合并后：'+error);
 }
 for(const code of new Set(changes.filter(c=>c.status!=='unchanged').map(c=>c.code))){const en=targets.get(JSON.stringify([code,'en']))?.content||contentFor(state.codes[code],'en');if(validateContent(en).length)fail([...targets.values()].find(t=>t.code===code).line,code+' 默认英语须完整；请先手动配置结构，再补齐文案。');}
 const displayRows=new Map();for(const c of changes){const key=JSON.stringify([c.line,c.code,c.blockId,c.field]);if(!displayRows.has(key))displayRows.set(key,{line:c.line,code:c.code,blockId:c.blockId,field:c.field,cells:{}});displayRows.get(key).cells[c.locale]=c;}
 counts.conflict=errors.length;
 return {targets:[...targets.values()],changes,displayRows:[...displayRows.values()],locales:locales.filter(locale=>changes.some(c=>c.locale===locale)),errors,counts,baseVersion:state.version,valid:errors.length===0};
}
export function applyMessageImport(state,plan,timestamp){
 if(!plan.valid)throw new Error('文案预检有错误，整批未写入。');
 if(plan.baseVersion!==state.version)throw new Error('配置已更新，请重新预检查后提交。');
 for(const target of plan.targets){if(structureSignature(state.codes[target.code])!==target.baseStructure||JSON.stringify(state.codes[target.code].content)!==target.baseContent||structureSignature({structure:target.content.blocks})!==target.baseStructure)throw new Error('文案或共用结构已变化，请重新下载模板并预检查。');}
 const next=clone(state);
 for(const target of plan.targets){
  if(!plan.changes.some(c=>c.code===target.code&&c.locale===target.locale&&c.status!=='unchanged'))continue;
  // Structure stays in its existing order; only text is normalized and saved.
  const content=translationOnly(target.content);
  next.codes[target.code].content[target.locale]=content;next.codes[target.code].updated=timestamp;
 }
 return next;
}
export function messageSample(state=initialState(),conflict=false){
 const code=Object.keys(state.codes).find(id=>hasContent(state.codes[id].content.en));
 const rows=code?exportMessageRows(state,[code]):[];
 if(conflict&&rows.length){const example=rows.find(r=>r.field==='primary')||rows[0],locale=locales.find(id=>present(example[id]));rows.push({...clone(example),[locale]:'同一单元格的冲突演示文案'});}
 return rows;
}
export function messageCSV(rows){const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';return '\uFEFF'+COLUMNS.join(',')+'\n'+rows.map(r=>COLUMNS.map(k=>quote(r[k])).join(',')).join('\n');}
export function exportMessageRows(state,codes=Object.keys(state.codes)){
 const rows=[];
 for(const code of codes){
  const content=state.codes[code].content,blockIds=structureOf(state.codes[code]).map(b=>b.id);
  const add=(blockId,field)=>{const row={normalizedCode:code,blockId,field};for(const locale of locales){const c=content[locale],b=blockId?c?.blocks.find(b=>b.id===blockId):null;row[locale]=blockId?b?.[field]??'':c?.[field]??'';}rows.push(row);};
  add('','title');add('','summary');for(const blockId of blockIds){add(blockId,'primary');add(blockId,'secondary');}
 }
 return rows;
}
