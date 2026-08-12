import {$,esc} from "./dom.js";
import {appState,products} from "./state.js";

let state={open:false,query:""};
const active=()=>products.find(item=>item.id===appState.selectedProductId)||products[0];
const matches=()=>{const keyword=state.query.trim().toLowerCase();return products.filter(item=>!keyword||[item.name,item.model,item.id].join(" ").toLowerCase().includes(keyword))};

export function renderProductPickerTrigger(){const button=$("#productPickerTrigger");if(!button)return;const item=active();button.innerHTML=`<span class="product-picker-value"><strong>${esc(item.name)}</strong><small>${esc(item.model)} · ${esc(item.id)}</small></span><span class="product-picker-arrow" aria-hidden="true">⌄</span>`;button.setAttribute("aria-expanded",String(state.open))}

function shell(){const item=active(),rows=matches();return `<div class="product-picker-host ${state.open?"is-open":""}" id="productPicker" role="presentation"><div class="product-picker-mask" data-product-picker-close></div><section class="product-picker-popover" role="dialog" aria-modal="true" aria-label="选择产品"><header><div><h3>选择产品</h3><p>搜索名称、型号或产品标识符</p></div><button type="button" class="icon-btn" data-product-picker-close aria-label="关闭">×</button></header><div class="product-picker-search"><span aria-hidden="true">⌕</span><input class="el-input" data-product-query value="${esc(state.query)}" placeholder="搜索产品名称、型号或标识符" autocomplete="off"></div><div class="product-picker-summary"><span>当前选择</span><strong>${esc(item.name)}</strong><small>${esc(item.model)} · ${esc(item.id)}</small></div><div class="product-picker-results"><div class="product-picker-results-head"><span>全部产品</span><small>${rows.length} 个结果</small></div>${rows.length?rows.map(product=>`<button type="button" class="product-option ${product.id===item.id?"selected":""}" data-select-product="${esc(product.id)}"><span class="product-option-mark">${product.id===item.id?"✓":""}</span><span><strong>${esc(product.name)}</strong><small>${esc(product.model)} · ${esc(product.id)}</small></span><em>${product.id===item.id?"当前产品":"选择"}</em></button>`).join(""):`<div class="product-picker-empty"><strong>没有找到产品</strong><span>试试产品名称、型号或标识符。</span><button type="button" class="op-link" data-product-picker-reset>清空搜索</button></div>`}</div></section></div>`}

function close(){state.open=false;state.query="";render()}
function select(id){if(!products.some(item=>item.id===id))return;state.open=false;state.query="";window.dispatchEvent(new CustomEvent("message-push:product-changed",{detail:id}))}
function wire(){const host=$("#productPicker");if(!host)return;host.querySelectorAll("[data-product-picker-close]").forEach(button=>button.onclick=close);host.querySelector("[data-product-query]")?.addEventListener("input",event=>{state.query=event.target.value;render(true)});host.querySelectorAll("[data-select-product]").forEach(button=>button.onclick=()=>select(button.dataset.selectProduct));host.querySelector("[data-product-picker-reset]")?.addEventListener("click",()=>{state.query="";render(true)})}
function render(focus=false){const mount=$("#productPickerMount");if(!mount)return;mount.innerHTML=state.open?shell():"";renderProductPickerTrigger();wire();if(focus)$('[data-product-query]',$("#productPicker"))?.focus()}

export function openProductPicker(){state.open=!state.open;state.query="";render(state.open)}
