import InfoTip from '../../src/components/InfoTip';
import { financeHelp } from '../../src/config/sectionHelp';
import React from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { render, fireEvent, waitFor, cleanup, act } from '@testing-library/react-native';
import { SetRates, SalarySettlement, SalaryReports, salaryReportTables, LabourExceptions } from '../../SalaryOperations';
const Choice = ({
  label,
  options,
  onChange
}) => <View><Text>{label}</Text>{options.map(o => <TouchableOpacity key={o.id} onPress={() => onChange(String(o.id))}><Text>{o.name}</Text></TouchableOpacity>)}</View>;
const DateField = ({
  label,
  value,
  onChange
}) => <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} />;
const setup = {
  versions: [],
  activities: [{
    work_activity_id: 1,
    work_activity_name: 'Fertilization'
  }],
  overtimeTypes: [{
    overtime_type_id: 2,
    name: 'Overtime',
    unit: 'hour'
  }],
  units: [{
    baseunit_id: 1,
    baseunit_name: 'Bushel'
  }],
  crops: []
};
const workers = [{
  labor_id: 1,
  labor_name: 'Best Labour',
  attendance: 1,
  total_earned: 150,
  settled_paid: 150,
  advance_paid: 0,
  status: 'unpaid',
  preview_key: 'first',
  work_charges: []
}, {
  labor_id: 2,
  labor_name: 'Sundara',
  attendance: 1,
  total_earned: 120,
  settled_paid: 100,
  advance_paid: 20,
  status: 'unpaid',
  preview_key: 'second',
  work_charges: []
}];
afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});
test('all four rate tabs require a date range and daily saves a new estate version without a labour selector', async () => {
  const request = jest.fn(async () => setup);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const ui = await render(<SetRates propertyId={1} request={request} Choice={Choice} DateField={DateField} />);
  await waitFor(() => expect(request).toHaveBeenCalled());
  for (const tab of ['Work Rates', 'Seasonal', 'Overtime', 'Daily Wages']) {
    await fireEvent.press(ui.getByText(tab));
    expect(ui.getByLabelText('From Date *')).toBeTruthy();
    expect(ui.getByLabelText('To Date *')).toBeTruthy();
  }
  await fireEvent.changeText(ui.getByLabelText('From Date *'), '2026-01-01');
  await fireEvent.changeText(ui.getByLabelText('To Date *'), '2026-06-30');
  await fireEvent.changeText(ui.getByLabelText('Full Day Wage (1 day) *'), '80');
  await fireEvent.changeText(ui.getByLabelText('Half Day Wage (0.5 day) *'), '40');
  await fireEvent.press(ui.getByText('Save new rate version'));
  await waitFor(() => expect(request.mock.calls.some(c => c[0] === '/api/payroll/rate-version')).toBe(true));
  const call = request.mock.calls.find(c => c[0] === '/api/payroll/rate-version');
  expect(call[1].method).toBe('POST');
  expect(JSON.parse(call[1].body)).toMatchObject({
    category: 'daily',
    effective_from: '2026-01-01',
    effective_to: '2026-06-30',
    payload: {
      full_day: '80',
      half_day: '40'
    }
  });
  expect(JSON.parse(call[1].body).labor_id).toBeUndefined();
});
test('settlement loads all attended workers and sends reviewed selection for atomic payment', async () => {
  const request = jest.fn(async () => ({
    rows: workers,
    alerts: [],
    setup
  }));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const ui = await render(<SalarySettlement propertyId={1} request={request} Choice={Choice} DateField={DateField} />);
  await waitFor(() => expect(ui.getByText('Best Labour (LT001)')).toBeTruthy());
  expect(ui.getByText('Sundara (LT002)')).toBeTruthy();
  await fireEvent.press(ui.getByText('Select all calculated'));
  await fireEvent.press(ui.getByText('Mark Selected as Paid'));
  expect(alert.mock.calls[0][1]).toContain('250');
  await act(async () => {
    await alert.mock.calls[0][2].find(x => x.text === 'Mark as Paid').onPress();
  });
  await waitFor(() => expect(request.mock.calls.some(c => c[0] === '/api/payroll/pay-selected')).toBe(true));
  const payment = JSON.parse(request.mock.calls.find(c => c[0] === '/api/payroll/pay-selected')[1].body);
  expect(payment.items).toEqual([{
    labor_id: 1,
    preview_key: 'first'
  }, {
    labor_id: 2,
    preview_key: 'second'
  }]);
});
test('paid detail is read-only and reports group frozen amounts rather than current rate fields', async () => {
  const paid = {
    ...workers[0],
    status: 'paid',
    work_date: '2026-09-20',
    fixed_earned: 100,
    work_earned: 50,
    work_charges: [{
      work_activity_name: 'Fertilization',
      block_name: 'North',
      amount: 50,
      rate: 50,
      quantity: 1
    }],
    rate_snapshot: {
      daily: {
        payload: {
          full_day: 100
        }
      }
    }
  };
  const request = jest.fn(async () => ({
    rows: [paid],
    alerts: [],
    setup
  }));
  const ui = await render(<SalarySettlement propertyId={1} request={request} Choice={Choice} DateField={DateField} />);
  await waitFor(() => expect(ui.getByText('Best Labour (LT001)')).toBeTruthy());
  await fireEvent.press(ui.getByText('Best Labour (LT001)'));
  expect(ui.queryByText('Save actuals and recalculate')).toBeNull();
  expect(ui.queryByText('Mark as Paid')).toBeNull();
  expect(ui.queryByLabelText('Edit Base wage')).toBeNull();
  const groups = salaryReportTables({
    rows: [paid, {
      ...workers[1],
      work_date: '2026-09-20'
    }]
  });
  expect(groups.labour).toEqual([{
    name: 'Best Labour (LT1)',
    earned: 150
  }]);
  expect(groups.work.find(x => x.name === 'Fertilization').earned).toBe(50);
  expect(groups.block.reduce((n, r) => n + r.earned, 0)).toBe(150);
});
test('report export receives saved payment data and separate cost tables', async () => {
  const report = {
    property: 'Estate',
    rows: [{
      ...workers[0],
      status: 'paid',
      work_date: '2026-09-20'
    }],
    advances: [],
    note: 'Paid uses snapshots'
  };
  const request = jest.fn(async () => report),
    exportPdf = jest.fn(async () => {});
  const ui = await render(<SalaryReports propertyId={1} request={request} Choice={Choice} DateField={DateField} exportPdf={exportPdf} />);
  await waitFor(() => expect(ui.getByText('Download PDF')).toBeTruthy());
  await fireEvent.press(ui.getByText('Download PDF'));
  expect(exportPdf).toHaveBeenCalledWith(report, expect.objectContaining({
    labour: [{
      name: 'Best Labour (LT1)',
      earned: 150
    }]
  }));
});
test('exceptions list only labourers with exceptions and supports search by ID', async () => {
  const context = {
    ...setup,
    labours: [{
      labor_id: 1,
      name: 'Sundara'
    }, {
      labor_id: 2,
      name: 'No custom rate'
    }],
    exceptions: [{
      exception_id: 1,
      labor_id: 1,
      labor_name: 'Sundara',
      category: 'daily',
      effective_from: '2026-01-01',
      effective_to: '2026-12-31',
      full_day: 70,
      half_day: 35
    }]
  };
  const ui = await render(<LabourExceptions category="daily" setup={context} request={jest.fn()} Choice={Choice} DateField={DateField} onChanged={jest.fn()} onBack={jest.fn()} />);
  expect(ui.getByText('Sundara (LT001)')).toBeTruthy();
  expect(ui.queryByText('No custom rate')).toBeNull();
  await fireEvent.changeText(ui.getByLabelText('Search labour name / ID'), 'LT001');
  expect(ui.getByText('Sundara (LT001)')).toBeTruthy();
  await fireEvent.press(ui.getByText('Sundara (LT001)'));
  expect(ui.getByText('Current Rate')).toBeTruthy();
  expect(ui.getByText('Rate History')).toBeTruthy();
});
test('saving a work exception sends only the selected work component and dated range', async () => {
  const request = jest.fn(async url => url.includes('rate-context') ? {
    rate: 50,
    unit: 'acre'
  } : {
    id: 3
  });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const context = {
    ...setup,
    labours: [{
      labor_id: 1,
      name: 'Sundara'
    }],
    exceptions: []
  };
  const ui = await render(<LabourExceptions category="work" setup={context} request={request} Choice={Choice} DateField={DateField} onChanged={jest.fn(async () => {})} onBack={jest.fn()} />);
  await fireEvent.press(ui.getByText('+ Add Labour Exception'));
  await fireEvent.press(ui.getByText('Sundara (LT001)'));
  await fireEvent.press(ui.getByText('Fertilization'));
  await fireEvent.changeText(ui.getByLabelText('From Date *'), '2026-09-01');
  await fireEvent.changeText(ui.getByLabelText('To Date *'), '2026-12-31');
  await waitFor(() => expect(ui.getByText('Estate Rate / acre')).toBeTruthy());
  await fireEvent.changeText(ui.getByLabelText('Custom Rate *'), '40');
  await fireEvent.press(ui.getByText('Save Labour Exception'));
  await waitFor(() => expect(request.mock.calls.some(c => c[0] === '/api/payroll/labour-exception')).toBe(true));
  const body = JSON.parse(request.mock.calls.find(c => c[0] === '/api/payroll/labour-exception')[1].body);
  expect(body).toMatchObject({
    category: 'work',
    labor_id: '1',
    type_id: '1',
    rate: '40',
    unit: 'acre',
    effective_from: '2026-09-01',
    effective_to: '2026-12-31'
  });
  expect(body.rates).toBeUndefined();
  expect(body.full_day).toBeUndefined();
});
test('information button explains settlement cycle and stops parent navigation', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {}),
    stopPropagation = jest.fn();
  const ui = await render(<InfoTip title="Settlement Cycle" text={financeHelp['Settlement Cycle']} />);
  await fireEvent.press(ui.getByLabelText('About Settlement Cycle'), {
    stopPropagation
  });
  expect(stopPropagation).toHaveBeenCalled();
  expect(alert).toHaveBeenCalledWith('Settlement Cycle', expect.stringContaining('weekly'), expect.any(Array));
  expect(alert.mock.calls[0][1]).toContain('does not set the wage');
});

test('normal salary list and optional details do not ask for completion or expose zero components',async()=>{
  const row={...workers[0],fixed_earned:120,work_earned:50,variable_earned:0,overtime_earned:0,custom_earned:0,total_earned:170,advance_paid:20,settled_paid:150};
  const request=jest.fn(async()=>({rows:[row],alerts:['Rate configuration info'],setup}));
  const ui=await render(<SalarySettlement propertyId={1} request={request} Choice={Choice} DateField={DateField}/>);
  await ui.findByText('Best Labour (LT001)');
  expect(ui.queryByText('Rate configuration info')).toBeNull();
  expect(ui.queryByText('Daily wage source')).toBeNull();
  await fireEvent.press(ui.getByText('Best Labour (LT001)'));
  for(const zero of ['Seasonal bonus','OT / Extra','Other / Custom'])expect(ui.queryByText(zero)).toBeNull();
  expect(ui.queryByLabelText('Harvest quantity')).toBeNull();
  expect(ui.queryByLabelText('Edit Base wage')).toBeNull();
  await fireEvent.press(ui.getByText('Salary exception'));
  expect(ui.getByText('Override component')).toBeTruthy();
  expect(ui.queryByLabelText('Harvest quantity')).toBeNull();
});
