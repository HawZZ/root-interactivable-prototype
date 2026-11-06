/* Prototype-only policy: technical production limits and Markdown strategy remain to be frozen. */
(function(root){
'use strict';
const langs=[['en','英语'],['zh','简体中文'],['de','德语'],['fr','法语'],['zh-Hant','繁体中文'],['it','意大利语'],['pt','葡萄牙语'],['es','西班牙语'],['ar','阿拉伯语'],['vi','越南语'],['id','印尼语'],['th','泰语'],['ms','马来语'],['ja','日语'],['ru','俄语'],['fil','菲律宾语']];
const codes=langs.map(x=>x[0]), MAX_TEXT=10000,MAX_FILE=1048576;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const blank=s=>String(s??'').trim()==='';
const editable=o=>Boolean(o)&&['开发中','测试中','发布中','暂停发布','已发布','已停止'].includes(o.status);
const effective=(notes,lang)=>blank(notes?.[lang])?{text:notes?.en||'',source:'en',fallback:lang!=='en'}:{text:notes[lang],source:lang,fallback:false};
function csv(text){
 text=text.replace(/^\uFEFF/,'');if(!text.length)return [];
 let rows=[],row=[],cell='',quoted=false,after=false,atStart=true;
 for(let i=0;i<text.length;i++){
  let c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;after=true;}}else cell+=c;continue;}
  if(c==='"'){if(!atStart)throw Error('CSV 引号位置错误（行 '+(rows.length+1)+'）');quoted=true;atStart=false;continue;}
  if(after&&c!==','&&c!=='\r'&&c!=='\n')throw Error('CSV 引号结束后存在非法字符');
  if(c===','||c==='\n'||c==='\r'){
   row.push(cell);cell='';after=false;atStart=true;
   if(c!==','){rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}continue;
  }
  cell+=c;atStart=false;
 }
 if(quoted)throw Error('CSV 引号未闭合');
 if(cell!==''||row.length||after) {row.push(cell);rows.push(row);}
 return rows;
}
function plan(rows,current){
 if(!rows.length)return {changes:[],items:codes.map(code=>({code,action:'跳过',before:current[code]||'',after:current[code]||''})),message:'无变更：文件为空'};
 const header=rows[0].map(x=>String(x??'').trim());let seen=new Set();
 header.forEach((h,i)=>{if(!codes.includes(h))throw Error('第1行，第'+(i+1)+'列：未知语言 '+(h||'空列名'));if(seen.has(h))throw Error('第1行：重复语言 '+h);seen.add(h);});
 const data=rows.slice(1).filter(r=>r.some(v=>!blank(v)));
 if(data.length>1)throw Error('仅支持一条对象数据行（发现 '+data.length+' 条）');
 const r=data[0]||[];
 if(r.length>header.length&&r.slice(header.length).some(x=>!blank(x)))throw Error('第2行存在无语言表头的数据');
 let merged={...current},changes=[],items=[];
 codes.forEach(code=>{
  const idx=header.indexOf(code), before=current[code]||'', raw=idx<0?undefined:r[idx],after=raw===undefined?undefined:String(raw);
  if(after!==undefined&&/^\s*=/.test(after))throw Error('第2行 '+code+'：不允许公式单元格');
  if(after!==undefined&&after.length>MAX_TEXT)throw Error('第2行 '+code+'：超过演示上限 '+MAX_TEXT+' 字符');
  let action=after===undefined||blank(after)?'跳过':after===before?'不变':blank(before)?'新增':'覆盖';
  if(action==='新增'||action==='覆盖'){merged[code]=after;changes.push(code);}
  items.push({code,action,before,after:action==='跳过'?before:after});
 });
 if(blank(merged.en))throw Error('合并后英语必填');
 return {changes,items,merged,message:changes.length?'预检通过':'无变更：空白、缺列及相同内容均保留现值'};
}
function workbookRows(book,XLSX){
 let active=[];
 for(const name of book.SheetNames){const sheet=book.Sheets[name];let has=false;
  for(const [key,cell] of Object.entries(sheet)){if(key.startsWith('!'))continue;if(cell.f!==undefined)throw Error('工作表 '+name+'，单元格 '+key+'：不允许公式（含缓存公式）');if(cell.v!==undefined&&!blank(cell.v))has=true;}
  if(has)active.push(name);
 }
 if(active.length>1)throw Error('多个非空工作表：'+active.join('、'));
 return active.length?XLSX.utils.sheet_to_json(book.Sheets[active[0]],{header:1,defval:'',raw:true,blankrows:false}):[];
}
function inline(s){
 // Escape first. Raw HTML never enters the DOM as executable markup.
 let safe=esc(s);let tokens=[];
 safe=safe.replace(/!?\[([^\]]*)\]\(([^\s]+)\)/g,(m,label,url)=>{
  if(m[0]==='!')return m; // image is readable source in this demo
  const target=url.replace(/&amp;/g,'&');
  const out=/^https:\/\/[^\s<>]+$/i.test(target)?'<a href="'+esc(target)+'" target="_blank" rel="noopener noreferrer">'+label+'</a>':label+'（链接已禁用）';
  tokens.push(out);return '\u0000'+(tokens.length-1)+'\u0000';
 });
 safe=safe.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/`([^`]+)`/g,'<code>$1</code>');
 return safe.replace(/\u0000(\d+)\u0000/g,(_,i)=>tokens[+i]);
}
function markdown(s){
 let out=[],list='',para=[],fence=false;
 const flush=()=>{if(para.length){out.push('<p>'+para.join('<br>')+'</p>');para=[];}if(list){out.push('</'+list+'>');list='';}};
 for(const line of String(s).replace(/\r\n/g,'\n').split('\n')){
  if(/^```/.test(line)){flush();fence=!fence;out.push('<p class="literal">'+esc(line)+'</p>');continue;}
  if(fence){out.push('<p class="literal">'+esc(line)+'</p>');continue;}
  const h=line.match(/^(#{1,6})\s+(.*)$/),li=line.match(/^\s*(?:([-*])\s+|\d+\.\s+)(.*)$/);
  if(h){flush();out.push('<h'+h[1].length+'>'+inline(h[2])+'</h'+h[1].length+'>');}
  else if(li){if(para.length){out.push('<p>'+para.join('<br>')+'</p>');para=[];}let t=li[1]?'ul':'ol';if(list!==t){if(list)out.push('</'+list+'>');out.push('<'+t+'>');list=t;}out.push('<li>'+inline(li[2])+'</li>');}
  else if(!line.trim())flush();else {if(list){out.push('</'+list+'>');list='';}para.push(inline(line.replace(/  $/,'')));}
 }
 flush();return out.join('');
}
const api={langs,codes,MAX_TEXT,MAX_FILE,esc,blank,editable,effective,csv,plan,workbookRows,markdown};
root.RN=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
