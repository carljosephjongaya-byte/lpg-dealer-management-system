import { currentUser, logout } from './auth.js';
export function renderLayout(active) {
  const user=currentUser(); if(!user)return;
  const pages=[
    {file:'dashboard.html',icon:'speedometer2',label:'Dashboard',roles:['admin','cashier','rider']},
    {file:'inventory.html',icon:'box-seam',label:'Stock',roles:['admin','cashier']},
    {file:'customers.html',icon:'people',label:'Customers',roles:['admin','cashier']},
    {file:'orders.html',icon:'truck',label:'Orders',roles:['admin','cashier','rider']},
    {file:'riders.html',icon:'person-badge',label:'Riders',roles:['admin','cashier']},
    {file:'reports.html',icon:'graph-up',label:'Reports',roles:['admin','cashier']}
  ];
  document.querySelector('[data-layout]').innerHTML=`
    <div class="sidebar" id="sidebar">
      <div class="sidebar-brand"><i class="bi bi-fuel-pump"></i><span>LPG Dealer</span></div>
      <nav>${pages.filter(p=>p.roles.includes(user.role)).map(p=>`<a class="nav-link-custom ${active===p.file?'active':''}" href="${p.file}"><i class="bi bi-${p.icon}"></i>${p.label}</a>`).join('')}</nav>
    </div>
    <main class="main">
      <header class="topbar">
        <div class="d-flex align-items-center gap-2"><button class="mobile-toggle" id="menuToggle" aria-label="Toggle menu"><i class="bi bi-list"></i></button><strong id="topTitle"></strong></div>
        <div class="topbar-user"><span class="role-chip">${user.role}</span><div class="d-none d-sm-block text-end"><strong class="d-block">${user.name}</strong><small class="text-secondary">${user.username}</small></div><button id="logoutBtn" class="btn btn-sm btn-outline-secondary" title="Logout"><i class="bi bi-box-arrow-right"></i></button></div>
      </header>
      <div class="content" id="pageContent"></div>
    </main>
    <nav class="bottom-nav" aria-label="Mobile navigation">${pages.filter(p=>p.roles.includes(user.role)).map(p=>`<a class="${active===p.file?'active':''}" href="${p.file}"><i class="bi bi-${p.icon}"></i><span>${p.label}</span></a>`).join('')}</nav>`;
  document.getElementById('menuToggle').onclick=()=>document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('logoutBtn').onclick=logout;
  const title=document.querySelector('[data-page-title]')?.textContent||''; document.getElementById('topTitle').textContent=title;
}
