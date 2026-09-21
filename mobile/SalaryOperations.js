import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppIcon from './src/components/AppIcon';
import InfoTip from './src/components/InfoTip';
import { rateHelp } from './src/config/sectionHelp';
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const cash = n => n == null ? '--' : `\u20b9${Number(n).toLocaleString('en-IN', {
  maximumFractionDigits: 2
})}`;
const options = (rows, key, label) => rows.map(r => ({
  id: r[key],
  name: r[label]
}));
const categories = [['daily', 'Daily Wages'], ['work', 'Work Rates'], ['seasonal', 'Seasonal'], ['overtime', 'Overtime']];
const componentLabels = {
  fixed_earned: 'Base wage',
  work_earned: 'Work charges',
  variable_earned: 'Seasonal bonus',
  overtime_earned: 'OT / Extra',
  custom_earned: 'Other / Custom',
  advance_paid: 'Advance deduction'
};
function Button({
  title,
  onPress,
  secondary,
  disabled
}) {
  return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button, secondary && s.secondary, disabled && {
    opacity: .45
  }]}><Text style={[s.buttonText, secondary && {
      color: '#4b2814'
    }]}>{title}</Text></TouchableOpacity>;
}
function Field({
  label,
  value,
  onChange,
  numeric = true
}) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} style={s.input} value={String(value ?? '')} onChangeText={onChange} keyboardType={numeric ? 'decimal-pad' : 'default'} /></View>;
}
function Pair({
  label,
  value
}) {
  return <View style={s.row}><Text style={s.muted}>{label}</Text><Text style={s.bold}>{value}</Text></View>;
}
function Notice({
  children,
  error
}) {
  return <Text style={[s.notice, error && s.error]}>{children}</Text>;
}
function Header({
  title,
  onBack
}) {
  return <View style={s.row}>{onBack ? <TouchableOpacity accessibilityLabel="Back" onPress={onBack}><AppIcon name="back" size={24} /></TouchableOpacity> : null}<Text style={s.title}>{title}</Text></View>;
}
export function SetRates({
  propertyId,
  request,
  Choice,
  DateField
}) {
  const [exceptionCategory, setExceptionCategory] = useState(null);
  const [tab, setTab] = useState('daily'),
    [setup, setSetup] = useState({
      versions: [],
      activities: [],
      overtimeTypes: [],
      units: [],
      crops: []
    });
  const [form, setForm] = useState({
      effective_from: today(),
      effective_to: '',
      rates: []
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [newType, setNewType] = useState(null);
  const sequence = useRef(0),
    saving = useRef(false);
  async function load() {
    const stamp = ++sequence.current;
    try {
      const data = await request('/api/payroll/rates');
      if (stamp === sequence.current) setSetup(data);
    } catch (e) {
      if (stamp === sequence.current) setError(e.message);
    }
  }
  useEffect(() => {
    setSetup({
      versions: [],
      activities: [],
      overtimeTypes: [],
      units: [],
      crops: []
    });
    setForm({
      effective_from: today(),
      effective_to: '',
      rates: []
    });
    setNewType(null);
    setExceptionCategory(null);
    setError('');
    load();
    return () => {
      sequence.current++;
    };
  }, [propertyId]);
  const field = key => value => setForm(f => ({
    ...f,
    [key]: value
  }));
  function changeTab(category) {
    setTab(category);
    setError('');
    setNewType(null);
    setForm({
      effective_from: today(),
      effective_to: '',
      rates: category === 'work' ? setup.activities.map(a => ({
        work_activity_id: a.work_activity_id,
        name: a.work_activity_name,
        unit: 'work',
        rate: ''
      })) : category === 'overtime' ? setup.overtimeTypes.map(a => ({
        overtime_type_id: a.overtime_type_id,
        name: a.name,
        unit: a.unit,
        rate: ''
      })) : []
    });
  }
  async function save() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      await request('/api/payroll/rate-version', {
        method: 'POST',
        body: JSON.stringify({
          category: tab,
          effective_from: form.effective_from,
          effective_to: form.effective_to,
          payload: {
            ...form,
            rates: (form.rates || []).filter(r => r.rate !== '')
          }
        })
      });
      await load();
      setForm(f => ({
        ...f,
        effective_from: '',
        effective_to: ''
      }));
      Alert.alert('Rate version saved', 'Previous versions remain unchanged. Choose a new date range for the next version.');
    } catch (e) {
      setError(e.message);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  async function addType() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      if (!newType.name?.trim()) throw new Error('Enter a type name');
      const r = await request(tab === 'work' ? '/api/workActivities' : '/api/payroll/overtime-type', {
        method: 'POST',
        body: JSON.stringify(tab === 'work' ? {
          property_id: propertyId,
          work_activity_name: newType.name,
          work_activity_type: 'general'
        } : {
          name: newType.name,
          unit: newType.unit || 'hour'
        })
      });
      const id = r.id || r.work_activity_id || r.overtime_type_id;
      if (id) setForm(f => ({
        ...f,
        rates: [...(f.rates || []), {
          [tab === 'work' ? 'work_activity_id' : 'overtime_type_id']: id,
          name: newType.name,
          unit: tab === 'work' ? 'work' : newType.unit || 'hour',
          rate: ''
        }]
      }));
      setNewType(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  const history = setup.versions.filter(r => r.category === tab);
  const current = history.find(r => r.effective_from <= today() && r.effective_to >= today());
  const updateRate = (i, key, value) => setForm(f => ({
    ...f,
    rates: f.rates.map((r, index) => index === i ? {
      ...r,
      [key]: value
    } : r)
  }));
  if (exceptionCategory) return <LabourExceptions category={exceptionCategory} setup={setup} request={request} Choice={Choice} DateField={DateField} onChanged={load} onBack={() => setExceptionCategory(null)} />;
  return <View><Header title="Set Rates" /><Text style={s.muted}>Estate defaults for all labourers. Save a new version for each date range.</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>{categories.map(([id, label]) => <TouchableOpacity key={id} onPress={() => changeTab(id)} style={[s.tab, tab === id && s.tabOn]}><Text style={s.bold}>{label}</Text></TouchableOpacity>)}</ScrollView>
    <View style={s.row}><Text style={s.bold}>About these rates</Text><InfoTip title={categories.find(x => x[0] === tab)[1]} text={rateHelp[tab]} /></View>
    {error ? <Notice error>{error}</Notice> : null}
    {!current ? <Notice>No active {categories.find(x => x[0] === tab)[1].toLowerCase()} rate for today.{history.some(r => r.effective_to < today()) ? ' Previous rates have expired.' : ''}</Notice> : null}
    {current && (Date.parse(current.effective_to) - Date.parse(today())) / 86400000 <= 14 ? <Notice>Rates expire on {current.effective_to}.</Notice> : null}
    {tab === 'seasonal' ? history.filter(r => r.effective_from > today()).map(r => <Notice key={r.rate_version_id}>{r.payload.name} starts on {r.effective_from}.</Notice>) : null}
    <View style={s.card}><View style={s.row}><Text style={s.section}>Effective Period</Text><InfoTip title="Effective Period" text={rateHelp.period} /></View><DateField label="From Date *" value={form.effective_from} onChange={field('effective_from')} /><DateField label="To Date *" value={form.effective_to} onChange={field('effective_to')} />
    {tab === 'daily' ? <><Field label="Full Day Wage (1 day) *" value={form.full_day} onChange={field('full_day')} /><Field label="Half Day Wage (0.5 day) *" value={form.half_day} onChange={field('half_day')} /></> : null}
    {tab === 'seasonal' ? <><Field label="Season Name *" numeric={false} value={form.name} onChange={field('name')} /><Choice label="Crop / Category" optional options={options(setup.crops, 'crop_id', 'crop_name')} value={form.crop_id} onChange={field('crop_id')} /><Field label="Full Day Wage (optional override)" value={form.full_day} onChange={field('full_day')} /><Field label="Half Day Wage (optional override)" value={form.half_day} onChange={field('half_day')} /><Choice label="Bonus Unit *" options={options(setup.units, 'baseunit_id', 'baseunit_name')} value={form.unit_id} onChange={field('unit_id')} /><Field label="Minimum Quantity *" value={form.minimum_quantity} onChange={field('minimum_quantity')} /><Field label="Bonus Amount *" value={form.bonus_amount} onChange={field('bonus_amount')} /><Notice>One bonus per day when the minimum quantity is reached. It does not repeat for additional groups. Blank wages use the regular daily rate.</Notice></> : null}
    {['work', 'overtime'].includes(tab) ? <>{(form.rates || []).map((r, i) => <View key={i} style={s.inset}><Choice label={tab === 'work' ? 'Work Type' : 'Overtime Type'} options={tab === 'work' ? options(setup.activities, 'work_activity_id', 'work_activity_name') : options(setup.overtimeTypes, 'overtime_type_id', 'name')} value={r[tab === 'work' ? 'work_activity_id' : 'overtime_type_id']} onChange={v => updateRate(i, tab === 'work' ? 'work_activity_id' : 'overtime_type_id', v)} />{tab === 'work' ? <Choice label="Unit" value={r.unit} onChange={v => updateRate(i, 'unit', v)} options={['work', 'day', 'acre', 'tree', 'kg', 'bushel'].map(id => ({
            id,
            name: id === 'work' ? 'Per assigned work (flat)' : id === 'day' ? 'Per day (follows attendance)' : `Per ${id}`
          }))} /> : <Text style={s.muted}>Per {setup.overtimeTypes.find(t => String(t.overtime_type_id) === String(r.overtime_type_id))?.unit || r.unit}</Text>}<Field label={`Rate ${i + 1}`} value={r.rate} onChange={v => updateRate(i, 'rate', v)} /><Button title="Remove row" secondary onPress={() => setForm(f => ({
            ...f,
            rates: f.rates.filter((_, n) => n !== i)
          }))} /></View>)}
    <Button title="Add existing type" secondary onPress={() => setForm(f => ({
          ...f,
          rates: [...(f.rates || []), {
            unit: 'work',
            rate: ''
          }]
        }))} /><Button title={tab === 'work' ? '+ Add Work Type' : '+ Add Overtime Type'} secondary onPress={() => setNewType({
          name: '',
          unit: 'hour'
        })} /></> : null}
    {newType ? <View style={s.inset}><Field label="New type name" numeric={false} value={newType.name} onChange={v => setNewType(f => ({
          ...f,
          name: v
        }))} />{tab === 'overtime' ? <Choice label="Type unit" value={newType.unit} onChange={v => setNewType(f => ({
          ...f,
          unit: v
        }))} options={['hour', 'trip', 'day', 'quantity'].map(id => ({
          id,
          name: id
        }))} /> : null}<Button title="Create type" disabled={busy} onPress={addType} /></View> : null}
    <Button title={busy ? 'Saving...' : 'Save new rate version'} disabled={busy} onPress={save} /></View>
    {tab !== 'seasonal' ? <TouchableOpacity style={s.card} onPress={() => setExceptionCategory(tab)} accessibilityRole="button"><View style={s.row}><View style={{
          flex: 1
        }}><Text style={s.bold}>Labour Exceptions</Text><Text style={s.muted}>{new Set((setup.exceptions || []).filter(e => e.category === tab).map(e => e.labor_id)).size} labourers have dated exceptions</Text></View><InfoTip title="Labour Exceptions" text={rateHelp.exceptions} /><AppIcon name="chevron" size={18} /></View></TouchableOpacity> : null}
    <View style={s.row}><Text style={s.section}>Rate History</Text><InfoTip title="Rate History" text={rateHelp.history} /></View>{!history.length ? <Text style={s.muted}>No saved versions.</Text> : history.map(r => <View style={s.card} key={r.rate_version_id}><Pair label={`${r.effective_from} to ${r.effective_to}`} value={r.effective_from > today() ? 'Upcoming' : r.effective_to < today() ? 'Expired' : 'Active'} />{r.category === 'daily' ? <Pair label="Full / Half day" value={`${cash(r.payload.full_day)} / ${cash(r.payload.half_day)}`} /> : r.category === 'seasonal' ? <><Text style={s.bold}>{r.payload.name}</Text><Pair label="Full / Half override" value={`${cash(r.payload.full_day)} / ${cash(r.payload.half_day)}`} /><Pair label={`Minimum ${r.payload.minimum_quantity} ${r.payload.unit_name}`} value={cash(r.payload.bonus_amount)} /></> : r.payload.rates.map((x, i) => <Pair key={i} label={`${x.name} / ${x.unit}`} value={cash(x.rate)} />)}<Button secondary title="Copy to new date range" onPress={() => {
        setForm({
          ...r.payload,
          effective_from: '',
          effective_to: ''
        });
        setError('');
      }} /></View>)}
  </View>;
}
export function LabourExceptions({
  category,
  setup,
  request,
  Choice,
  DateField,
  onChanged,
  onBack
}) {
  const [tab, setTab] = useState(category),
    [search, setSearch] = useState(''),
    [worker, setWorker] = useState(null),
    [form, setForm] = useState(null),
    [context, setContext] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const exceptions = (setup.exceptions || []).filter(e => e.category === tab),
    labours = setup.labours || [];
  const rows = [...new Map(exceptions.map(e => [e.labor_id, {
    labor_id: e.labor_id,
    name: e.labor_name
  }])).values()].filter(l => `${l.name} LT${String(l.labor_id).padStart(3, '0')} ${l.labor_id}`.toLowerCase().includes(search.toLowerCase()));
  const history = exceptions.filter(e => String(e.labor_id) === String(worker?.labor_id));
  const state = e => e.effective_from > today() ? 'Upcoming' : e.effective_to < today() ? 'Expired' : 'Active';
  const typeName = e => tab === 'daily' ? 'Daily Wage' : tab === 'work' ? setup.activities.find(a => Number(a.work_activity_id) === Number(e.type_id))?.work_activity_name || `Work #${e.type_id}` : setup.overtimeTypes.find(a => Number(a.overtime_type_id) === Number(e.type_id))?.name || `Extra #${e.type_id}`;
  useEffect(() => {
    let alive = true;
    setContext(null);
    if (form?.effective_from && (tab === 'daily' || form.type_id)) request(`/api/payroll/rate-context?${new URLSearchParams({
      date: form.effective_from,
      category: tab,
      type_id: form.type_id || 0
    })}`).then(r => {
      if (alive) setContext(r);
    }).catch(e => {
      if (alive) setError(e.message);
    });
    return () => {
      alive = false;
    };
  }, [form?.effective_from, form?.type_id, tab]);
  function add(base = {}) {
    setError('');
    setForm({
      ...base,
      labor_id: base.labor_id || worker?.labor_id || '',
      effective_from: '',
      effective_to: '',
      notes: ''
    });
  }
  async function save() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      await request('/api/payroll/labour-exception', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          category: tab,
          unit: context?.unit || form.unit
        })
      });
      await onChanged();
      setWorker(labours.find(l => String(l.labor_id) === String(form.labor_id)) || worker);
      setForm(null);
      Alert.alert('Exception saved', 'Only this labour and rate component use the custom amount. Other rates are inherited.');
    } catch (e) {
      setError(e.message);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  const field = key => value => setForm(f => ({
    ...f,
    [key]: value
  }));
  const summary = e => <View key={e.exception_id} style={s.card}><Pair label={typeName(e)} value={state(e)} /><Text style={s.muted}>{e.effective_from} to {e.effective_to}</Text>{tab === 'daily' ? <Pair label="Full / Half day" value={`${cash(e.full_day)} / ${cash(e.half_day)}`} /> : <Pair label={`Custom / ${e.unit}`} value={cash(e.rate)} />}<Text style={s.muted}>{e.notes}</Text><Button title="Copy to new exception period" secondary onPress={() => add(e)} /></View>;
  return <View><Header title={form ? 'Add Labour Exception' : 'Labour Exceptions'} onBack={() => {
      if (form) setForm(null);else if (worker) setWorker(null);else onBack();
    }} /><View style={s.row}><Text style={s.muted}>Optional custom rates for individual labourers</Text><InfoTip title="Labour Exceptions" text={rateHelp.exceptions} /></View>
    {!form ? <ScrollView horizontal contentContainerStyle={s.tabs}>{categories.filter(([id]) => id !== 'seasonal').map(([id, label]) => <TouchableOpacity key={id} style={[s.tab, id === tab && s.tabOn]} onPress={() => {
        setTab(id);
        setWorker(null);
        setSearch('');
        setError('');
      }}><Text style={s.bold}>{label}</Text></TouchableOpacity>)}</ScrollView> : null}
    {error ? <Notice error>{error}</Notice> : null}
    {form ? <View style={s.card}><Choice label="Labour *" options={labours.map(l => ({
        id: l.labor_id,
        name: `${l.name} (LT${String(l.labor_id).padStart(3, '0')})`
      }))} value={form.labor_id} onChange={field('labor_id')} />{tab !== 'daily' ? <Choice label={tab === 'work' ? 'Work Type *' : 'Overtime Type *'} options={tab === 'work' ? options(setup.activities, 'work_activity_id', 'work_activity_name') : options(setup.overtimeTypes, 'overtime_type_id', 'name')} value={form.type_id} onChange={field('type_id')} /> : null}
      <View style={s.row}><Text style={s.section}>Effective Period</Text><InfoTip title="Effective Period" text={rateHelp.period} /></View><DateField label="From Date *" value={form.effective_from} onChange={field('effective_from')} /><DateField label="To Date *" value={form.effective_to} onChange={field('effective_to')} />
      <Text style={s.section}>Estate Default (on From Date)</Text>{!context ? <Text style={s.muted}>Select the start date and rate type to see the default.</Text> : tab === 'daily' ? <><Pair label="Full Day" value={cash(context.full_day)} /><Pair label="Half Day" value={cash(context.half_day)} />{context.full_day == null ? <Notice>No estate daily rate covers this date. This exception can supply this labour's wage; other labourers still need an estate rate.</Notice> : null}</> : <Pair label={`Estate Rate / ${context.unit || 'no active unit'}`} value={cash(context.rate)} />}
      <Text style={s.section}>Custom {tab === 'daily' ? 'Daily Wage' : 'Rate'}</Text>{tab === 'daily' ? <><Field label="Custom Full Day Wage *" value={form.full_day} onChange={field('full_day')} /><Field label="Custom Half Day Wage *" value={form.half_day} onChange={field('half_day')} /></> : <><Field label="Custom Rate *" value={form.rate} onChange={field('rate')} />{context?.unit ? <Text style={s.muted}>Per {context.unit}</Text> : tab === 'work' ? <Choice label="Custom unit *" options={['work', 'day', 'acre', 'tree', 'kg', 'bushel'].map(id => ({
          id,
          name: id
        }))} value={form.unit} onChange={field('unit')} /> : <Text style={s.muted}>Per {setup.overtimeTypes.find(t => String(t.overtime_type_id) === String(form.type_id))?.unit || 'selected type unit'}</Text>}</>}
      <Field label="Notes / Reason (optional)" numeric={false} value={form.notes} onChange={field('notes')} /><Button title="Save Labour Exception" disabled={busy} onPress={save} />
    </View> : worker ? <><Text style={s.section}>{worker.name} (LT{String(worker.labor_id).padStart(3, '0')})</Text><Text style={s.section}>Current Rate</Text>{history.filter(e => state(e) === 'Active').length ? history.filter(e => state(e) === 'Active').map(summary) : <Notice>No active exception. Estate rates apply when available.</Notice>}<View style={s.row}><Text style={s.section}>Rate History</Text><InfoTip title="Rate History" text={rateHelp.history} /></View>{history.filter(e => state(e) !== 'Active').map(summary)}<Button title="+ Add Labour Exception" onPress={() => add()} /></> : <><Field label="Search labour name / ID" numeric={false} value={search} onChange={setSearch} />{!rows.length ? <Notice>No labour exceptions found. Estate defaults apply automatically.</Notice> : rows.map(l => <TouchableOpacity key={l.labor_id} style={s.card} onPress={() => setWorker(l)}><View style={s.row}><View><Text style={s.bold}>{l.name} (LT{String(l.labor_id).padStart(3, '0')})</Text><Text style={s.muted}>Custom {tab === 'daily' ? 'daily wages' : tab === 'work' ? 'work rates' : 'overtime rates'}</Text></View><AppIcon name="chevron" size={18} /></View></TouchableOpacity>)}<Button title="+ Add Labour Exception" onPress={() => add()} /></>}
  </View>;
}
export function SalarySettlement({
  propertyId,
  request,
  Choice,
  DateField,
  onHistory,
  exportPdf
}) {
  const [day, setDay] = useState(today()),
    [data, setData] = useState({
      rows: [],
      alerts: [],
      setup: {
        units: [],
        overtimeTypes: []
      }
    }),
    [selected, setSelected] = useState([]),
    [detail, setDetail] = useState(null),
    [form, setForm] = useState({}),
    [override, setOverride] = useState(null),
    [advance, setAdvance] = useState(null),
    [query, setQuery] = useState(''),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false),
    [method, setMethod] = useState('cash'),
    [paymentDate, setPaymentDate] = useState(today());
  const sequence = useRef(0),
    saving = useRef(false);
  async function load() {
    const stamp = ++sequence.current;
    setBusy(true);
    setError('');
    try {
      const next = await request(`/api/payroll/settlement-day?date=${day}`);
      if (stamp === sequence.current) {
        setData(next);
        setSelected([]);
        setDetail(d => d ? next.rows.find(r => r.labor_id === d.labor_id) || null : null);
        if (detail) {
          const updated = next.rows.find(r => r.labor_id === detail.labor_id);
          if (updated) setForm(actuals(updated, next.setup));
        }
        return next;
      }
    } catch (e) {
      if (stamp === sequence.current) setError(e.message);
    } finally {
      if (stamp === sequence.current) setBusy(false);
    }
  }
  useEffect(() => {
    setData({
      rows: [],
      alerts: [],
      setup: {
        units: [],
        overtimeTypes: []
      }
    });
    setDetail(null);
    setSelected([]);
    setOverride(null);
    setAdvance(null);
    load();
    return () => {
      sequence.current++;
    };
  }, [propertyId, day]);
  function actuals(row, setup = data.setup) {
    const season = setup.versions?.find(v => v.category === 'seasonal' && v.effective_from <= day && v.effective_to >= day);
    return {
      ...row.input,
      quantity: row.input?.quantity ?? 0,
      unit_id: row.input?.unit_id || season?.payload.unit_id || '',
      custom_amount: row.input?.custom_amount ?? 0,
      extras: row.input?.extras || []
    };
  }
  function open(row) {
    setDetail(row);
    setForm(actuals(row));
    setSaved(false);
    setOverride(null);
    setAdvance(null);
    setError('');
  }
  async function write(action, body) {
    if (saving.current) return;
    saving.current = true;
    Keyboard.dismiss();
    setSaved(false);
    setBusy(true);
    setError('');
    try {
      await request(`/api/payroll/${action}`, {
        method: 'POST',
        body: JSON.stringify({
          work_date: day,
          labor_id: detail?.labor_id,
          ...body
        })
      });
      setOverride(null);
      setAdvance(null);
      const refreshed = await load();
      setSaved(Boolean(refreshed));
    } catch (e) {
      setError(e.message);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  const dirty = detail && JSON.stringify(form) !== JSON.stringify(actuals(detail));
  const payableRows = data.rows.filter(r => selected.includes(r.labor_id) && r.status === 'unpaid');
  function pay(rows) {
    if (!rows.length) return;
    const total = rows.reduce((n, r) => n + r.settled_paid, 0);
    Alert.alert('Confirm salary payment', `${rows.length} labourers\nTotal payable: ${cash(total)}\nConfirm after making the payment.`, [{
      text: 'Cancel',
      style: 'cancel'
    }, {
      text: 'Mark as Paid',
      onPress: () => write('pay-selected', {
        payment_method: method,
        payment_date: paymentDate,
        items: rows.map(r => ({
          labor_id: r.labor_id,
          preview_key: r.preview_key
        }))
      })
    }]);
  }
  const field = key => value => setForm(f => ({
    ...f,
    [key]: value
  }));
  const units = data.setup.units || [],
    types = data.setup.overtimeTypes || [];
  return <View><Header title={detail ? 'Labour Detail' : 'Salary Settlement'} onBack={detail ? () => {
      setDetail(null);
      setError('');
    } : null} />
    {!detail ? <><DateField label="Settlement Date" value={day} onChange={setDay} /><View style={s.card}><Pair label="Labourers" value={data.rows.length} /><Pair label="Calculated / Pending / Paid" value={`${data.rows.filter(r => r.status === 'unpaid').length} / ${data.rows.filter(r => r.status === 'pending').length} / ${data.rows.filter(r => r.status === 'paid').length}`} /><Pair label="Paid net amount" value={cash(data.rows.filter(r => r.status === 'paid').reduce((n, r) => n + Number(r.settled_paid || 0), 0))} /><Pair label="Unpaid net payable" value={cash(data.rows.filter(r => r.status === 'unpaid').reduce((n, r) => n + r.settled_paid, 0))} /></View>{data.alerts.map((a, i) => <Notice key={i}>{a}</Notice>)}<Field label="Search labour" numeric={false} value={query} onChange={setQuery} /></> : null}
    {error ? <Notice error>{error}</Notice> : null}{busy ? <Text style={s.muted}>Loading...</Text> : null}
    {!detail ? <>{!data.rows.length && !busy ? <Notice>No attended labourers for this date. Record attendance first.</Notice> : null}{data.rows.filter(r => r.labor_name.toLowerCase().includes(query.toLowerCase())).map(r => <View style={s.card} key={r.labor_id}><View style={s.row}>{r.status === 'unpaid' ? <TouchableOpacity accessibilityRole="checkbox" accessibilityLabel={`Select ${r.labor_name}`} accessibilityState={{
            checked: selected.includes(r.labor_id)
          }} onPress={() => setSelected(ids => ids.includes(r.labor_id) ? ids.filter(id => id !== r.labor_id) : [...ids, r.labor_id])}><Text style={s.select}>{selected.includes(r.labor_id) ? '\u2611' : '\u2610'}</Text></TouchableOpacity> : null}<TouchableOpacity style={{
            flex: 1
          }} onPress={() => open(r)}><Text style={s.bold}>{r.labor_name} (LT{String(r.labor_id).padStart(3, '0')})</Text><Text style={s.muted}>{r.attendance === .5 ? 'Half day' : r.attendance === 1 ? 'Full day' : 'Attendance needs review'} | {r.status === 'unpaid' ? 'Calculated / Unpaid' : r.status}</Text><Text style={s.muted}>{(r.work_charges || []).map(w => `${w.work_activity_name} ${w.quantity} ${w.unit}`).join(', ')}</Text>{r.error ? <Text style={s.error}>{r.error}</Text> : null}</TouchableOpacity><Text style={s.bold}>{cash(r.settled_paid)}</Text></View></View>)}
      <Button title="Select all calculated" secondary disabled={busy} onPress={() => setSelected(data.rows.filter(r => r.status === 'unpaid').map(r => r.labor_id))} /><Pair label="Selected payable" value={cash(payableRows.reduce((n, r) => n + r.settled_paid, 0))} /><DateField label="Payment Date" value={paymentDate} onChange={setPaymentDate} /><Choice label="Payment Mode" value={method} onChange={setMethod} options={['cash', 'bank', 'upi'].map(id => ({
        id,
        name: id
      }))} /><Button title="Mark Selected as Paid" disabled={busy || !payableRows.length} onPress={() => pay(payableRows)} />{exportPdf ? <Button title="Download PDF" secondary disabled={busy} onPress={async () => {
        try {
          const r = await request(`/api/payroll/salary-report?from=${day}&to=${day}`);
          await exportPdf(r);
        } catch (e) {
          setError(e.message);
        }
      }} /> : null}<Button title="Refresh calculations" secondary disabled={busy} onPress={load} />{onHistory ? <Button title="Payment history and reports" secondary onPress={onHistory} /> : null}
    </> : <><View style={s.card}><Text style={s.section}>{detail.labor_name} | {day}</Text><Text style={s.muted}>{detail.attendance === .5 ? 'Half day' : detail.attendance === 1 ? 'Full day' : ''} | {detail.status}</Text>{detail.error ? <Notice error>{detail.error}</Notice> : null}{detail.messages?.map((m, i) => <Notice key={i}>{m}</Notice>)}
      {Object.entries(componentLabels).map(([key, label]) => <View style={s.row} key={key}><Text style={s.muted}>{label}</Text><Text style={s.bold}>{cash(detail[key])}</Text>{detail.status === 'unpaid' ? <TouchableOpacity accessibilityLabel={`Edit ${label}`} onPress={() => setOverride({
            component: key,
            override_amount: detail[key],
            reason: ''
          })}><Text style={s.link}>Edit</Text></TouchableOpacity> : null}</View>)}
      {detail.daily_rate_source ? <Text style={s.muted}>Base wage: {detail.daily_rate_source}</Text> : null}
      {(detail.extras || []).map((e, i) => <Text key={`extra-${i}`} style={s.muted}>{e.name || 'OT / Extra'}: {e.quantity} {e.unit} x {cash(e.rate)} | {e.rate_source || 'Saved rate'}</Text>)}
      {(detail.work_charges || []).map((w, i) => <Text style={s.muted} key={i}>{w.work_activity_name} | {w.block_name || 'Unallocated'} | {w.quantity} {w.unit} x {cash(w.rate)} = {cash(w.amount)} | {w.rate_source || 'Saved rate'}</Text>)}
      <Pair label="Earned" value={cash(detail.total_earned)} /><Pair label="Net payable" value={cash(detail.settled_paid)} />
      {detail.payment_date ? <Text style={s.muted}>Paid {detail.payment_date} | {detail.payment_method}</Text> : null}
      {(detail.override_audit || detail.overrides || []).map(o => <Text style={s.muted} key={o.override_id}>{componentLabels[o.component]}: {cash(o.original_amount)} to {cash(o.override_amount)} | {o.reason} | User {o.created_by} | {o.created_on}</Text>)}
      {(detail.recoveries || []).map(r => <Text style={s.muted} key={r.advance_id}>Advance #{r.advance_id}: {cash(r.recovered ?? r.amount)} | {r.reason || r.notes || ''}</Text>)}
    </View>
    {override ? <View style={s.card}><Text style={s.section}>Override {componentLabels[override.component]}</Text><Pair label="Original calculation" value={cash(override.component === 'advance_paid' ? detail.original_advance_paid : detail.original_components?.[override.component])} /><Field label="Override Amount" value={override.override_amount} onChange={v => setOverride(f => ({
          ...f,
          override_amount: v
        }))} /><Field label="Reason *" numeric={false} value={override.reason} onChange={v => setOverride(f => ({
          ...f,
          reason: v
        }))} /><Button title="Update override" disabled={busy} onPress={() => write('settlement-override', {
          ...override,
          preview_key: detail.preview_key
        })} /><Button title="Cancel override" secondary onPress={() => setOverride(null)} /></View> : null}
    {detail.status === 'unpaid' || detail.status === 'pending' ? <View style={s.card}><Text style={s.section}>Actual quantity / OT / Extras</Text>{data.setup.versions?.filter(v => v.category === 'seasonal' && v.effective_from <= day && v.effective_to >= day).map(v => <Notice key={v.rate_version_id}>{v.payload.name}: at least {v.payload.minimum_quantity} {v.payload.unit_name} earns one bonus of {cash(v.payload.bonus_amount)}. Enter the actual harvest below.</Notice>)}<Field label="Harvest quantity" value={form.quantity} onChange={field('quantity')} /><Choice label="Harvest unit" optional options={options(units, 'baseunit_id', 'baseunit_name')} value={form.unit_id} onChange={field('unit_id')} />
      {(form.extras || []).map((e, i) => <View style={s.inset} key={i}><Choice label="OT / Extra type" options={options(types, 'overtime_type_id', 'name')} value={e.overtime_type_id} onChange={v => setForm(f => ({
            ...f,
            extras: f.extras.map((x, n) => n === i ? {
              ...x,
              overtime_type_id: v
            } : x)
          }))} /><Field label={`Extra quantity ${i + 1}`} value={e.quantity} onChange={v => setForm(f => ({
            ...f,
            extras: f.extras.map((x, n) => n === i ? {
              ...x,
              quantity: v
            } : x)
          }))} /><Text style={s.muted}>Unit: {types.find(t => String(t.overtime_type_id) === String(e.overtime_type_id))?.unit || 'Select type'}</Text><Button title="Remove extra" secondary onPress={() => setForm(f => ({
            ...f,
            extras: f.extras.filter((_, n) => n !== i)
          }))} /></View>)}
      <Button title="Add OT / Extra" secondary onPress={() => setForm(f => ({
          ...f,
          extras: [...(f.extras || []), {
            quantity: '',
            overtime_type_id: ''
          }]
        }))} /><Field label="Other / Custom amount" value={form.custom_amount} onChange={field('custom_amount')} /><Choice label="Daily wage source" value={form.use_regular ? 'regular' : 'automatic'} onChange={v => field('use_regular')(v === 'regular')} options={[{
          id: 'automatic',
          name: 'Automatic (custom wage first, then seasonal)'
        }, {
          id: 'regular',
          name: 'Use regular wage (including labour exception)'
        }]} /><Field label="Notes" numeric={false} value={form.notes} onChange={field('notes')} /><Button title="Save actuals and recalculate" disabled={busy} onPress={() => write('settlement-input', {...form, quantity: form.quantity === '' ? 0 : form.quantity, custom_amount: form.custom_amount === '' ? 0 : form.custom_amount})} />{error ? <Notice error>{error}</Notice> : saved && !dirty ? <Notice>{detail.status === 'pending' ? `Actuals saved. Calculation needs attention: ${detail.error}` : 'Saved and recalculated. The breakdown above shows the updated amounts.'}</Notice> : null}<Button title="+ Add Advance" secondary onPress={() => setAdvance({
          paid_date: day,
          amount: '',
          reason: '',
          notes: ''
        })} />
      {advance ? <><DateField label="Advance Date" value={advance.paid_date} onChange={v => setAdvance(f => ({
            ...f,
            paid_date: v
          }))} /><Field label="Advance Amount" value={advance.amount} onChange={v => setAdvance(f => ({
            ...f,
            amount: v
          }))} /><Field label="Advance Reason / Notes" numeric={false} value={advance.reason} onChange={v => setAdvance(f => ({
            ...f,
            reason: v
          }))} /><Button title="Save Advance" disabled={busy} onPress={() => write('settlement-advance', advance)} /></> : null}
      <DateField label="Payment Date" value={paymentDate} onChange={setPaymentDate} /><Choice label="Payment Mode" value={method} onChange={setMethod} options={['cash', 'bank', 'upi'].map(id => ({
          id,
          name: id
        }))} />{dirty ? <Notice>Save actuals and recalculate before marking this salary as paid.</Notice> : null}<Button title="Mark as Paid" disabled={busy || dirty || detail.status !== 'unpaid'} onPress={() => pay([detail])} />
    </View> : null}</>}
  </View>;
}
export function salaryReportTables(report) {
  const rows = report.rows || [],
    groups = {
      labour: {},
      work: {},
      block: {},
      daily: {},
      monthly: {},
      seasonal: {}
    };
  const add = (kind, key, amount) => {
    groups[kind][key] = Math.round(((groups[kind][key] || 0) + Number(amount || 0)) * 100) / 100;
  };
  for (const r of rows.filter(r => r.status === 'paid' || r.status === 'partially paid')) {
    add('labour', `${r.labor_name} (LT${r.labor_id})`, r.total_earned);
    add('daily', r.work_date, r.total_earned);
    add('monthly', r.work_date.slice(0, 7), r.total_earned);
    add('seasonal', r.seasonal_name || 'Regular / legacy period', r.total_earned);
    const work = r.work_charges || (r.days || []).flatMap(d => d.work_charges || []);
    let assigned = 0;
    for (const w of work) {
      add('work', w.work_activity_name || 'Legacy work', w.amount);
      add('block', w.block_name || 'Unallocated', w.amount);
      assigned += Number(w.amount || 0);
    }
    add('work', 'Base wage, bonus, OT and adjustments', Number(r.total_earned || 0) - assigned);
    add('block', 'Unallocated wage, bonus, OT and adjustments', Number(r.total_earned || 0) - assigned);
  }
  return Object.fromEntries(Object.entries(groups).map(([key, value]) => [key, Object.entries(value).map(([name, earned]) => ({
    name,
    earned
  }))]));
}
export function SalaryReports({
  propertyId,
  request,
  DateField,
  Choice,
  exportPdf,
  onBack
}) {
  const [from, setFrom] = useState(today().slice(0, 8) + '01'),
    [to, setTo] = useState(today()),
    [report, setReport] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [group, setGroup] = useState('labour'),
    [detail, setDetail] = useState(null);
  const sequence = useRef(0);
  async function load() {
    const stamp = ++sequence.current;
    setBusy(true);
    setError('');
    try {
      const r = await request(`/api/payroll/salary-report?from=${from}&to=${to}`);
      if (stamp === sequence.current) setReport(r);
    } catch (e) {
      if (stamp === sequence.current) setError(e.message);
    } finally {
      if (stamp === sequence.current) setBusy(false);
    }
  }
  useEffect(() => {
    setReport(null);
    setDetail(null);
    load();
    return () => {
      sequence.current++;
    };
  }, [propertyId, from, to]);
  const tables = report ? salaryReportTables(report) : {},
    paid = (report?.rows || []).filter(r => r.status === 'paid' || r.status === 'partially paid'),
    unpaid = (report?.rows || []).filter(r => r.status === 'unpaid');
  const sum = (rows, key) => rows.reduce((n, r) => n + Number(r[key] || 0), 0);
  return <View><Header title="Labour Salary / Reports" onBack={onBack} /><DateField label="From Date" value={from} onChange={setFrom} /><DateField label="To Date" value={to} onChange={setTo} />{error ? <Notice error>{error}</Notice> : null}{busy ? <Text style={s.muted}>Loading...</Text> : null}
    {report ? <><Notice>{report.note}</Notice><View style={s.card}><Text style={s.section}>{report.property}</Text><Pair label="Final labour cost" value={cash(sum(paid, 'total_earned'))} /><Pair label="Net payments" value={cash(sum(paid, 'settled_paid'))} /><Pair label="Advances paid in period" value={cash(sum(report.advances, 'amount'))} /><Pair label="Advance deductions" value={cash(sum(paid, 'advance_paid'))} /><Pair label="Unpaid payable (provisional)" value={cash(sum(unpaid, 'settled_paid'))} /><Pair label="Pending calculations" value={report.rows.filter(r => r.status === 'pending').length} /><Pair label="Working days (paid)" value={paid.reduce((n, r) => n + Number(r.attendance ?? r.attendance_days ?? 0), 0)} /><Pair label="OT / Extra" value={cash(sum(paid, 'overtime_earned') + sum(paid, 'custom_earned'))} /><Pair label="Harvest / seasonal bonus" value={cash(sum(paid, 'variable_earned'))} /></View>
    <Choice label="Report view" value={group} onChange={setGroup} options={Object.keys(tables).map(id => ({
        id,
        name: `${id[0].toUpperCase() + id.slice(1)} cost`
      }))} /><View style={s.card}>{(tables[group] || []).map((r, i) => <Pair key={i} label={r.name} value={cash(r.earned)} />)}{!tables[group]?.length ? <Text style={s.muted}>No paid settlements in this period.</Text> : null}</View>
    <Text style={s.section}>Payment history and unpaid salary</Text>{report.rows.map((r, i) => <TouchableOpacity style={s.card} key={i} onPress={() => setDetail(r)}><Pair label={`${r.labor_name} | ${r.work_date}`} value={cash(r.settled_paid)} /><Text style={s.muted}>{r.status}{r.legacy ? ` | Period ${r.period_start} to ${r.period_end}` : ''}{r.error ? ` | ${r.error}` : ''}</Text></TouchableOpacity>)}
    {detail ? <View style={s.card}><Text style={s.section}>{detail.labor_name} | {detail.status}</Text>{Object.entries(componentLabels).map(([key, label]) => <Pair key={key} label={label} value={cash(detail[key])} />)}<Pair label="Final payable" value={cash(detail.settled_paid)} />{(detail.days || [detail]).map((d, i) => <View key={i}><Text style={s.bold}>{d.work_date} | {d.attendance} day</Text>{d.daily_rate_source ? <Text style={s.muted}>Base wage: {d.daily_rate_source}</Text> : null}{(d.work_charges || []).map((w, n) => <Pair key={n} label={`${w.work_activity_name} / ${w.block_name || 'Unallocated'} | ${w.rate_source || 'Saved rate'}`} value={`${w.quantity} x ${cash(w.rate)} = ${cash(w.amount)}`} />)}{(d.override_audit || d.overrides || []).map((o, n) => <Text key={n} style={s.muted}>{o.component}: {cash(o.original_amount)} to {cash(o.override_amount)} | {o.reason} | User {o.created_by} | {o.created_on}</Text>)}</View>)}<Button secondary title="Close details" onPress={() => setDetail(null)} /></View> : null}
    <Text style={s.section}>Advance history</Text>{report.advances.map(a => <View key={a.advance_id} style={s.card}><Pair label={`${a.labor_name} | ${a.paid_date}`} value={cash(a.amount)} /><Text style={s.muted}>{a.notes}</Text></View>)}
    {exportPdf ? <Button title="Download PDF" onPress={() => exportPdf(report, tables).catch(e => setError(e.message))} /> : null}</> : null}
  </View>;
}
const s = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#4b2814',
    marginVertical: 10
  },
  section: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4b2814',
    marginVertical: 10
  },
  card: {
    backgroundColor: '#fffaf2',
    borderWidth: 1,
    borderColor: '#e4d2bb',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12
  },
  inset: {
    borderTopWidth: 1,
    borderColor: '#e4d2bb',
    paddingTop: 10,
    marginTop: 8
  },
  tabs: {
    gap: 8,
    marginVertical: 14
  },
  tab: {
    padding: 10,
    borderBottomWidth: 2,
    borderColor: 'transparent'
  },
  tabOn: {
    borderColor: '#2f7134'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 7
  },
  muted: {
    fontSize: 12,
    color: '#715f51',
    flexShrink: 1
  },
  bold: {
    fontWeight: '800',
    color: '#4b2814',
    flexShrink: 1
  },
  button: {
    backgroundColor: '#4b2814',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 6
  },
  secondary: {
    backgroundColor: '#ead8bf'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800'
  },
  field: {
    marginBottom: 12
  },
  label: {
    fontWeight: '800',
    fontSize: 12,
    color: '#4b2814',
    marginBottom: 6
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#e4d2bb',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    color: '#4b2814'
  },
  notice: {
    backgroundColor: '#f1f6ed',
    color: '#426b36',
    padding: 12,
    borderRadius: 10,
    fontSize: 12,
    marginBottom: 10
  },
  error: {
    color: '#b6352d'
  },
  link: {
    color: '#8a4b20',
    fontWeight: '700'
  },
  select: {
    fontSize: 26,
    color: '#2f7134'
  }
});
