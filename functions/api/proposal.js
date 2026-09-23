// Cloudflare Pages Function adapter. Deployed only if Cloudflare Pages is the
// chosen host; the static site in dist/ does not depend on it.
import { handleProposal } from '../../server/proposal-handler.mjs';

export const onRequest = (context) => handleProposal(context.request, context.env ?? {});
