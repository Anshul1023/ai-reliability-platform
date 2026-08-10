const BASE=import.meta.env.VITE_API_URL||"http://localhost:8000";
export const API_BASE=BASE;
export const API_WS=BASE.replace(/^http/,"ws");
const KEY_STORE="pulseops_api_key";

export function getApiKey(){return localStorage.getItem(KEY_STORE)||""}
export function setApiKey(k){k?localStorage.setItem(KEY_STORE,k):localStorage.removeItem(KEY_STORE)}

async function get(path){const r=await fetch(BASE+path);if(!r.ok)throw new Error(await r.text());return r.json()}
async function post(path){
  const headers={};
  const key=getApiKey();
  if(key)headers.Authorization=`Bearer ${key}`;
  const r=await fetch(BASE+path,{method:"POST",headers});
  if(!r.ok)throw new Error(await r.text());
  return r.json();
}
export const api={
  health:()=>get("/health"),
  projects:()=>get("/projects"),
  summary:()=>get("/projects/summary"),
  incidents:()=>get("/incidents"),
  project:id=>get(`/projects/${id}`),
  services:id=>get(`/services/${id}`),
  deployments:id=>get(`/deployments/${id}`),
  metrics:id=>get(`/metrics/${id}`),
  github:repo=>get(`/github/repository?repo=${encodeURIComponent(repo)}`),
  commits:repo=>get(`/github/commits?repo=${encodeURIComponent(repo)}`),
  investigate:id=>post(`/incidents/${id}/investigate`)
}
