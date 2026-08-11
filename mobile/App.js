import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const today = new Date().toISOString().slice(0, 10);
const GREEN = '#0b7a2a';
const DARK = '#14361f';
const SOFT = '#f7f4ec';
const LINE = '#e3ddcf';
const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || '0a3c56cb73b74ef5802121513261008';
const WEATHER_LOCATION = process.env.EXPO_PUBLIC_WEATHER_LOCATION || 'bengaluru';

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

const readResources = ['properties','blocks','baseUnits','assets','plants','plantInventory','yieldTypes','yieldRates','cropDetails','cropIncome','fertilizers','labors','vendors','laborVendors','wages','wageSettlements','vendorSettlements','expenseTypes','expenses','workActivities','workAssignments','reports'];
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
  const defaultApiBase = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:8787' : 'http://localhost:8787');
  const [apiBase, setApiBase] = useState(defaultApiBase);
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
    <StatusBar barStyle="dark-content" backgroundColor="#fffdf8" translucent={false} />
    <Header property={property} user={user} dateLabel={new Intl.DateTimeFormat('en-IN', { day:'numeric', month:'short', weekday:'short' }).format(new Date())} />
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
    <StatusBar barStyle="dark-content" backgroundColor="#f3efe4" translucent={false} />
    <KeyboardAvoidingView style={styles.loginKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.loginScroll}>
        <View style={styles.logoCircle}><Text style={styles.logoText}>🌿</Text></View>
        <Text style={styles.loginTitle}>Estate App</Text>
        <Text style={styles.loginSub}>Simple • Smart • For Estate Owners</Text>
        <View style={styles.loginCard}>
          <FieldText label="Backend API URL" value={apiBase} onChangeText={setApiBase} placeholder="http://192.168.1.5:8787" returnKeyType="next" />
          <Text style={styles.note}>Use laptop IP in Expo Go. Do not use localhost on mobile.</Text>
          <FieldText label="Username / Email" value={username} onChangeText={setUsername} returnKeyType="next" />
          <FieldText label="Password" value={password} onChangeText={setPassword} secureTextEntry returnKeyType="done" onSubmitEditing={() => onLogin(username, password)} />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity disabled={loading} style={styles.primary} onPress={() => onLogin(username, password)}><Text style={styles.primaryText}>{loading ? 'Connecting…' : 'Login'}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function Header({ property, user, dateLabel }) {
  return <View style={styles.header}>
    <View style={styles.headerCopy}><Text style={styles.smallCaps}>TODAY'S ESTATE</Text><Text style={styles.headerTitle}>What needs your attention today?</Text></View>
    <View style={styles.headerMeta}><Text style={styles.date}>{dateLabel}</Text><Text numberOfLines={1} style={styles.location}>📍 {property?.property_name || 'Select Property'}</Text><Text numberOfLines={1} style={styles.user}>{user?.username}</Text></View>
  </View>;
}

function PropertyBar({ properties, propertyId, setPropertyId }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = properties.find(p => String(p.property_id) === String(propertyId));
  const filtered = properties.filter(p => `${p.property_name} ${p.address_1 || ''} ${p.property_id}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <View style={styles.propertySelectorWrap}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change property" style={styles.propertySelector} onPress={() => setOpen(true)}>
      <View style={styles.propertyBadge}><Text style={styles.propertyBadgeText}>E</Text></View>
      <View style={styles.propertySelectedCopy}>
        <Text style={styles.propertyEyebrow}>CURRENT PROPERTY</Text>
        <Text numberOfLines={1} style={styles.propertySelectedName}>{selected?.property_name || 'Select a property'}</Text>
        {!!selected?.address_1 && <Text numberOfLines={1} style={styles.propertySelectedAddress}>{selected.address_1}</Text>}
      </View>
      <View style={styles.propertyChange}><Text style={styles.propertyChangeText}>Change</Text><Text style={styles.propertyChevron}>⌄</Text></View>
    </TouchableOpacity>
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={styles.modalBack}>
        <View style={styles.propertyModal}>
          <View style={styles.propertyModalHead}><View><Text style={styles.modalTitle}>Select property</Text><Text style={styles.propertyCount}>{properties.length} properties available</Text></View><TouchableOpacity onPress={() => setOpen(false)} style={styles.closeButton}><Text style={styles.closeButtonText}>×</Text></TouchableOpacity></View>
          <TextInput value={query} onChangeText={setQuery} autoFocus placeholder="Search name, village or property ID" placeholderTextColor="#8a918b" style={styles.propertySearch} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.propertyList}>
            {filtered.map(p => {
              const active = String(p.property_id) === String(propertyId);
              return <TouchableOpacity key={p.property_id} style={[styles.propertyOption,active && styles.propertyOptionActive]} onPress={() => { setPropertyId(String(p.property_id)); setOpen(false); setQuery(''); }}>
                <View style={[styles.propertyOptionMark,active && styles.propertyOptionMarkActive]}><Text style={[styles.propertyOptionMarkText,active && styles.propertyOptionMarkTextActive]}>{active ? '✓' : String(p.property_name || 'E').charAt(0).toUpperCase()}</Text></View>
                <View style={{flex:1}}><Text style={styles.propertyOptionName}>{p.property_name}</Text><Text numberOfLines={1} style={styles.propertyOptionMeta}>{p.address_1 || 'Estate property'} • ID {p.property_id}</Text></View>
              </TouchableOpacity>;
            })}
            {!filtered.length && <Text style={styles.propertyEmpty}>No matching properties found.</Text>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </View>;
}

function weatherTheme(weather) {
  const code = weather?.current?.condition?.code || 1000;
  const text = (weather?.current?.condition?.text || '').toLowerCase();
  if (text.includes('thunder')) return { kind:'storm', icon:'⛈️', colors:['#152b46','#244c68'], accent:'#d9d36f' };
  if (text.includes('rain') || text.includes('drizzle') || [1063,1150,1153,1180,1183,1186,1189,1192,1195,1240,1243,1246].includes(code)) return { kind:'rain', icon:'🌧️', colors:['#245468','#39798a'], accent:'#bdeaff' };
  if (text.includes('cloud') || text.includes('overcast') || [1003,1006,1009].includes(code)) return { kind:'cloud', icon:'☁️', colors:['#607683','#8799a1'], accent:'#eef4f5' };
  if ((weather?.current?.temp_c || 0) >= 32) return { kind:'hot', icon:'☀️', colors:['#c75d19','#e99a26'], accent:'#fff2a8' };
  if ((weather?.current?.temp_c || 30) <= 16) return { kind:'cold', icon:'❄️', colors:['#3e7194','#6ba7c2'], accent:'#e8fbff' };
  return { kind:'sunny', icon:'☀️', colors:['#2d8558','#66a957'], accent:'#fff0a6' };
}

function WeatherHero() {
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState('');
  const motion = useRef(new Animated.Value(0)).current;
  const theme = weatherTheme(weather);

  async function loadWeather() {
    try {
      setWeatherError('');
      const response = await fetch(`https://api.weatherapi.com/v1/current.json?q=${encodeURIComponent(WEATHER_LOCATION)}&key=${WEATHER_API_KEY}`);
      const body = await response.json();
      if (!response.ok || body.error) throw new Error(body.error?.message || 'Weather unavailable');
      setWeather(body);
    } catch (error) { setWeatherError(error.message || 'Weather unavailable'); }
  }

  useEffect(() => {
    loadWeather();
    const timer = setInterval(loadWeather, 10 * 60 * 1000);
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(motion, { toValue:1, duration:1800, easing:Easing.inOut(Easing.sin), useNativeDriver:true }),
      Animated.timing(motion, { toValue:0, duration:1800, easing:Easing.inOut(Easing.sin), useNativeDriver:true })
    ]));
    animation.start();
    return () => { clearInterval(timer); animation.stop(); };
  }, []);

  const drift = motion.interpolate({ inputRange:[0,1], outputRange:[-5,7] });
  const pulse = motion.interpolate({ inputRange:[0,1], outputRange:[0.92,1.08] });
  const current = weather?.current;
  return <View style={[styles.weatherHero, {backgroundColor:theme.colors[0]}]}>
    <View style={[styles.weatherGlow, {backgroundColor:theme.colors[1]}]} />
    <View style={styles.weatherCopy}>
      <Text style={styles.weatherPlace}>{weather?.location?.name || 'Bengaluru'} • LIVE</Text>
      <Text style={styles.weatherCondition}>{current?.condition?.text || (weatherError ? 'Weather unavailable' : 'Updating weather…')}</Text>
      <Text style={styles.weatherTemperature}>{current ? `${Math.round(current.temp_c)}°C` : '--°'}</Text>
      <Text style={styles.weatherFeels}>Feels like {current ? `${Math.round(current.feelslike_c)}°C` : '--'}  •  Wind {current?.wind_kph ?? '--'} km/h</Text>
    </View>
    <Animated.View style={[styles.weatherArt, {transform:[{translateX:drift},{scale:pulse}]}]}>
      {current?.condition?.icon ? <Image source={{uri:`https:${current.condition.icon}`}} style={styles.weatherIconImage} /> : <Text style={styles.weatherEmoji}>{theme.icon}</Text>}
    </Animated.View>
    {(theme.kind === 'rain' || theme.kind === 'storm') && <View style={styles.rainLayer}>{[0,1,2,3,4,5,6].map(i => <Animated.View key={i} style={[styles.rainDrop,{left:10+i*18,transform:[{translateY:motion.interpolate({inputRange:[0,1],outputRange:[-8,55]})}]}]} />)}</View>}
    <View style={styles.weatherMetrics}>
      <View><Text style={styles.metricLabel}>Humidity</Text><Text style={styles.metricValue}>{current?.humidity ?? '--'}%</Text></View>
      <View><Text style={styles.metricLabel}>Rain</Text><Text style={styles.metricValue}>{current?.precip_mm ?? '--'} mm</Text></View>
      <View><Text style={styles.metricLabel}>UV</Text><Text style={styles.metricValue}>{current?.uv ?? '--'}</Text></View>
      <TouchableOpacity onPress={loadWeather}><Text style={[styles.weatherRefresh,{color:theme.accent}]}>Refresh</Text></TouchableOpacity>
    </View>
  </View>;
}

function Home({ dashboard, data, openModule }) {
  const summary = [
    ['Workers', dashboard?.attendance?.entries || data.labors?.length || 0, '👥'], ['Rain Today', `${dashboard?.rainfall?.total || 0} mm`, '🌧️'], ['Plants', dashboard?.plantInventoryTotal?.total_plants || 0, '🌱'], ['Profit', `₹${dashboard?.profit || 0}`, '💰']
  ];
  return <View>
    <WeatherHero />
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
  safe:{flex:1,backgroundColor:SOFT,paddingTop:Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0}, body:{padding:12,paddingBottom:96}, header:{minHeight:72,paddingHorizontal:16,paddingTop:12,paddingBottom:10,backgroundColor:'#fffdf8',borderBottomWidth:1,borderBottomColor:LINE,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},headerCopy:{flex:1,minWidth:0},headerMeta:{width:124,alignItems:'flex-end'},smallCaps:{fontWeight:'900',fontSize:15,color:'#111'}, headerTitle:{fontSize:12,color:'#3c453c',marginTop:3}, date:{fontSize:11,color:'#555'}, location:{fontSize:11,color:DARK,fontWeight:'700',marginTop:3,maxWidth:124}, user:{fontSize:10,color:'#777',marginTop:2,maxWidth:124},
  propertySelectorWrap:{backgroundColor:'#fffdf8',paddingHorizontal:12,paddingVertical:9,borderBottomWidth:1,borderBottomColor:'#d7d1c4'},propertySelector:{minHeight:62,flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderWidth:1.5,borderColor:'#b8c4b9',borderRadius:15,paddingHorizontal:12,paddingVertical:9,elevation:2,shadowColor:'#173d22',shadowOpacity:.08,shadowRadius:5},propertyBadge:{width:38,height:38,borderRadius:12,backgroundColor:'#e8f4e9',alignItems:'center',justifyContent:'center',marginRight:10},propertyBadgeText:{color:GREEN,fontWeight:'900',fontSize:18},propertySelectedCopy:{flex:1,minWidth:0},propertyEyebrow:{fontSize:9,color:'#738078',fontWeight:'900',letterSpacing:.7},propertySelectedName:{fontSize:15,color:DARK,fontWeight:'900',marginTop:1},propertySelectedAddress:{fontSize:10,color:'#687169',marginTop:1},propertyChange:{flexDirection:'row',alignItems:'center',backgroundColor:'#edf7ee',paddingHorizontal:10,paddingVertical:7,borderRadius:12,marginLeft:8},propertyChangeText:{fontSize:11,color:GREEN,fontWeight:'900'},propertyChevron:{fontSize:17,color:GREEN,fontWeight:'900',marginLeft:4,marginTop:-3},
  propertyModal:{backgroundColor:'#fffdf8',borderTopLeftRadius:24,borderTopRightRadius:24,padding:18,maxHeight:'82%'},propertyModalHead:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'},propertyCount:{fontSize:11,color:'#727b74',marginTop:-5,marginBottom:12},closeButton:{width:34,height:34,borderRadius:17,backgroundColor:'#eef0eb',alignItems:'center',justifyContent:'center'},closeButtonText:{fontSize:25,color:DARK,lineHeight:27},propertySearch:{backgroundColor:'#fff',borderWidth:1.5,borderColor:'#c5cec6',borderRadius:13,paddingHorizontal:14,paddingVertical:12,color:'#17291d',fontSize:14,marginBottom:10},propertyList:{paddingBottom:24},propertyOption:{flexDirection:'row',alignItems:'center',padding:12,borderBottomWidth:1,borderBottomColor:'#ece9e0',borderRadius:12},propertyOptionActive:{backgroundColor:'#edf7ee',borderBottomColor:'#d5ead8'},propertyOptionMark:{width:38,height:38,borderRadius:12,backgroundColor:'#f0f0ec',alignItems:'center',justifyContent:'center',marginRight:11},propertyOptionMarkActive:{backgroundColor:GREEN},propertyOptionMarkText:{fontWeight:'900',color:'#59645c'},propertyOptionMarkTextActive:{color:'#fff'},propertyOptionName:{fontSize:14,fontWeight:'900',color:DARK},propertyOptionMeta:{fontSize:10,color:'#6e786f',marginTop:3},propertyEmpty:{textAlign:'center',color:'#737b75',paddingVertical:30},
  loginPage:{flex:1,backgroundColor:'#f3efe4',paddingTop:Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0},loginKeyboard:{flex:1},loginScroll:{flexGrow:1,justifyContent:'center',paddingHorizontal:22,paddingTop:24,paddingBottom:36},logoCircle:{alignSelf:'center',width:76,height:76,borderRadius:38,backgroundColor:'#fff',borderWidth:2,borderColor:GREEN,alignItems:'center',justifyContent:'center',marginBottom:10},logoText:{fontSize:39},loginTitle:{fontSize:31,fontWeight:'900',color:GREEN,textAlign:'center'},loginSub:{backgroundColor:GREEN,color:'#fff',alignSelf:'center',paddingHorizontal:16,paddingVertical:7,borderRadius:18,overflow:'hidden',marginTop:7,marginBottom:16,fontWeight:'800'},loginCard:{backgroundColor:'#fffdf8',borderRadius:18,padding:16,borderWidth:1,borderColor:LINE},note:{fontSize:12,color:'#675',marginBottom:10},error:{color:'#b00020',fontWeight:'700',marginVertical:8},
  card:{backgroundColor:'#fffdf8',borderRadius:16,padding:14,marginBottom:12,borderWidth:1,borderColor:LINE,shadowColor:'#000',shadowOpacity:.05,shadowRadius:8,elevation:1}, screenTitle:{fontSize:22,fontWeight:'900',color:DARK,marginBottom:12}, sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}, sectionTitle:{fontSize:15,fontWeight:'900',color:DARK}, sectionRight:{fontSize:11,color:'#777'},
  weatherHero:{minHeight:220,borderRadius:22,padding:18,marginBottom:12,overflow:'hidden',shadowColor:'#10251b',shadowOpacity:.18,shadowRadius:12,elevation:5}, weatherGlow:{position:'absolute',right:-55,top:-60,width:210,height:210,borderRadius:105,opacity:.72}, weatherCopy:{zIndex:2,maxWidth:'67%'}, weatherPlace:{color:'rgba(255,255,255,.78)',fontSize:11,fontWeight:'900',letterSpacing:1}, weatherCondition:{color:'#fff',fontSize:18,fontWeight:'900',marginTop:8}, weatherTemperature:{color:'#fff',fontSize:46,fontWeight:'900',lineHeight:54}, weatherFeels:{color:'rgba(255,255,255,.9)',fontSize:11,fontWeight:'600'}, weatherArt:{position:'absolute',right:18,top:28,zIndex:2}, weatherIconImage:{width:96,height:96}, weatherEmoji:{fontSize:70}, rainLayer:{position:'absolute',right:8,top:78,width:145,height:74,overflow:'hidden'}, rainDrop:{position:'absolute',top:0,width:2,height:16,borderRadius:2,backgroundColor:'rgba(190,235,255,.75)',transform:[{rotate:'14deg'}]}, weatherMetrics:{position:'absolute',left:18,right:18,bottom:15,zIndex:3,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',backgroundColor:'rgba(0,0,0,.16)',borderRadius:13,paddingHorizontal:12,paddingVertical:9}, metricLabel:{color:'rgba(255,255,255,.72)',fontSize:9,textTransform:'uppercase'}, metricValue:{color:'#fff',fontSize:13,fontWeight:'900',marginTop:2}, weatherRefresh:{fontSize:11,fontWeight:'900',paddingVertical:5},
  weather:{width:168,backgroundColor:'#c88315',borderRadius:18,padding:14,marginBottom:12}, weatherRain:{backgroundColor:'#126247'}, weatherTop:{color:'#fff',fontWeight:'900'}, temp:{color:'#fff',fontWeight:'900',fontSize:28,marginVertical:10}, weatherSub:{color:'#fff',fontSize:12}, weatherFoot:{flexDirection:'row',justifyContent:'space-between',marginTop:14}, weatherMoney:{color:'#fff',fontWeight:'800',fontSize:11}, grid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:12}, stat:{width:'47.8%',backgroundColor:'#fffdf8',borderWidth:1,borderColor:LINE,borderRadius:16,padding:14}, statIcon:{fontSize:22}, statValue:{fontSize:20,fontWeight:'900',color:GREEN,marginTop:6}, statLabel:{fontSize:12,color:'#5d675f',fontWeight:'700'}, reportCard:{width:'47.8%',backgroundColor:'#fffdf8',borderWidth:1,borderColor:LINE,borderRadius:16,padding:14}, reportValue:{fontSize:17,fontWeight:'900',color:DARK,marginVertical:4},
  iconGrid:{flexDirection:'row',flexWrap:'wrap',gap:10}, iconTile:{width:'30.6%',alignItems:'center',paddingVertical:12,borderWidth:1,borderColor:LINE,borderRadius:14,backgroundColor:'#fff'}, icon:{fontSize:23}, iconLabel:{fontSize:11,textAlign:'center',color:DARK,fontWeight:'700',marginTop:5}, suggestion:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:7}, suggestionText:{fontSize:13,color:'#37433b'}, moduleRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#eee8da'}, moduleName:{fontSize:14,fontWeight:'800',color:DARK}, chev:{fontSize:28,color:GREEN},
  label:{fontSize:12,fontWeight:'800',color:DARK,marginBottom:6}, input:{backgroundColor:'#fff',borderWidth:1,borderColor:LINE,borderRadius:12,paddingHorizontal:12,paddingVertical:11,color:'#222'}, inputButton:{backgroundColor:'#fff',borderWidth:1,borderColor:LINE,borderRadius:12,paddingHorizontal:12,paddingVertical:13}, inputText:{color:'#222'}, placeholder:{color:'#9c9a91'}, primary:{backgroundColor:GREEN,borderRadius:12,paddingVertical:14,alignItems:'center',marginTop:4}, primaryText:{color:'#fff',fontWeight:'900'}, secondary:{borderWidth:1,borderColor:GREEN,borderRadius:12,paddingVertical:12,alignItems:'center',marginTop:8}, secondaryText:{color:GREEN,fontWeight:'900'},
  record:{flexDirection:'row',gap:8,backgroundColor:'#fff',borderWidth:1,borderColor:'#eee8da',borderRadius:12,padding:12,marginTop:8}, recordTitle:{fontWeight:'900',color:DARK,marginBottom:3}, recordLine:{fontSize:11,color:'#616b63'}, delete:{fontSize:19}, muted:{color:'#777',fontSize:13,paddingVertical:8},
  modalBack:{flex:1,backgroundColor:'rgba(0,0,0,.35)',justifyContent:'flex-end'}, modalCard:{backgroundColor:'#fffdf8',borderTopLeftRadius:22,borderTopRightRadius:22,padding:18,maxHeight:'80%'}, modalTitle:{fontSize:18,fontWeight:'900',color:DARK,marginBottom:10}, option:{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#eee'}, optionText:{fontWeight:'800',color:DARK}, optionSub:{fontSize:11,color:'#777'},
  bottom:{position:'absolute',left:12,right:12,bottom:12,backgroundColor:'#fffdf8',borderRadius:22,borderWidth:1,borderColor:LINE,flexDirection:'row',paddingVertical:8,shadowColor:'#000',shadowOpacity:.12,shadowRadius:10,elevation:8}, navItem:{flex:1,alignItems:'center'}, navIcon:{fontSize:20,color:'#777'}, navText:{fontSize:10,color:'#777',fontWeight:'800'}, navActive:{color:GREEN}
});
