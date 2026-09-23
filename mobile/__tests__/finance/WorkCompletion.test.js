import React from 'react';
import {Text,TextInput,TouchableOpacity,View} from 'react-native';
import {render,fireEvent,waitFor,cleanup} from '@testing-library/react-native';
import WorkCompletion from '../../WorkCompletion';
const Choice=({label,options,onChange})=><View><Text>{label}</Text>{options.map(o=><TouchableOpacity key={o.id} onPress={()=>onChange(String(o.id))}><Text>{o.name}</Text></TouchableOpacity>)}</View>;
const DateField=({label,value,onChange})=><TextInput accessibilityLabel={label} value={value} onChangeText={onChange}/>;
const assignment=(id,name,unit,assigned)=>({work_assignment_id:id,work_activity_name:name,unit,assigned_quantity:assigned,actual_quantity:null,revision:0,assignment_key:`assignment-${id}`,fixed:unit==='work',rate:50,rate_unit:unit});
const fixture=()=>({labours:[{labor_id:1,name:'Ramesh',input_key:'{}',assignments:[assignment(1,'Pruning','tree',10),assignment(2,'Weeding','acre',1)],extras:[]},{labor_id:2,name:'Novan',input_key:'{}',assignments:[assignment(3,'Harvesting','bushel',null)],extras:[]},{labor_id:3,name:'Best Labour',input_key:'{}',assignments:[assignment(4,'Transport','work',1)],extras:[]}],setup:{activities:[{work_activity_id:5,work_activity_name:'Extra fertilization'}],overtimeTypes:[{overtime_type_id:1,name:'Overtime',unit:'hour'}],attended:[{labor_id:1,name:'Ramesh'}]}});
const makeRequest=()=>{
  const data=fixture();
  return jest.fn(async(url,config)=>{
    if(config?.method==='POST'){
      const body=JSON.parse(config.body);
      if(url.endsWith('completion-extra-work'))data.labours[0].assignments.push(assignment(5,'Extra fertilization','acre',null));
      else for(const item of body.items){const row=data.labours.flatMap(l=>l.assignments).find(a=>a.work_assignment_id===item.work_assignment_id);Object.assign(row,item,{actual_quantity:Number(item.actual_quantity),revision:row.revision+1});}
      return {ok:true};
    }
    return structuredClone(data);
  });
};
afterEach(async()=>{await cleanup();});
test('one list groups works and saves numeric actuals, explicit zero, harvest and Done in a single request',async()=>{
  const request=makeRequest(),ui=await render(<WorkCompletion propertyId={1} request={request} Choice={Choice} DateField={DateField}/>);
  await ui.findByText('Ramesh');
  expect(ui.getAllByText('Ramesh')).toHaveLength(1);
  expect(ui.getByLabelText('Actual Ramesh Pruning 1').props.value).toBe('');
  expect(ui.queryByText('Labour')).toBeNull();expect(ui.queryByText('OT / Extra type')).toBeNull();
  expect(ui.queryByText('Assigned: 0 bushel')).toBeNull();
  await fireEvent.press(ui.getByLabelText('All Ramesh Pruning'));
  await fireEvent.changeText(ui.getByLabelText('Actual Ramesh Weeding 2'),'0');
  await fireEvent.changeText(ui.getByLabelText('Actual Novan Harvesting 3'),'5');
  await fireEvent.press(ui.getByLabelText('Done Best Labour Transport'));
  expect(ui.getAllByText('Save Work Completion')).toHaveLength(1);
  await fireEvent.press(ui.getByText('Save Work Completion'));
  await ui.findByText('Work completion saved.');
  const writes=request.mock.calls.filter(c=>c[1]?.method==='POST');expect(writes).toHaveLength(1);
  expect(JSON.parse(writes[0][1].body).items.map(i=>[i.work_assignment_id,Number(i.actual_quantity)])).toEqual([[1,10],[2,0],[3,5],[4,1]]);
  expect(ui.getByLabelText('Actual Novan Harvesting 3').props.value).toBe('5');
});
test('thirty labourers have direct quantity inputs without selecting each labour',async()=>{
  const data=fixture();data.labours=Array.from({length:30},(_,i)=>({labor_id:i+1,name:`Labour ${i+1}`,assignments:[assignment(i+1,'Pruning','tree',10)],extras:[]}));
  const ui=await render(<WorkCompletion propertyId={1} request={async()=>data} Choice={Choice} DateField={DateField}/>);
  await ui.findByText('Labour 30');expect(ui.getAllByLabelText(/^Actual Labour/)).toHaveLength(30);
  await fireEvent.changeText(ui.getByLabelText('Actual Labour 30 Pruning 30'),'9');
  expect(ui.queryByText('Labour Detail')).toBeNull();
});
test('partial save leaves blank rows pending and a save failure preserves typed quantities',async()=>{
  const base=makeRequest();let fail=true;
  const request=jest.fn(async(url,config)=>{if(config?.method==='POST'&&fail)throw new Error('Network unavailable');return base(url,config);});
  const ui=await render(<WorkCompletion propertyId={1} request={request} Choice={Choice} DateField={DateField}/>);
  await ui.findByText('Ramesh');await fireEvent.changeText(ui.getByLabelText('Actual Ramesh Pruning 1'),'4');
  await fireEvent.press(ui.getByText('Save Work Completion'));await ui.findByText('Network unavailable');
  expect(ui.getByLabelText('Actual Ramesh Pruning 1').props.value).toBe('4');
  fail=false;await fireEvent.press(ui.getByText('Save Work Completion'));await ui.findByText('Work completion saved.');
  expect(ui.getByLabelText('Actual Ramesh Weeding 2').props.value).toBe('');
  const body=JSON.parse(base.mock.calls.find(c=>c[1]?.method==='POST')[1].body);expect(body.items).toHaveLength(1);
});
test('extra work is optional, prefills the labour and preserves other unsaved completion entries',async()=>{
  const request=makeRequest(),ui=await render(<WorkCompletion propertyId={1} request={request} Choice={Choice} DateField={DateField}/>);
  await ui.findByText('Ramesh');await fireEvent.changeText(ui.getByLabelText('Actual Ramesh Pruning 1'),'6');
  await fireEvent.press(ui.getByLabelText('Extra work for Ramesh'));
  expect(ui.queryByText('Labour')).toBeNull();
  await fireEvent.press(ui.getByText('Extra fertilization'));
  await fireEvent.press(ui.getByText('Add to completion list'));
  await ui.findByLabelText('Actual Ramesh Extra fertilization 5');
  expect(ui.getByLabelText('Actual Ramesh Pruning 1').props.value).toBe('6');
  expect(JSON.parse(request.mock.calls.find(c=>c[0].endsWith('completion-extra-work'))[1].body).labor_id).toBe(1);
});

test('OT stays hidden until requested and joins the same completion save',async()=>{
  const request=makeRequest(),ui=await render(<WorkCompletion propertyId={1} request={request} Choice={Choice} DateField={DateField}/>);
  await ui.findByText('Ramesh');expect(ui.queryByText('Overtime')).toBeNull();
  await fireEvent.press(ui.getByText('+ Add OT / Extra'));
  await fireEvent.press(ui.getAllByText('Ramesh').at(-1));
  await fireEvent.press(ui.getByText('Overtime'));await fireEvent.changeText(ui.getByLabelText('OT quantity'),'2');
  await fireEvent.press(ui.getByText('Apply exception'));
  await fireEvent.press(ui.getByText('Save Work Completion'));
  await ui.findByText('Work completion saved.');
  const writes=request.mock.calls.filter(c=>c[1]?.method==='POST');expect(writes).toHaveLength(1);
  expect(JSON.parse(writes[0][1].body).labour_extras).toEqual([{labor_id:1,input_key:'{}',extras:[{overtime_type_id:1,quantity:'2'}]}]);
});
