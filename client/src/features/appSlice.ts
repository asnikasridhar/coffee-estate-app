import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export const resources = [
  'properties','blocks','labors','vendors','laborVendors','vendorSettlements','wages','wageSettlements',
  'plants','yieldTypes','yieldRates','assets','expenseTypes','expenses','cropDetails','cropIncome','fertilizers','reports','baseUnits'
];

const savedUser = localStorage.getItem('estateUser');
const savedProperty = localStorage.getItem('selectedPropertyId');
const baseHeaders = () => {
  const user = localStorage.getItem('estateUser');
  const propertyId = localStorage.getItem('selectedPropertyId') || '';
  const parsed = user ? JSON.parse(user) : null;
  return { 'Content-Type': 'application/json', 'x-user-id': parsed?.user_id ? String(parsed.user_id) : '', 'x-property-id': propertyId };
};
const api = async (path: string, options?: RequestInit) => {
  const res = await fetch(path, { headers: baseHeaders(), ...options });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
};
export const login = createAsyncThunk('app/login', async (payload: {username:string; password:string}) => api('/api/auth/login', { method:'POST', body: JSON.stringify(payload) }));
export const loadOwnerProperties = createAsyncThunk('app/loadOwnerProperties', () => api('/api/owner/properties'));
export const registerProperty = createAsyncThunk('app/registerProperty', async (payload: any, { dispatch }) => { const p = await api('/api/owner/properties', { method:'POST', body: JSON.stringify(payload) }); localStorage.setItem('selectedPropertyId', String(p.property_id)); dispatch(setSelectedPropertyId(String(p.property_id))); dispatch(loadMeta()); dispatch(loadDashboard()); return p; });
export const loadMeta = createAsyncThunk('app/loadMeta', () => api('/api/meta'));
export const loadDashboard = createAsyncThunk('app/loadDashboard', () => api('/api/dashboard'));
export const loadAttendance = createAsyncThunk('app/loadAttendance', () => api('/api/attendance'));
export const loadRainfall = createAsyncThunk('app/loadRainfall', () => api('/api/rainfall'));
export const loadYield = createAsyncThunk('app/loadYield', () => api('/api/yield'));
export const loadResource = createAsyncThunk('app/loadResource', (resource: string) => api(`/api/${resource}`).then(data => ({ resource, data })));
export const saveResource = createAsyncThunk('app/saveResource', async ({ resource, payload }: any, { dispatch }) => { await api(`/api/${resource}`, { method: 'POST', body: JSON.stringify(payload) }); dispatch(loadResource(resource)); dispatch(loadMeta()); dispatch(loadDashboard()); });
export const deleteResource = createAsyncThunk('app/deleteResource', async ({ resource, id }: any, { dispatch }) => { await api(`/api/${resource}/${id}`, { method: 'DELETE' }); dispatch(loadResource(resource)); dispatch(loadMeta()); dispatch(loadDashboard()); });
export const createAttendance = createAsyncThunk('app/createAttendance', async (payload: any, { dispatch }) => { await api('/api/attendance', { method: 'POST', body: JSON.stringify(payload) }); dispatch(loadAttendance()); dispatch(loadDashboard()); });
export const createRainfall = createAsyncThunk('app/createRainfall', async (payload: any, { dispatch }) => { await api('/api/rainfall', { method: 'POST', body: JSON.stringify(payload) }); dispatch(loadRainfall()); dispatch(loadDashboard()); });
export const createYield = createAsyncThunk('app/createYield', async (payload: any, { dispatch }) => { await api('/api/yield', { method: 'POST', body: JSON.stringify(payload) }); dispatch(loadYield()); dispatch(loadDashboard()); });

type State = { user:any; selectedPropertyId:string; meta:any; dashboard:any; attendance:any[]; rainfall:any[]; yields:any[]; resources:Record<string, any[]>; status:string; error:string };
const initialState: State = { user: savedUser ? JSON.parse(savedUser) : null, selectedPropertyId: savedProperty || '', meta:null, dashboard:null, attendance:[], rainfall:[], yields:[], resources:{}, status:'idle', error:'' };
const slice = createSlice({
  name: 'app', initialState,
  reducers: {
    setSelectedPropertyId: (s, a:PayloadAction<string>) => { s.selectedPropertyId = a.payload; localStorage.setItem('selectedPropertyId', a.payload); },
    logout: (s) => { s.user=null; s.selectedPropertyId=''; s.meta=null; s.dashboard=null; localStorage.removeItem('estateUser'); localStorage.removeItem('selectedPropertyId'); }
  },
  extraReducers: b => {
    b.addCase(login.fulfilled, (s,a:any) => { s.user = a.payload.user; localStorage.setItem('estateUser', JSON.stringify(a.payload.user)); s.meta = { ...(s.meta || {}), properties: a.payload.properties }; if (!s.selectedPropertyId && a.payload.properties?.[0]) { s.selectedPropertyId = String(a.payload.properties[0].property_id); localStorage.setItem('selectedPropertyId', s.selectedPropertyId); } });
    b.addCase(loadOwnerProperties.fulfilled, (s,a) => { s.meta = { ...(s.meta || {}), properties: a.payload }; });
    b.addCase(loadMeta.fulfilled, (s,a) => { s.meta = a.payload; if (!s.selectedPropertyId && a.payload?.properties?.[0]) { s.selectedPropertyId = String(a.payload.properties[0].property_id); localStorage.setItem('selectedPropertyId', s.selectedPropertyId); } });
    b.addCase(loadDashboard.fulfilled, (s,a) => { s.dashboard = a.payload; });
    b.addCase(loadAttendance.fulfilled, (s,a) => { s.attendance = a.payload; });
    b.addCase(loadRainfall.fulfilled, (s,a) => { s.rainfall = a.payload; });
    b.addCase(loadYield.fulfilled, (s,a) => { s.yields = a.payload; });
    b.addCase(loadResource.fulfilled, (s,a:any) => { s.resources[a.payload.resource] = a.payload.data; });
    b.addMatcher(a => a.type.endsWith('/pending'), s => { s.status = 'loading'; s.error=''; });
    b.addMatcher(a => a.type.endsWith('/fulfilled'), s => { s.status = 'idle'; });
    b.addMatcher(a => a.type.endsWith('/rejected'), (s,a:any) => { s.status='failed'; s.error = a.error?.message || 'Request failed'; });
  }
});
export const { setSelectedPropertyId, logout } = slice.actions;
export default slice.reducer;
