import { options, fail } from '../../_shared/http.js';
import { listResource, createResource } from '../../_shared/crud.js';
export function onRequestOptions(){return options();}
export async function onRequestGet({request,env}){try{return await listResource(request,env,'income');}catch(err){return fail(err,'income failed');}}
export async function onRequestPost({request,env}){try{return await createResource(request,env,'income');}catch(err){return fail(err,'Create income failed');}}
