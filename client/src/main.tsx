import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { createAttendance, createRainfall, createYield, deleteResource, loadAttendance, loadDashboard, loadMeta, loadRainfall, loadResource, loadYield, saveResource, login, logout, setSelectedPropertyId, registerProperty, setDashboardRanges } from './features/appSlice';
import './styles.css';

const today = new Date().toISOString().slice(0,10);
const nav = [
  ['Dashboard','dashboard'], ['Attendance','attendance'], ['Rainfall','rainfall'], ['Yield Entry','yield'], ['Plant Inventory','plantInventory'],
  ['Estate Setup','setup'], ['People & Vendors','people'], ['Labor Money','laborMoney'], ['Crop & Market','crop'], ['Expenses & Income','finance'], ['Inventory','inventory'], ['Reports','reports'], ['Images','images']
];
const groups: Record<string, string[]> = {
  setup: ['properties','blocks','plants','baseUnits'],
  people: ['labors','vendors','laborVendors'],
  laborMoney: ['wages','wageSettlements','vendorSettlements'],
  crop: ['plantInventory','yieldTypes','yieldRates','cropDetails','fertilizers'],
  finance: ['expenseTypes','expenses','cropIncome'],
  inventory: ['assets'],
  reports: ['reports']
};
const labels: Record<string,string> = {
  properties:'Properties', blocks:'Blocks', labors:'Employees / Labors', vendors:'Vendors', laborVendors:'Labor Vendor Mapping', vendorSettlements:'Labor Vendor Settlement', wages:'Labor Wage Settings', wageSettlements:'Running Wage Settlement', plants:'Plant Details', plantInventory:'Plant Inventory', yieldTypes:'Yield Types', yieldRates:'Yield Rates / Market Price', assets:'Inventory / Assets', expenseTypes:'Expense Types', expenses:'Running Expenses', cropDetails:'Crop Details', cropIncome:'Income / Revenue', fertilizers:'Fertilizers', reports:'Manual Reports', baseUnits:'Base Units'
};
const fieldConfig: Record<string, any[]> = {
  properties:[['property_name','text','Property name'],['total_acre','number','Total acre'],['address_1','text','Address 1'],['address_2','text','Address 2'],['pincode','text','Pincode'],['user_id','select','Manager/User','users','user_id','user_name']],
  blocks:[['block_name','text','Block name'],['block_area','number','Block area'],['property_id','select','Property','properties','property_id','property_name'],['parent_block_id','select','Parent block','blocks','block_id','block_name',true]],
  labors:[['name','text','Name'],['age','number','Age'],['adhar_card','text','Aadhaar'],['bank_details','text','Bank details'],['address','text','Address'],['emergency_details','text','Emergency details'],['user_id','select','User','users','user_id','user_name',true]],
  vendors:[['vendorname','text','Vendor name'],['description','text','Description']],
  laborVendors:[['labor_id','select','Labor','labors','labor_id','labor_name'],['vendor_id','select','Vendor','vendors','vendor_id','vendorname'],['vendor_labor_percentage','number','Vendor %'],['laborvendorcode','text','Season code']],
  vendorSettlements:[['laborvendor_id','select','Labor vendor','laborVendors','laborvendor_id','labor_vendor_label'],['settled_amount','number','Settled amount'],['advance_amount','number','Advance amount'],['running_wage_transaction_date','date','Date']],
  wages:[['labor_id','select','Labor','labors','labor_id','labor_name'],['wage_fixed','number','Fixed wage'],['wage_variable','number','Variable wage'],['wage_ot_perhr_price','number','OT per hour'],['wage_fix_code','text','Season wage code']],
  wageSettlements:[['wage_id','select','Wage','wages','wage_id','wage_label'],['settled_amount','number','Settled amount'],['advance_amount','number','Advance amount'],['running_wage_transaction_date','date','Date']],
  plants:[['plant_type','text','Plant type'],['details','text','Details'],['block_id','select','Block','blocks','block_id','block_name',true]],
  plantInventory:[['plant_inventory_id','hidden','ID'],['block_id','select','Block','blocks','block_id','block_name'],['sub_block_name','text','Sub block / section'],['plant_id','select','Plant type','plants','plant_id','plant_type'],['plant_count','number','Plant count'],['planting_date','date','Planting date'],['notes','text','Notes']],
  yieldTypes:[['yieldtype_name','text','Yield type'],['plant_id','select','Plant','plants','plant_id','plant_type']],
  yieldRates:[['plant_id','select','Plant','plants','plant_id','plant_type'],['yieldtype_id','select','Yield type','yieldTypes','yieldtype_id','yieldtype_name'],['yieldrate_code','text','Rate code / season'],['yieldrate_running_rate','number','Rate'],['baseunit_id','select','Unit','baseUnits','baseunit_id','baseunit_name']],
  assets:[['asset_name','text','Asset name'],['asset_price','number','Price'],['procured_year','number','Year'],['isactive','number','Active 1/0'],['property_id','select','Property','properties','property_id','property_name'],['asset_procured_source','text','Source']],
  expenseTypes:[['expense_code','text','Expense code'],['expense_name','text','Expense name'],['current_rate','number','Current rate'],['baseunit_id','select','Unit','baseUnits','baseunit_id','baseunit_name',true]],
  expenses:[['expensetype_id','select','Expense type','expenseTypes','expensetype_id','expense_name'],['property_id','select','Property','properties','property_id','property_name'],['expense_code','text','Expense code'],['expense_occurence_date','date','Expense date'],['other_expense','number','Amount']],
  cropDetails:[['yield_obtained','number','Yield obtained'],['selling_price','number','Selling price'],['property_id','select','Property','properties','property_id','property_name'],['other_detail','text','Other detail']],
  cropIncome:[['crop_id','select','Crop','cropDetails','crop_id','crop_label'],['income_amount','number','Income amount'],['received_date','date','Received date']],
  fertilizers:[['fertilizer_name','text','Fertilizer name'],['date_of_application','date','Date of application'],['property_id','select','Property','properties','property_id','property_name'],['other_details','text','Other details']],
  reports:[['total_expenditure','number','Total expenditure'],['total_revenue','number','Total revenue'],['profit_loss','number','Profit/Loss'],['property_id','select','Property','properties','property_id','property_name',true]],
  baseUnits:[['baseunit_name','text','Unit name']]
};
function emptyFor(resource:string){ const f:any = { created_by:'Admin' }; for(const x of fieldConfig[resource] || []) f[x[0]] = x[1] === 'date' ? today : x[1] === 'number' ? '0' : ''; return f; }


function App(){
  const dispatch = useAppDispatch();
  const {user,selectedPropertyId,meta,dashboard,attendance,rainfall,yields,error,status,resources}=useAppSelector(s=>s.app);
  const [tab,setTab]=useState('dashboard');
  const selectedProperty = meta?.properties?.find((p:any)=>String(p.property_id)===String(selectedPropertyId));
  useEffect(()=>{ if(user){ dispatch(loadMeta()); } },[dispatch,user,selectedPropertyId]);
  useEffect(()=>{ if(user && selectedPropertyId){ dispatch(loadDashboard()); dispatch(loadAttendance()); dispatch(loadRainfall()); dispatch(loadYield()); } },[dispatch,user,selectedPropertyId]);
  useEffect(()=>{ if(user && selectedPropertyId) (groups[tab]||[]).forEach(r=>dispatch(loadResource(r))); if(user && selectedPropertyId && tab==='plantInventory') dispatch(loadResource('plantInventory')); },[tab,dispatch,user,selectedPropertyId]);
  if(!user) return <ProviderShell><Login/></ProviderShell>;
  if(!meta) return <ProviderShell><p>Loading owner data…</p></ProviderShell>;
  const hasProperties = meta?.properties?.length > 0;
  return <div className="app"><aside><div className="brand">☕ Estate App</div><p>Owner login + selected property scoped data.</p>{nav.map(([name,key])=><button className={tab===key?'active':''} onClick={()=>setTab(key)} key={key}>{name}</button>)}<button className="danger" onClick={()=>dispatch(logout())}>Logout</button></aside><main><header><div><h1>{nav.find(x=>x[1]===tab)?.[0]}</h1><span>{status==='loading'?'Saving / loading…': selectedProperty ? `Working property: ${selectedProperty.property_name}` : 'No property selected'}</span></div><div className="topControls"><PropertySelector meta={meta}/><Badge>{user.username}</Badge></div></header>{error&&<div className="error">{error}</div>}{!hasProperties ? <RegisterProperty/> : !selectedPropertyId ? <div className="panel"><h2>Select a property</h2><p>Choose a property from the top dropdown to continue.</p></div> : <>{tab==='dashboard'&&<Dashboard data={dashboard}/>} {tab==='attendance'&&<Attendance meta={meta} rows={attendance} submit={(p:any)=>dispatch(createAttendance({...p,property_id:selectedPropertyId,user_id:user.user_id,created_by:user.username}))}/>} {tab==='rainfall'&&<Rainfall meta={meta} rows={rainfall} submit={(p:any)=>dispatch(createRainfall({...p,created_by:user.username}))}/>} {tab==='yield'&&<Yield meta={meta} rows={yields} submit={(p:any)=>dispatch(createYield({...p,created_by:user.username}))}/>} {tab==='plantInventory'&&<Crud resource="plantInventory" meta={meta} rows={resources.plantInventory||[]} save={(r:string,p:any)=>dispatch(saveResource({resource:r,payload:{...p,property_id:selectedPropertyId,created_by:user.username,modified_by:user.username}}))} remove={(r:string,id:any)=>dispatch(deleteResource({resource:r,id}))}/>} {groups[tab]&&<GroupScreen group={groups[tab]} meta={meta} resources={resources} save={(r:string,p:any)=>dispatch(saveResource({resource:r,payload:{...p,property_id:p.property_id || selectedPropertyId,created_by:user.username,user_id:p.user_id || user.user_id}}))} remove={(r:string,id:any)=>dispatch(deleteResource({resource:r,id}))}/>} {tab==='images'&&<Images/>}</>}</main></div>
}
function ProviderShell({children}:any){return <div className="loginWrap"><div className="loginCard">{children}</div></div>}
function Login(){ const dispatch=useAppDispatch(); const {status,error}=useAppSelector(s=>s.app); const [f,setF]=useState({username:'Asnika Sridhar',password:'owner123'}); return <form onSubmit={e=>{e.preventDefault();dispatch(login(f));}}><h1>☕ Coffee Estate Login</h1><p>Owner can log in and manage only their properties. Demo hashed users can use password <b>owner123</b>; plaintext seeded users use their stored password.</p>{error&&<div className="error">{error}</div>}<label>Username or email<input value={f.username} onChange={e=>setF({...f,username:e.target.value})}/></label><label>Password<input type="password" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></label><button>{status==='loading'?'Logging in…':'Login'}</button></form> }
function PropertySelector({meta}:any){ const dispatch=useAppDispatch(); const {selectedPropertyId}=useAppSelector(s=>s.app); const properties=meta?.properties || []; if(!properties.length) return null; return <label className="propertySelect">Property<select value={selectedPropertyId} onChange={e=>{dispatch(setSelectedPropertyId(e.target.value)); setTimeout(()=>{dispatch(loadMeta()); dispatch(loadDashboard()); dispatch(loadAttendance()); dispatch(loadRainfall()); dispatch(loadYield());},0)}}>{properties.map((p:any)=><option key={p.property_id} value={p.property_id}>{p.property_name}</option>)}</select></label> }
function RegisterProperty(){ const dispatch=useAppDispatch(); const [f,setF]=useState({property_name:'',total_acre:'0',address_1:'',address_2:'',pincode:''}); return <Form title="Register your first property" onSubmit={()=>dispatch(registerProperty(f))}><Input label="Property name" v="property_name" f={f} setF={setF}/><Input label="Total acre" type="number" v="total_acre" f={f} setF={setF}/><Input label="Address 1" v="address_1" f={f} setF={setF}/><Input label="Address 2" v="address_2" f={f} setF={setF}/><Input label="Pincode" v="pincode" f={f} setF={setF}/></Form> }
function Badge({children}:any){return <span className="badge">{children}</span>}
function Card({label,value}:{label:string,value:any}){return <div className="card"><small>{label}</small><strong>{value}</strong></div>}

function maxFromFor(to:string){ const d=new Date((to || today)+'T00:00:00'); d.setFullYear(d.getFullYear()-1); return d.toISOString().slice(0,10); }
function RangeControls({prefix,label}:any){
  const dispatch=useAppDispatch();
  const {dashboardRanges}=useAppSelector(s=>s.app);
  const fromKey=`${prefix}From`, toKey=`${prefix}To`;
  const currentTo=dashboardRanges[toKey] || today;
  const currentFrom=dashboardRanges[fromKey] || maxFromFor(currentTo);
  const apply=(next:any)=>{ dispatch(setDashboardRanges(next)); dispatch(loadDashboard(next)); };
  return <div className="rangeControls"><strong>{label}</strong><label>From<input type="date" value={currentFrom} max={currentTo} onChange={e=>apply({[fromKey]:e.target.value})}/></label><label>To<input type="date" value={currentTo} min={maxFromFor(currentTo)} max={today} onChange={e=>apply({[toKey]:e.target.value,[fromKey]: currentFrom < maxFromFor(e.target.value) ? maxFromFor(e.target.value) : currentFrom})}/></label><small>Max range: 1 year</small></div>
}
function StatPanel({prefix,label,value,sub}:any){return <div className="card statPanel"><RangeControls prefix={prefix} label={label}/><strong>{value}</strong>{sub&&<small>{sub}</small>}</div>}
function Dashboard({data}:{data:any}){
  if(!data) return <p>Loading dashboard…</p>;
  return <>
    <section className="grid">
      <StatPanel prefix="attendance" label="Labor days" value={data.attendance.labor_days} sub={`Entries: ${data.attendance.entries}`}/>
      <StatPanel prefix="attendance" label="Labor cost" value={`₹${Number(data.laborCost.total).toFixed(2)}`} />
      <StatPanel prefix="rainfall" label="Rainfall total" value={`${data.rainfall.total} mm`} sub={`Entries: ${data.rainfall.entries}`}/>
      <StatPanel prefix="yield" label="Yield value" value={`₹${Number(data.yieldTotal.value).toFixed(2)}`} sub={`Qty: ${data.yieldTotal.quantity}`}/>
      <StatPanel prefix="expenses" label="Expenses" value={`₹${Number(data.expenses.total).toFixed(2)}`} />
      <StatPanel prefix="income" label="Income" value={`₹${Number(data.income.total).toFixed(2)}`} />
      <StatPanel prefix="assets" label="Assets" value={`₹${Number(data.assets.value).toFixed(2)}`} />
      <StatPanel prefix="profit" label="Profit estimate" value={`₹${Number(data.profit).toFixed(2)}`} />
      <StatPanel prefix="plants" label="Total plants" value={Number(data.plantInventorySummary?.total_plants || 0).toLocaleString()} sub={`Entries: ${data.plantInventorySummary?.entries || 0}`}/>
    </section>
    <section className="grid two"><ChartPanel title="Plant distribution by block" rows={data.plantByBlock || []}/><ChartPanel title="Plant distribution by type" rows={data.plantByType || []}/></section>
    <section className="panel"><h2>Plants by block / sub-block</h2><Table rows={data.plantBySubBlock || []}/></section>
    <section className="panel"><RangeControls prefix="recent" label="Recent attendance range"/><Table rows={data.recentAttendance}/></section>
    <section className="panel"><RangeControls prefix="rainfall" label="Rain by block range"/><Table rows={data.rainByBlock}/></section>
    <section className="panel"><RangeControls prefix="profit" label="Income / expense range"/><Table rows={data.propertyProfit}/></section>
  </>
}
function firstId(items:any[], id:string){ return items?.[0]?.[id] ? String(items[0][id]) : ''; }
function Attendance({meta,rows,submit}:any){const [f,setF]=useState({labor_id:firstId(meta?.labors,'labor_id'),entry_date:today,attendance_value:'1',created_by:'Admin'});useEffect(()=>setF((x:any)=>({...x,labor_id:x.labor_id||firstId(meta?.labors,'labor_id')})),[meta]);return <><Form title="Add attendance" onSubmit={()=>submit(f)}><Select label="Labor" v="labor_id" f={f} setF={setF} opts={meta?.labors} id="labor_id" name="labor_name"/><Input label="Date" type="date" v="entry_date" f={f} setF={setF}/><Input label="Value" type="number" step="0.25" v="attendance_value" f={f} setF={setF}/></Form><Table rows={rows}/></>}
function Rainfall({meta,rows,submit}:any){const [f,setF]=useState({block_id:firstId(meta?.blocks,'block_id'),recorded_date:today,rain_value:'0',created_by:'Admin'});useEffect(()=>setF((x:any)=>({...x,block_id:x.block_id||firstId(meta?.blocks,'block_id')})),[meta]);return <><Form title="Add rainfall" onSubmit={()=>submit(f)}><Select label="Block from selected property" v="block_id" f={f} setF={setF} opts={meta?.blocks} id="block_id" name="block_name"/><Input label="Date" type="date" v="recorded_date" f={f} setF={setF}/><Input label="Rain mm" type="number" step="0.1" v="rain_value" f={f} setF={setF}/></Form><Table rows={rows}/></>}
function Yield({meta,rows,submit}:any){const [f,setF]=useState({yieldrate_id:firstId(meta?.yieldRates,'yieldrate_id'),picking_date:today,quantity:'0',created_by:'Admin'});useEffect(()=>setF((x:any)=>({...x,yieldrate_id:x.yieldrate_id||firstId(meta?.yieldRates,'yieldrate_id')})),[meta]);return <><Form title="Add yield settlement" onSubmit={()=>submit(f)}><Select label="Yield rate from selected property" v="yieldrate_id" f={f} setF={setF} opts={meta?.yieldRates} id="yieldrate_id" name="season"/><Input label="Picking date" type="date" v="picking_date" f={f} setF={setF}/><Input label="Quantity" type="number" step="0.1" v="quantity" f={f} setF={setF}/></Form><Table rows={rows}/></>}
function GroupScreen({group,meta,resources,save,remove}:any){ const [active,setActive]=useState(group[0]); useEffect(()=>setActive(group[0]),[group.join('|')]); return <><div className="tabs">{group.map((r:string)=><button key={r} className={active===r?'activeTab':''} onClick={()=>setActive(r)}>{labels[r]}</button>)}</div><Crud resource={active} meta={meta} rows={resources[active]||[]} save={save} remove={remove}/></> }
function Crud({resource,meta,rows,save,remove}:any){ const [f,setF]=useState(emptyFor(resource)); useEffect(()=>setF(emptyFor(resource)),[resource]); const fields = (fieldConfig[resource] || []).filter((x:any)=> !(x[0]==='property_id' && resource !== 'properties')); const idKey = rows?.[0] ? Object.keys(rows[0]).find(k=>k.endsWith('_id')) : (fieldConfig[resource]?.find((x:any)=>String(x[0]).endsWith('_id'))?.[0] || 'id'); return <><Form title={`${f[idKey]?'Edit':'Add'} ${labels[resource]}`} onSubmit={()=>{save(resource,f); setF(emptyFor(resource));}}>{fields.filter((x:any)=>x[1]!== 'hidden').map((x:any)=> x[1]==='select' ? <Select key={x[0]} label={x[2]} v={x[0]} f={f} setF={setF} opts={meta?.[x[3]] || []} id={x[4]} name={x[5]} allowEmpty={x[6]}/> : <Input key={x[0]} label={x[2]} type={x[1]} step="0.01" v={x[0]} f={f} setF={setF}/>) }{f[idKey]&&<button type="button" className="secondary" onClick={()=>setF(emptyFor(resource))}>Cancel edit</button>}</Form><Table rows={rows} onEdit={idKey ? (r:any)=>setF({...emptyFor(resource),...r}) : undefined} onDelete={idKey ? (r:any)=>remove(resource,r[idKey]) : undefined}/></> }

function ChartPanel({title,rows=[]}:any){
  const total = rows.reduce((a:number,r:any)=>a+Number(r.value||0),0);
  let acc = 0;
  const colors = ['#2f855a','#68d391','#9ae6b4','#276749','#c6f6d5','#22543d','#48bb78'];
  const gradient = total ? rows.map((r:any,i:number)=>{ const start=acc/total*100; acc += Number(r.value||0); const end=acc/total*100; return `${colors[i%colors.length]} ${start}% ${end}%`; }).join(', ') : '#e2e8f0 0 100%';
  return <div className="panel"><h2>{title}</h2><div className="chartRow"><div className="pie" style={{background:`conic-gradient(${gradient})`}}></div><div className="legend">{rows.length?rows.map((r:any,i:number)=><div key={i}><span className="dot" style={{background:colors[i%colors.length]}}></span>{r.name}: <b>{Number(r.value||0).toLocaleString()}</b></div>):<p>No plant data yet.</p>}</div></div></div>
}

function Images(){return <div className="panel"><h2>Estate image location</h2><p>Add optimized/imported estate photos here:</p><code>client/src/assets/estate-images/</code><p>Add directly served image files here:</p><code>client/public/estate-images/</code><p>Suggested names: estate-hero.jpg, block-a.jpg, block-b.jpg, rainfall-station.jpg, coffee-yield.jpg.</p></div>}
function Form({title,children,onSubmit}:any){return <form className="form" onSubmit={e=>{e.preventDefault();onSubmit();}}><h2>{title}</h2><div className="fields">{children}<button>Save</button></div></form>}
function Input({label,v,f,setF,...props}:any){return <label>{label}<input {...props} value={f[v] ?? ''} onChange={e=>setF({...f,[v]:e.target.value})}/></label>}
function Select({label,v,f,setF,opts=[],id,name,allowEmpty}:any){return <label>{label}<select value={f[v] ?? ''} onChange={e=>setF({...f,[v]:e.target.value})}>{allowEmpty&&<option value="">None</option>}{opts?.map((o:any)=><option key={o[id]} value={o[id]}>{o[name] || o[id]}</option>)}</select></label>}
function Table({rows=[],onDelete,onEdit}:any){ const visibleRows = useMemo(()=>rows || [],[rows]); if(!visibleRows?.length) return <p className="empty">No data yet.</p>; const keys=Object.keys(visibleRows[0]).filter(k=>!String(k).includes('password') && !String(k).includes('photo')); return <div className="table"><table><thead><tr>{keys.map(k=><th key={k}>{k.replace(/_/g,' ')}</th>)}{(onEdit||onDelete)&&<th>Action</th>}</tr></thead><tbody>{visibleRows.map((r:any,i:number)=><tr key={i}>{keys.map(k=><td key={k}>{String(r[k] ?? '')}</td>)}{(onEdit||onDelete)&&<td>{onEdit&&<button className="secondary" onClick={()=>onEdit(r)}>Edit</button>} {onDelete&&<button className="danger" onClick={()=>onDelete(r)}>Delete</button>}</td>}</tr>)}</tbody></table></div>}
createRoot(document.getElementById('root')!).render(<Provider store={store}><App/></Provider>);
