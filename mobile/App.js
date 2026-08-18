import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const today = new Date().toISOString().slice(0, 10);
const GREEN = '#0b7a2a';
const DARK = '#14361f';
const SOFT = '#f7f4ec';
const LINE = '#e3ddcf';
const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || '0a3c56cb73b74ef5802121513261008';
const WEATHER_LOCATION = process.env.EXPO_PUBLIC_WEATHER_LOCATION || 'bengaluru';
const PRODUCTION_API_BASE = 'https://coffee-estate-app.pages.dev/api';
const FAVORITES_KEY = 'estate-app-favorite-modules';
const QUICK_ACTIONS = [
  ['Attendance','✅','attendanceQuick'],['Rain','🌧️','rainfallQuick'],['Expense','💵','expenses'],['Labour','👷','labors'],
  ['Plant / Crop','🌱','plantInventory'],['Wage Sheet','🧾','wageSettlements'],['Harvest','🌾','yieldQuick'],['Blocks','🗺️','blocks'],
  ['Base Units','📐','baseUnits'],['Property','🏡','properties'],['Vendor','🤝','vendors'],['Work Assignment','🧑‍🌾','workAssignments'],
  ['Work Activity','📝','workActivities'],['Fertilizer','🌿','fertilizers'],['Crop Income','💰','cropIncome'],['Assets','🚜','assets']
];
const DEFAULT_FAVORITES = ['attendanceQuick','rainfallQuick','expenses','labors','plantInventory','wageSettlements','yieldQuick'];
const DATE_FIELDS = { attendanceQuick:'entry_date', rainfallQuick:'recorded_date', yieldQuick:'picking_date', expenses:'expense_occurence_date', fertilizers:'date_of_application', workAssignments:'work_date', wageSettlements:'running_wage_transaction_date', vendorSettlements:'running_wage_transaction_date', cropIncome:'received_date', plantInventory:'planting_date' };

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
const requiredFields = {
  attendanceQuick: ['labor_id','entry_date','attendance_value'],
  workAssignments: ['work_date','work_activity_id','labor_id','block_id'],
  rainfallQuick: ['block_id','recorded_date','rain_value'],
  yieldQuick: ['yieldrate_id','picking_date','quantity']
};

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
  yieldQuick:[['yieldrate_id','select','Yield Rate / Crop','yieldRates','yieldrate_id','yield_rate_label'],['picking_date','date','Picking Date'],['quantity','number','Quantity']],
  expenses:[['expensetype_id','select','Expense Type','expenseTypes','expensetype_id','expense_name'],['property_id','select','Property','properties','property_id','property_name'],['expense_code','text','Code / Notes'],['expense_occurence_date','date','Date'],['other_expense','number','Amount']],
  workActivities:[['work_activity_name','text','Work Activity Name'],['work_activity_type','text','Type'],['notes','text','Notes']],
  workAssignments:[['work_date','date','Work Date'],['work_activity_id','select','Work Activity','workActivities','work_activity_id','work_activity_name'],['labor_id','select','Labour','labors','labor_id','name'],['block_id','select','Block','blocks','block_id','block_name'],['notes','text','Notes']],
  reports:[['total_expenditure','number','Total Expenditure'],['total_revenue','number','Total Revenue'],['profit_loss','number','Profit / Loss'],['property_id','select','Property','properties','property_id','property_name']],
  settings:[]
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

function isoDate(value = new Date()) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function yesterdayDate() {
  const value = new Date();
  value.setDate(value.getDate() - 1);
  return isoDate(value);
}

function recordDate(row, moduleKey) {
  const preferred = DATE_FIELDS[moduleKey];
  const key = preferred && row[preferred] != null ? preferred : ['entry_date','recorded_date','date_time','picking_date','yield_settlement_date','expense_occurence_date','work_date','date_of_application','running_wage_transaction_date','received_date','planting_date','created_on'].find(item => row[item] != null);
  return key ? String(row[key]).slice(0, 10) : '';
}

function itemTitle(row) {
  if (!row) return 'Record';
  return row.property_name || row.block_name || row.name || row.vendorname || row.plant_type || row.work_activity_name || row.expense_name || row.baseunit_name || row.asset_name || row.yieldtype_name || row.fertilizer_name || row.labor_name || row.crop_label || `Record #${row.id || row[Object.keys(row).find(k => k.endsWith('_id'))] || ''}`;
}

function rowId(row) {
  const key = Object.keys(row || {}).find(item => item.endsWith('_id'));
  return key ? row[key] : null;
}

function optionLabel(option, preferredKey) {
  return option?.[preferredKey] || option?.assignment_label || option?.yield_rate_label || option?.labor_name || option?.name || option?.property_name || option?.block_name || option?.plant_type || option?.work_activity_name || option?.vendorname || option?.expense_name || option?.yieldtype_name || option?.baseunit_name || option?.crop_label || '';
}

function normalizedName(value) {
  return String(value || '').trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
}

function profitTotal(dashboard) {
  return Number(dashboard?.profit?.total ?? dashboard?.profit ?? 0);
}

function friendlyError(error) {
  const message = error?.message || String(error || 'Something went wrong');
  if (/must have attendance/i.test(message)) return 'Attendance is required first. Record this labourer’s attendance for the selected property and work date, then create the work assignment.';
  if (/unique constraint.*work_assignment/i.test(message)) return 'This labourer already has the same work assignment for the selected block and date.';
  if (/foreign key constraint/i.test(message)) return 'One of the selected records is no longer available. Refresh and select it again.';
  return message;
}

export default function App() {
  const defaultApiBase = process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_BASE;
  const apiBase = defaultApiBase;
  const [user, setUser] = useState(null);
  const [propertyId, setPropertyId] = useState('');
  const [meta, setMeta] = useState({});
  const [dashboard, setDashboard] = useState(null);
  const [data, setData] = useState({});
  const [screen, setScreen] = useState('home');
  const [activeModule, setActiveModule] = useState('attendanceQuick');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState(DEFAULT_FAVORITES);
  const [favoriteEditorOpen, setFavoriteEditorOpen] = useState(false);

  const property = (meta.properties || []).find(p => String(p.property_id) === String(propertyId));

  const headers = () => ({
    'Content-Type': 'application/json',
    'x-user-id': user?.user_id ? String(user.user_id) : '',
    'x-property-id': propertyId ? String(propertyId) : ''
  });

  async function request(path, options = {}) {
    const apiPath = path.replace(/^\/api(?=\/|$)/, '');
    const url = `${apiBase.replace(/\/$/, '')}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
    const res = await fetch(url, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!res.ok) throw new Error(body?.error || String(body || text || `HTTP ${res.status}`));
    return body;
  }

  async function safe(task, quiet = false) {
    try { setLoading(true); setError(''); return await task(); }
    catch (e) { const message = friendlyError(e); setError(message); if (!quiet) Alert.alert('Unable to continue', message); }
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
      const historyFrom = new Date(); historyFrom.setFullYear(historyFrom.getFullYear() - 1);
      const historyQuery = `?from=${isoDate(historyFrom)}&to=${isoDate()}`;
      const [m, d, attendance, rainfall, yieldRows] = await Promise.all([
        request('/api/meta'), request('/api/dashboard'), request(`/api/attendance${historyQuery}`), request(`/api/rainfall${historyQuery}`), request(`/api/yield${historyQuery}`)
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
  useEffect(() => { AsyncStorage.getItem(FAVORITES_KEY).then(value => { if (value) setFavorites(JSON.parse(value).slice(0, 8)); }).catch(() => {}); }, []);

  async function updateFavorites(next) {
    const limited = next.slice(0, 8);
    setFavorites(limited);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(limited));
  }

  if (!user) return <Login onLogin={login} loading={loading} error={error} />;

  const openModule = (key) => { setActiveModule(key); setScreen(key === 'dashboardReport' ? 'reports' : 'module'); };

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="dark-content" backgroundColor="#fffdf8" translucent={false} />
    <Header property={property} user={user} dateLabel={new Intl.DateTimeFormat('en-IN', { day:'numeric', month:'short', weekday:'short' }).format(new Date())} />
    <PropertyBar properties={meta.properties || []} propertyId={propertyId} setPropertyId={setPropertyId} />
    <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAll} />} contentContainerStyle={styles.body}>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {screen === 'home' && <Home dashboard={dashboard} data={data} openModule={openModule} favorites={favorites} editFavorites={() => setFavoriteEditorOpen(true)} />}
      {screen === 'add' && <QuickAdd openModule={openModule} />}
      {screen === 'modules' && <Modules openModule={openModule} />}
      {screen === 'reports' && <Reports dashboard={dashboard} data={data} openModule={openModule} />}
      {screen === 'more' && <More user={user} onLogout={() => setUser(null)} openModule={openModule} />}
      {screen === 'module' && <ModuleScreen moduleKey={activeModule} user={user} propertyId={propertyId} data={data} setData={setData} meta={meta} request={request} reload={loadAll} />}
    </ScrollView>
    <FavoriteEditor visible={favoriteEditorOpen} favorites={favorites} setFavorites={updateFavorites} close={() => setFavoriteEditorOpen(false)} />
    <BottomNav screen={screen} setScreen={setScreen} />
  </SafeAreaView>;
}

function Login({ onLogin, loading, error }) {
  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('owner123');
  return <SafeAreaView style={styles.loginPage}>
    <StatusBar barStyle="dark-content" backgroundColor="#f3efe4" translucent={false} />
    <KeyboardAvoidingView style={styles.loginKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.loginScroll}>
        <Image source={require('./logo.png')} style={styles.logoImage} accessibilityLabel="Estate App coffee bean logo" />
        <Text style={styles.loginTitle}>Estate App</Text>
        <Text style={styles.loginSub}>Simple • Smart • For Estate Owners</Text>
        <View style={styles.loginCard}>
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

function Home({ dashboard, data, openModule, favorites, editFavorites }) {
  const summary = [
    ['Workers', dashboard?.attendance?.entries || data.labors?.length || 0, '👥'], ['Rain Today', `${dashboard?.rainfall?.total || 0} mm`, '🌧️'], ['Plants', dashboard?.plantInventoryTotal?.total_plants || 0, '🌱'], ['Net Profit', `₹${profitTotal(dashboard).toLocaleString('en-IN')}`, '💰']
  ];
  return <View>
    <WeatherHero />
    <View style={styles.grid}>{summary.map(s => <View key={s[0]} style={styles.stat}><Text style={styles.statIcon}>{s[2]}</Text><Text style={styles.statValue}>{s[1]}</Text><Text style={styles.statLabel}>{s[0]}</Text></View>)}</View>
    <Section title="Quick Add" right={`${favorites.length}/8 shortcuts`}><IconGrid items={[...favorites.map(key => QUICK_ACTIONS.find(a => a[2] === key)).filter(Boolean),['More','•••','favorites']]} openModule={openModule} onMore={editFavorites} /></Section>
    <Section title="Today's Tasks"><RecordList rows={data.workAssignments || []} empty="No tasks assigned today." /></Section>
  </View>;
}

function FavoriteEditor({ visible, favorites, setFavorites, close }) {
  const toggle = key => {
    if (favorites.includes(key)) return setFavorites(favorites.filter(item => item !== key));
    if (favorites.length >= 8) return Alert.alert('Shortcut limit', 'You can select up to 8 favorite modules. Remove one before adding another.');
    setFavorites([...favorites, key]);
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
    <View style={styles.modalBack}><View style={styles.favoriteModal}>
      <View style={styles.favoriteHead}><View><Text style={styles.modalTitle}>Favorite shortcuts</Text><Text style={styles.favoriteHint}>Choose up to 8 • saved on this device</Text></View><TouchableOpacity style={styles.closeButton} onPress={close}><Text style={styles.closeButtonText}>×</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.favoriteList}>{QUICK_ACTIONS.map(([title,icon,key]) => {
        const active = favorites.includes(key);
        return <TouchableOpacity key={key} style={[styles.favoriteRow,active && styles.favoriteRowActive]} onPress={() => toggle(key)}><Text style={styles.favoriteIcon}>{icon}</Text><Text style={styles.favoriteName}>{title}</Text><View style={[styles.favoriteCheck,active && styles.favoriteCheckActive]}><Text style={styles.favoriteCheckText}>{active ? '✓' : '+'}</Text></View></TouchableOpacity>;
      })}</ScrollView>
      <TouchableOpacity style={styles.primary} onPress={close}><Text style={styles.primaryText}>Done ({favorites.length}/8)</Text></TouchableOpacity>
    </View></View>
  </Modal>;
}

function QuickAdd({ openModule }) {
  return <View><Text style={styles.screenTitle}>Quick Add</Text><IconGrid items={QUICK_ACTIONS} openModule={openModule} /></View>;
}

function Modules({ openModule }) {
  return <View><Text style={styles.screenTitle}>All Modules</Text>{moduleGroups.map(g => <View key={g.key} style={styles.card}><Text style={styles.sectionTitle}>{g.icon} {g.title}</Text>{g.items.map(i => <TouchableOpacity key={i} style={styles.moduleRow} onPress={() => openModule(i)}><Text style={styles.moduleName}>{labels[i]}</Text><Text style={styles.chev}>›</Text></TouchableOpacity>)}</View>)}</View>;
}

function Reports({ dashboard, data, openModule }) {
  const reportCards = [
    ['Rainfall Report', `${dashboard?.rainfall?.total || 0} mm`, '🌧️', 'rainfallQuick'], ['Expense Report', `₹${dashboard?.expenses?.total || 0}`, '💵', 'expenses'], ['Labour Report', `${dashboard?.attendance?.labor_days || 0} days`, '👥', 'attendanceQuick'], ['Plant Report', `${dashboard?.plantInventoryTotal?.total_plants || 0}`, '🌱', 'plantInventory'], ['Work Report', `${dashboard?.workAssignmentTotal?.entries || 0}`, '🧑‍🌾', 'workAssignments'], ['Profit Report', `₹${profitTotal(dashboard).toLocaleString('en-IN')}`, '📊', 'reports']
  ];
  return <View><Text style={styles.screenTitle}>Reports</Text><View style={styles.grid}>{reportCards.map(r => <TouchableOpacity key={r[0]} style={styles.reportCard} onPress={() => openModule(r[3])}><Text style={styles.statIcon}>{r[2]}</Text><Text style={styles.reportValue}>{r[1]}</Text><Text style={styles.statLabel}>{r[0]}</Text></TouchableOpacity>)}</View><Section title="Recent Attendance"><RecordList rows={data.attendance || []} /></Section><Section title="Plant Distribution"><RecordList rows={dashboard?.plantByType || data.plantInventory || []} /></Section></View>;
}

function More({ user, onLogout, openModule }) {
  return <View><Text style={styles.screenTitle}>More</Text><View style={styles.card}><Text style={styles.sectionTitle}>Account</Text><Text style={styles.note}>Logged in as {user?.username}</Text><TouchableOpacity style={styles.secondary} onPress={onLogout}><Text style={styles.secondaryText}>Logout</Text></TouchableOpacity></View><Section title="Secure & Reliable"><IconGrid items={[['Offline First Ready','📴','settings'],['Multi Language Ready','🌐','settings'],['Backup / Restore','💾','settings'],['Notifications','🔔','notifications']]} openModule={openModule} /></Section></View>;
}

function ModuleScreen({ moduleKey, user, propertyId, data, setData, meta, request, reload }) {
  const endpoint = resourceOf[moduleKey] || moduleKey;
  const [form, setForm] = useState(defaultForm(moduleKey, propertyId));
  const [editingId, setEditingId] = useState(null);
  const rows = data[endpoint] || data[moduleKey] || [];
  const [fromDate, setFromDate] = useState(yesterdayDate());
  const [toDate, setToDate] = useState(isoDate());
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const parentBlocks = moduleKey === 'plantInventory' ? (data.blocks || []).filter(block => !block.parent_block_id) : [];
  const subBlocks = moduleKey === 'plantInventory' && form.block_id ? (data.blocks || []).filter(block => String(block.parent_block_id) === String(form.block_id)) : [];
  const laborOptions = data.labors?.length ? data.labors : (meta.labors || []);
  const laborIdForAttendance = item => {
    if (item?.labor_id != null) return String(item.labor_id);
    const attendanceName = normalizedName(item?.labor_name || item?.name);
    const labor = laborOptions.find(candidate => normalizedName(candidate.name || candidate.labor_name) === attendanceName);
    return labor?.labor_id != null ? String(labor.labor_id) : '';
  };
  const attendedLaborIds = moduleKey === 'workAssignments' ? new Set((data.attendance || []).filter(item => String(item.entry_date || '').slice(0,10) === String(form.work_date || '').slice(0,10)).map(laborIdForAttendance).filter(Boolean)) : new Set();
  const availableAssignmentLabors = moduleKey === 'workAssignments' ? laborOptions.map(item => ({ ...item, assignment_label: `${item.name || item.labor_name || `Labour #${item.labor_id}`} — ${attendedLaborIds.has(String(item.labor_id)) ? 'attendance recorded' : 'attendance missing'}` })) : [];
  const fields = (fieldConfig[moduleKey] || []).map(field => {
    if (field[0] === 'block_id' && parentBlocks.length) return ['block_id','select','Block','availableParentBlocks','block_id','block_name'];
    if (field[0] === 'sub_block_name' && subBlocks.length) return ['sub_block_name','select','Sub-block / Section','availableSubBlocks','block_name','block_name',true];
    if (field[0] === 'labor_id' && moduleKey === 'workAssignments') return ['labor_id','select','Labour','availableAssignmentLabors','labor_id','assignment_label'];
    return field;
  });
  const fieldData = { ...data, availableParentBlocks: parentBlocks, availableSubBlocks: subBlocks, availableAssignmentLabors };
  const hasDateFilter = Boolean(DATE_FIELDS[moduleKey]);
  const filteredRows = hasDateFilter ? rows.filter(row => { const date = recordDate(row,moduleKey); return date && date >= fromDate && date <= toDate; }) : rows;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setForm(defaultForm(moduleKey, propertyId)); setEditingId(null); setFromDate(yesterdayDate()); setToDate(isoDate()); setPage(1); }, [moduleKey, propertyId]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount]);

  async function save() {
    if (moduleKey === 'settings') return Alert.alert('Saved', 'API settings updated.');
    const payload = { ...form, property_id: form.property_id || propertyId, user_id: user.user_id, created_by: user.username };
    const missingField = fields.find(([key]) => (requiredFields[moduleKey] || []).includes(key) && (form[key] == null || String(form[key]).trim() === ''));
    if (missingField) return Alert.alert('Required field', `Select or enter ${missingField[2]} before saving.`);
    if (moduleKey === 'attendanceQuick' && !optionSets.attendanceOptions.some(item => String(item.id) === String(form.attendance_value))) return Alert.alert('Attendance required', 'Select Full Day, Half Day, Absent, Hourly, or another attendance value before saving.');
    if (moduleKey === 'workAssignments' && !attendedLaborIds.has(String(form.labor_id))) return Alert.alert('Attendance required', 'The selected labourer does not have attendance for this property and work date. Save attendance first, then return to Work Assignment.');
    try {
      await request(`/api/${endpoint}${editingId ? `/${editingId}` : ''}`, { method: editingId ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      setForm(defaultForm(moduleKey, propertyId));
      const wasEditing = Boolean(editingId);
      setEditingId(null);
      await reload();
      Alert.alert(wasEditing ? 'Updated' : 'Saved', `${labels[moduleKey]} ${wasEditing ? 'updated' : 'saved'}.`);
    } catch (error) { Alert.alert('Could not save', friendlyError(error)); }
  }
  async function remove(row) {
    const id = rowId(row);
    if (!id) return Alert.alert('Info', 'This record cannot be deleted because its identifier is missing.');
    Alert.alert('Delete?', itemTitle(row), [{text:'Cancel'}, {text:'Delete', style:'destructive', onPress: async () => { try { await request(`/api/${endpoint}/${id}`, { method:'DELETE' }); await reload(); } catch (error) { Alert.alert('Could not delete', friendlyError(error)); } }}]);
  }

  function edit(row) {
    const id = rowId(row);
    if (!id) return Alert.alert('Info', 'This record cannot be edited because its identifier is missing.');
    const next = defaultForm(moduleKey, propertyId);
    fields.forEach(([key]) => {
      let value = row[key];
      if (value == null && key === 'recorded_date') value = row.date_time;
      if (value == null && key === 'picking_date') value = row.yield_settlement_date;
      if (value != null) next[key] = key.includes('date') ? String(value).slice(0,10) : String(value);
    });
    setForm(next);
    setEditingId(id);
  }

  if (moduleKey === 'notifications') return <View><Text style={styles.screenTitle}>Notifications</Text><Section title="Today"><Suggestion danger text="Heavy rain expected tomorrow." /><Suggestion warning text="Wage sheet generated for today." /><Suggestion warning text="Expense limit crossed this month." /><Suggestion text="New labour added: Ramesh." /></Section></View>;
  if (moduleKey === 'dashboardReport') return <Reports dashboard={data.dashboard} data={data} openModule={()=>{}} />;

  return <View><Text style={styles.screenTitle}>{labels[moduleKey]}</Text><View style={styles.card}>{editingId && <Text style={styles.editingBanner}>Editing record #{editingId}</Text>}{fields.map(f => <SmartField key={f[0]} field={f} value={form[f[0]]} setValue={(v) => setForm(f[0] === 'block_id' && moduleKey === 'plantInventory' ? {...form,block_id:v,sub_block_name:''} : {...form,[f[0]]:v})} meta={meta} data={fieldData} />)}{moduleKey === 'workAssignments' && form.work_date && !attendedLaborIds.size && <Text style={styles.inlineWarning}>No matching attendance is loaded for {form.work_date}. Labourers remain visible below; records without attendance cannot be assigned.</Text>}<TouchableOpacity style={styles.primary} onPress={save}><Text style={styles.primaryText}>{editingId ? 'Update' : 'Save'}</Text></TouchableOpacity>{editingId && <TouchableOpacity style={styles.secondary} onPress={() => { setForm(defaultForm(moduleKey, propertyId)); setEditingId(null); }}><Text style={styles.secondaryText}>Cancel edit</Text></TouchableOpacity>}</View><Section title="Records" right={`${filteredRows.length} entries`}>{hasDateFilter && <DateRangeFilter fromDate={fromDate} toDate={toDate} setFromDate={value => { setFromDate(value); setPage(1); }} setToDate={value => { setToDate(value); setPage(1); }} />}<RecordList rows={visibleRows} moduleKey={moduleKey} data={data} meta={meta} onEdit={edit} onDelete={remove} /><Pagination page={page} pageCount={pageCount} setPage={setPage} /></Section></View>;
}

function SmartField({ field, value, setValue, meta, data }) {
  const [open, setOpen] = useState(false);
  const [key, type, label, source, idKey, nameKey, optional] = field;
  if (type !== 'select') return <FieldText label={label} value={String(value ?? '')} onChangeText={setValue} keyboardType={type === 'number' ? 'numeric' : 'default'} placeholder={type === 'date' ? 'YYYY-MM-DD' : label} />;
  const rawOpts = optionSets[source] || (meta[source]?.length ? meta[source] : data[source]) || [];
  const opts = rawOpts.filter((option,index,list) => list.findIndex(candidate => String(candidate?.[idKey]) === String(option?.[idKey])) === index);
  const selected = opts.find(o => String(o[idKey]) === String(value));
  return <View style={{marginBottom:12}}><Text style={styles.label}>{label}{optional ? ' (optional)' : ''}</Text><TouchableOpacity style={styles.inputButton} onPress={() => setOpen(true)}><Text style={selected ? styles.inputText : styles.placeholder}>{selected ? (optionLabel(selected,nameKey) || selected[idKey]) : `Select ${label}`}</Text></TouchableOpacity><Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}><View style={styles.modalBack}><View style={styles.modalCard}><Text style={styles.modalTitle}>{label}</Text><ScrollView>{optional && <TouchableOpacity style={styles.option} onPress={() => { setValue(''); setOpen(false); }}><Text>None</Text></TouchableOpacity>}{opts.map((o,index) => <TouchableOpacity key={`select-${source}-${String(o[idKey])}-${index}`} style={styles.option} onPress={() => { setValue(String(o[idKey])); setOpen(false); }}><Text style={styles.optionText}>{optionLabel(o,nameKey) || o[idKey]}</Text></TouchableOpacity>)}</ScrollView><TouchableOpacity style={styles.secondary} onPress={() => setOpen(false)}><Text style={styles.secondaryText}>Close</Text></TouchableOpacity></View></View></Modal></View>;
}

function DateRangeFilter({ fromDate, toDate, setFromDate, setToDate }) {
  const [picker, setPicker] = useState(null);
  const todayValue = new Date(`${isoDate()}T12:00:00`);
  const apply = (type, date) => {
    const next = isoDate(date);
    if (type === 'from') {
      const earliest = new Date(`${toDate}T12:00:00`); earliest.setFullYear(earliest.getFullYear() - 1);
      if (date > new Date(`${toDate}T12:00:00`)) return Alert.alert('Invalid date range', 'From date cannot be after To date.');
      if (date < earliest) return Alert.alert('Range too large', 'The maximum date range is one year.');
      setFromDate(next);
    } else {
      const start = new Date(`${fromDate}T12:00:00`);
      if (date < start) return Alert.alert('Invalid date range', 'To date cannot be before From date.');
      const latest = new Date(start); latest.setFullYear(latest.getFullYear() + 1);
      if (date > latest) return Alert.alert('Range too large', 'The maximum date range is one year.');
      setToDate(next);
    }
  };
  return <View style={styles.dateFilter}>
    <View style={styles.dateFilterHead}><Text style={styles.dateFilterTitle}>History period</Text><TouchableOpacity onPress={() => { setFromDate(yesterdayDate()); setToDate(isoDate()); }}><Text style={styles.dateReset}>Reset</Text></TouchableOpacity></View>
    <View style={styles.dateButtons}>
      <TouchableOpacity style={styles.dateButton} onPress={() => setPicker('from')}><Text style={styles.dateButtonLabel}>FROM</Text><Text style={styles.dateButtonValue}>{fromDate}</Text></TouchableOpacity>
      <Text style={styles.dateArrow}>→</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setPicker('to')}><Text style={styles.dateButtonLabel}>TO</Text><Text style={styles.dateButtonValue}>{toDate}</Text></TouchableOpacity>
    </View>
    {!!picker && <DateTimePicker value={new Date(`${picker === 'from' ? fromDate : toDate}T12:00:00`)} mode="date" maximumDate={picker === 'to' ? todayValue : new Date(`${toDate}T12:00:00`)} minimumDate={picker === 'to' ? new Date(`${fromDate}T12:00:00`) : undefined} onChange={(event,date) => { setPicker(Platform.OS === 'ios' ? picker : null); if (event.type !== 'dismissed' && date) apply(picker,date); }} />}
  </View>;
}

function Pagination({ page, pageCount, setPage }) {
  if (pageCount <= 1) return null;
  return <View style={styles.pagination}><TouchableOpacity disabled={page === 1} style={[styles.pageButton,page === 1 && styles.pageDisabled]} onPress={() => setPage(page - 1)}><Text style={styles.pageButtonText}>Previous</Text></TouchableOpacity><Text style={styles.pageStatus}>Page {page} of {pageCount}</Text><TouchableOpacity disabled={page === pageCount} style={[styles.pageButton,page === pageCount && styles.pageDisabled]} onPress={() => setPage(page + 1)}><Text style={styles.pageButtonText}>Next</Text></TouchableOpacity></View>;
}

const referenceFields = {
  labor_id:['labors','labor_id','name','Labour'], block_id:['blocks','block_id','block_name','Block'], property_id:['properties','property_id','property_name','Property'],
  work_activity_id:['workActivities','work_activity_id','work_activity_name','Activity'], plant_id:['plants','plant_id','plant_type','Plant'], vendor_id:['vendors','vendor_id','vendorname','Vendor'],
  expensetype_id:['expenseTypes','expensetype_id','expense_name','Expense type'], yieldtype_id:['yieldTypes','yieldtype_id','yieldtype_name','Yield type'], yieldrate_id:['yieldRates','yieldrate_id','yield_rate_label','Yield rate']
};

function recordDetails(row, data, meta) {
  return Object.entries(row).filter(([key,value]) => value != null && value !== '' && !['created_by','modified_by','created_on','modified_on','user_id'].includes(key)).map(([key,value]) => {
    if (referenceFields[key]) {
      const [source,idKey,nameKey,label] = referenceFields[key];
      const match = (data[source] || meta[source] || []).find(item => String(item[idKey]) === String(value));
      return [label, optionLabel(match,nameKey) || `Unknown (${value})`];
    }
    if (key.endsWith('_id')) return null;
    const label = key.replaceAll('_',' ').replace(/\b\w/g, letter => letter.toUpperCase());
    return [label,value];
  }).filter(Boolean).slice(0, 6);
}

function FieldText({ label, value, onChangeText, ...props }) { return <View style={{marginBottom:12}}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} autoCapitalize="none" placeholderTextColor="#9c9a91" {...props} /></View>; }
function Section({ title, right, children }) { return <View style={styles.card}><View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text>{right && <Text style={styles.sectionRight}>{right}</Text>}</View>{children}</View>; }
function Suggestion({ text, danger, warning }) { return <View style={styles.suggestion}><Text>{danger ? '🔴' : warning ? '🟠' : '🟢'}</Text><Text style={styles.suggestionText}>{text}</Text></View>; }
function IconGrid({ items, openModule, onMore }) { return <View style={styles.iconGrid}>{items.map(([t,ic,key],index) => <TouchableOpacity key={`${key}-${t}-${index}`} style={styles.iconTile} onPress={() => key === 'favorites' ? onMore?.() : openModule(key)}><Text style={styles.icon}>{ic}</Text><Text style={styles.iconLabel}>{t}</Text></TouchableOpacity>)}</View>; }
function RecordList({ rows = [], empty = 'No records in this period.', moduleKey, data = {}, meta = {}, onEdit, onDelete }) { if (!rows?.length) return <Text style={styles.muted}>{empty}</Text>; return <View>{rows.map((r,i) => { const details = recordDetails(r,data,meta); const preferredTitle = r.labor_name || r.work_activity_name || r.block_name || r.property_name || r.name || details.find(([label]) => ['Labour','Activity','Block','Plant','Vendor'].includes(label))?.[1] || itemTitle(r); return <View key={`${rowId(r) || 'row'}-${i}`} style={styles.record}><View style={{flex:1}}><Text style={styles.recordTitle}>{preferredTitle}</Text>{details.map(([label,value],detailIndex) => <View key={`detail-${label}-${detailIndex}`} style={styles.recordDetail}><Text style={styles.recordLabel}>{label}</Text><Text style={styles.recordValue}>{String(value)}</Text></View>)}</View><View style={styles.recordActions}>{onEdit && <TouchableOpacity accessibilityLabel="Edit record" onPress={() => onEdit(r)}><Text style={styles.edit}>✏️</Text></TouchableOpacity>}{onDelete && <TouchableOpacity accessibilityLabel="Delete record" onPress={() => onDelete(r)}><Text style={styles.delete}>🗑️</Text></TouchableOpacity>}</View></View>; })}</View>; }
function BottomNav({ screen, setScreen }) { const nav = [['home','Home','🏠'],['add','Add','＋'],['modules','Modules','📋'],['reports','Reports','📊'],['more','More','☰']]; return <View style={styles.bottom}>{nav.map(n => <TouchableOpacity key={n[0]} style={styles.navItem} onPress={() => setScreen(n[0])}><Text style={[styles.navIcon, screen===n[0] && styles.navActive]}>{n[2]}</Text><Text style={[styles.navText, screen===n[0] && styles.navActive]}>{n[1]}</Text></TouchableOpacity>)}</View>; }

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:SOFT,paddingTop:Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0}, body:{padding:12,paddingBottom:96}, header:{minHeight:72,paddingHorizontal:16,paddingTop:12,paddingBottom:10,backgroundColor:'#fffdf8',borderBottomWidth:1,borderBottomColor:LINE,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},headerCopy:{flex:1,minWidth:0},headerMeta:{width:124,alignItems:'flex-end'},smallCaps:{fontWeight:'900',fontSize:15,color:'#111'}, headerTitle:{fontSize:12,color:'#3c453c',marginTop:3}, date:{fontSize:11,color:'#555'}, location:{fontSize:11,color:DARK,fontWeight:'700',marginTop:3,maxWidth:124}, user:{fontSize:10,color:'#777',marginTop:2,maxWidth:124},
  propertySelectorWrap:{backgroundColor:'#fffdf8',paddingHorizontal:12,paddingVertical:9,borderBottomWidth:1,borderBottomColor:'#d7d1c4'},propertySelector:{minHeight:62,flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderWidth:1.5,borderColor:'#b8c4b9',borderRadius:15,paddingHorizontal:12,paddingVertical:9,elevation:2,shadowColor:'#173d22',shadowOpacity:.08,shadowRadius:5},propertyBadge:{width:38,height:38,borderRadius:12,backgroundColor:'#e8f4e9',alignItems:'center',justifyContent:'center',marginRight:10},propertyBadgeText:{color:GREEN,fontWeight:'900',fontSize:18},propertySelectedCopy:{flex:1,minWidth:0},propertyEyebrow:{fontSize:9,color:'#738078',fontWeight:'900',letterSpacing:.7},propertySelectedName:{fontSize:15,color:DARK,fontWeight:'900',marginTop:1},propertySelectedAddress:{fontSize:10,color:'#687169',marginTop:1},propertyChange:{flexDirection:'row',alignItems:'center',backgroundColor:'#edf7ee',paddingHorizontal:10,paddingVertical:7,borderRadius:12,marginLeft:8},propertyChangeText:{fontSize:11,color:GREEN,fontWeight:'900'},propertyChevron:{fontSize:17,color:GREEN,fontWeight:'900',marginLeft:4,marginTop:-3},
  propertyModal:{backgroundColor:'#fffdf8',borderTopLeftRadius:24,borderTopRightRadius:24,padding:18,maxHeight:'82%'},propertyModalHead:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'},propertyCount:{fontSize:11,color:'#727b74',marginTop:-5,marginBottom:12},closeButton:{width:34,height:34,borderRadius:17,backgroundColor:'#eef0eb',alignItems:'center',justifyContent:'center'},closeButtonText:{fontSize:25,color:DARK,lineHeight:27},propertySearch:{backgroundColor:'#fff',borderWidth:1.5,borderColor:'#c5cec6',borderRadius:13,paddingHorizontal:14,paddingVertical:12,color:'#17291d',fontSize:14,marginBottom:10},propertyList:{paddingBottom:24},propertyOption:{flexDirection:'row',alignItems:'center',padding:12,borderBottomWidth:1,borderBottomColor:'#ece9e0',borderRadius:12},propertyOptionActive:{backgroundColor:'#edf7ee',borderBottomColor:'#d5ead8'},propertyOptionMark:{width:38,height:38,borderRadius:12,backgroundColor:'#f0f0ec',alignItems:'center',justifyContent:'center',marginRight:11},propertyOptionMarkActive:{backgroundColor:GREEN},propertyOptionMarkText:{fontWeight:'900',color:'#59645c'},propertyOptionMarkTextActive:{color:'#fff'},propertyOptionName:{fontSize:14,fontWeight:'900',color:DARK},propertyOptionMeta:{fontSize:10,color:'#6e786f',marginTop:3},propertyEmpty:{textAlign:'center',color:'#737b75',paddingVertical:30},
  loginPage:{flex:1,backgroundColor:'#f3efe4',paddingTop:Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0},loginKeyboard:{flex:1},loginScroll:{flexGrow:1,justifyContent:'center',paddingHorizontal:22,paddingTop:24,paddingBottom:36},logoImage:{alignSelf:'center',width:92,height:92,borderRadius:22,marginBottom:10},loginTitle:{fontSize:31,fontWeight:'900',color:GREEN,textAlign:'center'},loginSub:{backgroundColor:GREEN,color:'#fff',alignSelf:'center',paddingHorizontal:16,paddingVertical:7,borderRadius:18,overflow:'hidden',marginTop:7,marginBottom:16,fontWeight:'800'},loginCard:{backgroundColor:'#fffdf8',borderRadius:18,padding:16,borderWidth:1,borderColor:LINE},note:{fontSize:12,color:'#675',marginBottom:10},error:{color:'#b00020',fontWeight:'700',marginVertical:8},
  card:{backgroundColor:'#fffdf8',borderRadius:16,padding:14,marginBottom:12,borderWidth:1,borderColor:LINE,shadowColor:'#000',shadowOpacity:.05,shadowRadius:8,elevation:1}, screenTitle:{fontSize:22,fontWeight:'900',color:DARK,marginBottom:12}, sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}, sectionTitle:{fontSize:15,fontWeight:'900',color:DARK}, sectionRight:{fontSize:11,color:'#777'},
  weatherHero:{minHeight:220,borderRadius:22,padding:18,marginBottom:12,overflow:'hidden',shadowColor:'#10251b',shadowOpacity:.18,shadowRadius:12,elevation:5}, weatherGlow:{position:'absolute',right:-55,top:-60,width:210,height:210,borderRadius:105,opacity:.72}, weatherCopy:{zIndex:2,maxWidth:'67%'}, weatherPlace:{color:'rgba(255,255,255,.78)',fontSize:11,fontWeight:'900',letterSpacing:1}, weatherCondition:{color:'#fff',fontSize:18,fontWeight:'900',marginTop:8}, weatherTemperature:{color:'#fff',fontSize:46,fontWeight:'900',lineHeight:54}, weatherFeels:{color:'rgba(255,255,255,.9)',fontSize:11,fontWeight:'600'}, weatherArt:{position:'absolute',right:18,top:28,zIndex:2}, weatherIconImage:{width:96,height:96}, weatherEmoji:{fontSize:70}, rainLayer:{position:'absolute',right:8,top:78,width:145,height:74,overflow:'hidden'}, rainDrop:{position:'absolute',top:0,width:2,height:16,borderRadius:2,backgroundColor:'rgba(190,235,255,.75)',transform:[{rotate:'14deg'}]}, weatherMetrics:{position:'absolute',left:18,right:18,bottom:15,zIndex:3,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',backgroundColor:'rgba(0,0,0,.16)',borderRadius:13,paddingHorizontal:12,paddingVertical:9}, metricLabel:{color:'rgba(255,255,255,.72)',fontSize:9,textTransform:'uppercase'}, metricValue:{color:'#fff',fontSize:13,fontWeight:'900',marginTop:2}, weatherRefresh:{fontSize:11,fontWeight:'900',paddingVertical:5},
  weather:{width:168,backgroundColor:'#c88315',borderRadius:18,padding:14,marginBottom:12}, weatherRain:{backgroundColor:'#126247'}, weatherTop:{color:'#fff',fontWeight:'900'}, temp:{color:'#fff',fontWeight:'900',fontSize:28,marginVertical:10}, weatherSub:{color:'#fff',fontSize:12}, weatherFoot:{flexDirection:'row',justifyContent:'space-between',marginTop:14}, weatherMoney:{color:'#fff',fontWeight:'800',fontSize:11}, grid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:12}, stat:{width:'47.8%',backgroundColor:'#fffdf8',borderWidth:1,borderColor:LINE,borderRadius:16,padding:14}, statIcon:{fontSize:22}, statValue:{fontSize:20,fontWeight:'900',color:GREEN,marginTop:6}, statLabel:{fontSize:12,color:'#5d675f',fontWeight:'700'}, reportCard:{width:'47.8%',backgroundColor:'#fffdf8',borderWidth:1,borderColor:LINE,borderRadius:16,padding:14}, reportValue:{fontSize:17,fontWeight:'900',color:DARK,marginVertical:4},
  iconGrid:{flexDirection:'row',flexWrap:'wrap',gap:10}, iconTile:{width:'30.6%',alignItems:'center',paddingVertical:12,borderWidth:1,borderColor:LINE,borderRadius:14,backgroundColor:'#fff'}, icon:{fontSize:23}, iconLabel:{fontSize:11,textAlign:'center',color:DARK,fontWeight:'700',marginTop:5}, suggestion:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:7}, suggestionText:{fontSize:13,color:'#37433b'}, moduleRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#eee8da'}, moduleName:{fontSize:14,fontWeight:'800',color:DARK}, chev:{fontSize:28,color:GREEN},
  favoriteModal:{backgroundColor:'#fffdf8',borderTopLeftRadius:24,borderTopRightRadius:24,padding:18,maxHeight:'88%'},favoriteHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},favoriteHint:{fontSize:11,color:'#6f786f',marginTop:-5,marginBottom:10},favoriteList:{paddingBottom:10},favoriteRow:{flexDirection:'row',alignItems:'center',padding:11,borderWidth:1,borderColor:'#ebe7dc',borderRadius:13,marginBottom:7,backgroundColor:'#fff'},favoriteRowActive:{backgroundColor:'#edf7ee',borderColor:'#b8d9bd'},favoriteIcon:{fontSize:20,width:34},favoriteName:{flex:1,fontSize:13,fontWeight:'800',color:DARK},favoriteCheck:{width:28,height:28,borderRadius:9,backgroundColor:'#ecece7',alignItems:'center',justifyContent:'center'},favoriteCheckActive:{backgroundColor:GREEN},favoriteCheckText:{fontSize:16,color:'#fff',fontWeight:'900'},
  label:{fontSize:12,fontWeight:'800',color:DARK,marginBottom:6}, input:{backgroundColor:'#fff',borderWidth:1,borderColor:LINE,borderRadius:12,paddingHorizontal:12,paddingVertical:11,color:'#222'}, inputButton:{backgroundColor:'#fff',borderWidth:1,borderColor:LINE,borderRadius:12,paddingHorizontal:12,paddingVertical:13}, inputText:{color:'#222'}, placeholder:{color:'#9c9a91'}, primary:{backgroundColor:GREEN,borderRadius:12,paddingVertical:14,alignItems:'center',marginTop:4}, primaryText:{color:'#fff',fontWeight:'900'}, secondary:{borderWidth:1,borderColor:GREEN,borderRadius:12,paddingVertical:12,alignItems:'center',marginTop:8}, secondaryText:{color:GREEN,fontWeight:'900'},editingBanner:{backgroundColor:'#e7f3e8',color:GREEN,fontWeight:'900',padding:10,borderRadius:10,marginBottom:12},inlineWarning:{backgroundColor:'#fff2d8',color:'#765010',fontWeight:'700',padding:10,borderRadius:10,marginBottom:10},
  dateFilter:{backgroundColor:'#f4f7f2',borderRadius:13,padding:10,marginBottom:6,borderWidth:1,borderColor:'#dce5da'},dateFilterHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8},dateFilterTitle:{fontSize:11,fontWeight:'900',color:DARK},dateReset:{fontSize:11,fontWeight:'900',color:GREEN},dateButtons:{flexDirection:'row',alignItems:'center'},dateButton:{flex:1,backgroundColor:'#fff',borderWidth:1,borderColor:'#cbd4ca',borderRadius:10,paddingHorizontal:10,paddingVertical:8},dateButtonLabel:{fontSize:8,fontWeight:'900',color:'#758078'},dateButtonValue:{fontSize:12,fontWeight:'800',color:DARK,marginTop:2},dateArrow:{paddingHorizontal:8,color:GREEN,fontWeight:'900'},pagination:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:12},pageButton:{backgroundColor:'#e7f3e8',borderRadius:10,paddingHorizontal:13,paddingVertical:9},pageDisabled:{opacity:.35},pageButtonText:{fontSize:11,color:GREEN,fontWeight:'900'},pageStatus:{fontSize:11,color:'#687268',fontWeight:'700'},
  record:{flexDirection:'row',gap:8,backgroundColor:'#fff',borderWidth:1,borderColor:'#eee8da',borderRadius:12,padding:12,marginTop:8},recordTitle:{fontWeight:'900',color:DARK,marginBottom:7,fontSize:14},recordDetail:{flexDirection:'row',justifyContent:'space-between',gap:12,paddingVertical:2},recordLabel:{fontSize:10,color:'#7a827b',flex:1},recordValue:{fontSize:11,color:'#344039',fontWeight:'700',flex:1.4,textAlign:'right'},recordLine:{fontSize:11,color:'#616b63'},recordActions:{gap:12,alignItems:'center'},edit:{fontSize:18,marginLeft:6},delete:{fontSize:19,marginLeft:6},muted:{color:'#777',fontSize:13,paddingVertical:14,textAlign:'center'},
  modalBack:{flex:1,backgroundColor:'rgba(0,0,0,.35)',justifyContent:'flex-end'}, modalCard:{backgroundColor:'#fffdf8',borderTopLeftRadius:22,borderTopRightRadius:22,padding:18,maxHeight:'80%'}, modalTitle:{fontSize:18,fontWeight:'900',color:DARK,marginBottom:10}, option:{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#eee'}, optionText:{fontWeight:'800',color:DARK}, optionSub:{fontSize:11,color:'#777'},
  bottom:{position:'absolute',left:12,right:12,bottom:12,backgroundColor:'#fffdf8',borderRadius:22,borderWidth:1,borderColor:LINE,flexDirection:'row',paddingVertical:8,shadowColor:'#000',shadowOpacity:.12,shadowRadius:10,elevation:8}, navItem:{flex:1,alignItems:'center'}, navIcon:{fontSize:20,color:'#777'}, navText:{fontSize:10,color:'#777',fontWeight:'800'}, navActive:{color:GREEN}
});
