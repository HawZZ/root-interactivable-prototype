import {completeContent} from './content.js';
export const clone=x=>structuredClone(x);
export const normalizeText=text=>String(text??'').replace(/\r\n?/g,'\n').replace(/\\n/g,'\n');
export const mappingKey=r=>JSON.stringify([r.vendor,r.sdk,r.reasonType,r.reason]);
export function languageCount(content,languages){return languages.filter(([id])=>completeContent(content?.[id])).length;}
export function ready(code){return completeContent(code?.content?.en);}
export function parseCSV(text,requiredHeaders=['reasonType','reason','normalizedCode']){
 const rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(ch==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
  else if(ch===','&&!quoted){row.push(value);value='';}
  else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(x=>x.trim()))rows.push(row);row=[];value='';}
  else value+=ch;
 }
 if(quoted)throw new Error('CSV 引号未闭合，请检查文件内容。');
 row.push(value);if(row.some(x=>x.trim()))rows.push(row);
 if(rows.length<2)throw new Error('文件未包含有效数据行。');
 const headers=rows.shift().map(x=>x.replace(/^\uFEFF/,'').trim());
 if(new Set(headers).size!==headers.length)throw new Error('CSV 列名重复。');
 if(!requiredHeaders.every(k=>headers.includes(k)))throw new Error('缺少必填列：'+requiredHeaders.join('、')+'。');
 return rows.map((r,i)=>{if(r.length!==headers.length)throw new Error(`第 ${i+2} 行列数与表头不一致。`);return Object.fromEntries(headers.map((h,j)=>[h,r[j]]));});
}
export function parseFile(text,name){
 if(name.toLowerCase().endsWith('.csv'))return parseCSV(text);
 if(name.toLowerCase().endsWith('.json')){const data=JSON.parse(text);const rows=Array.isArray(data)?data:data.rows;if(!Array.isArray(rows)||!rows.length)throw new Error('JSON 需要非空数组或包含 rows 数组。');return rows;}
 throw new Error('演示支持 CSV 或 JSON，请使用下载的示例格式。');
}
export function inspectImport(state,rawRows,source){
 const existing=new Map(state.mappings.map(r=>[mappingKey(r),r]));const seen=new Map(),codeDescriptions=new Map();const rows=[],errors=[];const counts={added:0,updated:0,unchanged:0,conflict:0};
 if(!source?.vendor||!source?.sdk)throw new Error('请选择供应商及 SDK 来源。');
 if(!Array.isArray(rawRows)||!rawRows.length)throw new Error('映射表不能为空。');
 rawRows.forEach((raw,i)=>{
  const row={vendor:source.vendor,sdk:source.sdk,reasonType:raw?.reasonType,reason:raw?.reason,normalizedCode:String(raw?.normalizedCode??'').trim(),description:String(raw?.description??'').trim(),line:i+1,status:'added',error:''};
  const fail=message=>{row.status='conflict';row.error=message;errors.push(`第 ${i+1} 条：${message}`);};
  if(!raw||typeof raw!=='object'||Array.isArray(raw)){fail('数据行必须是对象。');}
  else if(!['number','string'].includes(row.reasonType))fail('reasonType 只能为 number 或 string。');
  else if(row.reason===undefined||row.reason===null||String(row.reason).trim()==='')fail('reason 不能为空。');
  else if(!row.normalizedCode)fail('normalizedCode 不能为空。');
  else{
   if(row.reasonType==='number'){const n=Number(row.reason);if(!Number.isFinite(n)||!Number.isSafeInteger(n))fail('number reason 需要安全整数，不能解析为有效数字。');else row.reason=n;}
   else if(typeof row.reason!=='string')fail('string reason 需要字符串，请检查类型。');
   if(!row.error){
    const key=mappingKey(row),before=existing.get(key),duplicate=seen.get(key);row.before=before?.normalizedCode||null;
    if(duplicate&&duplicate.normalizedCode!==row.normalizedCode){fail('文件内同一来源、类型及 reason 指向不同标准码。');duplicate.status='conflict';duplicate.error='相同来源键存在不同目标码。';}
    else if(duplicate){row.status='unchanged';row.duplicate=true;}
    else if(before){row.status=before.normalizedCode===row.normalizedCode?'unchanged':'updated';}
    if(!duplicate)seen.set(key,row);
    if(!state.codes[row.normalizedCode]&&!row.error){
     if(!row.description)fail('新标准码需要开发提供含义说明。');
     else if(codeDescriptions.has(row.normalizedCode)&&codeDescriptions.get(row.normalizedCode)!==row.description)fail('同一新标准码的含义说明不一致。');
     else codeDescriptions.set(row.normalizedCode,row.description);
    }
   }
  }
  rows.push(row);
 });
 for(const row of rows)counts[row.status==='conflict'?'conflict':row.status]++;
 return {rows,errors,counts,source:clone(source),baseVersion:state.version,rawRows:clone(rawRows),valid:!counts.conflict};
}
export function applyImport(state,plan){
 if(!plan.valid)throw new Error('预检查存在冲突，整批未写入。');
 if(state.version!==plan.baseVersion)throw new Error('配置已被其他操作更新，请重新预检查后提交。');
 const next=clone(state);const index=new Map(next.mappings.map((r,i)=>[mappingKey(r),i]));
 for(const row of plan.rows){
  if(row.status==='unchanged')continue;
  if(!next.codes[row.normalizedCode])next.codes[row.normalizedCode]={description:row.description,content:{},updated:''};
  const mapping={vendor:row.vendor,sdk:row.sdk,reasonType:row.reasonType,reason:row.reason,normalizedCode:row.normalizedCode};const key=mappingKey(row);
  if(index.has(key))next.mappings[index.get(key)]=mapping;else{index.set(key,next.mappings.length);next.mappings.push(mapping);}
 }
 return next;
}
export const STATUS_LABELS={added:'新增',updated:'更新',unchanged:'无变化',conflict:'冲突'};
