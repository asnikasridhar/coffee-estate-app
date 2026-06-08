import { options, fail } from '../../_shared/http.js';
import { listResource, createResource } from '../../_shared/crud.js';
export function onRequestOptions(){return options();}
export async function onRequestGet({request,env}){try{return await listResource(request,env,'blocks');}catch(err){return fail(err,'blocks failed');}}
export async function onRequestPost({request,env}){try{return await createResource(request,env,'blocks');}catch(err){return fail(err,'Create blocks failed');}}
