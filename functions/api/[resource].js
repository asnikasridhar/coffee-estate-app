import { options, fail } from '../_shared/http.js';
import { listResource, createResource } from '../_shared/crud.js';
export function onRequestOptions() { return options(); }
export async function onRequestGet(ctx) {
  try { return await listResource(ctx.request, ctx.env, ctx.params.resource); } catch (err) { return fail(err, 'List resource failed'); }
}
export async function onRequestPost(ctx) {
  try { return await createResource(ctx.request, ctx.env, ctx.params.resource); } catch (err) { return fail(err, 'Create resource failed'); }
}
