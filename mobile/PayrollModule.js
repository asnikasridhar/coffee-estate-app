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
    [detail, setDetail] = useState(null);
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
  const ruleFor = (id, date = day) => setup.rules.find(r => String(r.labor_id) === String(id) && r.effective_from <= date && (!r.effective_to || r.effective_to >= date) && (!r.season_id || String(r.season_id) === String(seasonId)));
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
      for (const l of setup.labours) {
        try {
          next[l.labor_id] = await request(`/api/payroll/preview?${new URLSearchParams(previewParams(l.labor_id))}`);
        } catch (e) {
          next[l.labor_id] = {
            status: 'needs attention',
            errors: [e.message]
          };
        }
      }
      if (stamp === generation.current) setPreviews(next);
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
    const rule = ruleFor(labor?.labor_id);
    if (kind === 'daily') {
      const entry = daily.entries.find(e => String(e.labor_id) === String(labor.labor_id));
      setForm(entry || {
        quantity: '',
        unit_id: rule?.variable_unit_id || '',
        overtime_hours: ''
      });
    } else if (kind === 'rule') {
      setForm({
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
      paid_date: day
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
          ...(kind === 'rule' && seasonId ? {
            season_id: seasonId
          } : {}),
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
  const rows = Object.values(previews),
    pending = rows.filter(x => x.status === 'unsettled'),
    sum = key => pending.reduce((n, x) => n + Number(x[key] || 0), 0);
  return <View>
    <View style={s.heading}><TouchableOpacity accessibilityLabel="Back to Finance" onPress={onBack}><AppIcon name="back" size={24} color="#4b2814" /></TouchableOpacity><View style={{
        flex: 1
      }}><Text style={s.title}>Labour Salary</Text><Text style={s.muted}>Attendance, harvest & settlement</Text></View><TouchableOpacity accessibilityLabel="Refresh salary" disabled={busy} onPress={load}><AppIcon name="refresh" size={22} color="#8a4b20" /></TouchableOpacity></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>{[['daily', 'Daily entry'], ['settle', 'Settlement'], ['history', 'History'], ['rates', 'Salary rates']].map(([id, label]) => <TouchableOpacity key={id} onPress={() => setTab(id)} style={[s.tab, tab === id && s.tabOn]}><Text style={[s.tabText, tab === id && {
          color: 'white'
        }]}>{label}</Text></TouchableOpacity>)}</ScrollView>
    {error ? <View style={s.card}><Text style={s.error}>{error}</Text><Button title="Retry" onPress={load} /></View> : null}
    {busy ? <Text accessibilityRole="progressbar" style={s.muted}>Loading salary details...</Text> : null}
    {tab === 'daily' && <>
      <View style={s.card}><DateField label="Work date" value={day} onChange={setDay} /><Text style={s.note}>Attendance is taken from Attendance. Enter each worker's total harvest and extra hours for this date. Estate harvest totals are recorded separately in Yield & Sales.</Text></View>
      <View style={s.card}><View style={s.tableHead}><Text style={[s.label, {
            flex: 1
          }]}>Labour</Text><Text style={s.label}>Attendance / Daily input</Text></View>{setup.labours.map(l => {
          const a = daily.attendance.find(x => String(x.labor_id) === String(l.labor_id)),
            e = daily.entries.find(x => String(x.labor_id) === String(l.labor_id)),
            locked = settledOn(l.labor_id, day),
            unit = setup.units.find(u => String(u.baseunit_id) === String(e?.unit_id))?.baseunit_name,
            earning = (daily.earnings || []).find(x => String(x.labor_id) === String(l.labor_id));
          return <TouchableOpacity key={l.labor_id} style={s.person} onPress={() => open('daily', l)} disabled={busy || locked || !a || Number(a.attendance_value) <= 0}><View style={s.avatar}><Text style={s.initial}>{l.name.slice(0, 1).toUpperCase()}</Text></View><View style={{
              flex: 1
            }}><Text style={s.name}>{l.name}</Text><Text style={s.muted}>{e ? `${e.quantity} ${unit || 'units'} | ${e.overtime_hours} h OT` : 'No harvest / OT entered'}</Text>{earning ? <Text style={s.amount}>{earning.error || cash(earning.total_earned)}</Text> : null}</View><Badge text={locked ? 'Settled' : !a ? 'Not marked' : Number(a.attendance_value) === 0 ? 'Absent' : Number(a.attendance_value) === 0.5 ? 'Half day' : 'Full day'} good={locked || Number(a?.attendance_value) > 0} /></TouchableOpacity>;
        })}{!setup.labours.length && !busy ? <Text style={s.note}>Add labour in Labour setup to begin.</Text> : null}</View>
    </>}
    {tab === 'settle' && <>
      <View style={s.card}><Choice label="Settlement cycle" value={cycleId} options={options(setup.cycles, 'settlement_cycle_id', 'cycle_name')} onChange={v => {
          setCycleId(v);
          setPeriod(cycleDates(setup.cycles.find(c => String(c.settlement_cycle_id) === v), day));
        }} /><View style={s.columns}><View style={s.column}><DateField label="From" value={period.period_start} onChange={v => setPeriod(p => ({
              ...p,
              period_start: v
            }))} /></View><View style={s.column}><DateField label="To" value={period.period_end} onChange={v => setPeriod(p => ({
              ...p,
              period_end: v
            }))} /></View></View><Button title="Calculate salary" disabled={busy || !cycleId} onPress={previewAll} />{!setup.cycles.length ? <Button title="Add settlement cycle" secondary onPress={() => open('cycle')} /> : null}</View>
      {rows.length > 0 && <View style={s.hero}><Text style={s.label}>PAYMENT DUE | UNSETTLED LABOUR</Text><Text style={s.total}>{cash(sum('settled_paid'))}</Text><Text style={s.muted}>Earned {cash(sum('total_earned'))} | Advances {cash(sum('advance_paid'))}</Text></View>}
      {setup.labours.map(l => {
        const existing = setup.history.find(h => String(h.labor_id) === String(l.labor_id) && h.period_start <= period.period_end && h.period_end >= period.period_start),
          p = previews[l.labor_id] || (existing ? {
            status: existing.status === 'paid' ? 'settled' : 'partially settled',
            existing
          } : null);
        return <TouchableOpacity key={l.labor_id} style={s.card} disabled={!p || busy} onPress={() => {
          if (p.existing) {
            const h = setup.history.find(h => h.wage_period_id === p.existing.wage_period_id);
            if (h) setDetail({
              history: h
            });
          } else {
            setDetail({
              preview: p
            });
            setForm({
              payment_method: 'cash'
            });
          }
        }}><View style={s.heading}><Text style={[s.name, {
              flex: 1
            }]}>{l.name}</Text><Badge text={p?.status || 'Not calculated'} good={p?.status === 'settled'} /></View>{p?.status === 'unsettled' ? <><Pair label={`${p.attendance_days} paid days | ${p.cycle_name}`} value={cash(p.settled_paid)} strong /><Text style={s.note}>Review earnings & settle</Text></> : p?.errors ? <Text style={s.error}>{p.errors.join('\n')}</Text> : p?.existing ? <Text style={s.note}>{p.existing.period_start} to {p.existing.period_end} | View settlement</Text> : null}</TouchableOpacity>;
      })}
    </>}
    {tab === 'history' && <>
      <Text style={s.section}>Settlement history</Text>{setup.history.map(h => <TouchableOpacity key={h.wage_period_id} style={s.card} onPress={() => setDetail({
        history: h
      })}><View style={s.heading}><Text style={[s.name, {
            flex: 1
          }]}>{h.labor_name}</Text><Badge text={h.status === 'paid' ? 'Settled' : 'Partially settled'} good={h.status === 'paid'} /></View><Text style={s.muted}>{h.cycle_name || 'Salary cycle'} | {h.period_start} to {h.period_end}</Text><Pair label="Salary payment" value={cash(h.settled_paid)} /><Text style={s.note}>Advance deducted {cash(h.advance_paid)} | Earned {cash(h.total_earned)}</Text></TouchableOpacity>)}{!setup.history.length ? <View style={s.card}><Text style={s.muted}>Settled salary will appear here with each labour's cycle and payment breakdown.</Text></View> : null}
      <Text style={s.section}>Advance payments</Text>{setup.advances.map(a => <View style={s.card} key={a.advance_id}><Text style={s.name}>{a.labor_name}</Text><Pair label={`${a.paid_date} | Paid`} value={cash(a.amount)} /><Pair label="Still to recover" value={cash(a.remaining)} /></View>)}
    </>}
    {tab === 'rates' && <><View style={s.card}><Text style={s.section}>Salary calculation</Text><Text style={s.note}>Daily salary = fixed rate x attendance + extra harvest x rate + OT hours x OT rate. The included harvest allowance is halved for half-day attendance.</Text><Button title="Add settlement cycle" secondary onPress={() => open('cycle')} /></View>{setup.labours.map(l => {
        const r = ruleFor(l.labor_id);
        return <View key={l.labor_id} style={s.card}><View style={s.heading}><Text style={[s.name, {
              flex: 1
            }]}>{l.name}</Text><Badge text={r ? 'Rate configured' : 'Needs a rate'} good={!!r} /></View>{r ? <><Pair label="Daily fixed pay" value={cash(r.fixed_rate)} /><Text style={s.note}>{r.included_quantity} {r.baseunit_name || 'units'} included | {cash(r.variable_rate)} / extra unit | {cash(r.overtime_rate)} / OT hour</Text></> : null}<View style={s.columns}><View style={s.column}><Button title="Set salary rate" secondary onPress={() => open('rule', l)} /></View><View style={s.column}><Button title="Pay advance" secondary onPress={() => open('advance', l)} /></View></View></View>;
      })}</>}
    <Modal visible={!!editor} transparent animationType="slide" onRequestClose={() => !busy && setEditor(null)}><View style={s.shade}><View style={s.sheet}><ScrollView keyboardShouldPersistTaps="handled"><Text style={s.title}>{editor?.kind === 'daily' ? 'Daily harvest & OT' : editor?.kind === 'rule' ? 'Salary rate' : editor?.kind === 'cycle' ? 'Settlement cycle' : 'Advance payment'}</Text><Text style={s.section}>{editor?.labor?.name || ''}</Text>
      {editor?.kind === 'daily' && <><Text style={s.note}>{day} | Attendance determines fixed pay</Text><Field label="Total harvest picked" value={form.quantity} onChange={field('quantity')} /><Choice label="Harvest unit" value={form.unit_id} onChange={field('unit_id')} options={options(setup.units, 'baseunit_id', 'baseunit_name')} /><Field label="Extra hours (OT)" value={form.overtime_hours} onChange={field('overtime_hours')} /><Field label="Notes" numeric={false} value={form.notes} onChange={field('notes')} /></>}
      {editor?.kind === 'rule' && <><DateField label="Effective from" value={form.effective_from} onChange={field('effective_from')} /><Choice label="Salary cycle" value={form.settlement_cycle_id} onChange={field('settlement_cycle_id')} options={options(setup.cycles, 'settlement_cycle_id', 'cycle_name')} />{!setup.cycles.length ? <Text style={s.error}>Add a settlement cycle from Salary rates first.</Text> : null}<Field label="Fixed salary / full day" value={form.fixed_rate} onChange={field('fixed_rate')} /><Choice label="Yield unit" value={form.variable_unit_id} onChange={field('variable_unit_id')} options={options(setup.units, 'baseunit_id', 'baseunit_name')} /><Field label="Harvest included / full day" value={form.included_quantity} onChange={field('included_quantity')} /><Field label="Rate / extra unit" value={form.variable_rate} onChange={field('variable_rate')} /><Field label="Rate / OT hour" value={form.overtime_rate} onChange={field('overtime_rate')} /><Text style={s.note}>Half day: half the fixed salary and half the included harvest. Saving creates a rate effective from the selected date; settled salary stays unchanged.</Text></>}
      {editor?.kind === 'advance' && <><DateField label="Payment date" value={form.paid_date} onChange={field('paid_date')} /><Field label="Advance amount paid" value={form.amount} onChange={field('amount')} /><Field label="Notes / reference" numeric={false} value={form.notes} onChange={field('notes')} /><Text style={s.note}>Record advances already paid. Unrecovered amounts are deducted from the next salary settlement.</Text></>}
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
      <Button title={busy ? 'Saving...' : 'Save'} onPress={save} disabled={busy} /><Button title="Cancel" secondary onPress={() => setEditor(null)} disabled={busy} />
    </ScrollView></View></View></Modal>
    <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => !busy && setDetail(null)}><View style={s.shade}><View style={s.sheet}><ScrollView>{(() => {
              const h = detail?.history,
                p = detail?.preview || (h?.breakdown_json ? JSON.parse(h.breakdown_json) : h);
              if (!p) return null;
              return <><Text style={s.title}>{p.labor_name || h?.labor_name}</Text><Text style={s.section}>{p.period_start} to {p.period_end}</Text><Pair label="Fixed salary" value={cash(p.fixed_earned)} /><Pair label="Extra harvest" value={cash(p.variable_earned)} /><Pair label="Overtime" value={cash(p.overtime_earned)} /><Pair label="Total earned" value={cash(p.total_earned)} strong /><Pair label="Advance deducted" value={`- ${cash(p.advance_paid)}`} /><Pair label={h ? 'Salary paid' : 'Payment due'} value={cash(p.settled_paid)} strong />{p.advance_remaining > 0 ? <Text style={s.note}>Advance carried forward: {cash(p.advance_remaining)}</Text> : null}{p.errors?.length ? <Text style={s.error}>{p.errors.join('\n')}</Text> : null}<Text style={s.section}>Daily breakdown</Text>{p.days?.map(d => <View key={d.work_date} style={s.dayRow}><View style={s.heading}><Text style={s.name}>{d.work_date}</Text><Badge text={d.attendance === 0.5 ? 'Half day' : d.attendance === 1 ? 'Full day' : 'Absent'} /></View><Text style={s.note}>{d.quantity} {d.unit} picked | {d.included_quantity} included | {d.extra_quantity} extra | {d.overtime_hours} h OT</Text><Pair label={`${cash(d.fixed_earned)} + ${cash(d.variable_earned)} + ${cash(d.overtime_earned)}`} value={cash(d.total_earned)} /></View>)}{!h && p.status === 'unsettled' ? <><Choice label="Payment method" value={form.payment_method || 'cash'} onChange={field('payment_method')} options={[{
                    id: 'cash',
                    name: 'Cash'
                  }, {
                    id: 'bank',
                    name: 'Bank transfer'
                  }, {
                    id: 'upi',
                    name: 'UPI'
                  }]} /><Button title={`Settle ${cash(p.settled_paid)}`} disabled={busy} onPress={() => settle(p)} /></> : null}{h ? <Text style={s.note}>Settled {h.settled_on || h.created_on} | {h.payment_method || 'Payment recorded'}</Text> : null}</>;
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
    fontSize: 23,
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
    backgroundColor: '#fffaf2',
    borderWidth: 1,
    borderColor: '#e4d2bb',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12
  },
  hero: {
    backgroundColor: '#edf5e8',
    borderWidth: 1,
    borderColor: '#bfd2b2',
    borderRadius: 16,
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
    backgroundColor: '#ead8bf'
  },
  tabOn: {
    backgroundColor: '#4b2814'
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
    backgroundColor: '#fffaf2',
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
