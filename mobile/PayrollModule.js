import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppIcon from './src/components/AppIcon';
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const cash = n => `\u20b9${Number(n || 0).toLocaleString('en-IN', {
  maximumFractionDigits: 2
})}`;
const options = (items, id, label) => items.map(x => ({
  id: x[id],
  name: x[label]
}));
export function cycleDates(cycle, selected) {
  const d = new Date(`${selected}T00:00:00Z`),
    anchor = new Date(`${cycle.effective_from}T00:00:00Z`);
  if (cycle.frequency === 'monthly') return {
    period_start: new Date(Math.max(+anchor, Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))).toISOString().slice(0, 10),
    period_end: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10)
  };
  const length = cycle.frequency === 'weekly' ? 7 : cycle.frequency === 'fifteen_day' ? 15 : Number(cycle.custom_days || 1);
  const offset = Math.floor((d - anchor) / 86400000 / length) * length;
  return {
    period_start: new Date(+anchor + offset * 86400000).toISOString().slice(0, 10),
    period_end: new Date(+anchor + (offset + length - 1) * 86400000).toISOString().slice(0, 10)
  };
}
function Button({
  title,
  onPress,
  secondary,
  disabled
}) {
  return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button, secondary && s.secondary, disabled && {
    opacity: 0.45
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
  value,
  strong
}) {
  return <View style={s.pair}><Text style={[s.muted, strong && s.bold]}>{label}</Text><Text style={[s.amount, strong && s.big]}>{value}</Text></View>;
}
function Badge({
  text,
  good
}) {
  return <View style={[s.badge, good && s.good]}><Text style={[s.badgeText, good && {
      color: '#2f7134'
    }]}>{text}</Text></View>;
}
export default function PayrollModule({
  propertyId,
  user,
  request,
  seasonId,
  onBack,
  Choice,
  DateField
}) {
  const [tab, setTab] = useState('daily'),
    [setup, setSetup] = useState({
      labours: [],
      rules: [],
      cycles: [],
      units: [],
      advances: [],
      history: []
    }),
    [day, setDay] = useState(today()),
    [daily, setDaily] = useState({
      attendance: [],
      entries: []
    }),
    [cycleId, setCycleId] = useState(''),
    [period, setPeriod] = useState({
      period_start: today().slice(0, 8) + '01',
      period_end: today()
    }),
    [previews, setPreviews] = useState({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [editor, setEditor] = useState(null),
    [form, setForm] = useState({}),
    [detail, setDetail] = useState(null),
    [selectedLabour, setSelectedLabour] = useState(''),
    [showDays, setShowDays] = useState(false);
  const generation = useRef(0),
    saving = useRef(false),
    loadSequence = useRef(0);
  const field = k => v => setForm(f => ({
    ...f,
    [k]: v
  }));
  async function load() {
    const sequence = ++loadSequence.current;
    setBusy(true);
    setError('');
    try {
      const [st, d] = await Promise.all([request('/api/payroll/setup'), request(`/api/payroll/daily?date=${day}&season_id=${seasonId || ''}`)]);
      if (sequence !== loadSequence.current) return;
      setSetup(st);
      if (!st.labours.some(l => String(l.labor_id) === selectedLabour)) setSelectedLabour(String(st.labours[0]?.labor_id || ''));
      setDaily(d);
      if (!st.cycles.some(c => String(c.settlement_cycle_id) === String(cycleId)) && st.cycles.length) {
        setCycleId(String(st.cycles[0].settlement_cycle_id));
        setPeriod(cycleDates(st.cycles[0], day));
      }
    } catch (e) {
      if (sequence === loadSequence.current) setError(e.message);
    } finally {
      if (sequence === loadSequence.current) setBusy(false);
    }
  }
  useEffect(() => {
    setSetup({
      labours: [],
      rules: [],
      cycles: [],
      units: [],
      advances: [],
      history: []
    });
    setCycleId('');
    setPreviews({});
    setEditor(null);
    setDetail(null);
  }, [propertyId]);
  useEffect(() => {
    setPreviews({});
    setEditor(null);
    setDetail(null);
    load();
    return () => {
      loadSequence.current += 1;
    };
  }, [propertyId, day, seasonId]);
  useEffect(() => {
    generation.current += 1;
    setPreviews({});
  }, [cycleId, period.period_start, period.period_end, seasonId, propertyId]);
  const ruleFor = (id, date = day) => [...setup.rules].sort((a, b) => Number(!!b.season_id) - Number(!!a.season_id)).find(r => String(r.labor_id) === String(id) && r.effective_from <= date && (!r.effective_to || r.effective_to >= date) && (!r.season_id || String(r.season_id) === String(seasonId)));
  const settledOn = (id, date) => setup.history.some(h => String(h.labor_id) === String(id) && h.period_start <= date && h.period_end >= date);
  const previewParams = id => ({
    labor_id: id,
    settlement_cycle_id: cycleId,
    ...period,
    ...(seasonId ? {
      season_id: seasonId
    } : {})
  });
  async function previewAll() {
    if (!cycleId) return Alert.alert('Salary', 'Add or select a settlement cycle first.');
    const stamp = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const next = {};
      for (const l of setup.labours.filter(l => String(l.labor_id) === selectedLabour)) {
        try {
          next[l.labor_id] = await request(`/api/payroll/preview?${new URLSearchParams(previewParams(l.labor_id))}`);
        } catch (e) {
          next[l.labor_id] = {
            status: 'needs attention',
            errors: [e.message]
          };
        }
      }
      if (stamp === generation.current) {
        setPreviews(next);
        setForm({
          payment_method: 'cash',
          payment_date: today(),
          amount_paid: next[selectedLabour]?.settled_paid
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function open(kind, labor) {
    setEditor({
      kind,
      labor
    });
    const rule = kind === 'rule' ? setup.rules.find(r => String(r.labor_id) === String(labor?.labor_id) && !r.season_id && r.effective_from <= day && (!r.effective_to || r.effective_to >= day)) : ruleFor(labor?.labor_id);
    if (kind === 'daily') {
      const entry = daily.entries.find(e => String(e.labor_id) === String(labor.labor_id));
      setForm(entry ? {
        ...entry,
        unit_id: entry.unit_id || rule?.variable_unit_id || '',
        _ot: Number(entry.overtime_hours) > 0,
        _harvest: Number(entry.quantity) > 0,
        _custom: Number(entry.custom_amount) > 0
      } : {
        quantity: '',
        unit_id: rule?.variable_unit_id || '',
        overtime_hours: ''
      });
    } else if (kind === 'rule') {
      setForm({
        season_id: '',
        work_rates: JSON.parse(rule?.work_rates_json || '[]'),
        bonus_quantity: rule?.bonus_quantity || 3,
        bonus_mode: 'complete',
        fixed_rate: rule?.fixed_rate || '',
        variable_rate: rule?.variable_rate || '',
        overtime_rate: rule?.overtime_rate || '',
        included_quantity: rule?.included_quantity ?? 5,
        variable_unit_id: rule?.variable_unit_id || '',
        settlement_cycle_id: rule?.settlement_cycle_id || cycleId,
        effective_from: day
      });
    } else if (kind === 'cycle') {
      setForm({
        frequency: 'weekly',
        effective_from: day
      });
    } else setForm({
      paid_date: day,
      reason: 'Personal'
    });
  }
  async function save() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    try {
      const kind = editor.kind;
      if (kind === 'cycle') {
        if (!form.cycle_name?.trim()) throw new Error('Enter a cycle name');
        await request('/api/finance/cycles', {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            created_by: user.username
          })
        });
      } else await request(`/api/payroll/${kind}`, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          labor_id: editor.labor.labor_id,
          work_date: day,
          created_by: user.username
        })
      });
      setEditor(null);
      setPreviews({});
      await load();
      Alert.alert('Saved', kind === 'advance' ? 'Advance recorded. It will be deducted from salary when settled.' : 'Salary details saved.');
    } catch (e) {
      Alert.alert('Could not save', e.message);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  function settle(preview) {
    Alert.alert('Confirm salary payment', `${preview.labor_name}\n${preview.period_start} to ${preview.period_end}\nEarned: ${cash(preview.total_earned)}\nAdvance deduction: ${cash(preview.advance_paid)}\nPayment now: ${cash(preview.settled_paid)}\n\nConfirm after making this payment.`, [{
      text: 'Cancel',
      style: 'cancel'
    }, {
      text: 'Mark settled',
      onPress: async () => {
        if (saving.current) return;
        saving.current = true;
        setBusy(true);
        try {
          await request('/api/payroll/settle', {
            method: 'POST',
            body: JSON.stringify({
              ...previewParams(preview.labor_id),
              preview_key: preview.preview_key,
              payment_method: form.payment_method || 'cash',
              payment_date: form.payment_date || today(),
              amount_paid: form.amount_paid ?? preview.settled_paid,
              created_by: user.username
            })
          });
          setDetail(null);
          setPreviews({});
          await load();
          Alert.alert('Settled', 'Salary payment saved in settlement history.');
        } catch (e) {
          Alert.alert('Could not settle', e.message);
        } finally {
          saving.current = false;
          setBusy(false);
        }
      }
    }]);
  }
  const selectedCycle = setup.cycles.find(c => String(c.settlement_cycle_id) === String(cycleId));
  const periodOptions = selectedCycle ? Array.from({
    length: 12
  }, (_, i) => {
    const d = new Date(`${day}T00:00:00Z`);
    if (selectedCycle.frequency === 'monthly') {
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() - i);
    } else d.setUTCDate(d.getUTCDate() - i * (selectedCycle.frequency === 'weekly' ? 7 : selectedCycle.frequency === 'fifteen_day' ? 15 : Number(selectedCycle.custom_days || 1)));
    const range = cycleDates(selectedCycle, d.toISOString().slice(0, 10));
    return {
      id: `${range.period_start}|${range.period_end}`,
      name: selectedCycle.frequency === 'monthly' ? new Intl.DateTimeFormat('en-IN', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(d) : `${range.period_start} to ${range.period_end}`,
      range
    };
  }).filter(x => x.range.period_start >= selectedCycle.effective_from && x.range.period_start <= x.range.period_end) : [];
  return <View>
    <View style={s.heading}><TouchableOpacity accessibilityLabel="Back to Finance" onPress={onBack}><AppIcon name="back" size={24} color="#4b2814" /></TouchableOpacity><View style={{
        flex: 1
      }}><Text style={s.title}>Labour Salary</Text><Text style={s.muted}>Attendance, harvest & settlement</Text></View><TouchableOpacity accessibilityLabel="Refresh salary" disabled={busy} onPress={load}><AppIcon name="refresh" size={22} color="#8a4b20" /></TouchableOpacity></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>{[['daily', 'Daily entry'], ['settle', 'Settlement'], ['history', 'History'], ['rates', 'Salary rates']].map(([id, label]) => <TouchableOpacity key={id} onPress={() => {
        setTab(id);
        setEditor(null);
      }} style={[s.tab, tab === id && s.tabOn]}><Text style={[s.tabText, tab === id && {
          color: '#075b32'
        }]}>{label}</Text></TouchableOpacity>)}</ScrollView>
    {error ? <View style={s.card}><Text style={s.error}>{error}</Text><Button title="Retry" onPress={load} /></View> : null}
    {busy ? <Text accessibilityRole="progressbar" style={s.muted}>Loading salary details...</Text> : null}
    {tab === 'daily' && !editor && <>
      <DateField label="Work date" value={day} onChange={setDay} />
      <Text style={s.note}>Attendance and work type are already taken from your records. Only enter extras, if any.</Text>
      <Button title="Pay Advance" secondary onPress={() => open('advance', setup.labours.find(l => String(l.labor_id) === selectedLabour) || setup.labours[0])} disabled={!setup.labours.length} />
      {setup.labours.map(l => {
        const a = daily.attendance.find(x => String(x.labor_id) === String(l.labor_id)),
          entry = daily.entries.find(x => String(x.labor_id) === String(l.labor_id)),
          earning = (daily.earnings || []).find(x => String(x.labor_id) === String(l.labor_id)),
          locked = settledOn(l.labor_id, day),
          work = (daily.assignments || []).filter(w => String(w.labor_id) === String(l.labor_id));
        return <View key={l.labor_id} style={s.card}>
          <View style={s.person}><View style={s.avatar}><Text style={s.initial}>{l.name.slice(0, 1)}</Text></View><View style={{
              flex: 1
            }}><Text style={s.name}>{l.name} (LT{String(l.labor_id).padStart(3, '0')})</Text><Badge text={locked ? 'Settled' : !a ? 'Not marked' : Number(a.attendance_value) === 0.5 ? 'Half day' : Number(a.attendance_value) > 0 ? 'Full day' : 'Absent'} good={Number(a?.attendance_value) > 0} /><Text style={s.note}>Work type: {work.map(w => w.work_activity_name).join(', ') || 'No assignment'}</Text></View></View>
          {entry && earning && !earning.error ? <><Badge text="Auto Calculated" good /><Pair label={`Regular Wage (${earning.attendance} day)`} value={cash(earning.fixed_earned)} />{earning.work_charges?.map((w, i) => <Pair key={i} label={`${w.work_activity_name} (${w.quantity} ${w.unit})`} value={cash(w.amount)} />)}<Pair label="OT / Extra" value={cash(Number(earning.overtime_earned || 0) + Number(earning.custom_earned || 0))} /><Pair label="Harvest Bonus" value={cash(earning.variable_earned)} /><View style={s.hero}><Pair label="Today's Total" value={cash(earning.total_earned)} strong /></View><Badge text="Entry saved" good /></> : <Text style={earning?.error ? s.error : s.note}>{earning?.error || 'Anything extra today? If not, simply save.'}</Text>}
          <Button title={entry ? 'Edit' : 'Record daily entry'} secondary disabled={busy || locked || !a || Number(a.attendance_value) <= 0} onPress={() => open('daily', l)} />
        </View>;
      })}
    </>}
    {tab === 'settle' && !editor && <><Choice label="Select Labour" value={selectedLabour} onChange={setSelectedLabour} options={setup.labours.map(l => ({
        id: l.labor_id,
        name: `${l.name} (LT${String(l.labor_id).padStart(3, '0')})`
      }))} />
      <View style={s.card}><Choice label="Settlement cycle" value={cycleId} options={options(setup.cycles, 'settlement_cycle_id', 'cycle_name')} onChange={v => {
          setCycleId(v);
          setPeriod(cycleDates(setup.cycles.find(c => String(c.settlement_cycle_id) === v), day));
        }} /><Choice label="Select Period" value={`${period.period_start}|${period.period_end}`} options={periodOptions} onChange={v => {
          const [period_start, period_end] = v.split('|');
          setPeriod({
            period_start,
            period_end
          });
        }} /><View style={s.columns}><View style={s.column}><DateField label="From" value={period.period_start} onChange={v => setPeriod(p => ({
              ...p,
              period_start: v
            }))} /></View><View style={s.column}><DateField label="To" value={period.period_end} onChange={v => setPeriod(p => ({
              ...p,
              period_end: v
            }))} /></View></View><Button title="Calculate salary" disabled={busy || !cycleId} onPress={previewAll} />{!setup.cycles.length ? <Button title="Add settlement cycle" secondary onPress={() => open('cycle')} /> : null}</View>
      {setup.labours.filter(l => String(l.labor_id) === selectedLabour).map(l => {
        const existing = setup.history.find(h => String(h.labor_id) === String(l.labor_id) && h.period_start <= period.period_end && h.period_end >= period.period_start),
          p = previews[l.labor_id] || (existing ? {
            status: existing.status === 'paid' ? 'settled' : 'partially settled',
            existing
          } : null);
        return <View key={l.labor_id} style={s.card}>
          <View style={s.person}><View style={s.avatar}><Text style={s.initial}>{l.name.slice(0, 1)}</Text></View><Text style={[s.name, {
              flex: 1
            }]}>{l.name}</Text><Badge text={p?.status || 'Not calculated'} good={p?.status === 'settled'} /></View>
          {p?.status === 'unsettled' ? <>
            <Pair label="Regular Wages" value={cash(p.fixed_earned)} /><Pair label="Work Charges" value={cash(p.work_earned)} /><Pair label="OT / Extra" value={cash(Number(p.overtime_earned || 0) + Number(p.custom_earned || 0))} /><Pair label="Harvest Bonus" value={cash(p.variable_earned)} />
            <Pair label="Total Earned" value={cash(p.total_earned)} /><Pair label="Advance Paid" value={`- ${cash(p.advance_paid)}`} /><View style={s.hero}><Pair label="Net Payable" value={cash(p.settled_paid)} strong /></View>
            <Button title="View Daily Details" secondary onPress={() => {
              setDetail({
                preview: p
              });
              setShowDays(true);
            }} />
            <Text style={s.section}>Payment Details</Text><DateField label="Payment Date" value={form.payment_date || today()} onChange={field('payment_date')} /><Choice label="Payment Mode" value={form.payment_method || 'cash'} onChange={field('payment_method')} options={[{
              id: 'cash',
              name: 'Cash'
            }, {
              id: 'bank',
              name: 'Bank transfer'
            }, {
              id: 'upi',
              name: 'UPI'
            }]} /><Field label="Amount Paid" value={form.amount_paid ?? p.settled_paid} onChange={field('amount_paid')} /><Button title="Mark as Paid" disabled={busy} onPress={() => settle(p)} />
          </> : p?.errors ? <Text style={s.error}>{p.errors.join('\n')}</Text> : p?.existing ? <><Text style={s.note}>{p.existing.period_start} to {p.existing.period_end}</Text><Button title="View settlement" secondary onPress={() => {
              setDetail({
                history: setup.history.find(h => h.wage_period_id === p.existing.wage_period_id)
              });
              setShowDays(false);
            }} /></> : null}
        </View>;
      })}
    </>}
    {tab === 'history' && !editor && <><Choice label="Select Labour" value={selectedLabour} onChange={setSelectedLabour} options={setup.labours.map(l => ({
        id: l.labor_id,
        name: `${l.name} (LT${String(l.labor_id).padStart(3, '0')})`
      }))} />
      <Text style={s.section}>Settlement history</Text>{setup.history.filter(h => String(h.labor_id) === selectedLabour).map(h => <TouchableOpacity key={h.wage_period_id} style={s.card} onPress={() => {
        setDetail({
          history: h
        });
        setShowDays(false);
      }}><View style={s.heading}><Text style={[s.name, {
            flex: 1
          }]}>{h.labor_name}</Text><Badge text={h.status === 'paid' ? 'Settled' : 'Partially settled'} good={h.status === 'paid'} /></View><Text style={s.muted}>{h.cycle_name || 'Salary cycle'} | {h.period_start} to {h.period_end}</Text><Pair label="Salary payment" value={cash(h.settled_paid)} /><Text style={s.note}>Advance deducted {cash(h.advance_paid)} | Earned {cash(h.total_earned)}</Text></TouchableOpacity>)}{!setup.history.length ? <View style={s.card}><Text style={s.muted}>Settled salary will appear here with each labour's cycle and payment breakdown.</Text></View> : null}
      <Text style={s.section}>Advance payments</Text>{setup.advances.filter(a => String(a.labor_id) === selectedLabour).map(a => <View style={s.card} key={a.advance_id}><Text style={s.name}>{a.labor_name}</Text><Pair label={`${a.paid_date} | Paid`} value={cash(a.amount)} /><Pair label="Still to recover" value={cash(a.remaining)} /></View>)}
    </>}
    {tab === 'rates' && !editor && <><Choice label="Select Labour" value={selectedLabour} onChange={setSelectedLabour} options={setup.labours.map(l => ({
        id: l.labor_id,
        name: `${l.name} (LT${String(l.labor_id).padStart(3, '0')})`
      }))} /><View style={s.card}><Text style={s.section}>Salary calculation</Text><Text style={s.note}>Set wages once for each labour. Daily pay combines attendance, assigned work, OT and completed harvest bonus groups. Half days halve the wage and included harvest allowance.</Text><Button title="Add settlement cycle" secondary onPress={() => open('cycle')} /></View>{setup.labours.filter(l => String(l.labor_id) === selectedLabour).map(l => {
        const r = setup.rules.find(r => String(r.labor_id) === String(l.labor_id) && !r.season_id && r.effective_from <= day && (!r.effective_to || r.effective_to >= day));
        return <View key={l.labor_id} style={s.card}><View style={s.heading}><Text style={[s.name, {
              flex: 1
            }]}>{l.name}</Text><Badge text={r ? 'Rate configured' : 'Needs a rate'} good={!!r} /></View>{r ? <><Text style={s.section}>Regular Wages</Text><Pair label="Full Day (1 Day)" value={cash(r.fixed_rate)} /><Pair label="Half Day (0.5 Day)" value={cash(Number(r.fixed_rate) / 2)} /><Text style={s.section}>Work-wise Charges</Text>{JSON.parse(r.work_rates_json || '[]').map((w, i) => <Pair key={i} label={`${(setup.activities || []).find(a => Number(a.work_activity_id) === Number(w.work_activity_id))?.work_activity_name || 'Work'} / ${w.unit}`} value={cash(w.rate)} />)}<Text style={s.note}>{r.included_quantity} {r.baseunit_name || 'units'} included | {cash(r.variable_rate)} / {r.bonus_quantity || 1} {r.baseunit_name || 'units'} | {cash(r.overtime_rate)} / OT hour</Text></> : null}<View style={s.columns}><View style={s.column}><Button title="Set salary rate" secondary onPress={() => open('rule', l)} /></View><View style={s.column}><Button title="Pay advance" secondary onPress={() => open('advance', l)} /></View></View><Text style={s.section}>Seasonal Rates (Optional)</Text>{setup.rules.filter(x => String(x.labor_id) === String(l.labor_id) && x.season_id).map(x => <View key={x.wage_rule_id}><Text style={s.name}>{(setup.seasons || []).find(c => Number(c.season_id) === Number(x.season_id))?.season_name || 'Season'} | {x.effective_from}</Text><Pair label="Daily Wage" value={cash(x.fixed_rate)} /><Pair label={`Bonus per ${x.bonus_quantity || 1} ${x.baseunit_name || 'units'}`} value={cash(x.variable_rate)} /></View>)}<Button title="Add Seasonal Rate" secondary onPress={() => {
            open('rule', l);
            setForm(f => ({
              ...f,
              season_id: seasonId || (setup.seasons || [])[0]?.season_id || ''
            }));
          }} /></View>;
      })}</>}
    {editor && <View style={s.card}><Text style={s.title}>{editor?.kind === 'daily' ? 'Daily harvest & OT' : editor?.kind === 'rule' ? 'Salary rate' : editor?.kind === 'cycle' ? 'Settlement cycle' : 'Advance payment'}</Text><Text style={s.section}>{editor?.labor?.name || ''}</Text>
      {editor?.kind === 'daily' && <>
        <Text style={s.note}>{day} | Attendance: {Number(daily.attendance.find(a => String(a.labor_id) === String(editor.labor.labor_id))?.attendance_value) === 0.5 ? 'Present (Half Day)' : 'Present (Full Day)'}</Text>
        <Text style={s.note}>Work Type: {(daily.assignments || []).filter(w => String(w.labor_id) === String(editor.labor.labor_id)).map(w => w.work_activity_name).join(', ') || 'No assignment'} (From Work Assignment)</Text>
        <Text style={s.section}>Anything extra today?</Text>
        <Button title="No Extra" secondary onPress={() => setForm(f => ({
          ...f,
          _ot: false,
          _harvest: false,
          _custom: false,
          quantity: 0,
          overtime_hours: 0,
          custom_amount: 0
        }))} />
        {!form._ot && !form._harvest && !form._custom ? <Badge text="Only regular + work charges" good /> : null}
        <Button title="Overtime (OT)" secondary onPress={() => setForm(f => ({
          ...f,
          _ot: !f._ot,
          overtime_hours: f._ot ? 0 : f.overtime_hours
        }))} />
        {form._ot ? <Field label="Extra hours (OT)" value={form.overtime_hours} onChange={field('overtime_hours')} /> : null}
        <Button title="Harvesting (Coffee)" secondary onPress={() => setForm(f => ({
          ...f,
          _harvest: !f._harvest,
          quantity: f._harvest ? 0 : f.quantity
        }))} />
        {form._harvest ? <><Field label="Total harvest picked" value={form.quantity} onChange={field('quantity')} /><Choice label="Harvest unit" value={form.unit_id} onChange={field('unit_id')} options={options(setup.units, 'baseunit_id', 'baseunit_name')} /></> : null}
        <Button title="Other / Custom" secondary onPress={() => setForm(f => ({
          ...f,
          _custom: !f._custom,
          custom_amount: f._custom ? 0 : f.custom_amount
        }))} />
        {form._custom ? <Field label="Custom extra amount" value={form.custom_amount} onChange={field('custom_amount')} /> : null}
        <Field label="Notes (Optional)" numeric={false} value={form.notes} onChange={field('notes')} />
      </>}
      {editor?.kind === 'rule' && <>
        <Choice label="Seasonal Rate (Optional)" optional value={form.season_id} onChange={field('season_id')} options={options(setup.seasons || [], 'season_id', 'season_name')} />
        <DateField label="Effective from" value={form.effective_from} onChange={field('effective_from')} />
        <DateField label="Effective to (Optional)" optional value={form.effective_to} onChange={field('effective_to')} />
        <Choice label="Salary cycle" value={form.settlement_cycle_id} onChange={field('settlement_cycle_id')} options={options(setup.cycles, 'settlement_cycle_id', 'cycle_name')} />
        <Text style={s.section}>Regular Wages</Text><Field label="Full Day (1 Day)" value={form.fixed_rate} onChange={field('fixed_rate')} /><Pair label="Half Day (0.5 Day)" value={cash(Number(form.fixed_rate || 0) / 2)} />
        <Text style={s.section}>Work-wise Charges (Optional)</Text>
        {(form.work_rates || []).map((w, i) => <View key={i} style={s.dayRow}>
          <Choice label="Work Type" value={w.work_activity_id} onChange={v => setForm(f => ({
            ...f,
            work_rates: f.work_rates.map((x, j) => j === i ? {
              ...x,
              work_activity_id: v
            } : x)
          }))} options={options(setup.activities || [], 'work_activity_id', 'work_activity_name')} />
          <Choice label="Charge per" value={w.unit} onChange={v => setForm(f => ({
            ...f,
            work_rates: f.work_rates.map((x, j) => j === i ? {
              ...x,
              unit: v
            } : x)
          }))} options={['acre', 'tree', 'day', 'kg', 'bushel'].map(x => ({
            id: x,
            name: x
          }))} />
          <Field label="Work rate" value={w.rate} onChange={v => setForm(f => ({
            ...f,
            work_rates: f.work_rates.map((x, j) => j === i ? {
              ...x,
              rate: v
            } : x)
          }))} />
          <Button title="Remove work type" secondary onPress={() => setForm(f => ({
            ...f,
            work_rates: f.work_rates.filter((_, j) => j !== i)
          }))} />
        </View>)}
        <Button title="+ Add Work Type" secondary onPress={() => setForm(f => ({
          ...f,
          work_rates: [...(f.work_rates || []), {
            work_activity_id: '',
            unit: 'acre',
            rate: ''
          }]
        }))} />
        <Text style={s.section}>Harvest Bonus & OT</Text>
        <Choice label="Yield unit" value={form.variable_unit_id} onChange={field('variable_unit_id')} options={options(setup.units, 'baseunit_id', 'baseunit_name')} />
        <Field label="Harvest included / full day" value={form.included_quantity} onChange={field('included_quantity')} />
        <Field label="Units per bonus group (estate setting)" value={form.bonus_quantity} onChange={field('bonus_quantity')} />
        <Field label="Bonus per completed group" value={form.variable_rate} onChange={field('variable_rate')} />
        <Choice label="Bonus calculation" value={form.bonus_mode || 'complete'} onChange={field('bonus_mode')} options={[{
          id: 'complete',
          name: 'Completed groups only'
        }, {
          id: 'proportional',
          name: 'Proportional (existing rates)'
        }]} />
        <Field label="Rate / OT hour" value={form.overtime_rate} onChange={field('overtime_rate')} />
        <Text style={s.note}>Set the group size for this estate: for example, 3 or 4 bushels. Bonus groups are counted above the included daily allowance. Half days halve the fixed wage and included allowance. Quantities stay in the chosen unit; kg and bushels are not automatically converted.</Text>
      </>}
      {editor?.kind === 'advance' && <><Choice label="Select Labour" value={editor.labor?.labor_id} onChange={v => setEditor(e => ({
          ...e,
          labor: setup.labours.find(l => String(l.labor_id) === v)
        }))} options={options(setup.labours, 'labor_id', 'name')} /><DateField label="Payment date" value={form.paid_date} onChange={field('paid_date')} /><Field label="Advance amount paid" value={form.amount} onChange={field('amount')} /><Choice label="Reason" value={form.reason || 'Personal'} onChange={field('reason')} options={['Personal', 'Medical', 'Family', 'Other'].map(x => ({
          id: x,
          name: x
        }))} /><Field label="Notes / reference" numeric={false} value={form.notes} onChange={field('notes')} /><Text style={s.note}>This advance will be auto-deducted in settlement.</Text><Text style={s.section}>Recent Advances</Text>{setup.advances.filter(a => String(a.labor_id) === String(editor.labor?.labor_id)).slice(0, 5).map(a => <Pair key={a.advance_id} label={`${a.paid_date} | ${a.reason || 'Other'}`} value={cash(a.amount)} />)}</>}
      {editor?.kind === 'cycle' && <><Field label="Cycle name" numeric={false} value={form.cycle_name} onChange={field('cycle_name')} /><Choice label="Frequency" value={form.frequency} onChange={field('frequency')} options={[{
          id: 'weekly',
          name: 'Weekly'
        }, {
          id: 'fifteen_day',
          name: '15 days'
        }, {
          id: 'monthly',
          name: 'Monthly'
        }, {
          id: 'custom',
          name: 'Custom'
        }]} />{form.frequency === 'custom' ? <Field label="Number of days" value={form.custom_days} onChange={field('custom_days')} /> : null}<DateField label="Effective from" value={form.effective_from} onChange={field('effective_from')} /></>}
      <Button title={busy ? 'Saving...' : editor.kind === 'daily' ? 'Save Entry' : editor.kind === 'advance' ? 'Save Advance' : editor.kind === 'cycle' ? 'Save Cycle' : 'Save Salary Rates'} onPress={save} disabled={busy} /><Button title="Cancel" secondary onPress={() => setEditor(null)} disabled={busy} />
    </View>}
    <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => !busy && setDetail(null)}><View style={s.shade}><View style={s.sheet}><ScrollView>{(() => {
              const h = detail?.history,
                p = detail?.preview || (h?.breakdown_json ? JSON.parse(h.breakdown_json) : h);
              if (!p) return null;
              return <><Text style={s.title}>{p.labor_name || h?.labor_name}</Text><Text style={s.section}>{p.period_start} to {p.period_end}</Text><Pair label="Regular Wages" value={cash(p.fixed_earned)} /><Pair label="Harvest Bonus" value={cash(p.variable_earned)} /><Pair label="Work Charges" value={cash(p.work_earned)} /><Pair label="OT / Extra" value={cash(Number(p.overtime_earned || 0) + Number(p.custom_earned || 0))} /><Pair label="Total earned" value={cash(p.total_earned)} strong /><Pair label="Advance deducted" value={`- ${cash(p.advance_paid)}`} /><Pair label={h ? 'Salary paid' : 'Payment due'} value={cash(p.settled_paid)} strong />{p.advance_remaining > 0 ? <Text style={s.note}>Advance carried forward: {cash(p.advance_remaining)}</Text> : null}{p.errors?.length ? <Text style={s.error}>{p.errors.join('\n')}</Text> : null}<Button title={showDays ? 'Hide Daily Details' : 'View Daily Details'} secondary onPress={() => setShowDays(v => !v)} />{showDays && p.days?.map(d => <View key={d.work_date} style={s.dayRow}><View style={s.heading}><Text style={s.name}>{d.work_date}</Text><Badge text={d.attendance === 0.5 ? 'Half day' : d.attendance === 1 ? 'Full day' : 'Absent'} /></View><Text style={s.note}>{d.quantity} {d.unit} picked | {d.included_quantity} included | {d.extra_quantity} extra | {d.overtime_hours} h OT</Text><Pair label={`${cash(d.fixed_earned)} + ${cash(d.work_earned)} + ${cash(d.variable_earned)} + ${cash(Number(d.overtime_earned || 0) + Number(d.custom_earned || 0))}`} value={cash(d.total_earned)} /></View>)}{h ? <Text style={s.note}>Settled {h.payment_date || h.settled_on || h.created_on} | {h.payment_method || 'Payment recorded'}</Text> : null}</>;
            })()}<Button title="Close" secondary disabled={busy} onPress={() => setDetail(null)} /></ScrollView></View></View></Modal>
  </View>;
}
const s = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: '#4b2814'
  },
  section: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4b2814',
    marginVertical: 12
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4d2bb',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12
  },
  hero: {
    backgroundColor: '#edf5e8',
    borderWidth: 1,
    borderColor: '#bfd2b2',
    borderRadius: 10,
    padding: 18,
    marginBottom: 12
  },
  total: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2f7134',
    marginVertical: 8
  },
  tabs: {
    gap: 8,
    paddingBottom: 14
  },
  tab: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#ffffff'
  },
  tabOn: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#075b32'
  },
  tabText: {
    fontWeight: '800',
    color: '#4b2814'
  },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e4d2bb',
    paddingBottom: 8
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#efe3d4'
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ead8bf'
  },
  initial: {
    fontWeight: '900',
    color: '#8a4b20'
  },
  name: {
    fontWeight: '800',
    fontSize: 15,
    color: '#4b2814'
  },
  muted: {
    fontSize: 12,
    color: '#715f51',
    lineHeight: 19
  },
  note: {
    fontSize: 12,
    lineHeight: 19,
    color: '#715f51',
    marginBottom: 10
  },
  error: {
    color: '#b6352d',
    lineHeight: 20,
    marginBottom: 10
  },
  badge: {
    backgroundColor: '#f1e5d6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  good: {
    backgroundColor: '#e4f0df'
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#715f51',
    textTransform: 'capitalize'
  },
  columns: {
    flexDirection: 'row',
    gap: 10
  },
  column: {
    flex: 1
  },
  pair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 7
  },
  amount: {
    fontWeight: '800',
    color: '#4b2814'
  },
  bold: {
    fontWeight: '800'
  },
  big: {
    fontSize: 19
  },
  button: {
    backgroundColor: '#4b2814',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4
  },
  secondary: {
    backgroundColor: '#ead8bf'
  },
  buttonText: {
    fontWeight: '800',
    color: 'white'
  },
  field: {
    marginBottom: 14
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4b2814',
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#e4d2bb',
    borderRadius: 10,
    backgroundColor: 'white',
    padding: 12,
    minHeight: 46,
    color: '#4b2814'
  },
  shade: {
    flex: 1,
    backgroundColor: '#0008',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: '92%'
  },
  dayRow: {
    borderTopWidth: 1,
    borderColor: '#e4d2bb',
    paddingVertical: 10
  }
});
