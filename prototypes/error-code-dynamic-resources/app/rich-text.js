import {normalizeText} from './domain.js?v=v1.7.2';
import {textTokens} from './content.js?v=v1.7.2';
const escape=text=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function editableHTML(value){return textTokens(value).map(t=>{const text=escape(t.text).replace(/\n/g,'<br>');return t.bold?'<strong>'+text+'</strong>':text;}).join('');}
export function serializeRuns(runs){
 const merged=[];for(const run of runs){if(!run.text)continue;const previous=merged.at(-1);if(previous&&previous.bold===run.bold)previous.text+=run.text;else merged.push({...run});}
 return merged.map(r=>r.bold&&r.text.trim()?'**'+r.text+'**':r.text).join('');
}
export function editableText(element){
 const runs=[];
 const push=(text,bold)=>runs.push({text,bold});
 const endsInNewline=()=>runs.at(-1)?.text.endsWith('\n');
 function walk(node,bold=false){
  if(node.nodeType===3){push(node.textContent,bold);return;}
  if(node.nodeType!==1)return;
  const tag=node.tagName.toLowerCase();if(tag==='br'){push('\n',bold);return;}
  if(['script','style'].includes(tag))return;
  const block=['div','p','li'].includes(tag);
  if(block&&runs.length&&!endsInNewline())push('\n',false);
  const strong=bold||tag==='strong'||tag==='b'||Number(node.style?.fontWeight)>=600;
  for(const child of node.childNodes)walk(child,strong);
  if(block&&!endsInNewline())push('\n',false);
 }
 for(const child of element.childNodes)walk(child);
 return normalizeText(serializeRuns(runs)).replace(/\n$/,'');
}
