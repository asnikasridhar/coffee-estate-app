import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { Choice, vendorLabourOptions, commissionSelection } from '../../FinanceModule';

const options=Array.from({length:12},(_,i)=>({id:i+1,name:`Vendor ${i+1}`}));
afterEach(async()=>{await cleanup()});

describe('Finance shared Choice',()=>{
  test('loads, searches, selects, persists on rerender, reopens and dismisses',async()=>{
    const onChange=jest.fn();
    const view=await render(<Choice label="Vendor" value="" onChange={onChange} options={options}/>);
    await fireEvent.press(view.getByText('Select'));
    expect(await view.findByText('Vendor 12')).toBeTruthy();
    await fireEvent.changeText(await view.findByPlaceholderText('Search vendor...'),'Vendor 11');
    expect(await view.findByText('Vendor 11')).toBeTruthy();
    await fireEvent.press(await view.findByText('Vendor 11'));
    expect(onChange).toHaveBeenCalledWith('11');
    await view.rerender(<Choice label="Vendor" value="11" onChange={onChange} options={options}/>);
    expect(view.getByText('Vendor 11')).toBeTruthy();
    await fireEvent.press(view.getByText('Vendor 11'));
    expect(await view.findByPlaceholderText('Search vendor...')).toBeTruthy();
    await fireEvent.press(view.getAllByText('Vendor 11').at(-1));
  });
});


test('vendor commission includes existing vendor links without a wage rule',()=>{
  const link={laborvendor_id:7,labor_id:2,vendor_id:3,labor_name:'Worker',vendorname:'Vendor'};
  const options=vendorLabourOptions({vendorLabours:[link]});
  expect(options).toHaveLength(1);
  expect(options[0].name).toContain('Worker');
  expect(commissionSelection(options[0].id)).toEqual({laborvendor_id:'7',labour_engagement_id:null});
  const existing=vendorLabourOptions({vendorLabours:[link],engagements:[{...link,labour_type:'vendor',labour_engagement_id:9}]});
  expect(existing).toHaveLength(1);
  expect(commissionSelection(existing[0].id)).toEqual({labour_engagement_id:'9',laborvendor_id:null});
  expect(vendorLabourOptions({})).toEqual([]);
});

test('opening searchable dropdown dismisses the prior keyboard without autofocus and survives parent rerenders',async()=>{
  const {Keyboard}=require('react-native');
  const dismiss=jest.spyOn(Keyboard,'dismiss').mockImplementation(()=>{});
  const onChange=jest.fn();
  const ui=await render(<Choice label="Harvest unit" value="" options={options} onChange={onChange}/>);
  await fireEvent.press(ui.getByLabelText('Harvest unit'));
  expect(dismiss).toHaveBeenCalled();
  expect(ui.getByLabelText('Search Harvest unit').props.autoFocus).not.toBe(true);
  await fireEvent.changeText(ui.getByLabelText('Search Harvest unit'),'Vendor 11');
  await ui.rerender(<Choice label="Harvest unit" value="" options={options.map(x=>({...x}))} onChange={onChange}/>);
  expect(ui.getByLabelText('Search Harvest unit').props.value).toBe('Vendor 11');
  await fireEvent.press(ui.getByText('Vendor 11'));
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith('11');
  expect(ui.queryByLabelText('Search Harvest unit')).toBeNull();
  dismiss.mockRestore();
});
