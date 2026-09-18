import React from 'react';
import { Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { render, fireEvent, waitFor, cleanup, act } from '@testing-library/react-native';
import PayrollModule, { cycleDates } from '../../PayrollModule';
const Choice = ({
  label,
  options,
  onChange
}) => <View><Text>{label}</Text>{options.map(x => <TouchableOpacity key={x.id} onPress={() => onChange(String(x.id))}><Text>{x.name}</Text></TouchableOpacity>)}</View>;
const DateField = ({
  label,
  value,
  onChange
}) => <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} />;
const fixture = {
  labours: [{
    labor_id: 1,
    name: 'Meena'
  }],
  cycles: [{
    settlement_cycle_id: 4,
    cycle_name: 'Weekly',
    frequency: 'weekly',
    effective_from: '2026-01-01'
  }],
  units: [{
    baseunit_id: 1,
    baseunit_name: 'Bushel'
  }],
  rules: [{
    labor_id: 1,
    fixed_rate: 500,
    variable_rate: 50,
    overtime_rate: 100,
    included_quantity: 5,
    variable_unit_id: 1,
    baseunit_name: 'Bushel',
    effective_from: '2026-01-01'
  }],
  advances: [],
  history: []
};
const preview = {
  labor_id: 1,
  labor_name: 'Meena',
  status: 'unsettled',
  period_start: '2026-09-01',
  period_end: '2026-09-07',
  cycle_name: 'Weekly',
  attendance_days: 1.5,
  fixed_earned: 750,
  variable_earned: 150,
  overtime_earned: 300,
  total_earned: 1200,
  advance_paid: 200,
  settled_paid: 1000,
  preview_key: 'server-preview',
  days: []
};
function api() {
  return jest.fn(async (url, options) => {
    if (options?.method === 'POST') return {
      ok: true
    };
    if (url.includes('/setup')) return fixture;
    if (url.includes('/daily')) return {
      attendance: [{
        labor_id: 1,
        attendance_value: 0.5
      }],
      entries: [],
      earnings: [{
        labor_id: 1,
        total_earned: 250
      }]
    };
    if (url.includes('/preview')) return preview;
    throw new Error(url);
  });
}
const props = request => ({
  propertyId: 1,
  user: {
    username: 'Test'
  },
  request,
  onBack: jest.fn(),
  Choice,
  DateField
});
afterEach(async () => {
  await cleanup();
  jest.restoreAllMocks();
});
test('weekly and monthly salary date ranges', () => {
  expect(cycleDates({
    frequency: 'weekly',
    effective_from: '2026-09-01'
  }, '2026-09-09')).toEqual({
    period_start: '2026-09-08',
    period_end: '2026-09-14'
  });
  expect(cycleDates({
    frequency: 'monthly',
    effective_from: '2026-01-01'
  }, '2026-02-15')).toEqual({
    period_start: '2026-02-01',
    period_end: '2026-02-28'
  });
});
test('half-day worker shows pay and saves daily harvest and OT', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const request = api(),
    view = await render(<PayrollModule {...props(request)} />);
  expect(await view.findByText('Half day')).toBeTruthy();
  expect(await view.findByText('\u20b9250')).toBeTruthy();
  await fireEvent.press(view.getByText('Meena'));
  await fireEvent.changeText(view.getByLabelText('Total harvest picked'), '3.5');
  await fireEvent.press(view.getByText('Bushel'));
  await fireEvent.changeText(view.getByLabelText('Extra hours (OT)'), '1');
  await fireEvent.press(view.getByText('Save'));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/api/payroll/daily', expect.objectContaining({
    method: 'POST'
  })));
  const sent = JSON.parse(request.mock.calls.find(([url, o]) => url === '/api/payroll/daily' && o?.method === 'POST')[1].body);
  expect(sent).toMatchObject({
    labor_id: 1,
    quantity: '3.5',
    unit_id: '1',
    overtime_hours: '1'
  });
});
test('settlement requires review and confirmation of server preview', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {}),
    request = api(),
    view = await render(<PayrollModule {...props(request)} />);
  await view.findByText('Meena');
  await fireEvent.press(view.getByText('Settlement'));
  await fireEvent.press(view.getByText('Calculate salary'));
  await view.findByText('unsettled');
  await fireEvent.press(view.getByText('Meena'));
  await fireEvent.press(view.getByText('Settle \u20b91,000'));
  expect(alert).toHaveBeenCalledWith('Confirm salary payment', expect.stringContaining('Advance deduction: \u20b9200'), expect.any(Array));
  expect(request.mock.calls.filter(([url]) => url === '/api/payroll/settle')).toHaveLength(0);
  const buttons = alert.mock.calls.find(c => c[0] === 'Confirm salary payment')[2];
  await act(async () => {
    await buttons[1].onPress();
  });
  expect(JSON.parse(request.mock.calls.find(([url]) => url === '/api/payroll/settle')[1].body)).toMatchObject({
    labor_id: 1,
    preview_key: 'server-preview',
    payment_method: 'cash'
  });
});
test('setup errors are visible instead of silently showing an empty list', async () => {
  const view = await render(<PayrollModule {...props(jest.fn(async () => {
    throw new Error('Salary setup unavailable');
  }))} />);
  expect(await view.findByText('Salary setup unavailable')).toBeTruthy();
  expect(view.getByText('Retry')).toBeTruthy();
});

test('settled workers remain marked when returning to the cycle',async()=>{
  const request=api();request.mockImplementation(async(url)=>url.includes('/setup')?{...fixture,history:[{wage_period_id:5,labor_id:1,labor_name:'Meena',status:'paid',period_start:'2026-01-01',period_end:'2026-12-31',total_earned:1200,settled_paid:1000,advance_paid:200}]}:{attendance:[],entries:[],earnings:[]});
  const view=await render(<PayrollModule {...props(request)}/>);
  await view.findByText('Meena');await fireEvent.press(view.getByText('Settlement'));
  expect(await view.findByText('settled')).toBeTruthy();
  await fireEvent.press(view.getByText('History'));
  expect(await view.findByText('Settled')).toBeTruthy();
  expect(view.getByText('Salary payment')).toBeTruthy();
});
