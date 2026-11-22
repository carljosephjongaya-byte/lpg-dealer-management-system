import {requireAuth} from './auth.js';
import {renderLayout} from './layout.js';
import {KEYS,collection} from './storage.js';
import {csv,peso,escapeHtml,riderName,inventoryName,customerName,dateTime, dateShort} from './utils.js';
const user=requireAuth(['admin','cashier']);if(!user)throw new Error('Unauthorized');
renderLayout('reports.html');
function render(){
 const today=new Date().toISOString().slice(0,10),from=document.getElementById('fromDate')?.value||today, to=document.getElementById('toDate')?.value||today;
 const orders=collection(KEYS.orders).filter(o=>o.deliveredAt&&o.deliveredAt.slice(0,10)>=from&&o.deliveredAt.slice(0,10)<=to);
 const txns=collection(KEYS.inventoryTxns).filter(t=>t.timestamp.slice(0,10)>=from&&t.timestamp.slice(0,10)<=to);
 const fullOut=txns.filter(t=>t.type==='sale').reduce((n,t)=>n+t.qty,0)+orders.flatMap(o=>o.items).reduce((n,i)=>n+i.qty,0);
 const emptyIn=txns.filter(t=>['rider_return','deposit_return'].includes(t.type)).reduce((n,t)=>n+t.qty,0)+orders.reduce((n,o)=>n+(Number(o.emptiesReturned)||0),0);
 const cash=orders.reduce((n,o)=>n+(Number(o.cashCollected)||0),0);
 const rm=collection(KEYS.remittances).filter(r=>r.date>=from&&r.date<=to),remitted=rm.reduce((n,r)=>n+r.cashAmount,0),variance=cash-remitted;
 document.getElementById('pageContent').innerHTML=`<div class="d-flex justify-content-between align-items-center mb-3"><div><h1 class="page-title">Sales & Audit Reports</h1><p class="page-subtitle">Date-range reconciliation and activity log</p></div><div class="no-print d-flex gap-2"><button id="csvBtn" class="btn btn-outline-secondary"><i class="bi bi-download"></i> CSV</button><button onclick="window.print()" class="btn btn-primary-lpg"><i class="bi bi-printer"></i> Print</button></div></div>
 <div class="card-lite p-3 mb-3 d-flex flex-wrap gap-2 align-items-end"><div><label class="form-label">From</label><input id="fromDate" type="date" class="form-control" value="${from}"></div><div><label class="form-label">To</label><input id="toDate" type="date" class="form-control" value="${to}"></div></div>
 <div class="row g-3 mb-3"><div class="col-sm-6 col-lg-3"><div class="card-lite kpi-card"><div class="kpi-label">Full cylinders out</div><div class="kpi-value">${fullOut}</div></div></div><div class="col-sm-6 col-lg-3"><div class="card-lite kpi-card"><div class="kpi-label">Empty shells in</div><div class="kpi-value">${emptyIn}</div></div></div><div class="col-sm-6 col-lg-3"><div class="card-lite kpi-card"><div class="kpi-label">Cash collected</div><div class="kpi-value">${peso(cash)}</div></div></div><div class="col-sm-6 col-lg-3"><div class="card-lite kpi-card"><div class="kpi-label">Reconciliation variance</div><div class="kpi-value variance ${variance!==0?'bad':''}">${peso(variance)}</div></div></div></div>
 <div class="card-lite p-3 mb-3"><h6 class="fw-bold">Reconciliation</h6><div class="table-wrap"><table class="table-lite"><thead><tr><th>Rider</th><th>Date</th><th>Cash collected</th><th>Cash remitted</th><th>Variance</th><th>Status</th></tr></thead><tbody>${rm.map(r=>{const collected=orders.filter(o=>o.riderId===r.riderId&&o.deliveredAt?.slice(0,10)===r.date).reduce((n,o)=>n+(o.cashCollected||0),0);const v=collected-r.cashAmount;return `<tr><td>${escapeHtml(riderName(r.riderId))}</td><td>${dateShort(r.date)}</td><td>${peso(collected)}</td><td>${peso(r.cashAmount)}</td><td class="variance ${v!==0?'bad':''}">${peso(v)}</td><td>${r.reconciled?'Reconciled':'Open'}</td></tr>`}).join('')||'<tr><td colspan="6"><div class="empty-state">No remittances in date range</div></td></tr>'}</tbody></table></div></div>
 <div class="card-lite p-3"><h6 class="fw-bold">Audit log</h6><div class="table-wrap"><table class="table-lite"><thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody>${collection(KEYS.auditLog).slice(0,25).map(a=>`<tr><td>${dateTime(a.timestamp)}</td><td>${a.userId}</td><td>${escapeHtml(a.action)}</td><td>${escapeHtml(a.entity)}</td><td>${escapeHtml(a.details)}</td></tr>`).join('')||'<tr><td colspan="5"><div class="empty-state">No audit entries</div></td></tr>'}</tbody></table></div></div>`;
 document.getElementById('fromDate').onchange=render;document.getElementById('toDate').onchange=render;
 document.getElementById('csvBtn').onclick=()=>csv(`lpg-report-${from}-to-${to}.csv`,[
 ['Report','LPG Dealer'],['Date range',from+' to '+to],['Full cylinders out',fullOut],['Empty shells in',emptyIn],['Cash collected',cash],['Cash remitted',remitted],['Variance',variance],[],['Audit timestamp','User','Action','Entity','Details'],
 ...collection(KEYS.auditLog).map(a=>[a.timestamp,a.userId,a.action,a.entity,a.details])
 ]);
}
render();
