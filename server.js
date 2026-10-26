import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const PUBLIC_DIR = join(process.cwd(), 'public');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml' };

function send(res, status, body, type='application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'strict-origin-when-cross-origin' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}
async function bodyJson(req) {
  let raw=''; for await (const chunk of req) { raw += chunk; if (raw.length > 1_000_000) throw new Error('Request too large'); }
  return JSON.parse(raw || '{}');
}
const server = http.createServer(async (req,res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok:true, configured:Boolean(API_KEY), model:MODEL });
  if (req.method === 'POST' && url.pathname === '/api/chat') {
    if (!API_KEY) return send(res, 503, { error:'Server is not configured yet. Set GEMINI_API_KEY in your hosting environment variables.' });
    try {
      const input = await bodyJson(req);
      if (!Array.isArray(input.messages) || input.messages.length === 0) return send(res, 400, { error:'Send at least one message.' });
      const contents = input.messages.slice(-30).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts:[{ text:String(m.text || '').slice(0,12000) }] }));
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
        method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':API_KEY},
        body:JSON.stringify({
          systemInstruction:{parts:[{text:'You are Orbit, a helpful and honest study and productivity AI agent. Help users plan and complete tasks with clear steps. Ask concise clarifying questions when needed. Never claim to have taken external actions you did not take. Use clear headings and bullet points when useful.'}]},
          contents,
          generationConfig:{temperature:0.7,maxOutputTokens:4096}
        }), signal:AbortSignal.timeout(60000)
      });
      const data = await response.json().catch(()=>({}));
      if (!response.ok) {
        const message = data?.error?.message || `Gemini API returned ${response.status}`;
        const status = response.status === 429 ? 429 : (response.status === 400 ? 400 : 502);
        return send(res,status,{error:message});
      }
      const answer = data?.candidates?.[0]?.content?.parts?.map(p=>p.text || '').join('').trim();
      if (!answer) return send(res,502,{error:'Gemini returned no text. Try again.'});
      return send(res,200,{answer});
    } catch (err) {
      return send(res,500,{error:err.name === 'TimeoutError' ? 'Gemini request timed out. Please retry.' : (err.message || 'Unexpected server error')});
    }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res,405,{error:'Method not allowed'});
  let pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  let safe = normalize(pathname).replace(/^([.][.][/\\])+/, '').replace(/^[/\\]+/, '');
  const file = join(PUBLIC_DIR, safe);
  if (!file.startsWith(PUBLIC_DIR)) return send(res,403,{error:'Forbidden'});
  try { const content = await readFile(file); res.writeHead(200,{'Content-Type':mime[extname(file)] || 'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}); return res.end(req.method === 'HEAD' ? undefined : content); }
  catch { return send(res,404,'Not found','text/plain; charset=utf-8'); }
});
server.listen(PORT, () => console.log(`Orbit AI running on http://localhost:${PORT}`));
