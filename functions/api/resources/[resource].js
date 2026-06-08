import { options, fail } from '../../_shared/http.js';
import { listResource, createResource } from '../../_shared/crud.js';
export function onRequestOptions(){return options();}
export async function onRequestGet({request,env,params}){try{return await listResource(request,env,params.resource);}catch(err){return fail(err,'Resource failed');}}
export async function onRequestPost({request,env,params}){try{return await createResource(request,env,params.resource);}catch(err){return fail(err,'Create resource failed');}}
