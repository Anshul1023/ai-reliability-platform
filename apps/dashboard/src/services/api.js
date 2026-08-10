const BASE=import.meta.env.VITE_API_URL||"http://localhost:8000";
export const API_BASE=BASE;
export const API_WS=BASE.replace(/^http/,"ws");
const KEY_STORE="pulseops_api_key";

export function getApiKey(){return localStorage.getItem(KEY_STORE)||""}
export function setApiKey(k){k?localStorage.setItem(KEY_STORE,k):localStorage.removeItem(KEY_STORE)}

async function get(path){const r=await fetch(BASE+path);if(!r.ok)throw new Error(await r.text());return r.json()}
async function authHeaders(json){const headers={};const key=getApiKey();if(key)headers.Authorization=`Bearer ${key}`;if(json)headers["Content-Type"]="application/json";return headers}
async function post(path,json){
  const r=await fetch(BASE+path,{method:"POST",headers:await authHeaders(json),...(json?{body:JSON.stringify(json)}:{})});
  if(!r.ok)throw new Error(await r.text());
  return r.json();
}
async function del(path){
  const r=await fetch(BASE+path,{method:"DELETE",headers:await authHeaders(false)});
  if(!r.ok)throw new Error(await r.text());
  return r.json();
}
export const api={
  health:()=>get("/health"),
  projects:()=>get("/projects"),
  summary:()=>get("/projects/summary"),
  incidents:()=>get("/incidents"),
  project:id=>get(`/projects/${id}`),
  projectData:id=>get(`/projects/${id}/data`),
  services:id=>get(`/services/${id}`),
  deployments:id=>get(`/deployments/${id}`),
  metrics:id=>get(`/metrics/${id}`),
  github:repo=>get(`/github/repository?repo=${encodeURIComponent(repo)}`),
  commits:repo=>get(`/github/commits?repo=${encodeURIComponent(repo)}`),
  contents:(repo,path="")=>get(`/github/contents?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`),
  proposeChange:(data)=>post("/github/change-proposal",data),
  chat:(messages,projectId)=>post("/ai/chat",{messages,project_id:projectId}),
  chatHistory:(projectId)=>get(`/ai/chat/history${projectId?`?project_id=${projectId}`:""}`),
  clearChat:(projectId)=>del(`/ai/chat/history${projectId?`?project_id=${projectId}`:""}`),
  sync:()=>post("/projects/sync"),
  investigate:id=>post(`/incidents/${id}/investigate`)
}
