import {requireAuth} from './auth.js';
import {renderLayout} from './layout.js';
import {KEYS,collection,saveCollection,uid,set} from './storage.js';
import {modal,closeModal,undoToast,toast,audit,peso,escapeHtml,riderName,customerName,inventoryName,dateShort,dateTime} from './utils.js';

const user=requireAuth(['admin','cashier','rider']);if(!user)throw new Error('Unauthorized');
renderLayout('riders.html');

function riderForUser(){
 if(user.role==='rider'){
  const riderNameMatch=user.name.toLowerCase().split(' ')[0];
  return collection(KEYS.riders).find(r=>r.name.toLowerCase().startsWith(riderNameMatch))||null;
 }
 return null;
}

function render(){
 if(user.role==='rider'){
  renderRiderPortal(riderForUser());
 }else{
  renderAdminRiders();
 }
}

function renderRiderPortal(rider){
 const orders=collection(KEYS.orders).filter(o=>rider&&o.riderId===rider.id);
 const assigned=orders.filter(o=>['assigned','out_for_delivery'].includes(o.status));
 const delivered=orders.filter(o=>o.status==='delivered');
 const fullIssued=assigned.concat(delivered).reduce((total,o)=>total+o.items.reduce((n,i)=>n+(Number(i.qty)||0),0),0);
 const empties=delivered.reduce((n,o)=>n+(Number(o.emptiesReturned)||0),0);
 const cashToRemit=delivered.filter(o=>o.paymentType==='cod'&&o.paymentStatus==='unremitted').reduce((n,o)=>n+(Number(o.cashCollected)||0),0);
 const unreturned=delivered.filter(o=>o.transactionType==='refill_swap'&&Number(o.emptiesReturned)<o.items.reduce((n,i)=>n+i.qty,0));

 document.getElementById('pageContent').innerHTML=`
  <div class="page-header"><div><h1 class="page-title">${rider?'My Day':'Rider Portal'}</h1><p class="page-subtitle">Assigned deliveries and cash clearance</p></div></div>
  ${rider?`<div class="rider-summary-grid">
   <div class="rider-card"><span class="kpi-label">Full Issued</span><div class="answer-number">${fullIssued}</div></div>
   <div class="rider-card"><span class="kpi-label">Delivered</span><div class="answer-number">${delivered.length}</div></div>
   <div class="rider-card"><span class="kpi-label">Empties Collected</span><div class="answer-number">${empties}</div></div>
   <div class="rider-card"><span class="kpi-label">Cash to Remit</span><div class="answer-number">${peso(cashToRemit)}</div></div>
  </div>`:''}
  ${unreturned.length?`<div class="deficit-alert mb-3"><i class="bi bi-exclamation-triangle-fill"></i> ${unreturned.length} delivery has missing empties. A reason is required for clearance.</div>`:''}
  <div class="rider-order-list">${assigned.length?assigned.map(riderOrderCard).join(''):'<div class="empty-state rider-card">No deliveries assigned right now.</div>'}</div>
  <div class="rider-table-wrap card-lite table-wrap"><table class="table-lite"><thead><tr><th>Customer</th><th>Tank</th><th>Type</th><th>Empties</th><th>Payment</th><th>Action</th></tr></thead><tbody>${assigned.map(o=>`<tr><td>${escapeHtml(customerName(o.customerId))}</td><td>${o.items.map(i=>`${i.qty} × ${escapeHtml(inventoryName(i.variantId))}`).join('<br>')}</td><td>${transactionBadge(o)}</td><td>${o.emptiesReturned||0}</td><td>${paymentBadge(o)}</td><td>${riderAction(o)}</td></tr>`).join('')||'<tr><td colspan="6"><div class="empty-state">No deliveries assigned.</div></td></tr>'}</tbody></table></div>`;
 document.querySelectorAll('[data-rider-out]').forEach(b=>b.onclick=()=>setStatus(b.dataset.riderOut,'out_for_delivery'));
 document.querySelectorAll('[data-rider-deliver]').forEach(b=>b.onclick=()=>deliverModal(collection(KEYS.orders).find(o=>o.id===b.dataset.riderDeliver)));
}

function transactionBadge(o){
 return o.transactionType==='new_tank'
  ?'<span class="badge-status status-assigned"><i class="bi bi-plus-circle"></i> New Tank</span>'
  :'<span class="badge-status status-pending"><i class="bi bi-arrow-repeat"></i> Refill Swap</span>';
}

function paymentBadge(o){
 if(o.paymentType==='paid')return '<span class="badge-status status-delivered"><i class="bi bi-check-circle"></i> Paid</span>';
 return o.paymentStatus==='remitted'
  ?'<span class="badge-status status-delivered"><i class="bi bi-check-circle"></i> Remitted</span>'
  :'<span class="badge-status status-pending"><i class="bi bi-clock"></i> COD - Unremitted</span>';
}

function riderOrderCard(o){
 return `<article class="rider-order-card"><div class="d-flex justify-content-between align-items-start gap-2"><div><strong>${escapeHtml(customerName(o.customerId))}</strong><div class="small text-secondary">${escapeHtml(o.address)}</div></div>${transactionBadge(o)}</div><div class="mt-3">${o.items.map(i=>`${i.qty} × ${escapeHtml(inventoryName(i.variantId))}`).join('<br>')}<div class="mt-2">${paymentBadge(o)}</div></div><div class="mt-3">${riderAction(o)}</div></article>`;
}

function riderAction(o){
 if(o.status==='assigned')return `<button class="btn btn-primary-lpg primary-action" data-rider-out="${o.id}"><i class="bi bi-truck"></i> Out for Delivery</button>`;
 if(o.status==='out_for_delivery')return `<button class="btn btn-primary-lpg primary-action" data-rider-deliver="${o.id}"><i class="bi bi-check-circle"></i> Mark Delivered</button>`;
 return '—';
}

function setStatus(orderId,status){
 const orders=collection(KEYS.orders);const order=orders.find(o=>o.id===orderId);
 if(!order)return;
 order.status=status;
 saveCollection(KEYS.orders,orders);
 audit(user,'Updated','Delivery',orderId,`Status changed to ${status}`);
 toast(status==='out_for_delivery'?'Out for delivery':'Delivery updated');
 render();
}

function deliverModal(o){
 const qty=o.items.reduce((n,i)=>n+(Number(i.qty)||0),0);
 const expectedEmpty=o.transactionType==='refill_swap'?qty:0;
 const body=`<form id="riderDeliverForm"><div class="row g-3">
  <div class="col-12"><div class="alert alert-light border">${o.paymentType==='cod'?`Collect <strong>${peso(o.amount)}</strong>`:'Already paid'}</div></div>
  <div class="col-md-6"><label class="form-label">Empties collected</label><input name="empties" type="number" min="0" value="${o.emptiesReturned||0}" class="form-control" required></div>
  <div class="col-md-6"><label class="form-label">Delivery proof PIN</label><input name="proof" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" class="form-control" placeholder="4 digits" required></div>
  ${o.transactionType==='refill_swap'?`<div class="col-12"><label class="form-label">Reason if empties are missing</label><textarea name="reason" class="form-control" rows="2" placeholder="Example: Customer will return the empty tomorrow"></textarea><small class="text-secondary">Required only when fewer than ${expectedEmpty} empties are collected.</small></div>`:''}
 </div></form>`;
 modal('Mark Delivered',body,[{label:'Cancel',class:'btn btn-outline-secondary',action:closeModal},{label:'Mark Delivered',class:'btn btn-primary-lpg',action:()=>{
  const f=document.getElementById('riderDeliverForm');if(!f.reportValidity())return;
  const fd=new FormData(f);const empties=+fd.get('empties');const proof=String(fd.get('proof')||'');
  if(!/^\d{4}$/.test(proof)){toast('Enter a 4-digit delivery PIN','error');return;}
  const reason=String(fd.get('reason')||'').trim();
  if(o.transactionType==='refill_swap'&&empties<qty&&!reason){toast('Add a reason before clearing this refill','error');return;}
  const orders=collection(KEYS.orders);const target=orders.find(x=>x.id===o.id);
  target.status='delivered';target.deliveredAt=new Date().toISOString();target.emptiesReturned=empties;target.proofPin=proof;target.emptyDeficitReason=reason;
  target.cashCollected=o.paymentType==='cod'?Number(o.amount):0;
  target.paymentStatus=o.paymentType==='cod'?'unremitted':'paid';
  saveCollection(KEYS.orders,orders);

  const inv=collection(KEYS.inventory);
  target.items.forEach(item=>{const variant=inv.find(v=>v.id===item.variantId);if(variant){variant.fullQty=Math.max(0,variant.fullQty-item.qty);variant.emptyQty+=target.transactionType==='refill_swap'?empties:0;}});
  saveCollection(KEYS.inventory,inv);

  const riders=collection(KEYS.riders);const rider=riders.find(r=>r.id===target.riderId);
  if(rider&&!orders.some(x=>x.id!==target.id&&x.riderId===rider.id&&['assigned','out_for_delivery'].includes(x.status)))rider.status='available';
  saveCollection(KEYS.riders,riders);

  if(reason)audit(user,'Flagged','Empty Deficit',target.id,reason);
  audit(user,'Delivered','Delivery',target.id,`Proof PIN recorded; ${empties} empties collected; payment remains ${target.paymentStatus}`);
  closeModal();toast('Delivered — payment clearance is still open','success');render();
 }}]);
}

function expectedCash(riderId,date){
 return collection(KEYS.orders).filter(o=>o.riderId===riderId&&o.status==='delivered'&&o.deliveredAt?.slice(0,10)===date&&o.paymentStatus==='unremitted').reduce((n,o)=>n+(Number(o.cashCollected)||0),0);
}

function renderAdminRiders(){
 const riders=collection(KEYS.riders),orders=collection(KEYS.orders),rms=collection(KEYS.remittances),users=collection(KEYS.users);
 document.getElementById('pageContent').innerHTML=`
  <div class="page-header"><div><h1 class="page-title">Riders & Remittance</h1><p class="page-subtitle">Availability and cash clearance</p></div><button id="addRider" class="btn btn-primary-lpg primary-action no-print">+ Add Rider</button></div>
  <div class="card-lite p-3 mb-3"><input id="riderSearch" class="form-control search-input" placeholder="Search rider"></div>
  <div class="card-lite table-wrap mb-3"><table class="table-lite"><thead><tr><th>Rider</th><th>Contact</th><th>Status</th><th>Active delivery</th><th>Actions</th></tr></thead><tbody>${riders.map(r=>{const active=orders.find(o=>o.riderId===r.id&&['assigned','out_for_delivery'].includes(o.status));return `<tr><td><strong>${escapeHtml(r.name)}</strong></td><td>${escapeHtml(r.contact)}</td><td><span class="badge-status status-${r.status==='on-delivery'?'on-delivery':'available'}">${r.status==='on-delivery'?'<i class="bi bi-truck"></i> On delivery':'<i class="bi bi-check-circle"></i> Available'}</span></td><td>${active?escapeHtml(active.id):'—'}</td><td><button class="btn btn-sm btn-outline-secondary" data-edit="${r.id}"><i class="bi bi-pencil"></i> Edit</button></td></tr>`}).join('')||'<tr><td colspan="5"><div class="empty-state">No riders yet.</div></td></tr>'}</tbody></table></div>
  <div class="d-flex justify-content-between align-items-center mb-2"><h5 class="mb-0">Cash Clearance</h5></div>
  <div class="card-lite table-wrap mb-3"><table class="table-lite"><thead><tr><th>Rider</th><th>Date</th><th>Cash to clear</th><th>Cash remitted</th><th>Variance</th><th>Payment</th><th>Action</th></tr></thead><tbody>${rms.map(r=>{const collected=expectedCash(r.riderId,r.date);const variance=collected-r.cashAmount;return `<tr><td>${escapeHtml(riderName(r.riderId))}</td><td>${dateShort(r.date)}</td><td>${peso(collected)}</td><td>${peso(r.cashAmount)}</td><td class="variance ${variance!==0?'bad':''}">${peso(variance)}</td><td>${r.reconciled?'<span class="badge-status status-delivered"><i class="bi bi-check-circle"></i> Remitted</span>':'<span class="badge-status status-pending"><i class="bi bi-clock"></i> COD - Unremitted</span>'}</td><td>${r.reconciled?'—':`<button class="btn btn-sm btn-primary-lpg" data-confirm-remit="${r.id}">Confirm Remittance</button>`}</td></tr>`}).join('')||'<tr><td colspan="7"><div class="empty-state">No cash clearance records yet.</div></td></tr>'}</tbody></table></div>
  ${user.role==='admin'?`<div class="d-flex justify-content-between align-items-center mb-2"><h5 class="mb-0">Team Accounts</h5><button id="addAccount" class="btn btn-sm btn-outline-primary no-print">+ Add Account</button></div><div class="card-lite table-wrap"><table class="table-lite"><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Action</th></tr></thead><tbody>${users.map(a=>`<tr><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.username)}</td><td>${escapeHtml(a.role)}</td><td><button class="btn btn-sm btn-outline-secondary" data-edit-account="${a.id}" ${a.id===user.id?'disabled':''}>Edit</button> <button class="btn btn-sm btn-outline-danger" data-delete-account="${a.id}" ${a.id===user.id?'disabled':''}>Delete</button></td></tr>`).join('')}</tbody></table></div>`:''}`;
 document.getElementById('addRider').onclick=()=>editRider();
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editRider(riders.find(r=>r.id===b.dataset.edit)));
 document.querySelectorAll('[data-confirm-remit]').forEach(b=>b.onclick=()=>confirmRemittance(rms.find(r=>r.id===b.dataset.confirmRemit)));
 document.getElementById('addAccount')?.addEventListener('click',()=>editAccount());
 document.querySelectorAll('[data-edit-account]').forEach(b=>b.onclick=()=>editAccount(users.find(a=>a.id===b.dataset.editAccount)));
 document.querySelectorAll('[data-delete-account]').forEach(b=>b.onclick=()=>{const removed=users.find(a=>a.id===b.dataset.deleteAccount);if(!removed||removed.id===user.id)return;saveCollection(KEYS.users,users.filter(a=>a.id!==removed.id));audit(user,'Deleted','Account',removed.id,`Account ${removed.username} deleted`);render();undoToast('Account deleted',()=>{saveCollection(KEYS.users,[removed,...users.filter(a=>a.id!==removed.id)]);render();});});
}

function confirmRemittance(rm){
 if(!rm)return;
 modal('Confirm Remittance',`<p>Confirm <strong>${peso(rm.cashAmount)}</strong> from ${escapeHtml(riderName(rm.riderId))} on ${dateShort(rm.date)}.</p>`,[
  {label:'Cancel',class:'btn btn-outline-secondary',action:closeModal},
  {label:'Confirm Remittance',class:'btn btn-primary-lpg',action:()=>{
   rm.reconciled=true;rm.variance=0;
   const rms=collection(KEYS.remittances);const stored=rms.find(r=>r.id===rm.id);if(stored){stored.reconciled=true;stored.variance=0;}
   saveCollection(KEYS.remittances,rms);
   const orders=collection(KEYS.orders);orders.forEach(o=>{if(o.riderId===rm.riderId&&o.paymentType==='cod'&&o.deliveredAt?.slice(0,10)<=rm.date)o.paymentStatus='remitted';});
   saveCollection(KEYS.orders,orders);
   audit(user,'Confirmed','Remittance',rm.id,`Cash clearance confirmed for ${riderName(rm.riderId)}`);
   closeModal();toast('Remittance confirmed');render();
  }}
 ]);
}

function editAccount(account){
 const body=`<form id="accountForm"><div class="row g-3"><div class="col-md-6"><label class="form-label">Name</label><input name="name" class="form-control" value="${escapeHtml(account?.name||'')}" required></div><div class="col-md-6"><label class="form-label">Username</label><input name="username" class="form-control" value="${escapeHtml(account?.username||'')}" required></div><div class="col-md-6"><label class="form-label">Password</label><input name="password" type="password" class="form-control" value="${escapeHtml(account?.password||'')}" required></div><div class="col-md-6"><label class="form-label">Role</label><select name="role" class="form-select"><option value="admin" ${account?.role==='admin'?'selected':''}>Admin</option><option value="cashier" ${account?.role==='cashier'?'selected':''}>Cashier</option><option value="rider" ${account?.role==='rider'?'selected':''}>Rider</option></select></div></div></form>`;
 modal(account?'Edit Account':'Add Account',body,[{label:'Cancel',class:'btn btn-outline-secondary',action:closeModal},{label:account?'Save Account':'Add Account',class:'btn btn-primary-lpg',action:()=>{
  const f=document.getElementById('accountForm');if(!f.reportValidity())return;
  const fd=new FormData(f),users=collection(KEYS.users),username=fd.get('username').trim();
  if(users.some(a=>a.username===username&&a.id!==account?.id)){toast('That username is already used','error');return;}
  if(account){account.name=fd.get('name').trim();account.username=username;account.password=fd.get('password');account.role=fd.get('role');}
  else users.push({id:uid('u'),name:fd.get('name').trim(),username,password:fd.get('password'),role:fd.get('role')});
  saveCollection(KEYS.users,users);
  audit(user,account?'Updated':'Created','Account',account?.id||users.at(-1).id,`Account ${username} saved`);
  closeModal();toast(account?'Account saved':'Account added');render();
 }}]);
}

function editRider(r){
 const body=`<form id="riderForm"><div class="row g-3"><div class="col-md-6"><label class="form-label">Name</label><input name="name" class="form-control" value="${escapeHtml(r?.name||'')}" required></div><div class="col-md-6"><label class="form-label">Contact</label><input name="contact" class="form-control" value="${escapeHtml(r?.contact||'')}" required></div><div class="col-md-6"><label class="form-label">Status</label><select name="status" class="form-select"><option value="available" ${r?.status==='available'?'selected':''}>Available</option><option value="on-delivery" ${r?.status==='on-delivery'?'selected':''}>On delivery</option></select></div></div></form>`;
 modal(r?'Edit Rider':'Add Rider',body,[{label:'Cancel',class:'btn btn-outline-secondary',action:closeModal},{label:r?'Save Rider':'Add Rider',class:'btn btn-primary-lpg',action:()=>{const f=document.getElementById('riderForm');if(!f.reportValidity())return;const fd=new FormData(f),riders=collection(KEYS.riders);if(r){r.name=fd.get('name').trim();r.contact=fd.get('contact').trim();r.status=fd.get('status');}else{riders.push({id:uid('r'),name:fd.get('name').trim(),contact:fd.get('contact').trim(),status:fd.get('status')});}saveCollection(KEYS.riders,riders);audit(user,r?'Updated':'Created','Rider',r?.id||riders.at(-1).id,'Rider profile saved');closeModal();toast(r?'Rider saved':'Rider added');render();}}]);
}

render();
