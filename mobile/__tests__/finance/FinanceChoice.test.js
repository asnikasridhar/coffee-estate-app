import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { Choice, vendorLabourOptions, commissionSelection } from '../../FinanceModule';

const options=Array.from({length:12},(_,i)=>({id:i+1,name:`Vendor ${i+1}`}));
afterEach(async()=>{await cleanup()});

describe('Finance shared Choice',()=>{
  test('loads, searches, selects, persists on rerender, reopens and dismisses',async()=>{
    const onChange=jest.fn();
    const view=await render(<Choice label="Vendor" value="" onChange={onChange} options={options}/>);
    fireEvent.press(view.getByText('Select'));
    expect(await view.findByText('Vendor 12')).toBeTruthy();
    fireEvent.changeText(await view.findByPlaceholderText('Search vendor...'),'Vendor 11');
    expect(await view.findByText('Vendor 11')).toBeTruthy();
    fireEvent.press(await view.findByText('Vendor 11'));
    expect(onChange).toHaveBeenCalledWith('11');
    view.rerender(<Choice label="Vendor" value="11" onChange={onChange} options={options}/>);
    expect(view.getByText('Vendor 11')).toBeTruthy();
    fireEvent.press(view.getByText('Vendor 11'));
    expect(await view.findByPlaceholderText('Search vendor...')).toBeTruthy();
    fireEvent.press(await view.findByText('Vendor 11'));
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
