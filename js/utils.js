import { KEYS, collection, get, set, uid } from './storage.js';
export const peso=n=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(n)||0);
export const dateShort=s=>s?new Date(s).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}):'—';
export const dateTime=s=>s?new Date(s).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'—';
export function escapeHtml(v=''){ const d=document.createElement('div');d.textContent=v==null?'':String(v);return d.innerHTML; }
export function inventoryName(id){const v=collection(KEYS.inventory).find(x=>x.id===id);return v?`${v.brand} ${v.sizeKg}kg`: 'Unknown';}
export function customerName(id){return collection(KEYS.customers).find(x=>x.id===id)?.name||'Unknown';}
export function riderName(id){return collection(KEYS.riders).find(x=>x.id===id)?.name||'Unassigned';}
export function audit(user,action,entity,entityId,details){
  const log=collection(KEYS.auditLog); log.unshift({id:uid('audit'),timestamp:new Date().toISOString(),userId:user.id,action,entity,entityId,details});
  set(KEYS.auditLog,log);
}
export function toast(message,type='success'){
  let box=document.querySelector('.toast-box');if(!box){box=document.createElement('div');box.className='toast-box';document.body.append(box);}
  const el=document.createElement('div');el.className=`toast-item ${type}`;el.textContent=message;box.append(el);setTimeout(()=>el.remove(),3500);
}
export function undoToast(message,onUndo){
  let box=document.querySelector('.toast-box');if(!box){box=document.createElement('div');box.className='toast-box';document.body.append(box);}
  const el=document.createElement('div');el.className='toast-item';
  el.innerHTML=`<span>${escapeHtml(message)}</span> <button class="btn btn-link text-white fw-bold p-0 ms-3" type="button">Undo</button>`;
  el.querySelector('button').onclick=()=>{onUndo();el.remove();toast('Change undone','success')};
  box.append(el);setTimeout(()=>el.remove(),7000);
}
export function modal(title,body,buttons=[]){
  closeModal();const el=document.createElement('div');el.className='modal-backdrop-custom';el.id='appModal';
  el.innerHTML=`<div class="modal-card" role="dialog" aria-modal="true"><div class="modal-head"><h5 class="m-0">${escapeHtml(title)}</h5><button class="btn-close" aria-label="Close"></button></div><div class="modal-body">${body}</div><div class="modal-foot">${buttons.map((b,i)=>`<button class="${b.class}" data-modal-btn="${i}">${escapeHtml(b.label)}</button>`).join('')}</div></div>`;
  document.body.append(el);el.querySelector('.btn-close').onclick=closeModal;
  buttons.forEach((b,i)=>el.querySelector(`[data-modal-btn="${i}"]`).onclick=b.action);
  el.querySelector('input,select,textarea')?.focus();
}
export function closeModal(){document.getElementById('appModal')?.remove();}
export function csv(filename,rows){
  const csv=rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href);
}
