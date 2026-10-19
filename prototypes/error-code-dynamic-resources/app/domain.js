import {completeContent,contentFor} from './content.js?v=v1.7.1';
import {blankCode} from './data.js?v=v1.7.1';
export const clone=x=>structuredClone(x);
export const normalizeText=text=>String(text??'').replace(/\r\n?/g,'\n').replace(/\\n/g,'\n');
export function languageCount(code,languages){return languages.filter(([id])=>completeContent(contentFor(code,id))).length;}
export function ready(code){return completeContent(contentFor(code,'en'));}
export function matchesCode(id,code,query){const q=query.trim().toLowerCase();return [id,code.description,...Object.values(code.content).flatMap(c=>[c.title,c.summary])].some(text=>String(text??'').toLowerCase().includes(q));}
export function parseCSV(text,requiredHeaders=['normalizedCode','description']){
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
 if(name.toLowerCase().endsWith('.json')){const data=JSON.parse(text);const rows=Array.isArray(data)?data:data?.rows;if(!Array.isArray(rows)||!rows.length)throw new Error('JSON 需要非空数组或包含 rows 数组。');return rows;}
 throw new Error('请选择 CSV 或 JSON 码表。');
}
export function inspectImport(state,rawRows){
 if(!Array.isArray(rawRows)||!rawRows.length)throw new Error('码表不能为空。');
 const seen=new Map(),rows=[],errors=[],counts={added:0,updated:0,unchanged:0,conflict:0};
 for(const [i,raw] of rawRows.entries()){
  const row={line:i+1,normalizedCode:'',description:'',before:'',status:'added',error:''};
  const fail=message=>{row.status='conflict';row.error=message;errors.push(`第 ${row.line} 条：${message}`);};
  if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('数据行必须是对象。');
  else if(Object.keys(raw).some(k=>!['normalizedCode','description'].includes(k)))fail('码表仅支持 normalizedCode、description 两列。');
  else if(typeof raw.normalizedCode!=='string'||!raw.normalizedCode.trim())fail('错误码必须为非空文本。');
  else if(typeof raw.description!=='string'||!raw.description.trim())fail('标准语义必须为非空文本。');
  else{
   row.normalizedCode=raw.normalizedCode.trim();row.description=raw.description.trim();
   const duplicate=seen.get(row.normalizedCode),before=Object.hasOwn(state.codes,row.normalizedCode)?state.codes[row.normalizedCode]:null;
   row.before=before?.description??'';
   if(duplicate&&duplicate.description!==row.description){fail('同一错误码存在不同标准语义，整批不可导入。');duplicate.status='conflict';duplicate.error='同一错误码存在不同标准语义。';}
   else if(duplicate){row.status='unchanged';row.duplicate=true;}
   else{row.status=before?(before.description===row.description?'unchanged':'updated'):'added';seen.set(row.normalizedCode,row);}
  }
  rows.push(row);
 }
 for(const row of rows)counts[row.status]++;
 return {rows,errors,counts,baseVersion:state.version,baseCodes:JSON.stringify(state.codes),valid:!errors.length};
}
export function applyImport(state,plan,timestamp=''){
 if(!plan.valid)throw new Error('码表预检查有错误，整批未写入。');
 if(state.version!==plan.baseVersion||JSON.stringify(state.codes)!==plan.baseCodes)throw new Error('错误码、文案或结构已更新，请重新预检查后提交。');
 const next=clone(state);
 for(const row of plan.rows){
  if(row.status==='unchanged')continue;
  if(!Object.hasOwn(next.codes,row.normalizedCode))Object.defineProperty(next.codes,row.normalizedCode,{value:blankCode(row.description),enumerable:true,writable:true,configurable:true});
  next.codes[row.normalizedCode].description=row.description;next.codes[row.normalizedCode].updated=timestamp;
 }
 return next;
}
export function saveCodeMetadata(state,rawCode,rawDescription,editing=false,timestamp=''){
 if(typeof rawCode!=='string'||!rawCode.trim())throw new Error('请填写错误码。');
 if(typeof rawDescription!=='string'||!rawDescription.trim())throw new Error('请填写标准语义。');
 const id=rawCode.trim(),description=rawDescription.trim(),exists=Object.hasOwn(state.codes,id);
 if(editing&&!exists)throw new Error('错误码已不存在，请重新加载。');
 if(!editing&&exists)throw new Error('错误码已存在，请编辑现有条目。');
 const next=clone(state);
 if(!exists)Object.defineProperty(next.codes,id,{value:blankCode(description),enumerable:true,writable:true,configurable:true});
 next.codes[id].description=description;next.codes[id].updated=timestamp;return next;
}
export const STATUS_LABELS={added:'新增',updated:'更新',unchanged:'无变化',conflict:'冲突'};
