export const KEYS = {
  session:'lpg_session', seed:'lpg_seed_version', users:'users', inventory:'inventory',
  inventoryTxns:'inventoryTxns', customers:'customers', deposits:'deposits', loans:'loans',
  riders:'riders', orders:'orders', remittances:'remittances', auditLog:'auditLog'
};
export function get(key) { try { return JSON.parse(localStorage.getItem(key)) ?? null; } catch { return null; } }
export function set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
export function remove(key) { localStorage.removeItem(key); }
export function collection(name) { return get(name) || []; }
export function saveCollection(name, items) { set(name, items); }
export function uid(prefix='id') { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7); }
export function seedIfNeeded() {
  if (get(KEYS.seed) === '2') return;
  set(KEYS.users, [
    {id:'u-admin',name:'Maria Santos',username:'admin',password:'admin123',role:'admin'},
    {id:'u-cashier',name:'Juan Dela Cruz',username:'cashier',password:'cash123',role:'cashier'},
    {id:'u-rider1',name:'Mark Villanueva',username:'rider1',password:'rider123',role:'rider'},
    {id:'u-rider2',name:'Paolo Reyes',username:'rider2',password:'rider123',role:'rider'}
  ]);
  set(KEYS.inventory, [
    ['Petron Gasul','2.7',35,14,8],['Petron Gasul','11',48,20,12],['Petron Gasul','22',14,8,4],['Petron Gasul','50',8,5,3],
    ['Shellane','2.7',32,12,8],['Shellane','11',42,18,10],['Shellane','22',11,7,4],['Shellane','50',6,4,2]
  ].map((v,i)=>({id:'inv-'+i,brand:v[0],sizeKg:v[1],fullQty:v[2],emptyQty:v[3],lowStockThreshold:v[4]})));
  set(KEYS.customers, [
    {id:'c1',name:'Ana Mercado',contact:'09171234567',address:'Blk 2 Lot 4 Mabini St.',barangay:'Poblacion',type:'household',depositBalance:1500,createdAt:'2026-11-15T09:00:00'},
    {id:'c2',name:'Aling Nena Eatery',contact:'09182345678',address:'12 M. Aguilar Ave.',barangay:'Benevento',type:'eatery',depositBalance:3000,createdAt:'2026-11-12T09:00:00'},
    {id:'c3',name:'Carlos Ramos',contact:'09293456789',address:'456 Aniban Road',barangay:'Aniban',type:'household',depositBalance:1000,createdAt:'2026-11-10T09:00:00'},
    {id:'c4',name:'Sari-Sari ni Liza',contact:'09994567890',address:'8 Sampaguita St.',barangay:'Pasong Buaya',type:'eatery',depositBalance:2000,createdAt:'2026-11-08T09:00:00'},
    {id:'c5',name:'Ruth Garcia',contact:'09105678901',address:'77 Rizal Avenue',barangay:'San Gabriel',type:'household',depositBalance:500,createdAt:'2026-11-05T09:00:00'}
  ]);
  set(KEYS.riders, [
    {id:'r1',name:'Mark Villanueva',contact:'09170001111',status:'on-delivery'},
    {id:'r2',name:'Paolo Reyes',contact:'09170002222',status:'available'},
    {id:'r3',name:'Jasper Cruz',contact:'09170003333',status:'available'},
    {id:'r4',name:'Leo Mendoza',contact:'09170004444',status:'available'}
  ]);
  set(KEYS.deposits, [
    {id:'d1',customerId:'c1',type:'receive',amount:1500,timestamp:'2026-11-15T09:10:00',userId:'u-cashier',notes:'Tank deposit'},
    {id:'d2',customerId:'c2',type:'receive',amount:3000,timestamp:'2026-11-12T09:10:00',userId:'u-admin',notes:'Business cylinder deposit'},
    {id:'d3',customerId:'c3',type:'receive',amount:1000,timestamp:'2026-11-10T09:10:00',userId:'u-cashier',notes:'Household deposit'},
    {id:'d4',customerId:'c4',type:'receive',amount:2000,timestamp:'2026-11-08T09:10:00',userId:'u-cashier',notes:'Store refill deposit'}
  ]);
  set(KEYS.loans, [
    {id:'l1',customerId:'c1',variantId:'inv-1',qty:1,serials:['PG11-001'],status:'loaned',timestamp:'2026-11-17T10:00:00'},
    {id:'l2',customerId:'c2',variantId:'inv-5',qty:2,serials:['SH11-020','SH11-021'],status:'loaned',timestamp:'2026-11-18T11:00:00'},
    {id:'l3',customerId:'c3',variantId:'inv-0',qty:1,serials:['PG27-009'],status:'returned',timestamp:'2026-11-16T14:00:00'},
    {id:'l4',customerId:'c4',variantId:'inv-7',qty:1,serials:['SH50-003'],status:'loaned',timestamp:'2026-11-19T15:00:00'}
  ]);
  const now = new Date();
  set(KEYS.orders, [
    {id:'o1',customerId:'c1',items:[{variantId:'inv-1',qty:2}],address:'Blk 2 Lot 4 Mabini St.',paymentType:'paid',paymentStatus:'paid',transactionType:'refill_swap',amount:2100,status:'delivered',riderId:'r2',createdAt:'2026-11-20T08:30:00',deliveredAt:'2026-11-20T10:15:00',emptiesReturned:2,cashCollected:2100,proofPin:'4821',emptyDeficitReason:''},
    {id:'o2',customerId:'c2',items:[{variantId:'inv-5',qty:3}],address:'12 M. Aguilar Ave.',paymentType:'cod',paymentStatus:'remitted',transactionType:'refill_swap',amount:3300,status:'delivered',riderId:'r1',createdAt:'2026-11-21T09:10:00',deliveredAt:'2026-11-21T11:30:00',emptiesReturned:3,cashCollected:3300,proofPin:'7193',emptyDeficitReason:''},
    {id:'o3',customerId:'c3',items:[{variantId:'inv-0',qty:1}],address:'456 Aniban Road',paymentType:'cod',paymentStatus:'unremitted',transactionType:'refill_swap',amount:650,status:'out_for_delivery',riderId:'r1',createdAt:'2026-11-22T08:20:00',deliveredAt:'',emptiesReturned:0,cashCollected:0,proofPin:'',emptyDeficitReason:''},
    {id:'o4',customerId:'c4',items:[{variantId:'inv-3',qty:1},{variantId:'inv-7',qty:1}],address:'8 Sampaguita St.',paymentType:'paid',paymentStatus:'paid',transactionType:'new_tank',amount:5200,status:'assigned',riderId:'r3',createdAt:'2026-11-22T09:00:00',deliveredAt:'',emptiesReturned:0,cashCollected:0,proofPin:'',emptyDeficitReason:''},
    {id:'o5',customerId:'c5',items:[{variantId:'inv-1',qty:1}],address:'77 Rizal Avenue',paymentType:'cod',paymentStatus:'unremitted',transactionType:'refill_swap',amount:1050,status:'pending',riderId:'',createdAt:'2026-11-22T09:20:00',deliveredAt:'',emptiesReturned:0,cashCollected:0,proofPin:'',emptyDeficitReason:''},
    {id:'o6',customerId:'c2',items:[{variantId:'inv-5',qty:2}],address:'12 M. Aguilar Ave.',paymentType:'paid',paymentStatus:'paid',transactionType:'refill_swap',amount:2200,status:'cancelled',riderId:'',createdAt:'2026-11-19T13:00:00',deliveredAt:'',emptiesReturned:0,cashCollected:0,proofPin:'',emptyDeficitReason:''},
    {id:'o7',customerId:'c1',items:[{variantId:'inv-1',qty:1}],address:'Blk 2 Lot 4 Mabini St.',paymentType:'cod',paymentStatus:'unremitted',transactionType:'refill_swap',amount:1050,status:'delivered',riderId:'r4',createdAt:'2026-11-18T08:45:00',deliveredAt:'2026-11-18T10:10:00',emptiesReturned:1,cashCollected:1000,proofPin:'2604',emptyDeficitReason:''},
    {id:'o8',customerId:'c3',items:[{variantId:'inv-4',qty:2}],address:'456 Aniban Road',paymentType:'paid',paymentStatus:'paid',transactionType:'new_tank',amount:1300,status:'delivered',riderId:'r2',createdAt:'2026-11-17T14:00:00',deliveredAt:'2026-11-17T15:30:00',emptiesReturned:2,cashCollected:1300,proofPin:'1357',emptyDeficitReason:''}
  ]);
  set(KEYS.inventoryTxns, [
    {id:'tx1',timestamp:'2026-11-20T08:00:00',type:'restock',variantId:'inv-1',qty:10,userId:'u-admin',notes:'Supplier restock'},
    {id:'tx2',timestamp:'2026-11-20T10:20:00',type:'sale',variantId:'inv-1',qty:2,userId:'u-cashier',notes:'Walk-in sale'},
    {id:'tx3',timestamp:'2026-11-21T11:40:00',type:'rider_return',variantId:'inv-5',qty:3,userId:'u-cashier',notes:'Empties returned by rider'},
    {id:'tx4',timestamp:'2026-11-22T08:10:00',type:'deposit_loan',variantId:'inv-1',qty:1,userId:'u-admin',notes:'Loaned to customer'}
  ]);
  set(KEYS.remittances, [
    {id:'rm1',riderId:'r1',date:'2026-11-21',cashAmount:3300,emptiesCount:3,reconciled:true,variance:0},
    {id:'rm2',riderId:'r4',date:'2026-11-18',cashAmount:950,emptiesCount:1,reconciled:true,variance:-50},
    {id:'rm3',riderId:'r2',date:'2026-11-20',cashAmount:2100,emptiesCount:2,reconciled:true,variance:0}
  ]);
  set(KEYS.auditLog, [
    {id:'a1',timestamp:'2026-11-22T09:20:00',userId:'u-cashier',action:'Created',entity:'Order',entityId:'o5',details:'New COD order for Ruth Garcia'},
    {id:'a2',timestamp:'2026-11-22T09:00:00',userId:'u-admin',action:'Assigned',entity:'Order',entityId:'o4',details:'Assigned to Jasper Cruz'},
    {id:'a3',timestamp:'2026-11-21T11:40:00',userId:'u-cashier',action:'Recorded',entity:'Inventory',entityId:'inv-5',details:'Rider return of 3 empty shells'}
  ]);
  set(KEYS.seed, '2');
}
