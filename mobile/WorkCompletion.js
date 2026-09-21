import React, {useEffect, useRef, useState} from 'react';
import {View,Text,TextInput,TouchableOpacity,StyleSheet,Modal,ScrollView,Keyboard} from 'react-native';
import AppIcon from './src/components/AppIcon';
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const money=n=>`₹${Number(n || 0).toLocaleString('en-IN')}`;
const empty={labours:[],setup:{activities:[],overtimeTypes:[],attended:[]}};
const opts=(rows,id,name)=>rows.map(r=>({id:r[id],name:r[name]}));
function Button({title,onPress,disabled,secondary}){return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button,secondary&&s.secondary,disabled&&{opacity:.4}]}><Text style={[s.buttonText,secondary&&{color:'#285f3b'}]}>{title}</Text></TouchableOpacity>;}
export default function WorkCompletion({propertyId,request,Choice,DateField}) {
  const [date,setDate]=useState(today()),[data,setData]=useState(empty),[drafts,setDrafts]=useState({}),[extras,setExtras]=useState({});
  const [search,setSearch]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false),[exception,setException]=useState(null);
  const generation=useRef(0),saving=useRef(false),activeContext=useRef();
  const contextKey=`${propertyId}:${date}`;activeContext.current=contextKey;
  async function load(preserve=false){
    const stamp=++generation.current;setBusy(true);
    try {const result=await request(`/api/payroll/work-completion?date=${date}`);if(stamp!==generation.current)return;
      setData(result);if(!preserve){setDrafts({});setExtras({});}
    }catch(e){if(stamp===generation.current)setError(e.message);throw e;}
    finally{if(stamp===generation.current)setBusy(false);}
  }
  useEffect(()=>{setData(empty);setDrafts({});setExtras({});setException(null);setSaved(false);setError('');load().catch(()=>{});return()=>{generation.current++;};},[date,propertyId]);
  function patch(row,change){setSaved(false);setDrafts(d=>({...d,[row.work_assignment_id]:{...(d[row.work_assignment_id] || {}),...change}}));}
  const actual=row=>Object.hasOwn(drafts[row.work_assignment_id] || {},'actual_quantity')?drafts[row.work_assignment_id].actual_quantity:row.actual_quantity;
  const labours=[...data.labours,...data.setup.attended.filter(l=>extras[l.labor_id] && !data.labours.some(x=>x.labor_id===l.labor_id)).map(l=>({...l,assignments:[],extras:[]}))];
  const completed=labours.filter(l=>l.paid || l.assignments.every(a=>actual(a)!==null && actual(a)!==undefined && actual(a)!==''));
  const dirty=Object.keys(drafts).length>0 || Object.keys(extras).length>0;
  async function save(){
    if(saving.current)return;saving.current=true;setBusy(true);setError('');setSaved(false);Keyboard.dismiss();
    try {
      const items=[];
      for(const labor of data.labours)for(const row of labor.assignments){
        const draft=drafts[row.work_assignment_id];if(!draft)continue;
        const value=actual(row);
        if(value==null || value===''){if(row.actual_quantity!=null)throw new Error('Enter an actual quantity, or 0 for no work.');continue;}
        items.push({work_assignment_id:row.work_assignment_id,assignment_key:row.assignment_key,revision:row.revision,actual_quantity:value,
          rate_override:row.rate_override,reason:row.reason,notes:row.completion_notes,...draft});
      }
      const labour_extras=Object.entries(extras).map(([id,entries])=>({labor_id:Number(id),extras:entries,input_key:labours.find(l=>l.labor_id===Number(id))?.input_key || '{}'}));
      await request('/api/payroll/work-completion',{method:'POST',body:JSON.stringify({date,items,labour_extras})});
      if(activeContext.current!==contextKey)return;
      await load();setSaved(true);
    }catch(e){if(activeContext.current===contextKey)setError(e.message);}finally{saving.current=false;if(activeContext.current===contextKey)setBusy(false);}
  }
  async function saveException(){
    if(exception.kind==='row'){
      const row=data.labours.flatMap(l=>l.assignments).find(a=>a.work_assignment_id===exception.id);
      if(exception.rate_override!=='' && !exception.reason.trim()){setError('A reason is required for a different rate.');return;}
      patch(row,{rate_override:exception.rate_override===''?null:exception.rate_override,reason:exception.reason,notes:exception.notes});setException(null);return;
    }
    if(!exception.labor_id){setError('Select a labourer');return;}
    if(exception.kind==='ot'){
      if(!exception.overtime_type_id || exception.quantity==='' || !Number.isFinite(Number(exception.quantity)) || Number(exception.quantity)<0){setError('Select an OT type and enter its quantity.');return;}
      const id=Number(exception.labor_id),current=extras[id] || labours.find(l=>l.labor_id===id)?.extras || [];
      const updated=[...current.filter(e=>String(e.overtime_type_id)!==String(exception.overtime_type_id)),{overtime_type_id:Number(exception.overtime_type_id),quantity:exception.quantity}];
      setExtras(e=>({...e,[id]:updated}));setSaved(false);setException(null);return;
    }
    if(!exception.work_activity_id){setError('Select extra work');return;}
    if(saving.current)return;saving.current=true;setBusy(true);
    try{await request('/api/payroll/completion-extra-work',{method:'POST',body:JSON.stringify({date,labor_id:exception.labor_id,work_activity_id:exception.work_activity_id})});if(activeContext.current!==contextKey)return;await load(true);setException(null);setSaved(false);}
    catch(e){setError(e.message);}finally{saving.current=false;setBusy(false);}
  }
  const showException=value=>{setError('');setException(value);};
  return <View>
    <Text style={s.title}>Work Completion</Text>
    <DateField label="Completion date" value={date} onChange={setDate}/>
    <Text style={s.hint}>Enter actual work completed. Tap All to use the assigned quantity.</Text>
    <TextInput accessibilityLabel="Search labour" placeholder="Search labour (optional)" value={search} onChangeText={setSearch} style={s.search}/>
    <View style={s.summary}>{[[labours.length,'Labourers'],[completed.length,'Completed'],[labours.length-completed.length,'Pending']].map(([n,label])=><View key={label} style={s.metric}><Text style={s.number}>{n}</Text><Text style={s.small}>{label}</Text></View>)}</View>
    {error?<Text accessibilityRole="alert" style={s.error}>{error}</Text>:null}
    {saved?<Text style={s.success}>Work completion saved.</Text>:null}
    {busy?<Text style={s.small}>Loading…</Text>:null}
    <View style={s.columns}><Text style={[s.columnLabel,{flex:1}]}>Labour / Assigned work</Text><Text style={s.columnLabel}>Completed</Text></View>
    {!labours.length&&!busy?<Text style={s.hint}>No assigned work for this date.</Text>:null}
    {labours.filter(l=>`${l.name} LT${String(l.labor_id).padStart(3,'0')}`.toLowerCase().includes(search.toLowerCase())).map(l=><View key={l.labor_id} style={s.labour}>
      <View style={s.labourHeader}><View style={s.avatar}><Text style={s.initial}>{l.name.slice(0,1)}</Text></View><View style={{flex:1}}><Text style={s.name}>{l.name}</Text><Text style={s.small}>LT{String(l.labor_id).padStart(3,'0')}</Text></View>{l.paid?<Text style={s.success}>Paid</Text>:<TouchableOpacity accessibilityLabel={`Extra work for ${l.name}`} onPress={()=>showException({kind:'work',labor_id:l.labor_id,work_activity_id:''})}><AppIcon name="add" size={20}/></TouchableOpacity>}</View>
      {l.assignments.map(row=><View key={row.work_assignment_id} style={s.workRow}><View style={{flex:1,paddingRight:8}}><Text style={s.work}>{row.work_activity_name}</Text>{row.block_name?<Text style={s.small}>{row.block_name}</Text>:null}{row.assigned_quantity!=null&&!row.fixed?<Text style={s.small}>Assigned: {row.assigned_quantity} {row.unit}</Text>:null}</View>
        {l.paid?<Text style={s.readonly}>{row.fixed?(row.actual_quantity?'Done':'No work'):`${row.actual_quantity ?? '—'} ${row.unit}`}</Text>:<>
          {row.fixed?<TouchableOpacity accessibilityRole="checkbox" accessibilityLabel={`Done ${l.name} ${row.work_activity_name}`} accessibilityState={{checked:Number(actual(row))===1}} style={s.all} onPress={()=>patch(row,{actual_quantity:Number(actual(row))===1?0:1})}><Text style={s.green}>{actual(row)==null?'Done':Number(actual(row))===1?'✓ Done':'No work'}</Text></TouchableOpacity>:<><TextInput accessibilityLabel={`Actual ${l.name} ${row.work_activity_name} ${row.work_assignment_id}`} editable={!busy} value={actual(row)==null?'':String(actual(row))} placeholder="—" keyboardType="decimal-pad" style={s.quantity} onChangeText={v=>patch(row,{actual_quantity:v})}/><Text style={s.unit}>{row.unit}</Text>{row.assigned_quantity!=null?<TouchableOpacity accessibilityLabel={`All ${l.name} ${row.work_activity_name}`} style={s.all} onPress={()=>patch(row,{actual_quantity:row.assigned_quantity})}><Text style={s.green}>All</Text></TouchableOpacity>:null}</>}
          <TouchableOpacity accessibilityLabel={`Work exception ${l.name} ${row.work_activity_name}`} style={s.more} onPress={()=>showException({kind:'row',id:row.work_assignment_id,rate_override:drafts[row.work_assignment_id]?.rate_override??row.rate_override??'',reason:drafts[row.work_assignment_id]?.reason??row.reason??'',notes:drafts[row.work_assignment_id]?.notes??row.completion_notes??'',rate:row.rate,unit:row.rate_unit})}><AppIcon name="edit" size={16}/></TouchableOpacity>
        </>}
      </View>)}
      {(extras[l.labor_id] || l.extras || []).map(e=>{const type=data.setup.overtimeTypes.find(t=>t.overtime_type_id===Number(e.overtime_type_id));return <View key={e.overtime_type_id} style={s.workRow}><Text style={{flex:1}}>{type?.name || 'OT / Extra'}</Text><Text>{e.quantity} {type?.unit}</Text>{!l.paid?<TouchableOpacity accessibilityLabel={`Remove ${type?.name} for ${l.name}`} style={s.more} onPress={()=>{setExtras(x=>({...x,[l.labor_id]:(x[l.labor_id] || l.extras).filter(t=>t.overtime_type_id!==e.overtime_type_id)}));setSaved(false);}}><Text>×</Text></TouchableOpacity>:null}</View>;})}
    </View>)}
    <Button title="+ Add OT / Extra" secondary disabled={busy} onPress={()=>showException({kind:'ot',labor_id:'',overtime_type_id:'',quantity:''})}/>
    <Button title="Save Work Completion" disabled={busy||!dirty} onPress={save}/>
    <Modal visible={!!exception} transparent animationType="fade" onRequestClose={()=>setException(null)}><View style={s.shade}><ScrollView keyboardShouldPersistTaps="handled" style={s.dialog} contentContainerStyle={{padding:18}}>
      <Text style={s.title}>{exception?.kind==='row'?'Work Exception':exception?.kind==='work'?'Add Extra Work':'Add OT / Extra'}</Text>
      {exception?.kind==='row'?<><Text style={s.small}>Configured rate: {money(exception.rate)} / {exception.unit}</Text><Text>Different rate (optional)</Text><TextInput accessibilityLabel="Different work rate" keyboardType="decimal-pad" style={s.search} value={String(exception.rate_override)} onChangeText={v=>setException(e=>({...e,rate_override:v}))}/><Text>Reason</Text><TextInput accessibilityLabel="Work exception reason" style={s.search} value={exception.reason} onChangeText={v=>setException(e=>({...e,reason:v}))}/><Text>Note</Text><TextInput accessibilityLabel="Work exception note" style={s.search} value={exception.notes} onChangeText={v=>setException(e=>({...e,notes:v}))}/></>:exception?<>
        {exception.kind==='work'?<Text style={s.name}>{labours.find(l=>l.labor_id===Number(exception.labor_id))?.name}</Text>:<Choice label="Labour" options={opts(data.setup.attended,'labor_id','name')} value={exception.labor_id} onChange={v=>setException(e=>({...e,labor_id:v}))}/>}
        {exception.kind==='work'?<Choice label="Extra work" options={opts(data.setup.activities,'work_activity_id','work_activity_name')} value={exception.work_activity_id} onChange={v=>setException(e=>({...e,work_activity_id:v}))}/>:<><Choice label="OT / Extra type" options={opts(data.setup.overtimeTypes,'overtime_type_id','name')} value={exception.overtime_type_id} onChange={v=>setException(e=>({...e,overtime_type_id:v}))}/><TextInput accessibilityLabel="OT quantity" style={s.search} keyboardType="decimal-pad" value={exception.quantity} onChangeText={v=>setException(e=>({...e,quantity:v}))}/><Text>{data.setup.overtimeTypes.find(t=>String(t.overtime_type_id)===String(exception.overtime_type_id))?.unit}</Text></>}
      </>:null}
      {error?<Text style={s.error}>{error}</Text>:null}
      <Button title={exception?.kind==='work'?'Add to completion list':'Apply exception'} disabled={busy} onPress={saveException}/><Button title="Cancel" secondary onPress={()=>{setException(null);setError('');}}/>
    </ScrollView></View></Modal>
  </View>;
}
const s=StyleSheet.create({title:{fontSize:22,fontWeight:'800',color:'#31251b',marginBottom:14},hint:{fontSize:12,color:'#52635a',marginBottom:12},search:{borderWidth:1,borderColor:'#ddd',backgroundColor:'white',borderRadius:7,padding:10,marginVertical:10,color:'#302820'},summary:{flexDirection:'row',backgroundColor:'#eff8f0',borderRadius:8,marginBottom:12,paddingVertical:12},metric:{flex:1,alignItems:'center'},number:{fontSize:20,fontWeight:'800',color:'#086039'},small:{fontSize:11,color:'#63706b',marginTop:3},columns:{flexDirection:'row',padding:10,backgroundColor:'#f3f3f1'},columnLabel:{fontSize:12,fontWeight:'700'},labour:{backgroundColor:'white',borderBottomWidth:1,borderColor:'#e9e9e4',paddingVertical:10},labourHeader:{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:8},avatar:{width:30,height:30,borderRadius:15,backgroundColor:'#f4e6d8',alignItems:'center',justifyContent:'center'},initial:{fontWeight:'800',color:'#75472e'},name:{fontWeight:'700',fontSize:13,color:'#282b27'},workRow:{flexDirection:'row',alignItems:'center',paddingVertical:10,paddingLeft:8},work:{fontSize:12,color:'#303a33'},quantity:{borderWidth:1,borderColor:'#d8dfdf',borderRadius:6,width:54,minHeight:42,textAlign:'center',color:'#243f34',backgroundColor:'#fff'},unit:{fontSize:11,color:'#52645c',maxWidth:44,marginHorizontal:4},all:{backgroundColor:'#e5faec',borderRadius:6,paddingHorizontal:8,paddingVertical:12},green:{fontSize:12,color:'#087044',fontWeight:'600'},more:{padding:10},readonly:{fontSize:12,color:'#326d43'},button:{backgroundColor:'#60432e',padding:14,borderRadius:7,alignItems:'center',marginTop:12},secondary:{backgroundColor:'#edfaf0'},buttonText:{color:'white',fontWeight:'700'},error:{color:'#a02b22',paddingVertical:8},success:{color:'#0a7845',paddingVertical:6,fontSize:12},shade:{flex:1,backgroundColor:'#0007',justifyContent:'center',padding:18},dialog:{flexGrow:0,maxHeight:'85%',backgroundColor:'white',borderRadius:12}});
