import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { createAttendance, createRainfall, createYield, deleteResource, loadAttendance, loadDashboard, loadMeta, loadRainfall, loadResource, loadYield, saveResource, login, logout, setSelectedPropertyId, registerProperty, setDashboardRanges } from './features/appSlice';
import './styles.css';

const today = new Date().toISOString().slice(0,10);
const nav = [
  ['Dashboard','dashboard'], ['Attendance','attendance'], ['Rainfall','rainfall'], ['Yield Entry','yield'],
  ['Estate Setup','setup'], ['People & Vendors','people'], ['Labor Money','laborMoney'], ['Crop & Market','crop'], ['Expenses & Income','finance'], ['Inventory','inventory'], ['Reports','reports'], ['Images','images']
];
const groups: Record<string, string[]> = {
  setup: ['properties','blocks','plants','baseUnits'],
  people: ['labors','vendors','laborVendors'],
  laborMoney: ['wages','wageSettlements','vendorSettlements'],
  crop: ['yieldTypes','yieldRates','cropDetails','fertilizers'],
  finance: ['expenseTypes','expenses','cropIncome'],
  inventory: ['assets'],
  reports: ['reports']
};
const labels: Record<string,string> = {
  properties:'Properties', blocks:'Blocks', labors:'Employees / Labors', vendors:'Vendors', laborVendors:'Labor Vendor Mapping', vendorSettlements:'Labor Vendor Settlement', wages:'Labor Wage Settings', wageSettlements:'Running Wage Settlement', plants:'Plant Details', yieldTypes:'Yield Types', yieldRates:'Yield Rates / Market Price', assets:'Inventory / Assets', expenseTypes:'Expense Types', expenses:'Running Expenses', cropDetails:'Crop Details', cropIncome:'Income / Revenue', fertilizers:'Fertilizers', reports:'Manual Reports', baseUnits:'Base Units'
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
function isViewer(user:any){ return ['guest','viewer','read_only'].includes(String(user?.role || '').toLowerCase()); }

function App(){
  const dispatch = useAppDispatch();
  const {user,selectedPropertyId,meta,dashboard,attendance,rainfall,yields,error,status,resources}=useAppSelector(s=>s.app);
  const [tab,setTab]=useState('dashboard');
  const selectedProperty = meta?.properties?.find((p:any)=>String(p.property_id)===String(selectedPropertyId));
  useEffect(()=>{ if(user && !isViewer(user)){ dispatch(loadMeta()); } },[dispatch,user,selectedPropertyId]);
  useEffect(()=>{ if(user && !isViewer(user) && selectedPropertyId){ dispatch(loadDashboard()); dispatch(loadAttendance()); dispatch(loadRainfall()); dispatch(loadYield()); } },[dispatch,user,selectedPropertyId]);
  useEffect(()=>{ if(user && !isViewer(user) && selectedPropertyId) (groups[tab]||[]).forEach(r=>dispatch(loadResource(r))); },[tab,dispatch,user,selectedPropertyId]);
  if(!user) return <ProviderShell><Login/></ProviderShell>;
  if(isViewer(user)) return <GuestPortal/>;
  if(!meta) return <ProviderShell><p>Loading owner data…</p>{error&&<div className="error">{error}</div>}</ProviderShell>;
  const hasProperties = meta?.properties?.length > 0;
  return <div className="app"><aside><div className="brandBlock"><div className="brand">☕ Estate App</div><p>Malnad coffee estate records, rainfall, yield and labour insights for each property.</p></div><nav className="sideNav">{nav.map(([name,key])=><button className={tab===key?'active':''} onClick={()=>setTab(key)} key={key}>{name}</button>)}<button className="danger" onClick={()=>dispatch(logout())}>Logout</button></nav></aside><main><header><div><h1>{nav.find(x=>x[1]===tab)?.[0]}</h1><span>{status==='loading'?'Saving / loading…': selectedProperty ? `Working property: ${selectedProperty.property_name}` : 'No property selected'}</span></div><div className="topControls"><PropertySelector meta={meta}/><Badge>{user.username}</Badge></div></header>{error&&<div className="error">{error}</div>}{!hasProperties ? <RegisterProperty/> : !selectedPropertyId ? <div className="panel"><h2>Select a property</h2><p>Choose a property from the top dropdown to continue.</p></div> : <>{tab==='dashboard'&&<Dashboard data={dashboard}/>} {tab==='attendance'&&<Attendance meta={meta} rows={attendance} submit={(p:any)=>dispatch(createAttendance({...p,property_id:selectedPropertyId,user_id:user.user_id,created_by:user.username}))}/>} {tab==='rainfall'&&<Rainfall meta={meta} rows={rainfall} submit={(p:any)=>dispatch(createRainfall({...p,created_by:user.username}))}/>} {tab==='yield'&&<Yield meta={meta} rows={yields} submit={(p:any)=>dispatch(createYield({...p,created_by:user.username}))}/>} {groups[tab]&&<GroupScreen group={groups[tab]} meta={meta} resources={resources} save={(r:string,p:any)=>dispatch(saveResource({resource:r,payload:{...p,property_id:p.property_id || selectedPropertyId,created_by:user.username,user_id:p.user_id || user.user_id}}))} remove={(r:string,id:any)=>dispatch(deleteResource({resource:r,id}))}/>} {tab==='images'&&<Images/>}</>}</main></div>
}
function ProviderShell({children}:any){return <div className="loginWrap"><div className="loginCard">{children}</div></div>}
function Login(){ const dispatch=useAppDispatch(); const {status,error}=useAppSelector(s=>s.app); const [f,setF]=useState({username:'Asnika Sridhar',password:'owner123'}); return <form onSubmit={e=>{e.preventDefault();dispatch(login(f));}}><div className="loginHero"><span>☕</span><div><h1>Coffee Estate Login</h1><p>Owners can manage full estate data. Guest Viewer shows only a safe public snapshot.</p></div></div><div className="hint"><b>Owner:</b> Asnika Sridhar / owner123<br/><b>Guest:</b> guest / guest123</div>{error&&<div className="error">{error}</div>}<label>Username or email<input value={f.username} onChange={e=>setF({...f,username:e.target.value})}/></label><label>Password<input type="password" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></label><button>{status==='loading'?'Logging in…':'Login'}</button></form> }
function GuestPortal(){ const dispatch=useAppDispatch(); const {user}=useAppSelector(s=>s.app); const [data,setData]=useState<any>(null); const [err,setErr]=useState(''); useEffect(()=>{fetch('/api/guest/summary').then(async r=>{const t=await r.text(); if(!r.ok) throw new Error(t); return JSON.parse(t)}).then(setData).catch(e=>setErr(e.message));},[]); return <div className="guestPage"><div className="guestHero"><div><Badge>{user?.username}</Badge><h1>Coffee Estate Public View</h1><p>A minimal read-only summary for guests. Private owner, wage, vendor, employee and expense details are hidden.</p></div><button onClick={()=>dispatch(logout())}>Logout</button></div>{err&&<div className="error">{err}</div>}{!data?<p>Loading guest summary…</p>:<><section className="grid guestGrid"><Card label="Properties" value={data.propertyCount?.total_properties || 0}/><Card label="Total acres" value={data.propertyCount?.total_acres || 0}/><Card label="Rainfall records" value={data.rainfall?.entries || 0}/><Card label="Yield entries" value={data.yieldTotal?.entries || 0}/></section><section className="panel"><h2>Estate snapshot</h2><MiniBars rows={(data.properties||[]).map((p:any)=>({label:p.property_name,value:Number(p.total_acre||0)}))} suffix=" acres"/><p className="muted">This view is deliberately limited for external sharing.</p></section></>}</div> }
function PropertySelector({meta}:any){ const dispatch=useAppDispatch(); const {selectedPropertyId}=useAppSelector(s=>s.app); const properties=meta?.properties || []; if(!properties.length) return null; return <label className="propertySelect">Property<select value={selectedPropertyId} onChange={e=>{dispatch(setSelectedPropertyId(e.target.value)); setTimeout(()=>{dispatch(loadMeta()); dispatch(loadDashboard()); dispatch(loadAttendance()); dispatch(loadRainfall()); dispatch(loadYield());},0)}}>{properties.map((p:any)=><option key={p.property_id} value={p.property_id}>{p.property_name}</option>)}</select></label> }
function RegisterProperty(){ const dispatch=useAppDispatch(); const [f,setF]=useState({property_name:'',total_acre:'0',address_1:'',address_2:'',pincode:''}); return <Form title="Register your first property" onSubmit={()=>dispatch(registerProperty(f))}><Input label="Property name" v="property_name" f={f} setF={setF}/><Input label="Total acre" type="number" v="total_acre" f={f} setF={setF}/><Input label="Address 1" v="address_1" f={f} setF={setF}/><Input label="Address 2" v="address_2" f={f} setF={setF}/><Input label="Pincode" v="pincode" f={f} setF={setF}/></Form> }
function Badge({children}:any){return <span className="badge">{children}</span>}
function Card({label,value}:{label:string,value:any}){return <div className="card" title={`${label}: ${value}`}><small>{label}</small><strong>{value}</strong></div>}

function maxFromFor(to:string){ const d=new Date((to || today)+'T00:00:00'); d.setFullYear(d.getFullYear()-1); return d.toISOString().slice(0,10); }
function RangeControls({prefix,label}:any){
  const dispatch=useAppDispatch();
  const {dashboardRanges}=useAppSelector(s=>s.app);
  const fromKey=`${prefix}From`, toKey=`${prefix}To`;
  const currentTo=dashboardRanges[toKey] || today;
  const currentFrom=dashboardRanges[fromKey] || maxFromFor(currentTo);
  const apply=(next:any)=>{ dispatch(setDashboardRanges(next)); dispatch(loadDashboard(next)); };
  return <div className="rangeControls"><strong title="Each card can have its own date range. Range is capped to one year.">{label}</strong><label>From<input type="date" value={currentFrom} max={currentTo} onChange={e=>apply({[fromKey]:e.target.value})}/></label><label>To<input type="date" value={currentTo} min={maxFromFor(currentTo)} max={today} onChange={e=>apply({[toKey]:e.target.value,[fromKey]: currentFrom < maxFromFor(e.target.value) ? maxFromFor(e.target.value) : currentFrom})}/></label><small>Max range: 1 year</small></div>
}
function InfoTip({text}:{text:string}){return <span className="infoTip" tabIndex={0} aria-label={text} data-tip={text}>i</span>}
function StatPanel({prefix,label,value,sub,tip}:any){return <div className="card statPanel"><div className="statTop"><RangeControls prefix={prefix} label={label}/><InfoTip text={tip || label}/></div><strong>{value}</strong>{sub&&<small>{sub}</small>}</div>}
function MiniBars({rows=[],suffix=''}:any){ const max = Math.max(1, ...rows.map((r:any)=>Math.abs(Number(r.value||0)))); return <div className="miniBars">{rows.map((r:any,i:number)=><div className="barRow" key={i} title={`${r.label}: ${r.value}${suffix}`}><span>{r.label}</span><div><i style={{width:`${Math.max(4,(Math.abs(Number(r.value||0))/max)*100)}%`}}/></div><b>{r.value}{suffix}</b></div>)}</div> }
function LineChart({rows=[]}:{rows:any[]}){ const vals=rows.map(r=>Number(r.value||0)); const max=Math.max(1,...vals); const pts=rows.map((r,i)=>{ const x=rows.length===1?50:(i/(rows.length-1))*100; const y=100-(Number(r.value||0)/max)*84-8; return `${x},${y}`;}).join(' '); return <div className="chartBox"><svg viewBox="0 0 100 108" preserveAspectRatio="none"><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><line x1="0" y1="100" x2="100" y2="100" stroke="#d7ccb5" strokeWidth="1"/></svg><div className="chartLabels">{rows.map((r,i)=><span key={i}>{r.label}</span>)}</div></div>}
function ChartPanel({title,tip,children}:any){return <section className="panel chartPanel"><div className="panelTitle"><h2>{title}</h2><InfoTip text={tip}/></div>{children}</section>}
function Dashboard({data}:{data:any}){
  if(!data) return <p>Loading dashboard…</p>;
  const income = Number(data.income?.total || 0);
  const expenses = Number(data.expenses?.total || 0);
  const laborCost = Number(data.laborCost?.total || 0);
  const profit = Number(data.profit?.total ?? data.profit ?? (income - expenses));
  const chartRows = [
    {label:'Income', value: income},
    {label:'Expenses', value: expenses},
    {label:'Labor', value: laborCost},
    {label:'Profit', value: profit}
  ];
  const rainfallTrend = (data.rainByBlock || []).slice(0,6).map((r:any)=>({label:r.block_name || r.property_name || 'Block', value:Number(r.total_rain || r.total || 0)}));
  const attendanceTrend = (data.recentAttendance || []).slice().reverse().map((r:any)=>({label:String(r.entry_date || '').slice(5), value:Number(r.attendance_value || 0)}));
  return <>
    <section className="heroPanel"><div><span className="eyebrow">Malnad estate command centre</span><h2>Estate health overview</h2><p>Shade-grown coffee operations across rainfall, labour, yield and finances. Use the date controls on each card for focused, property-wise review.</p></div><img src="/estate-images/estate-hero.svg" alt="Coffee estate illustration"/></section>
    <section className="grid">
      <StatPanel prefix="attendance" label="Labor days" value={data.attendance?.labor_days || 0} sub={`Entries: ${data.attendance?.entries || 0}`} tip="Total attendance value in the selected range. Change dates inside this card."/>
      <StatPanel prefix="attendance" label="Labor cost" value={`₹${laborCost.toFixed(2)}`} tip="Attendance multiplied by configured fixed and variable wage."/>
      <StatPanel prefix="rainfall" label="Rainfall total" value={`${data.rainfall?.total || 0} mm`} sub={`Entries: ${data.rainfall?.entries || 0}`} tip="Total rainfall recorded for blocks in the selected property."/>
      <StatPanel prefix="yield" label="Yield value" value={`₹${Number(data.yieldTotal?.value || 0).toFixed(2)}`} sub={`Qty: ${data.yieldTotal?.quantity || 0}`} tip="Estimated yield quantity multiplied by configured market rate where available."/>
      <StatPanel prefix="expenses" label="Expenses" value={`₹${expenses.toFixed(2)}`} tip="Running expenses for the property in this range." />
      <StatPanel prefix="income" label="Income" value={`₹${income.toFixed(2)}`} tip="Recorded crop income and revenue for this range." />
      <StatPanel prefix="assets" label="Assets" value={`₹${Number(data.assets?.value || 0).toFixed(2)}`} tip="Total active inventory or asset value linked to this property." />
      <StatPanel prefix="profit" label="Profit estimate" value={`₹${profit.toFixed(2)}`} tip="Income minus recorded expenses. Use as an estimate until all expenses are entered." />
    </section>
    <div className="chartGrid">
      <ChartPanel title="Financial mix" tip="Bar lengths compare income, expenses, labor cost and profit estimate. Hover rows for exact values."><MiniBars rows={chartRows} suffix=" ₹"/></ChartPanel>
      <ChartPanel title="Recent labor pattern" tip="Simple trend from the latest attendance entries."><LineChart rows={attendanceTrend.length ? attendanceTrend : [{label:'No data', value:0}]}/></ChartPanel>
      <ChartPanel title="Rain by block" tip="Compares rainfall totals across estate blocks."><MiniBars rows={rainfallTrend.length ? rainfallTrend : [{label:'No rain data', value:0}]} suffix=" mm"/></ChartPanel>
    </div>
    <section className="panel"><div className="panelTitle"><RangeControls prefix="recent" label="Recent attendance range"/><InfoTip text="Shows most recent attendance records for the chosen property."/></div><Table rows={data.recentAttendance}/></section>
    <section className="panel"><div className="panelTitle"><RangeControls prefix="rainfall" label="Rain by block range"/><InfoTip text="Block-wise rainfall is restricted to the selected property."/></div><Table rows={data.rainByBlock}/></section>
    <section className="panel"><div className="panelTitle"><RangeControls prefix="profit" label="Income / expense range"/><InfoTip text="Income and expenses used for the profit estimate."/></div><Table rows={data.propertyProfit}/></section>
  </>
}
function firstId(items:any[], id:string){ return items?.[0]?.[id] ? String(items[0][id]) : ''; }
function Attendance({meta,rows,submit}:any){const [f,setF]=useState({labor_id:firstId(meta?.labors,'labor_id'),entry_date:today,attendance_value:'1',created_by:'Admin'});useEffect(()=>setF((x:any)=>({...x,labor_id:x.labor_id||firstId(meta?.labors,'labor_id')})),[meta]);return <><Form title="Add attendance" onSubmit={()=>submit(f)}><Select label="Labor" v="labor_id" f={f} setF={setF} opts={meta?.labors} id="labor_id" name="labor_name"/><Input label="Date" type="date" v="entry_date" f={f} setF={setF}/><Input label="Value" type="number" step="0.25" v="attendance_value" f={f} setF={setF}/></Form><Table rows={rows}/></>}
function Rainfall({meta,rows,submit}:any){const [f,setF]=useState({block_id:firstId(meta?.blocks,'block_id'),recorded_date:today,rain_value:'0',created_by:'Admin'});useEffect(()=>setF((x:any)=>({...x,block_id:x.block_id||firstId(meta?.blocks,'block_id')})),[meta]);return <><Form title="Add rainfall" onSubmit={()=>submit(f)}><Select label="Block from selected property" v="block_id" f={f} setF={setF} opts={meta?.blocks} id="block_id" name="block_name"/><Input label="Date" type="date" v="recorded_date" f={f} setF={setF}/><Input label="Rain mm" type="number" step="0.1" v="rain_value" f={f} setF={setF}/></Form><Table rows={rows}/></>}
function Yield({meta,rows,submit}:any){const [f,setF]=useState({yieldrate_id:firstId(meta?.yieldRates,'yieldrate_id'),picking_date:today,quantity:'0',created_by:'Admin'});useEffect(()=>setF((x:any)=>({...x,yieldrate_id:x.yieldrate_id||firstId(meta?.yieldRates,'yieldrate_id')})),[meta]);return <><Form title="Add yield settlement" onSubmit={()=>submit(f)}><Select label="Yield rate from selected property" v="yieldrate_id" f={f} setF={setF} opts={meta?.yieldRates} id="yieldrate_id" name="season"/><Input label="Picking date" type="date" v="picking_date" f={f} setF={setF}/><Input label="Quantity" type="number" step="0.1" v="quantity" f={f} setF={setF}/></Form><Table rows={rows}/></>}
function GroupScreen({group,meta,resources,save,remove}:any){ const [active,setActive]=useState(group[0]); useEffect(()=>setActive(group[0]),[group.join('|')]); return <><div className="tabs">{group.map((r:string)=><button key={r} className={active===r?'activeTab':''} onClick={()=>setActive(r)}>{labels[r]}</button>)}</div><Crud resource={active} meta={meta} rows={resources[active]||[]} save={save} remove={remove}/></> }
function Crud({resource,meta,rows,save,remove}:any){ const [f,setF]=useState(emptyFor(resource)); useEffect(()=>setF(emptyFor(resource)),[resource]); const fields = (fieldConfig[resource] || []).filter((x:any)=> !(x[0]==='property_id' && resource !== 'properties')); const idKey = rows?.[0] ? Object.keys(rows[0]).find(k=>k.endsWith('_id')) : 'id'; return <><Form title={`Add ${labels[resource]}`} onSubmit={()=>save(resource,f)}>{fields.map((x:any)=> x[1]==='select' ? <Select key={x[0]} label={x[2]} v={x[0]} f={f} setF={setF} opts={meta?.[x[3]] || []} id={x[4]} name={x[5]} allowEmpty={x[6]}/> : <Input key={x[0]} label={x[2]} type={x[1]} step="0.01" v={x[0]} f={f} setF={setF}/>)}</Form><Table rows={rows} onDelete={idKey ? (r:any)=>remove(resource,r[idKey]) : undefined}/></> }
function Images(){return <div className="panel"><h2>Estate image location</h2><p>Placeholder images are in:</p><code>client/public/estate-images/</code><div className="imageGrid"><img src="/estate-images/estate-hero.svg"/><img src="/estate-images/rainfall.svg"/><img src="/estate-images/yield.svg"/></div><p>Replace these with actual estate images later, keeping the same names for zero code changes.</p></div>}
function Form({title,children,onSubmit}:any){return <form className="form" onSubmit={e=>{e.preventDefault();onSubmit();}}><h2>{title}</h2><div className="fields">{children}<button>Save</button></div></form>}
function Input({label,v,f,setF,...props}:any){return <label><span className="labelText">{label}<InfoTip text={`Enter ${String(label).toLowerCase()}`}/></span><input {...props} value={f[v] ?? ''} onChange={e=>setF({...f,[v]:e.target.value})}/></label>}
function Select({label,v,f,setF,opts=[],id,name,allowEmpty}:any){return <label><span className="labelText">{label}<InfoTip text={`Choose ${String(label).toLowerCase()}`}/></span><select value={f[v] ?? ''} onChange={e=>setF({...f,[v]:e.target.value})}>{allowEmpty&&<option value="">None</option>}{opts?.map((o:any)=><option key={o[id]} value={o[id]}>{o[name] || o[id]}</option>)}</select></label>}
function Table({rows=[],onDelete}:any){ const visibleRows = useMemo(()=>rows || [],[rows]); if(!visibleRows?.length) return <p className="empty">No data yet.</p>; const keys=Object.keys(visibleRows[0]).filter(k=>!String(k).includes('password') && !String(k).includes('photo') && !String(k).includes('adhar') && !String(k).includes('bank')); return <div className="table"><table><thead><tr>{keys.map(k=><th key={k}>{k.replaceAll('_',' ')}</th>)}{onDelete&&<th>Action</th>}</tr></thead><tbody>{visibleRows.map((r:any,i:number)=><tr key={i}>{keys.map(k=><td key={k} title={String(r[k] ?? '')}>{String(r[k] ?? '')}</td>)}{onDelete&&<td><button className="danger" onClick={()=>onDelete(r)}>Delete</button></td>}</tr>)}</tbody></table></div>}
createRoot(document.getElementById('root')!).render(<Provider store={store}><App/></Provider>);
