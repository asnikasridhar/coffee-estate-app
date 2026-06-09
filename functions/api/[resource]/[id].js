import { options, fail } from '../../_shared/http.js';
import { updateResource, deleteResource } from '../../_shared/crud.js';
export function onRequestOptions() { return options(); }
export async function onRequestPatch(ctx) {
  try { return await updateResource(ctx.request, ctx.env, ctx.params.resource, ctx.params.id); } catch (err) { return fail(err, 'Update resource failed'); }
}
export async function onRequestDelete(ctx) {
  try { return await deleteResource(ctx.request, ctx.env, ctx.params.resource, ctx.params.id); } catch (err) { return fail(err, 'Delete resource failed'); }
}
