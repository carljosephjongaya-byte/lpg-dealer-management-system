import { KEYS, collection, get, set, remove, seedIfNeeded } from './storage.js';
seedIfNeeded();
export function login(username,password) {
  const user=collection(KEYS.users).find(u=>u.username===username && u.password===password);
  if(!user) return null;
  set(KEYS.session,{id:user.id,name:user.name,role:user.role,username:user.username});
  return user;
}
export function logout(){ remove(KEYS.session); location.href='index.html'; }
export function currentUser(){ return get(KEYS.session); }
export function requireAuth(allowed=[]){
  const user=currentUser();
  if(!user){ location.href='index.html'; return null; }
  if(allowed.length && !allowed.includes(user.role)){ location.href='dashboard.html'; return null; }
  return user;
}
