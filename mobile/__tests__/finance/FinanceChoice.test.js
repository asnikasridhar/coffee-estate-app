import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { Choice } from '../../FinanceModule';

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
