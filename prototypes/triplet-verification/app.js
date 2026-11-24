'use strict';
const $ = id => document.getElementById(id);
const logs = [];
const occupied = new Set();
const devices = Array.from({length:18}, (_,i) => ({
  sn:'LT26' + String(41001+i), mac:'02:3A:61:20:08:' + (32+i).toString(16).toUpperCase(),
  owner:i%3===1?'B':'A', version:1
}));
const A = devices[0];
const inputFields = ['SN','MAC','批次号','三元组校验摘要'];
const omitted = '格式非法，已省略';
const pageSize = 8;
const startClock = Date.UTC(2026,10,23,1,30,0);
let serial = 0, scope = 'all', page = 1, listMode = 'ready', detailId = null;
let applied = {start:'',end:'',batch:''}, lastDetailButton, fit = true, listGeneration = 0;
const enc = value => String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const dateString = millis => new Date(millis + 8*3600000).toISOString().slice(0,19).replace('T',' ');
const compactMac = str => str.replace(/[:-]/g,'').toUpperCase();
const validMac = s => /^(?:[0-9a-f]{12}|(?:[0-9a-f]{2}:){5}[0-9a-f]{2}|(?:[0-9a-f]{2}-){5}[0-9a-f]{2})$/i.test(s);
const validCode = s => /^[a-z\d][a-z\d._-]{0,63}$/i.test(s);
const validDigest = s => /^[0-9a-f]{64}$/.test(s);
const display = x => x==='' || x==null?'—':String(x);

async function calculateSample(device) {
  const parts = ['sample-product',device.sn,'demo-only-'+device.sn+'-v'+device.version];
  const bytes = new TextEncoder().encode(JSON.stringify(parts));
  const digest = await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}

async function verify(raw, caller, scene='normal', at=null) {
  const seq = ++serial;
  const ms = at ?? (startClock + seq*59000);
  const check = [validCode, validMac, validCode, validDigest];
  const safe = {};
  inputFields.forEach((key,i) => {
    const value = raw[key];
    safe[key] = value == null || value==='' ? null : check[i](value) ? value : omitted;
  });
  const row = {id:'VFY-'+String(seq).padStart(5,'0'), owner:caller, received:dateString(ms),
    input:safe, output:null, result:'', delivery:'已发出', sentAt:null};
  function error(kind,message) {
    row.result=kind;
    row.output={错误类型:kind,错误信息:message};
  }
  if(scene==='denied') {
    row.owner=null;
    error('鉴权拒绝','调用凭据未通过验证');
  } else if(Object.values(safe).some(value=>value===null || value===omitted)) {
    error('参数错误','请检查必填字段及字段格式');
  } else {
    const device=devices.find(d=>d.sn===raw.SN && compactMac(d.mac)===compactMac(raw.MAC) && d.owner===caller);
    if(scene==='broken' || scene==='unsent') {
      error('技术异常','设备记录无法完成校验');
    } else if(!device) {
      row.result='未找到SN/MAC';
    } else {
      const expected=await calculateSample(device);
      const key=[device.sn,compactMac(device.mac),expected].join('|');
      if(raw['三元组校验摘要']!==expected) row.result='校验失败';
      else if(occupied.has(key)) row.result='重复校验';
      else if(scene==='persist') error('技术异常','首次成功登记未完成');
      else {
        occupied.add(key);
        row.result='成功';
      }
    }
    if(!row.output) row.output={校验结果:row.result,校验时间:dateString(ms+1000),...safe};
  }
  if(scene==='unsent') {row.delivery='未发出';row.output=null;}
  else row.sentAt=dateString(ms+1000);
  logs.push(row);
  return row;
}
function rawFor(d,digest,batch) {return {SN:d.sn,MAC:d.mac,批次号:batch,三元组校验摘要:digest};}
async function seed() {
  for(let i=1;i<=24;i++){
    const d=devices[i===24?17:1+(i%16)];
    const digest=await calculateSample(d);
    const raw=rawFor(d,digest,i%4===0?'B261123-02':'B261123-01');
    let scene='normal';
    if(i%9===0) raw['三元组校验摘要']='0'.repeat(64);
    else if(i%11===0) raw.SN='LT2699999';
    else if(i===6) raw['批次号']='';
    else if(i===14 || i===20) scene='unsent';
    else if(i===13) scene='denied';
    await verify(raw,d.owner,scene);
  }
}

function visibleRows() {
  if(scope==='none') return [];
  return logs.filter(row => (scope==='all'||row.owner===scope)
    && (!applied.start||row.received>=applied.start)
    && (!applied.end||row.received<=applied.end)
    && (!applied.batch||row.input['批次号']===applied.batch))
    .sort((a,b)=>b.received.localeCompare(a.received)||b.id.localeCompare(a.id));
}
const tones={'成功':'ok','重复校验':'repeat','校验失败':'bad','参数错误':'tech','技术异常':'tech','鉴权拒绝':'tech'};
function badge(result){return '<span class="badge '+(tones[result]||'')+'">'+enc(result)+'</span>';}
function stateBox(title,info,action=''){return '<div class="empty"><b>'+title+'</b><span>'+info+'</span>'+action+'</div>';}
function renderList() {
  const rows=visibleRows(), count=rows.length, pages=Math.max(1,Math.ceil(count/pageSize));
  page=Math.min(page,pages);
  const ready=scope!=='none' && listMode==='ready';
  $('identity').textContent=scope==='all'?'质量管理':scope==='A'?'工厂 A':'受限账号';
  $('export').disabled=!ready||!count;
  $('query').disabled=scope==='none'||listMode==='loading';
  $('total').textContent=ready?'共 '+count+' 条':'';
  $('pager').innerHTML='';
  if(scope==='none') $('list').innerHTML=stateBox('无日志访问权限','当前账号无法查看或导出校验日志。');
  else if(listMode==='loading') $('list').innerHTML=stateBox('正在查询…','正在读取符合条件的请求记录。');
  else if(listMode==='error') $('list').innerHTML=stateBox('查询失败','请重试，筛选条件已保留。','<button id="retry">重试</button>');
  else if(!count) $('list').innerHTML=stateBox('暂无匹配记录','请调整请求时间或批次号。');
  else {
    const slice=rows.slice((page-1)*pageSize,page*pageSize);
    $('list').innerHTML='<table><thead><tr><th>请求时间</th><th>批次号</th><th>SN</th><th>MAC 地址</th><th>校验结果 / 异常</th><th>操作 <button class="anchor" data-anchor="4">4</button></th></tr></thead><tbody>'+slice.map(r=>'<tr><td class="numeric">'+r.received+'</td><td class="mono">'+enc(display(r.input['批次号']))+'</td><td class="mono">'+enc(display(r.input.SN))+'</td><td class="mono">'+enc(display(r.input.MAC))+'</td><td>'+badge(r.result)+'</td><td><button class="link" data-detail="'+r.id+'">查看详情</button></td></tr>').join('')+'</tbody></table>';
    $('pager').innerHTML='<span>第 '+((page-1)*pageSize+1)+'–'+Math.min(page*pageSize,count)+' 条，共 '+count+' 条</span><div class="pages"><button id="prev" '+(page===1?'disabled':'')+'>上一页</button><span>'+page+' / '+pages+'</span><button id="next" '+(page===pages?'disabled':'')+'>下一页</button></div>';
  }
  renderNotes();
}
async function queryRows(fail=false) {
  const own=++listGeneration;
  listMode='loading';renderList();
  await new Promise(resolve=>setTimeout(resolve,260));
  if(own!==listGeneration) return;
  page=1;listMode=fail?'error':'ready';renderList();
}
function normalizeTime(value) {
  if(!value) return '';
  const normalized=value.replace('T',' ');
  return normalized.length===16?normalized+':00':normalized;
}
$('filters').onsubmit=e=>{
  e.preventDefault();
  const start=normalizeTime($('start').value),end=normalizeTime($('end').value);
  if(start&&end&&start>end) {
    $('filter-error').textContent='结束时间须晚于或等于开始时间。';$('filter-error').hidden=false;return;
  }
  $('filter-error').hidden=true;
  applied={start,end,batch:$('batch').value.trim()};queryRows();
};
$('reset').onclick=()=>{
  HTMLFormElement.prototype.reset.call($('filters'));$('filter-error').hidden=true;applied={start:'',end:'',batch:''};queryRows();
};
$('scope').onchange=()=>{closeDetail();scope=$('scope').value;page=1;++listGeneration;listMode='ready';renderList();};
$('fault').onclick=()=>queryRows(true);
const resultColumns = ['成功','未找到SN/MAC','校验失败','重复校验','参数错误','鉴权拒绝','技术异常'];
function macStatistics(rows) {
  const groups = new Map();
  for (const row of rows) {
    const value = row.input.MAC;
    const mac = validMac(value) ? compactMac(value).match(/../g).join(':') : 'MAC 缺失或无效';
    if (!groups.has(mac)) groups.set(mac, new Map());
    const counts = groups.get(mac);
    counts.set(row.result, (counts.get(row.result) || 0) + 1);
  }
  const table = [['MAC','请求总次数',...resultColumns]];
  for (const mac of [...groups.keys()].sort()) {
    const counts = groups.get(mac);
    const distribution = resultColumns.map(result => counts.get(result) || 0);
    table.push([mac, distribution.reduce((sum,count) => sum + count, 0), ...distribution]);
  }
  return table;
}
function addSheet(book, name, values, widths) {
  const sheet = XLSX.utils.aoa_to_sheet(values);
  sheet['!cols'] = widths.map(wch => ({wch}));
  sheet['!autofilter'] = {ref:sheet['!ref']};
  XLSX.utils.book_append_sheet(book, sheet, name);
}
function exportRows() {
  const rows=visibleRows();
  if(!rows.length||scope==='none'||listMode!=='ready') return;
  const head=['请求编号','请求时间','校验结果 / 异常',...inputFields.map(f=>'入参·'+f),'响应状态','出参·校验结果','出参·校验时间',...inputFields.map(f=>'出参·'+f),'错误类型','错误信息'];
  const data=rows.map(r=>[r.id,r.received,r.result,...inputFields.map(k=>r.input[k]),r.delivery,r.output?.校验结果,r.output?.校验时间,...inputFields.map(k=>r.output?.[k]),r.output?.错误类型,r.output?.错误信息]);
  const book = XLSX.utils.book_new();
  addSheet(book, '日志记录', [head,...data], [16,23,18,18,22,20,68,13,18,23,18,22,20,68,16,36]);
  addSheet(book, 'MAC 统计', macStatistics(rows), [23,16,12,20,14,14,14,14,14]);
  XLSX.writeFile(book, '三元组校验日志.xlsx', {compression:true});
  toast('已导出 '+rows.length+' 条请求记录及 MAC 统计');
}
$('export').onclick=exportRows;
let toastTimer;
function toast(msg){clearTimeout(toastTimer);$('toast').textContent=msg;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,2300);}

function section(title,num,obj){
  return '<section class="detail-box" id="box-'+num+'"><h3>'+title+' <button class="anchor" data-anchor="'+num+'">'+num+'</button></h3><dl class="kv">'+Object.entries(obj).map(([k,v])=>'<div><dt>'+enc(k)+'</dt><dd class="mono">'+enc(display(v))+'</dd></div>').join('')+'</dl></section>';
}
function openDetail(id) {
  const row=visibleRows().find(r=>r.id===id);
  if(!row)return;
  lastDetailButton=document.activeElement;detailId=id;
  $('detail').innerHTML=badge(row.result)+section('请求概况',5,{'请求编号':row.id,'请求时间':row.received,'响应状态':row.delivery})+
    section('请求入参',6,row.input)+section('实际出参',7,row.output||{'响应状态':'未发出'});
  $('overlay').hidden=false;selectTab('spec');renderNotes();$('close').focus();
}
function closeDetail(){
  if(!detailId)return;
  detailId=null;$('overlay').hidden=true;renderNotes();lastDetailButton?.focus();
}
$('close').onclick=closeDetail;$('scrim').onclick=closeDetail;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDetail();});

const annotations={
  1:['查询条件','日志列表 › 筛选区','按服务端接收时间或请求批次号查询；两项同时填写时取交集。起止时间均包含边界，允许仅填一端。','原型备注 · 时区示例为 UTC+8，批次按完整值匹配。'],
  2:['请求记录','日志列表 › 表格','每次调用单独一行，按接收时间倒序。四种校验结果与参数、鉴权、技术异常均保留；缺少批次号显示为横杠。','数据范围由可信调用归属或管理授权决定。无权限显示受限态；查询失败可重试。'],
  3:['导出 Excel','日志列表 › 导出','「日志记录」保存本次筛选和权限下的全部请求，一次一行；「MAC 统计」按规范化入参 MAC 汇总请求总次数和各业务结果、异常的次数。重试单独计数。','无有效 MAC 的请求合并列为“MAC 缺失或无效”。所有统计行的总次数之和等于日志条数。列表为空、加载中、查询失败或无权限时不可导出。'],
  4:['查看详情','日志列表 › 操作列','打开本次请求的详情。关闭后返回原筛选条件与页码，可对照首次成功及后续重试。','原型备注 · 入口位于审计日志下，详情采用侧栏展示。'],
  5:['请求概况','请求详情 › 概况','请求编号用于区分当次调用。请求时间取平台接收时刻，校验时间见业务出参。','响应状态只描述平台是否发出响应；客户端仍可能超时。'],
  6:['请求入参','请求详情 › 入参','展示本次 SN、MAC、批次号和提交摘要。缺失字段留空，非法值只显示省略标记。','平台计算的期望摘要、明文三元组和认证头均不进入详情或导出。'],
  7:['实际出参','请求详情 › 出参','四类业务响应均展示结果、校验时间及本次提交的四项。异常显示实际错误，未发出时显示响应状态。','重复校验表示该键曾成功；工位须暂停并核查首次请求与重试记录。']
};
function renderNotes() {
  const ids=detailId?[5,6,7]:[1,2,3,...(document.querySelector('[data-detail]')?[4]:[])];
  $('notes').innerHTML=ids.map(n=>{
    const [title,loc,a,b]=annotations[n];
    return '<button class="note" data-note="'+n+'"><b><strong>'+n+'</strong>'+title+'</b><small>'+loc+'</small><p>'+a+'</p><p>'+b+'</p></button>';
  }).join('');
}
function mark(n,fromCard) {
  document.querySelectorAll('.highlight,.note.active').forEach(el=>el.classList.remove('highlight','active'));
  const target=document.querySelector('[data-anchor="'+n+'"]'),card=document.querySelector('[data-note="'+n+'"]');
  if(!target||!card) return;
  const area=target.closest('.detail-box,th,#export-group,#record-title,.filter-box')||target;
  area.classList.add('highlight');card.classList.add('active');
  if(fromCard){setMobile('work');area.scrollIntoView({block:'nearest',inline:'nearest'});}
  else {selectTab('spec');setMobile('notes');card.scrollIntoView({block:'nearest'});}
}
function selectTab(tab){
  if(tab==='demo' && detailId)closeDetail();
  $('spec').hidden=tab!=='spec';$('demo').hidden=tab!=='demo';
  document.querySelectorAll('[data-tab]').forEach(el=>el.setAttribute('aria-selected',el.dataset.tab===tab));
}
function setMobile(selected){
  document.body.classList.toggle('notes-view',selected==='notes');
  document.querySelectorAll('[data-view]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.view===selected));
}
function sizeCanvas(){
  const mobile=matchMedia('(max-width:800px)').matches;
  const scale=!mobile&&fit?Math.min(1,Math.max(.73,$('viewport').clientWidth/1440)):1;
  document.documentElement.style.setProperty('--scale',scale);
  $('size').textContent=fit?'原始大小':'适配视窗';
}
$('size').onclick=()=>{fit=!fit;sizeCanvas();};
window.addEventListener('resize',sizeCanvas);
document.addEventListener('click',e=>{
  const btn=e.target.closest('button');
  if(!btn)return;
  if(btn.dataset.detail)openDetail(btn.dataset.detail);
  else if(btn.dataset.anchor)mark(btn.dataset.anchor,false);
  else if(btn.dataset.note)mark(btn.dataset.note,true);
  else if(btn.dataset.tab)selectTab(btn.dataset.tab);
  else if(btn.dataset.view)setMobile(btn.dataset.view);
  else if(btn.id==='retry')queryRows();
  else if(btn.id==='prev'||btn.id==='next'){page+=btn.id==='prev'?-1:1;renderList();}
});

function selectedDevice(){return devices[Number($('device').value)];}
async function applySample() {
  const d=selectedDevice();
  $('sn').value=d.sn;$('mac').value=d.mac;
  $('digest').value=await calculateSample(d);
}
$('device').onchange=applySample;
document.querySelectorAll('[data-fill]').forEach(btn=>btn.onclick=async()=>{
  const fills={valid:()=>calculateSample(selectedDevice()),wrong:()=>'0'.repeat(64),invalid:()=>'{"sample":"非生产三元组样例"}'};
  $('digest').value=await fills[btn.dataset.fill]();
});
$('rotate').onclick=async()=>{
  A.version=A.version===1?2:1;
  $('device').value='0';await applySample();toast('设备 A 已切换至样例版本 '+A.version);
};
$('send').onclick=async()=>{
  const button=$('send');button.disabled=true;
  try {
    const raw={SN:$('sn').value,MAC:$('mac').value,批次号:$('sim-batch').value,三元组校验摘要:$('digest').value};
    const scene=$('scene').value,caller=selectedDevice().owner;
    let requests;
    if(scene==='pair'){
      const at=startClock+(serial+1)*59000;
      requests=await Promise.all([verify(raw,caller,'normal',at),verify({...raw,批次号:raw['批次号']+'-B'},caller,'normal',at)]);
    } else requests=[await verify(raw,caller,scene)];
    $('outcome').replaceChildren();
    requests.forEach(row=>{
      const p=document.createElement('p');
      const observed=scene==='lost'?'等待响应超时':row.delivery==='未发出'?'未收到响应':row.result;
      p.textContent='工位结果 · '+observed+'（'+row.id+'）';
      $('outcome').append(p);
      if(scene!=='lost' && row.output){
        const packet=document.createElement('details');
        const summary=document.createElement('summary'),body=document.createElement('pre');
        summary.textContent='工位收到的出参';
        body.textContent=JSON.stringify(row.output,null,2);
        packet.append(summary,body);$('outcome').append(packet);
      }
    });
    if(scene==='lost')$('outcome').append('工位应暂停放行。可查看本次请求日志，核对平台实际处理结果。');
    if(listMode==='ready'){page=1;renderList();}
  } finally {button.disabled=false;}
};
async function init(){
  $('send').disabled=true;
  $('device').innerHTML=[0,1].map(i=>'<option value="'+i+'">设备 '+(i?'B':'A')+' · 工厂 '+devices[i].owner+'</option>').join('');
  sizeCanvas();await seed();await applySample();renderList();$('send').disabled=false;
}
init().catch(()=>{$('list').innerHTML=stateBox('样例初始化失败','请使用支持 Web Crypto 的浏览器打开本地原型。');});
