const BASE=import.meta.env.VITE_API_URL||"http://localhost:8010";
export const API_BASE=BASE;
export const API_WS=BASE.replace(/^http/,"ws");
const KEY_STORE="pulseops_api_key";

const FALLBACK_PROFILE={
  name:"Anshul Rawat",
  title:"Full Stack Developer",
  tagline:"I build fast, resilient web apps. From pixel-perfect React frontends to async FastAPI backends with Docker, Redis and real observability.",
  summary:"Full Stack Developer with hands-on experience building scalable, high-performance, responsive web apps. Skilled in React.js, FastAPI, PostgreSQL, Docker, CI/CD and modern DevOps practices.",
  about:["I build fast, resilient web apps.","I turn ideas into products that feel fast and never break."],
  phone:"+91 9953540593",
  email:"anshulrawat5124@gmail.com",
  location:"Faridabad, Haryana, India",
  links:{
    github:"https://github.com/Anshul1023",
    linkedin:"https://www.linkedin.com/in/anshul-rawat-235019290",
    portfolio:"https://anshul-rawat-portfolio.vercel.app"
  },
  skills:["React.js","JavaScript (ES6+)","TypeScript","HTML5","CSS3","Vite","Python","FastAPI","PostgreSQL","Docker","Redis"],
  experience:[],
  projects:[],
  education:[],
  languages:["Hindi","English"]
};

export function getApiKey(){return localStorage.getItem(KEY_STORE)||""}
export function setApiKey(k){k?localStorage.setItem(KEY_STORE,k):localStorage.removeItem(KEY_STORE)}
export function isOwner(){return !!(getApiKey()||localStorage.getItem("pulseops_owner_email"))}

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
  deleteProject:id=>del(`/projects/${id}`),
  projectData:id=>get(`/projects/${id}/data`),
  services:id=>get(`/services/${id}`),
  deployments:id=>get(`/deployments/${id}`),
  metrics:id=>get(`/metrics/${id}`),
  github:repo=>get(`/github/repository?repo=${encodeURIComponent(repo)}`),
  commits:repo=>get(`/github/commits?repo=${encodeURIComponent(repo)}`),
  contents:(repo,path="")=>get(`/github/contents?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`),
  proposeChange:(data)=>post("/github/change-proposal",data),
  chat:async(messages,projectId)=>{try{return await post("/ai/chat",{messages,project_id:projectId})}catch(e){const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages,project_id:projectId})});if(!r.ok)throw new Error(await r.text());return r.json()}},
  chatHistory:(projectId)=>get(`/ai/chat/history${projectId?`?project_id=${projectId}`:""}`),
  clearChat:(projectId)=>del(`/ai/chat/history${projectId?`?project_id=${projectId}`:""}`),
  recordView:(data)=>post("/analytics/view",data),
  analytics:(range="7d")=>get(`/analytics/views?range=${range}`),
  feedback:(data)=>post("/feedback",data),
  listFeedback:()=>get("/feedback"),
  contact:(data)=>post("/contact",data),
  listContacts:()=>get("/contact"),
  profile:async()=>{try{return await get("/profile")}catch(e){return FALLBACK_PROFILE}},
  sync:()=>post("/projects/sync"),
  investigate:id=>post(`/incidents/${id}/investigate`)
}
