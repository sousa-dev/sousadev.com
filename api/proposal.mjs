// Vercel Function adapter (Web handler signature). Deployed only if Vercel is
// the chosen host; the static site in dist/ does not depend on it.
import { handleProposal } from '../server/proposal-handler.mjs';

export const config = { runtime: 'edge' };

export default (request) => handleProposal(request, process.env ?? {});
