import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const today = new Date().toISOString().slice(0, 10);
const GREEN = '#0b7a2a';
const DARK = '#14361f';
const SOFT = '#f7f4ec';
const LINE = '#e3ddcf';

const moduleGroups = [
  { key: 'estate', title: 'Estate Setup', icon: '🏡', items: ['properties','blocks','baseUnits','assets'] },
  { key: 'plants', title: 'Plant & Crop', icon: '🌱', items: ['plants','plantInventory','yieldTypes','yieldRates','cropDetails','cropIncome','fertilizers'] },
  { key: 'workforce', title: 'Workforce', icon: '👥', items: ['labors','vendors','laborVendors','wages','wageSettlements','vendorSettlements'] },
  { key: 'daily', title: 'Daily Entry', icon: '📝', items: ['attendanceQuick','rainfallQuick','yieldQuick','expenses','workActivities','workAssignments'] },
  { key: 'reports', title: 'Reports', icon: '📊', items: ['reports','dashboardReport','notifications','settings'] }
];

const labels = {
  properties:'Property Management', blocks:'Blocks & Sub Blocks', baseUnits:'Base Units Configuration', assets:'Assets / Inventory',
  plants:'Plant Master', plantInventory:'Plant Inventory', yieldTypes:'Yield Types', yieldRates:'Yield Rates / Price', cropDetails:'Crop Details', cropIncome:'Income / Revenue', fertilizers:'Fertilizer Log',
  labors:'Labour Master', vendors:'Vendor Registration', laborVendors:'Vendor Labour & Commission', wages:'Wage Configuration', wageSettlements:'Wage Sheet / Settlement', vendorSettlements:'Vendor Settlement',
  attendanceQuick:'Attendance', rainfallQuick:'Rain Entry', yieldQuick:'Harvest / Yield Entry', expenses:'Expense Entry', workActivities:'Work Activity Master', workAssignments:'Work Assignment',
  reports:'Manual Reports', dashboardReport:'Dashboard Reports', notifications:'Notifications', settings:'Settings'
};

const resourceOf = { attendanceQuick: 'attendance', rainfallQuick: 'rainfall', yieldQuick: 'yield' };

const fieldConfig = {
  properties:[['property_name','text','Property Name'],['total_acre','number','Total Area / Acres'],['address_1','text','Village / Address'],['address_2','text','Taluk / District'],['pincode','text','Pincode']],
  blocks:[['block_name','text','Block / Sub Block Name'],['block_area','number','Area'],['property_id','select','Property','properties','property_id','property_name'],['parent_block_id','select','Parent Block','blocks','block_id','block_name',true]],
  baseUnits:[['baseunit_name','text','Unit Name']],
  assets:[['asset_name','text','Asset Name'],['asset_price','number','Price'],['procured_year','number','Procured Year'],['isactive','number','Active 1/0'],['property_id','select','Property','properties','property_id','property_name'],['asset_procured_source','text','Source']],
  plants:[['plant_type','text','Plant Type'],['details','text','Details'],['block_id','select','Block','blocks','block_id','block_name']],
  plantInventory:[['block_id','select','Block','blocks','block_id','block_name'],['sub_block_name','text','Sub Block / Section'],['plant_id','select','Plant','plants','plant_id','plant_type'],['plant_count','number','Plant Count'],['planting_date','date','Planting Date'],['spacing','text','Spacing'],['status','select','Status','statusOptions','id','name'],['notes','text','Notes']],
  yieldTypes:[['yieldtype_name','text','Yield Type'],['plant_id','select','Plant','plants','plant_id','plant_type']],
  yieldRates:[['plant_id','select','Plant','plants','plant_id','plant_type'],['yieldtype_id','select','Yield Type','yieldTypes','yieldtype_id','yieldtype_name'],['yieldrate_code','text','Season / Code'],['yieldrate_running_rate','number','Rate'],['baseunit_id','select','Unit','baseUnits','baseunit_id','baseunit_name']],
  cropDetails:[['yield_obtained','number','Yield Obtained'],['selling_price','number','Selling Price'],['property_id','select','Property','properties','property_id','property_name'],['other_detail','text','Other Detail']],
  cropIncome:[['crop_id','select','Crop','cropDetails','crop_id','crop_label'],['income_amount','number','Income Amount'],['received_date','date','Received Date']],
  fertilizers:[['fertilizer_name','text','Fertilizer Name'],['date_of_application','date','Date'],['property_id','select','Property','properties','property_id','property_name'],['other_details','text','Details']],
  labors:[['name','text','Labour Name'],['age','number','Age'],['adhar_card','text','Govt ID / Aadhaar'],['bank_details','text','Bank Details'],['health_history','text','Health Notes'],['photo','text','Photo URL / Ref'],['address','text','Address'],['emergency_details','text','Emergency Contact']],
  vendors:[['vendorname','text','Vendor Name'],['description','text','Contact / Address / Notes']],
  laborVendors:[['labor_id','select','Labour','labors','labor_id','name'],['vendor_id','select','Vendor','vendors','vendor_id','vendorname'],['vendor_labor_percentage','number','Commission / Amount'],['laborvendorcode','text','Code']],
  wages:[['labor_id','select','Labour','labors','labor_id','name'],['wage_fixed','number','Fixed Wage'],['wage_variable','number','Variable Wage'],['wage_ot_perhr_price','number','Hourly / OT Rate'],['wage_fix_code','text','Wage Code']],
  wageSettlements:[['wage_id','select','Wage','wages','wage_id','wage_label'],['settled_amount','number','Settled Amount'],['advance_amount','number','Advance Amount'],['running_wage_transaction_date','date','Date']],
  vendorSettlements:[['laborvendor_id','select','Vendor Labour','laborVendors','laborvendor_id','labor_vendor_label'],['settled_amount','number','Settled Amount'],['advance_amount','number','Advance Amount'],['running_wage_transaction_date','date','Date']],
  attendanceQuick:[['labor_id','select','Labour','labors','labor_id','name'],['entry_date','date','Date'],['attendance_value','select','Attendance','attendanceOptions','id','name']],
  rainfallQuick:[['block_id','select','Block','blocks','block_id','block_name'],['recorded_date','date','Date'],['rain_value','number','Rain mm']],
  yieldQuick:[['yieldrate_id','select','Yield Rate','yieldRates','yieldrate_id','yieldtype_name'],['picking_date','date','Picking Date'],['quantity','number','Quantity']],
  expenses:[['expensetype_id','select','Expense Type','expenseTypes','expensetype_id','expense_name'],['property_id','select','Property','properties','property_id','property_name'],['expense_code','text','Code / Notes'],['expense_occurence_date','date','Date'],['other_expense','number','Amount']],
  workActivities:[['work_activity_name','text','Work Activity Name'],['work_activity_type','text','Type'],['notes','text','Notes']],
  workAssignments:[['work_date','date','Work Date'],['work_activity_id','select','Work Activity','workActivities','work_activity_id','work_activity_name'],['labor_id','select','Labour','labors','labor_id','name'],['block_id','select','Block','blocks','block_id','block_name'],['notes','text','Notes']],
  reports:[['total_expenditure','number','Total Expenditure'],['total_revenue','number','Total Revenue'],['profit_loss','number','Profit / Loss'],['property_id','select','Property','properties','property_id','property_name']],
  settings:[['apiBase','text','Backend API URL']]
};

const readResources = ['properties','blocks','baseUnits','assets','plants','plantInventory','yieldTypes','yieldRates','cropDetails','cropIncome','fertilizers','labors','vendors','laborVendors','wages','wageSettlements','vendorSettlements','expenses','workActivities','workAssignments','reports'];
const metaMirror = ['properties','blocks','plants','yieldTypes','yieldRates','wages','laborVendors','cropDetails','workActivities','attendanceLabors'];
const optionSets = {
  statusOptions: [{id:'active',name:'Active'}, {id:'new',name:'New'}, {id:'replaced',name:'Replaced'}, {id:'dead',name:'Dead'}],
  attendanceOptions: [{id:'1',name:'Full Day (1)'}, {id:'0.5',name:'Half Day (0.5)'}, {id:'0',name:'Absent (0)'}, {id:'0.25',name:'Hourly / Quarter'}, {id:'0.75',name:'3/4 Day'}, {id:'1.5',name:'Full + OT (1.5)'}]
};

function defaultForm(key, propertyId) {
  if (key === 'settings') return {};
  const out = { created_by: 'Mobile' };
  (fieldConfig[key] || []).forEach(f => { out[f[0]] = f[1] === 'date' ? today : f[1] === 'number' ? '0' : ''; });
  if ('property_id' in out && propertyId) out.property_id = String(propertyId);
  return out;
}

function itemTitle(row) {
  if (!row) return 'Record';
  return row.property_name || row.block_name || row.name || row.vendorname || row.plant_type || row.work_activity_name || row.expense_name || row.baseunit_name || row.asset_name || row.yieldtype_name || row.fertilizer_name || row.labor_name || row.crop_label || `Record #${row.id || row[Object.keys(row).find(k => k.endsWith('_id'))] || ''}`;
}

export default function App() {
  const [apiBase, setApiBase] = useState('http://192.168.1.5:8787');
  const [user, setUser] = useState(null);
  const [propertyId, setPropertyId] = useState('');
  const [meta, setMeta] = useState({});
  const [dashboard, setDashboard] = useState(null);
  const [data, setData] = useState({});
  const [screen, setScreen] = useState('home');
  const [activeModule, setActiveModule] = useState('attendanceQuick');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const property = (meta.properties || []).find(p => String(p.property_id) === String(propertyId));

  const headers = () => ({
    'Content-Type': 'application/json',
    'x-user-id': user?.user_id ? String(user.user_id) : '',
    'x-property-id': propertyId ? String(propertyId) : ''
  });

  async function request(path, options = {}) {
    const url = `${apiBase.replace(/\/$/, '')}${path}`;
    const res = await fetch(url, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!res.ok) throw new Error(body?.error || String(body || text || `HTTP ${res.status}`));
    return body;
  }

  async function safe(task, quiet = false) {
    try { setLoading(true); setError(''); return await task(); }
    catch (e) { setError(e.message || 'Something went wrong'); if (!quiet) Alert.alert('Error', e.message || 'Something went wrong'); }
    finally { setLoading(false); }
  }

  async function login(username, password) {
    await safe(async () => {
      const result = await request('/api/auth/login', { method:'POST', body: JSON.stringify({ username, password }) });
      setUser(result.user);
      setMeta(prev => ({ ...prev, properties: result.properties || [] }));
      if (result.properties?.[0]) setPropertyId(String(result.properties[0].property_id));
      setScreen('home');
    });
  }

  async function loadAll() {
    if (!user) return;
    await safe(async () => {
      const [m, d, attendance, rainfall, yieldRows] = await Promise.all([
        request('/api/meta'), request('/api/dashboard'), request('/api/attendance'), request('/api/rainfall'), request('/api/yield')
      ]);
      const nextMeta = { ...m };
      setMeta(nextMeta); setDashboard(d); setData(prev => ({...prev, attendance, rainfall, yield: yieldRows}));
      const pairs = await Promise.all(readResources.map(async r => [r, await request(`/api/${r}`).catch(() => [])]));
      const next = { attendance, rainfall, yield: yieldRows };
      pairs.forEach(([k,v]) => { next[k] = v || []; });
      metaMirror.forEach(k => { if (nextMeta[k] && !next[k]) next[k] = nextMeta[k]; });
      setData(next);
    }, true);
  }

  useEffect(() => { if (user && propertyId) loadAll(); }, [user, propertyId]);

  if (!user) return <Login apiBase={apiBase} setApiBase={setApiBase} onLogin={login} loading={loading} error={error} />;

  const openModule = (key) => { setActiveModule(key); setScreen(key === 'dashboardReport' ? 'reports' : 'module'); };

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="dark-content" />
    <Header property={property} user={user} dateLabel="20 Jun 2026, Friday" />
    <PropertyBar properties={meta.properties || []} propertyId={propertyId} setPropertyId={setPropertyId} />
    <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAll} />} contentContainerStyle={styles.body}>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {screen === 'home' && <Home dashboard={dashboard} data={data} openModule={openModule} />}
      {screen === 'add' && <QuickAdd openModule={openModule} />}
      {screen === 'modules' && <Modules openModule={openModule} />}
      {screen === 'reports' && <Reports dashboard={dashboard} data={data} openModule={openModule} />}
      {screen === 'more' && <More apiBase={apiBase} setApiBase={setApiBase} user={user} onLogout={() => setUser(null)} openModule={openModule} />}
      {screen === 'module' && <ModuleScreen moduleKey={activeModule} apiBase={apiBase} setApiBase={setApiBase} user={user} propertyId={propertyId} data={data} setData={setData} meta={meta} request={request} reload={loadAll} />}
    </ScrollView>
    <BottomNav screen={screen} setScreen={setScreen} />
  </SafeAreaView>;
}

function Login({ apiBase, setApiBase, onLogin, loading, error }) {
  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('owner123');
  return <SafeAreaView style={styles.loginPage}>
    <View style={styles.logoCircle}><Text style={styles.logoText}>🌿</Text></View>
    <Text style={styles.loginTitle}>Estate App</Text>
    <Text style={styles.loginSub}>Simple • Smart • For Estate Owners</Text>
    <View style={styles.loginCard}>
      <FieldText label="Backend API URL" value={apiBase} onChangeText={setApiBase} placeholder="http://192.168.1.5:8787" />
      <Text style={styles.note}>Use laptop IP in Expo Go. Do not use localhost on mobile.</Text>
      <FieldText label="Username / Email" value={username} onChangeText={setUsername} />
      <FieldText label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity disabled={loading} style={styles.primary} onPress={() => onLogin(username, password)}><Text style={styles.primaryText}>{loading ? 'Connecting…' : 'Login'}</Text></TouchableOpacity>
    </View>
  </SafeAreaView>;
}

function Header({ property, user, dateLabel }) {
  return <View style={styles.header}>
    <View><Text style={styles.smallCaps}>TODAY'S ESTATE</Text><Text style={styles.headerTitle}>What needs your attention?</Text></View>
    <View style={{alignItems:'flex-end'}}><Text style={styles.date}>{dateLabel}</Text><Text style={styles.location}>📍 {property?.property_name || 'Select Property'}</Text><Text style={styles.user}>{user?.username}</Text></View>
  </View>;
}

function PropertyBar({ properties, propertyId, setPropertyId }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propWrap} contentContainerStyle={{paddingHorizontal:12}}>
    {properties.map(p => <TouchableOpacity key={p.property_id} onPress={() => setPropertyId(String(p.property_id))} style={[styles.propChip, String(p.property_id) === String(propertyId) && styles.propActive]}><Text style={[styles.propText, String(p.property_id) === String(propertyId) && styles.propTextActive]}>{p.property_name}</Text></TouchableOpacity>)}
  </ScrollView>;
}

function Home({ dashboard, data, openModule }) {
  const weatherCards = [
    ['Sunny','☀️','32°C','0 mm','18','₹8,000','₹2,400'], ['Rainy','🌧️','22°C','12 mm','20','₹6,500','₹2,100'], ['Dry','🌤️','35°C','0 mm','15','₹5,000','₹1,800']
  ];
  const summary = [
    ['Workers', dashboard?.attendance?.workers || data.labors?.length || 0, '👥'], ['Rain Today', `${dashboard?.rainfall?.today || 0} mm`, '🌧️'], ['Plants', dashboard?.plantInventoryTotal?.total_plants || 0, '🌱'], ['Profit', `₹${dashboard?.profit || 0}`, '💰']
  ];
  return <View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12}}>{weatherCards.map((c,i) => <View key={c[0]} style={[styles.weather, i===1 && styles.weatherRain]}><Text style={styles.weatherTop}>{c[0]} {c[1]}</Text><Text style={styles.temp}>{c[2]}</Text><Text style={styles.weatherSub}>Rain {c[3]} • Workers {c[4]}</Text><View style={styles.weatherFoot}><Text style={styles.weatherMoney}>Pending {c[5]}</Text><Text style={styles.weatherMoney}>Expense {c[6]}</Text></View></View>)}</ScrollView>
    <View style={styles.grid}>{summary.map(s => <View key={s[0]} style={styles.stat}><Text style={styles.statIcon}>{s[2]}</Text><Text style={styles.statValue}>{s[1]}</Text><Text style={styles.statLabel}>{s[0]}</Text></View>)}</View>
    <Section title="Quick Add" right="One Tap"><IconGrid items={[['Attendance','✅','attendanceQuick'],['Rain','🌧️','rainfallQuick'],['Expense','💵','expenses'],['Labour','👷','labors'],['Plant / Crop','🌱','plantInventory'],['Wage Sheet','🧾','wageSettlements'],['Harvest','🌾','yieldQuick'],['More','•••','modules']]} openModule={openModule} /></Section>
    <Section title="Smart Suggestions"><Suggestion text="Heavy rain expected tomorrow." /><Suggestion text="Check drainage in Block B." /><Suggestion text="Harvest of Arabica in Block A due in 3 days." /></Section>
    <Section title="Today's Tasks"><RecordList rows={data.workAssignments || []} empty="No tasks assigned today." /></Section>
  </View>;
}

function QuickAdd({ openModule }) {
  return <View><Text style={styles.screenTitle}>Quick Add</Text><IconGrid items={[['Attendance','✅','attendanceQuick'],['Hourly Details','⏱️','attendanceQuick'],['Base Units','📐','baseUnits'],['Add Property','🏡','properties'],['Map / Blocks','🗺️','blocks'],['Vendor','🤝','vendors'],['Add Labour','👷','labors'],['Labour ID','🪪','labors'],['Wage Sheet','🧾','wageSettlements'],['Rain Report','🌧️','rainfallQuick'],['Expense','💵','expenses'],['Work Task','🧑‍🌾','workAssignments']]} openModule={openModule} /></View>;
}

function Modules({ openModule }) {
  return <View><Text style={styles.screenTitle}>All Modules</Text>{moduleGroups.map(g => <View key={g.key} style={styles.card}><Text style={styles.sectionTitle}>{g.icon} {g.title}</Text>{g.items.map(i => <TouchableOpacity key={i} style={styles.moduleRow} onPress={() => openModule(i)}><Text style={styles.moduleName}>{labels[i]}</Text><Text style={styles.chev}>›</Text></TouchableOpacity>)}</View>)}</View>;
}

function Reports({ dashboard, data, openModule }) {
  const reportCards = [
    ['Rainfall Report', `${dashboard?.rainfall?.total || 0} mm`, '🌧️', 'rainfallQuick'], ['Expense Report', `₹${dashboard?.expenses?.total || 0}`, '💵', 'expenses'], ['Labour Report', `${dashboard?.attendance?.labor_days || 0} days`, '👥', 'attendanceQuick'], ['Plant Report', `${dashboard?.plantInventoryTotal?.total_plants || 0}`, '🌱', 'plantInventory'], ['Work Report', `${dashboard?.workAssignmentTotal?.entries || 0}`, '🧑‍🌾', 'workAssignments'], ['Profit Report', `₹${dashboard?.profit || 0}`, '📊', 'reports']
  ];
  return <View><Text style={styles.screenTitle}>Reports</Text><View style={styles.grid}>{reportCards.map(r => <TouchableOpacity key={r[0]} style={styles.reportCard} onPress={() => openModule(r[3])}><Text style={styles.statIcon}>{r[2]}</Text><Text style={styles.reportValue}>{r[1]}</Text><Text style={styles.statLabel}>{r[0]}</Text></TouchableOpacity>)}</View><Section title="Recent Attendance"><RecordList rows={data.attendance || []} /></Section><Section title="Plant Distribution"><RecordList rows={dashboard?.plantByType || data.plantInventory || []} /></Section></View>;
}

function More({ apiBase, setApiBase, user, onLogout, openModule }) {
  return <View><Text style={styles.screenTitle}>More</Text><View style={styles.card}><Text style={styles.sectionTitle}>API Settings</Text><FieldText label="Backend API URL" value={apiBase} onChangeText={setApiBase} /><Text style={styles.note}>Logged in as {user?.username}</Text><TouchableOpacity style={styles.secondary} onPress={onLogout}><Text style={styles.secondaryText}>Logout</Text></TouchableOpacity></View><Section title="Secure & Reliable"><IconGrid items={[['Offline First Ready','📴','settings'],['Multi Language Ready','🌐','settings'],['Backup / Restore','💾','settings'],['Notifications','🔔','notifications']]} openModule={openModule} /></Section></View>;
}

function ModuleScreen({ moduleKey, apiBase, setApiBase, user, propertyId, data, setData, meta, request, reload }) {
  const endpoint = resourceOf[moduleKey] || moduleKey;
  const fields = fieldConfig[moduleKey] || [];
  const [form, setForm] = useState(defaultForm(moduleKey, propertyId));
  const rows = data[endpoint] || data[moduleKey] || [];

  useEffect(() => setForm(defaultForm(moduleKey, propertyId)), [moduleKey, propertyId]);

  async function save() {
    if (moduleKey === 'settings') return Alert.alert('Saved', 'API settings updated.');
    const payload = { ...form, property_id: form.property_id || propertyId, user_id: user.user_id, created_by: user.username };
    await request(`/api/${endpoint}`, { method:'POST', body: JSON.stringify(payload) });
    setForm(defaultForm(moduleKey, propertyId));
    await reload();
    Alert.alert('Saved', `${labels[moduleKey]} saved.`);
  }
  async function remove(row) {
    const idKey = Object.keys(row).find(k => k.endsWith('_id'));
    if (!idKey || ['attendance','rainfall','yield'].includes(endpoint)) return Alert.alert('Info', 'Delete is available for master/resource modules only.');
    Alert.alert('Delete?', itemTitle(row), [{text:'Cancel'}, {text:'Delete', style:'destructive', onPress: async () => { await request(`/api/${endpoint}/${row[idKey]}`, { method:'DELETE' }); await reload(); }}]);
  }

  if (moduleKey === 'notifications') return <View><Text style={styles.screenTitle}>Notifications</Text><Section title="Today"><Suggestion danger text="Heavy rain expected tomorrow." /><Suggestion warning text="Wage sheet generated for today." /><Suggestion warning text="Expense limit crossed this month." /><Suggestion text="New labour added: Ramesh." /></Section></View>;
  if (moduleKey === 'dashboardReport') return <Reports dashboard={data.dashboard} data={data} openModule={()=>{}} />;

  return <View><Text style={styles.screenTitle}>{labels[moduleKey]}</Text><View style={styles.card}>{fields.map(f => <SmartField key={f[0]} field={f} value={moduleKey==='settings' && f[0]==='apiBase' ? apiBase : form[f[0]]} setValue={(v) => moduleKey==='settings' && f[0]==='apiBase' ? setApiBase(v) : setForm({...form, [f[0]]: v})} meta={meta} data={data} />)}<TouchableOpacity style={styles.primary} onPress={save}><Text style={styles.primaryText}>Save</Text></TouchableOpacity></View><Section title="Records"><RecordList rows={rows} onDelete={remove} /></Section></View>;
}

function SmartField({ field, value, setValue, meta, data }) {
  const [open, setOpen] = useState(false);
  const [key, type, label, source, idKey, nameKey, optional] = field;
  if (type !== 'select') return <FieldText label={label} value={String(value ?? '')} onChangeText={setValue} keyboardType={type === 'number' ? 'numeric' : 'default'} placeholder={type === 'date' ? 'YYYY-MM-DD' : label} />;
  const opts = optionSets[source] || data[source] || meta[source] || [];
  const selected = opts.find(o => String(o[idKey]) === String(value));
  return <View style={{marginBottom:12}}><Text style={styles.label}>{label}{optional ? ' (optional)' : ''}</Text><TouchableOpacity style={styles.inputButton} onPress={() => setOpen(true)}><Text style={selected ? styles.inputText : styles.placeholder}>{selected ? (selected[nameKey] || selected[idKey]) : `Select ${label}`}</Text></TouchableOpacity><Modal visible={open} transparent animationType="slide"><View style={styles.modalBack}><View style={styles.modalCard}><Text style={styles.modalTitle}>{label}</Text><ScrollView>{optional && <TouchableOpacity style={styles.option} onPress={() => { setValue(''); setOpen(false); }}><Text>None</Text></TouchableOpacity>}{opts.map(o => <TouchableOpacity key={String(o[idKey])} style={styles.option} onPress={() => { setValue(String(o[idKey])); setOpen(false); }}><Text style={styles.optionText}>{o[nameKey] || o[idKey]}</Text><Text style={styles.optionSub}>ID: {o[idKey]}</Text></TouchableOpacity>)}</ScrollView><TouchableOpacity style={styles.secondary} onPress={() => setOpen(false)}><Text style={styles.secondaryText}>Close</Text></TouchableOpacity></View></View></Modal></View>;
}

function FieldText({ label, value, onChangeText, ...props }) { return <View style={{marginBottom:12}}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} autoCapitalize="none" placeholderTextColor="#9c9a91" {...props} /></View>; }
function Section({ title, right, children }) { return <View style={styles.card}><View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text>{right && <Text style={styles.sectionRight}>{right}</Text>}</View>{children}</View>; }
function Suggestion({ text, danger, warning }) { return <View style={styles.suggestion}><Text>{danger ? '🔴' : warning ? '🟠' : '🟢'}</Text><Text style={styles.suggestionText}>{text}</Text></View>; }
function IconGrid({ items, openModule }) { return <View style={styles.iconGrid}>{items.map(([t,ic,key]) => <TouchableOpacity key={t} style={styles.iconTile} onPress={() => key==='modules' ? null : openModule(key)}><Text style={styles.icon}>{ic}</Text><Text style={styles.iconLabel}>{t}</Text></TouchableOpacity>)}</View>; }
function RecordList({ rows = [], empty = 'No records yet.', onDelete }) { if (!rows?.length) return <Text style={styles.muted}>{empty}</Text>; return <View>{rows.slice(0, 25).map((r,i) => <View key={i} style={styles.record}><View style={{flex:1}}><Text style={styles.recordTitle}>{itemTitle(r)}</Text>{Object.entries(r).slice(0,5).map(([k,v]) => <Text key={k} style={styles.recordLine}>{k}: {String(v ?? '')}</Text>)}</View>{onDelete && <TouchableOpacity onPress={() => onDelete(r)}><Text style={styles.delete}>🗑️</Text></TouchableOpacity>}</View>)}</View>; }
function BottomNav({ screen, setScreen }) { const nav = [['home','Home','🏠'],['add','Add','＋'],['modules','Modules','📋'],['reports','Reports','📊'],['more','More','☰']]; return <View style={styles.bottom}>{nav.map(n => <TouchableOpacity key={n[0]} style={styles.navItem} onPress={() => setScreen(n[0])}><Text style={[styles.navIcon, screen===n[0] && styles.navActive]}>{n[2]}</Text><Text style={[styles.navText, screen===n[0] && styles.navActive]}>{n[1]}</Text></TouchableOpacity>)}</View>; }

const styles = StyleSheet.create({
  safe:{flex:1, backgroundColor:SOFT}, body:{padding:12, paddingBottom:96}, header:{paddingHorizontal:16,paddingTop:10,paddingBottom:8,backgroundColor:'#fffdf8',borderBottomWidth:1,borderBottomColor:LINE,flexDirection:'row',justifyContent:'space-between',gap:10}, smallCaps:{fontWeight:'900',fontSize:15,color:'#111'}, headerTitle:{fontSize:12,color:'#3c453c'}, date:{fontSize:11,color:'#555'}, location:{fontSize:11,color:DARK,fontWeight:'700'}, user:{fontSize:10,color:'#777'}, propWrap:{backgroundColor:'#fffdf8',borderBottomWidth:1,borderBottomColor:LINE,maxHeight:48}, propChip:{paddingHorizontal:14,paddingVertical:9,borderRadius:18,borderWidth:1,borderColor:LINE,marginRight:8,marginVertical:6,backgroundColor:'#fff'}, propActive:{backgroundColor:GREEN,borderColor:GREEN}, propText:{fontSize:12,color:DARK,fontWeight:'700'}, propTextActive:{color:'#fff'},
  loginPage:{flex:1,backgroundColor:'#f3efe4',justifyContent:'center',padding:22}, logoCircle:{alignSelf:'center',width:86,height:86,borderRadius:43,backgroundColor:'#fff',borderWidth:2,borderColor:GREEN,alignItems:'center',justifyContent:'center',marginBottom:12}, logoText:{fontSize:44}, loginTitle:{fontSize:34,fontWeight:'900',color:GREEN,textAlign:'center'}, loginSub:{backgroundColor:GREEN,color:'#fff',alignSelf:'center',paddingHorizontal:16,paddingVertical:7,borderRadius:18,overflow:'hidden',marginTop:8,marginBottom:18,fontWeight:'800'}, loginCard:{backgroundColor:'#fffdf8',borderRadius:18,padding:16,borderWidth:1,borderColor:LINE}, note:{fontSize:12,color:'#675',marginBottom:10}, error:{color:'#b00020',fontWeight:'700',marginVertical:8},
  card:{backgroundColor:'#fffdf8',borderRadius:16,padding:14,marginBottom:12,borderWidth:1,borderColor:LINE,shadowColor:'#000',shadowOpacity:.05,shadowRadius:8,elevation:1}, screenTitle:{fontSize:22,fontWeight:'900',color:DARK,marginBottom:12}, sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}, sectionTitle:{fontSize:15,fontWeight:'900',color:DARK}, sectionRight:{fontSize:11,color:'#777'},
  weather:{width:168,backgroundColor:'#c88315',borderRadius:18,padding:14,marginBottom:12}, weatherRain:{backgroundColor:'#126247'}, weatherTop:{color:'#fff',fontWeight:'900'}, temp:{color:'#fff',fontWeight:'900',fontSize:28,marginVertical:10}, weatherSub:{color:'#fff',fontSize:12}, weatherFoot:{flexDirection:'row',justifyContent:'space-between',marginTop:14}, weatherMoney:{color:'#fff',fontWeight:'800',fontSize:11}, grid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:12}, stat:{width:'47.8%',backgroundColor:'#fffdf8',borderWidth:1,borderColor:LINE,borderRadius:16,padding:14}, statIcon:{fontSize:22}, statValue:{fontSize:20,fontWeight:'900',color:GREEN,marginTop:6}, statLabel:{fontSize:12,color:'#5d675f',fontWeight:'700'}, reportCard:{width:'47.8%',backgroundColor:'#fffdf8',borderWidth:1,borderColor:LINE,borderRadius:16,padding:14}, reportValue:{fontSize:17,fontWeight:'900',color:DARK,marginVertical:4},
  iconGrid:{flexDirection:'row',flexWrap:'wrap',gap:10}, iconTile:{width:'30.6%',alignItems:'center',paddingVertical:12,borderWidth:1,borderColor:LINE,borderRadius:14,backgroundColor:'#fff'}, icon:{fontSize:23}, iconLabel:{fontSize:11,textAlign:'center',color:DARK,fontWeight:'700',marginTop:5}, suggestion:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:7}, suggestionText:{fontSize:13,color:'#37433b'}, moduleRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#eee8da'}, moduleName:{fontSize:14,fontWeight:'800',color:DARK}, chev:{fontSize:28,color:GREEN},
  label:{fontSize:12,fontWeight:'800',color:DARK,marginBottom:6}, input:{backgroundColor:'#fff',borderWidth:1,borderColor:LINE,borderRadius:12,paddingHorizontal:12,paddingVertical:11,color:'#222'}, inputButton:{backgroundColor:'#fff',borderWidth:1,borderColor:LINE,borderRadius:12,paddingHorizontal:12,paddingVertical:13}, inputText:{color:'#222'}, placeholder:{color:'#9c9a91'}, primary:{backgroundColor:GREEN,borderRadius:12,paddingVertical:14,alignItems:'center',marginTop:4}, primaryText:{color:'#fff',fontWeight:'900'}, secondary:{borderWidth:1,borderColor:GREEN,borderRadius:12,paddingVertical:12,alignItems:'center',marginTop:8}, secondaryText:{color:GREEN,fontWeight:'900'},
  record:{flexDirection:'row',gap:8,backgroundColor:'#fff',borderWidth:1,borderColor:'#eee8da',borderRadius:12,padding:12,marginTop:8}, recordTitle:{fontWeight:'900',color:DARK,marginBottom:3}, recordLine:{fontSize:11,color:'#616b63'}, delete:{fontSize:19}, muted:{color:'#777',fontSize:13,paddingVertical:8},
  modalBack:{flex:1,backgroundColor:'rgba(0,0,0,.35)',justifyContent:'flex-end'}, modalCard:{backgroundColor:'#fffdf8',borderTopLeftRadius:22,borderTopRightRadius:22,padding:18,maxHeight:'80%'}, modalTitle:{fontSize:18,fontWeight:'900',color:DARK,marginBottom:10}, option:{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#eee'}, optionText:{fontWeight:'800',color:DARK}, optionSub:{fontSize:11,color:'#777'},
  bottom:{position:'absolute',left:12,right:12,bottom:12,backgroundColor:'#fffdf8',borderRadius:22,borderWidth:1,borderColor:LINE,flexDirection:'row',paddingVertical:8,shadowColor:'#000',shadowOpacity:.12,shadowRadius:10,elevation:8}, navItem:{flex:1,alignItems:'center'}, navIcon:{fontSize:20,color:'#777'}, navText:{fontSize:10,color:'#777',fontWeight:'800'}, navActive:{color:GREEN}
});
