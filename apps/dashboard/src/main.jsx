import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import {LayoutDashboard,Box,AlertTriangle,Bot,Settings,Activity,Github,ChevronRight,Plus,Search,Bell,CheckCircle2,Sparkles,MessageSquare,RefreshCw,User} from "lucide-react";
import {ResponsiveContainer,AreaChart,Area,XAxis,YAxis,Tooltip} from "recharts";
import {api,API_WS,getApiKey,setApiKey} from "./services/api";
import "./styles.css";

const demo=[{time:"09:00",error:1.1},{time:"10:00",error:1.4},{time:"11:00",error:1.2},{time:"12:00",error:2.1},{time:"13:00",error:3.2},{time:"14:00",error:2.4},{time:"15:00",error:1.1}];

function Badge({children,tone="neutral"}){return <span className={"badge "+tone}>{children}</span>}
function Card({title,children,action}){return <section className="card"><div className="head"><h3>{title}</h3>{action}</div>{children}</section>}
function useCountUp(target,dur=650){
 const [v,setV]=useState(0);
 useEffect(()=>{
  let raf;const t0=performance.now();
  const step=t=>{const k=Math.min(1,(t-t0)/dur);const e=1-Math.pow(1-k,3);setV(target*e);if(k<1)raf=requestAnimationFrame(step)};
  raf=requestAnimationFrame(step);
  return()=>cancelAnimationFrame(raf);
 },[target,dur]);
 return v;
}
function CountUp({n,dur}){const v=useCountUp(n,dur);return <>{n%1===0?Math.round(v):Math.round(v*100)/100}</>}
function Stat({title,value,sub,count,suffix}){const v=useCountUp(count??0);return <div className="card stat"><span>{title}</span><b>{count!==undefined?(count%1===0?Math.round(v):Math.round(v*100)/100)+(suffix||""):value}</b><small>{sub}</small></div>}
function MsgBubble({m}){
 return <div className={"bubble "+(m.role==="user"?"me":"bot")}>
  <span className="bAvatar">{m.role==="user"?<User size={13}/>:<Bot size={13}/>}</span>
  <div className="bBody"><span className="bName">{m.role==="user"?"You":"Dev"}</span><div className="bText">{m.content}</div>{m.provider?<small className="bMeta">· {m.provider}</small>:null}</div>
 </div>;
}
function Typing(){
 return <div className="bubble bot typing"><span className="bAvatar"><Bot size={13}/></span><div className="bBody"><span className="bName">Dev</span><div className="dots"><i/><i/><i/></div></div></div>;
}

function Overview({liveTick}){
 const [incidents,setIncidents]=useState([]);
 const [projects,setProjects]=useState([]);
 useEffect(()=>{api.incidents().then(setIncidents).catch(()=>{})},[liveTick]);
 useEffect(()=>{api.projects().then(setProjects).catch(()=>{})},[liveTick]);
 return <div className="page"><div className="title"><div><h1>Overview</h1><p>Production health across connected projects.</p></div><button><Plus size={15}/> Add project</button></div>
 <div className="stats"><Stat title="System uptime" count={99.96} suffix="%" sub="+0.04% this month"/><Stat title="Active incidents" count={incidents.length||2} sub="1 critical · 1 warning"/><Stat title="Avg latency" count={242} suffix=" ms" sub="-8.4% vs yesterday"/><Stat title="Deployments" count={24} sub="22 passed · 2 failed"/></div>
 <div className="topProjects"><Card title="Top projects" action={<Badge tone="blue">Live</Badge>}><div className="miniProjects">{(projects.length?projects:[{id:1,name:"Demo Production API",repo:"demo/reliability-api",status:"Healthy",uptime:99.96}]).slice(0,6).map(p=><div className="miniProject" key={p.id}><span className={"dot "+(p.status==="Healthy"?"":"warn")}/><div><b>{p.name}</b><small>{p.repo}</small></div><span className="miniUptime"><CountUp n={p.uptime}/>%</span></div>)}</div></Card></div>
 <div className="grid2"><Card title="Error rate" action={<Badge tone="green">Normal</Badge>}><div className="chart"><ResponsiveContainer width="100%" height={250}><AreaChart data={demo}><XAxis dataKey="time"/><YAxis/><Tooltip/><Area dataKey="error" type="monotone" fill="currentColor" fillOpacity=".08" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></Card>
 <Card title="Service health"><div className="rows">{["API Gateway","Payments API","AI Worker","PostgreSQL","Redis"].map((x,i)=><div className="row" key={x}><span className={"dot "+(i===2?"warn":"")}/><b>{x}</b><span>{i===2?"Degraded":"Healthy"}</span><small>{i===2?"612":"220"}ms</small></div>)}</div></Card></div>
 <Card title="Active incidents"><div className="rows">{(incidents.length?incidents:[{id:1042,title:"Payment API latency spike",service:"Payments API",severity:"Critical",status:"Investigating"}]).map(x=><div className="row" key={x.id}><AlertTriangle size={15}/><div><b>{x.title}</b><small>{x.service}</small></div><Badge tone="red">{x.status}</Badge></div>)}</div></Card>
 </div>
}
function Projects({open,liveTick}){
 const [data,setData]=useState([]);
 const [summary,setSummary]=useState({services:{},deployments:{},incidents:{}});
 const [q,setQ]=useState("");const [status,setStatus]=useState("All");const [sort,setSort]=useState("name");
 useEffect(()=>{api.projects().then(setData).catch(()=>{})},[liveTick]);
 useEffect(()=>{api.summary().then(setSummary).catch(()=>{})},[liveTick]);
 const base=data.length?data:[{id:1,name:"Demo Production API",repo:"demo/reliability-api",status:"Healthy",uptime:99.96}];
 const list=base.filter(p=>(status==="All"||p.status===status)&&(!q||p.name.toLowerCase().includes(q.toLowerCase())||p.repo.toLowerCase().includes(q.toLowerCase())));
 const sorted=[...list].sort((a,b)=>sort==="uptime"?b.uptime-a.uptime:a.name.localeCompare(b.name));
 return <div className="page"><div className="title"><div><h1>Projects</h1><p>Connected repositories and production systems.</p></div><button><Plus size={15}/> Connect repository</button></div>
 <div className="filters"><div className="search"><Search size={14}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search projects…"/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option>All</option><option>Healthy</option><option>Degraded</option><option>Down</option></select><select value={sort} onChange={e=>setSort(e.target.value)}><option value="name">Sort: Name</option><option value="uptime">Sort: Uptime</option></select><span className="muted filterCount">{sorted.length} project{sorted.length===1?"":"s"}</span></div>
 <div className="projectGrid">{sorted.map(p=><div className="card project" key={p.id} onClick={()=>open(p)}><div className="projectTop"><Github size={20}/><Badge tone={p.status==="Healthy"?"green":"yellow"}>{p.status}</Badge></div><h3>{p.name}</h3><small>{p.repo}</small><div className="metrics"><div><span>Uptime</span><b><CountUp n={p.uptime}/>%</b></div><div><span>Services</span><b>{summary.services[p.id]||0}</b></div><div><span>Incidents</span><b>{summary.incidents[p.id]||0}</b></div></div><strong>Open project <ChevronRight size={14}/></strong></div>)}{sorted.length===0?<p className="muted full">No projects match your filters.</p>:null}</div></div>
}
function Incidents({liveTick}){
 const [data,setData]=useState([]);
 const [q,setQ]=useState("");const [sev,setSev]=useState("All");const [st,setSt]=useState("All");
 useEffect(()=>{api.incidents().then(setData).catch(()=>{})},[liveTick]);
 const base=data.length?data:[{id:1042,title:"Payment API latency spike",service:"Payments API",severity:"Critical",status:"Investigating"}];
 const list=base.filter(i=>(sev==="All"||i.severity===sev)&&(st==="All"||i.status===st)&&(!q||(i.title||"").toLowerCase().includes(q.toLowerCase())||(i.service||"").toLowerCase().includes(q.toLowerCase())));
 return <div className="page"><div className="title"><div><h1>Incidents</h1><p>Investigate production anomalies.</p></div></div>
 <div className="filters"><div className="search"><Search size={14}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search incidents…"/></div><select value={sev} onChange={e=>setSev(e.target.value)}><option>All</option><option>Critical</option><option>Warning</option><option>Info</option></select><select value={st} onChange={e=>setSt(e.target.value)}><option>All</option><option>Investigating</option><option>Resolved</option></select><span className="muted filterCount">{list.length} incident{list.length===1?"":"s"}</span></div>
 <Card title="Incident timeline" action={<Badge>{list.length} shown</Badge>}><div className="rows">{list.map(x=><div className="row" key={x.id}><div className="incidentIcon"><AlertTriangle size={15}/></div><div><b>{x.title}</b><small>INC-{x.id} · {x.service}</small></div><Badge tone={x.severity==="Critical"?"red":"yellow"}>{x.status}</Badge><ChevronRight size={15}/></div>)}{list.length===0?<p className="muted">No incidents match your filters.</p>:null}</div></Card></div>}
function AIPage(){return <div className="page"><div className="title"><div><h1>AI Investigation</h1><p>Evidence-backed incident analysis.</p></div><Badge tone="purple"><Sparkles size={13}/> Agent online</Badge></div><div className="stats"><Stat title="Investigations today" value="18" sub="16 completed"/><Stat title="Average confidence" value="86%" sub="+4.2% this week"/><Stat title="Evidence sources" value="142" sub="GitHub + metrics + logs"/><Stat title="Awaiting approval" value="2" sub="Human review required"/></div><Card title="Current investigation"><div className="ai"><Bot size={22}/><div><b>Payment API incident</b><p>Checking recent deployments, metrics and previous incident patterns…</p><div className="progress"><i/></div></div></div></Card></div>}
function SettingsPage(){
 const [key,setKey]=useState(getApiKey());
 const [email,setEmail]=useState(localStorage.getItem("pulseops_owner_email")||"");
 const [saved,setSaved]=useState(false);
 const save=()=>{setApiKey(key.trim());localStorage.setItem("pulseops_owner_email",email.trim());setSaved(true);setTimeout(()=>setSaved(false),2000)};
 return <div className="page"><div className="title"><div><h1>Settings</h1><p>Integrations and workspace preferences.</p></div></div>
 <Card title="Owner identity" action={email?<Badge tone="green">Signed in as {email}</Badge>:<Badge>Not set</Badge>}>
  <p className="muted">Only you can make changes — the API key is your write credential, and this email marks you as the owner. Stored only in this browser.</p>
  <div className="row"><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your email (owner)…"/></div>
 </Card>
 <Card title="API access" action={key?<Badge tone="green">Configured</Badge>:<Badge>Not set</Badge>}>
  <p className="muted">API key for write actions (chat, investigations, proposing changes). Stored only in this browser — never in the app bundle. Reads stay public.</p>
  <div className="row"><input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="Paste your API key…"/><button onClick={save}>{saved?"Saved ✓":"Save"}</button></div>
 </Card>
 <Card title="GitHub integration"><div className="row"><Github size={20}/><div><b>GitHub</b><small>Demo connection · read-only</small></div><button>Manage</button></div></Card>
 </div>}
function ProjectDetails({p,back,liveTick}){
 const [repo,setRepo]=useState(null);
 const [commits,setCommits]=useState([]);
 const [services,setServices]=useState([]);
 const [deployments,setDeployments]=useState([]);
 const [incidents,setIncidents]=useState([]);
 const [pdata,setPdata]=useState(null);
 const [preview,setPreview]=useState(null);
 useEffect(()=>{
  setRepo(null);setCommits([]);setServices([]);setDeployments([]);setIncidents([]);setPdata(null);setPreview(null);
  api.github(p.repo).then(setRepo).catch(()=>{});
  api.commits(p.repo).then(setCommits).catch(()=>{});
  api.services(p.id).then(setServices).catch(()=>{});
  api.deployments(p.id).then(setDeployments).catch(()=>{});
  api.incidents().then(x=>setIncidents(x.filter(i=>i.project_id===p.id))).catch(()=>{});
  api.projectData(p.id).then(setPdata).catch(()=>{});
 },[p,liveTick]);
 const short=s=>s?s.slice(0,7):"";
 const open=incidents.filter(i=>i.status!=="Resolved").length;
 const filesDoc=(pdata||[]).find(d=>d.data_type==="files");
 const filesPaths=Array.isArray(filesDoc&&filesDoc.payload)?filesDoc.payload:[];
 const openFile=async path=>{try{const c=await api.contents(p.repo,path);if(c.type==="file")setPreview({path,content:atob(c.content||"")})}catch(e){}};
 return <div className="page"><button className="back" onClick={back}>← Projects</button>
 <div className="title"><div><h1>{p.name}</h1><p><Github size={14}/> {p.repo}</p></div><Badge tone={p.status==="Healthy"?"green":"yellow"}>{p.status}</Badge></div>
 <div className="pgraphWrap"><ProjectGraph projectId={p.id} projectName={p.name}/></div>
 <div className="stats"><Stat title="Uptime" count={p.uptime} suffix="%" sub="Last 30 days"/><Stat title="Services" count={services.length} sub={services.length?"Monitored":"Not monitored yet"}/><Stat title="Deployments" count={deployments.length} sub="Tracked here"/><Stat title="Open incidents" count={open} sub="Needs attention"/></div>
 <div className="grid2">
  <Card title="GitHub repository" action={repo?<Badge tone="green">Connected</Badge>:null}>
   {repo?<div className="rows">
    <div className="row"><Github size={15}/><div><b>{repo.full_name}</b><small>{repo.description||"No description"}</small></div></div>
    <div className="row"><span/><div><b>Default branch</b><small>{repo.default_branch}</small></div></div>
    <div className="row"><span/><div><b>Language</b><small>{repo.language||"—"}</small></div></div>
    {repo.homepage?<div className="row"><span/><div><b>Live site</b><small><a href={repo.homepage} target="_blank" rel="noreferrer">{repo.homepage}</a></small></div></div>:null}
    <div className="row"><span/><div><b>Repository</b><small><a href={repo.html_url} target="_blank" rel="noreferrer">{repo.html_url}</a></small></div></div>
   </div>:<p className="muted">Loading repository…</p>}
  </Card>
  <Card title="Recent commits" action={commits.length?<Badge>{commits.length} latest</Badge>:null}>
   <div className="rows">{commits.length?commits.map(c=><div className="row" key={c.sha}><code className="mono">{short(c.sha)}</code><div><b>{c.message}</b><small>{c.author}</small></div></div>):<p className="muted">No commits found.</p>}</div>
  </Card>
 </div>
 <Card title="Services"><div className="rows">{services.length?services.map(s=><div className="row" key={s.id}><span className={"dot "+(s.status==="Healthy"?"":"warn")}/><b>{s.name}</b><span>{s.status}</span><small>{Math.round(s.latency_ms)}ms</small></div>):<p className="muted">No monitored services yet — Vercel/Railway monitoring comes next.</p>}</div></Card>
 <Card title="Deployments"><div className="rows">{deployments.length?deployments.map(d=><div className="row" key={d.id}><code className="mono">{short(d.sha)}</code><div><b>{d.message}</b><small>{d.author} · {new Date(d.created_at).toLocaleString()}</small></div><Badge tone={d.status==="Passed"?"green":"red"}>{d.status}</Badge></div>):<p className="muted">No deployments recorded yet.</p>}</div></Card>
 <Card title="Repository files" action={filesPaths.length?<Badge tone="blue">{filesPaths.length} files</Badge>:null}>
  <FileTree paths={filesPaths} onOpenFile={openFile}/>
  {preview?<div className="filePreview"><div className="fpHead"><code className="mono">{preview.path}</code><button onClick={()=>setPreview(null)}>✕</button></div><pre>{preview.content.slice(0,8000)}</pre></div>:null}
 </Card>
 </div>}
function ChatPage(){
 const [projects,setProjects]=useState([]);
 const [projectId,setProjectId]=useState(null);
 const [msgs,setMsgs]=useState([]);
 const [input,setInput]=useState("");
 const [busy,setBusy]=useState(false);
 const [files,setFiles]=useState(null);
 const [curFile,setCurFile]=useState(null);
 const [edit,setEdit]=useState("");
 const [prMsg,setPrMsg]=useState("");
 const [note,setNote]=useState("");
 const [synced,setSynced]=useState(null);
 useEffect(()=>{api.projects().then(setProjects).catch(()=>{})},[]);
 const project=projects.find(p=>p.id===projectId)||null;
 const boxRef=React.useRef(null);
 useEffect(()=>{const el=boxRef.current;if(el)el.scrollTop=el.scrollHeight},[msgs,busy]);
 const send=async()=>{
  if(!input.trim()||busy)return;
  const history=[...msgs,{role:"user",content:input,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}];
  setMsgs(history);setInput("");setBusy(true);
  try{
   const res=await api.chat(history.map(m=>({role:m.role,content:m.content})),projectId);
   setMsgs([...history,{role:"assistant",content:res.reply,provider:res.provider,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}]);
  }catch(e){setMsgs([...history,{role:"assistant",content:"Error: "+e.message}])}
  setBusy(false);
 };
 const doSync=async()=>{setSynced(null);try{const r=await api.sync();setSynced(`Sync: ${r.added} added, ${r.skipped} already present, ${r.repos_found} repos found.`);api.projects().then(setProjects).catch(()=>{})}catch(e){setSynced("Sync failed: "+e.message)}};
 const browse=async()=>{
  if(!project){setNote("Select a project first.");return}
  setNote("");setCurFile(null);setEdit("");
  try{const pd=await api.projectData(projectId);const fd=pd.find(d=>d.data_type==="files");setFiles((fd&&Array.isArray(fd.payload))?fd.payload:[])}catch(e){setNote("Browse failed: "+e.message);setFiles(null)}
 };
 const openFile=async path=>{
  if(!project)return;
  try{const c=await api.contents(project.repo,path);if(c.type!=="file")return;setCurFile(path);setEdit(atob(c.content||""))}catch(e){setNote("Read failed: "+e.message)}
 };
 const propose=async()=>{
  if(!project||!curFile)return;
  setNote("");
  try{const r=await api.proposeChange({repo:project.repo,path:curFile,content:edit,message:prMsg||`Update ${curFile}`});setNote(`✅ PR #${r.pr_number} opened: ${r.pr_url}`)}catch(e){setNote("Change failed: "+e.message)}
 };
 return <div className="page"><div className="title"><div><h1>AI Chat</h1><p>Ask anything about your projects — grounded in real repo + monitoring data.</p></div><button onClick={doSync}><RefreshCw size={13}/> Sync projects</button></div>
 {synced?<p className="muted">{synced}</p>:null}
 <div className="grid2">
  <Card title="Conversation" action={<Badge tone="purple"><Sparkles size={13}/> RAG</Badge>}>
   <div className="chatbox" ref={boxRef}>{(msgs.length?msgs:[{role:"assistant",content:"Hey! I'm Dev — your senior dev sidekick. Pick a project (or ask across all of them) — code, services, incidents, or what to build next. 💡"}]).map((m,i)=><MsgBubble m={m} key={i}/>)}{busy?<Typing/>:null}</div>
   <div className="chatbar"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send()}} placeholder="Ask Dev about a project…"/><button onClick={send} disabled={busy||!input.trim()}>{busy?<span className="miniSpin"/>:"Send"}</button></div>
  </Card>
  <div>
   <Card title="Project" action={project?<Badge tone="green">{project.name}</Badge>:null}>
    <div className="row"><select value={projectId||""} onChange={e=>{setProjectId(e.target.value?Number(e.target.value):null);setFiles(null);setCurFile(null)}}><option value="">Select a project…</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button onClick={browse}>Browse repo</button></div>
    <p className="muted">Chat and changes need the API key from Settings.</p>
   </Card>
   <Card title="Repository files">
    {files?(files.length?<FileTree paths={files} onOpenFile={openFile}/>:<p className="muted">Empty repository.</p>):<p className="muted">Browse a repo to see its files, then edit and propose a change — it opens a pull request, never pushes to main directly.</p>}
    {curFile?<div><div className="row"><code className="mono">{curFile}</code></div><textarea className="editor" value={edit} onChange={e=>setEdit(e.target.value)} rows={10}/><div className="row"><input placeholder="Change message (PR title)…" value={prMsg} onChange={e=>setPrMsg(e.target.value)}/><button onClick={propose}>Propose change (PR)</button></div></div>:null}
    {note?<p className="muted">{note}</p>:null}
   </Card>
  </div>
 </div>
</div>
}

function buildTree(paths){
 const root={dirs:{},files:[]};
 for(const p of paths||[]){
  if(!p)continue;
  const parts=p.split("/");let node=root;let acc="";
  for(let i=0;i<parts.length-1;i++){
   const d=parts[i];acc=acc?acc+"/"+d:d;
   if(!node.dirs[d])node.dirs[d]={dirs:{},files:[],path:acc};
   node=node.dirs[d];
  }
  node.files.push({name:parts[parts.length-1],path:p});
 }
 return root;
}
function FileTree({paths,onOpenFile}){
 const [open,setOpen]=useState({});
 const root=buildTree(paths);
 const render=(node,name,path,lev)=>{
  const folders=Object.entries(node.dirs);
  const key=path||"__root__";
  const isOpen=!!open[key];
  return <div key={key}>
   {name?<div className="treeRow folder" style={{paddingLeft:lev*14+8}} onClick={()=>setOpen(s=>({...s,[key]:!s[key]}))}><ChevronRight size={12} className={"treeChev"+(isOpen?" open":"")}/><span>📁</span><b>{name}</b><small>{folders.length+node.files.length}</small></div>:null}
   <div className={"treeChildren"+(isOpen||!name?" open":"")}><div className="treeInner">
    {folders.map(([n,c])=>render(c,n,c.path,lev+1))}
    {node.files.map((f,i)=><div className="treeRow file" key={f.path} style={{paddingLeft:lev*14+26,animationDelay:(i*18)+"ms"}} onClick={()=>onOpenFile&&onOpenFile(f.path)}><span>📄</span><span>{f.name}</span></div>)}
   </div></div>
  </div>;
 };
 return <div className="tree">{render(root,null,"",0)}</div>;
}
function SvcLatency({n}){const v=useCountUp(n,900);return <>{Math.round(v)}</>}

function ProjectGraph({projectId,projectName}){
 const [docs,setDocs]=useState(null);
 useEffect(()=>{
  if(!projectId){setDocs(null);return}
  setDocs(null);
  api.projectData(projectId).then(setDocs).catch(()=>setDocs(null));
 },[projectId]);
 if(!projectId)return null;
 const m={};(docs||[]).forEach(d=>{m[d.data_type]=d.payload});
 const repo=m.repository||{};
 const services=Array.isArray(m.services)?m.services:[];
 const tech=Array.isArray((m.tech||{}).tech)?m.tech.tech:[];
 const files=Array.isArray(m.files)?m.files:[];
 const incidents=Array.isArray(m.incidents)?m.incidents:[];
 const svcs=services.slice(0,2);
 const color=s=>s==="Healthy"?"#36a667":s==="Degraded"?"#d79b2b":"#c54d4d";
 return <div className="pgraph">
  <svg viewBox="0 0 360 185">
   {svcs.map((s,i)=>(<path key={"e"+i} className="pedge" d={i===0?"M180 46 C 220 58, 250 66, 284 85":"M180 46 C 220 70, 250 100, 284 137"}/>))}
   <path className="pedge" d="M180 46 C 140 60, 110 75, 78 93"/>
   <g className="pnode" style={{animationDelay:"0s"}}>
    <rect x="110" y="6" width="140" height="40" rx="10" fill="#eef2ff" stroke="#c9d3f7"/>
    <circle cx="132" cy="26" r="4" className="pdot" fill="#36a667"/>
    <text x="180" y="25" textAnchor="middle" fontSize="11" fontWeight="700" fill="#3a4a8f">{projectName||(repo.full_name||"Project").split("/").pop()}</text>
    <text x="180" y="38" textAnchor="middle" fontSize="8.5" fill="#7d88b8">{repo.full_name||"loading…"}</text>
   </g>
   <g className="pnode" style={{animationDelay:".12s"}}>
    <rect x="8" y="95" width="130" height="42" rx="10" fill="#fff" stroke="#e0e5ee"/>
    <text x="73" y="109" textAnchor="middle" fontSize="10" fontWeight="700" fill="#182234">GitHub</text>
    <text x="73" y="122" textAnchor="middle" fontSize="8.5" fill="#687386">{repo.language||"—"}</text>
    <text x="73" y="133" textAnchor="middle" fontSize="8.5" fill="#8992a2">{repo.default_branch?"branch: "+repo.default_branch:""}</text>
   </g>
   {svcs.map((s,i)=>(<g className="pnode" style={{animationDelay:`.2${i}s`}} key={"s"+i}>
    <rect x="226" y={i===0?88:140} width="126" height="38" rx="10" fill="#fff" stroke="#e0e5ee"/>
    <circle cx="240" cy={i===0?103:155} r="4" className="pdot" fill={color(s.status)}/>
    <text x="256" y={i===0?101:153} fontSize="9.5" fontWeight="700" fill="#182234">{s.name}</text>
    <text x="256" y={i===0?114:166} fontSize="8.5" fill="#687386">{s.status} · <SvcLatency n={s.latency_ms}/>ms</text>
   </g>))}
  </svg>
  {(tech.length||files.length||incidents.length)?<div className="pchips">{tech.slice(0,7).map((t,i)=><span className="pchip" key={i}>{t}</span>)}{files.length?<span className="pchip ghost">📄 {files.length} files</span>:null}{incidents.length?<span className="pchip warn">⚠ {incidents.length} incident{incidents.length>1?"s":""}</span>:null}</div>:null}
 </div>;
}

function ChatDrawer({onClose}){
 const [projects,setProjects]=useState([]);
 const [projectId,setProjectId]=useState(null);
 const [msgs,setMsgs]=useState([]);
 const [input,setInput]=useState("");
 const [busy,setBusy]=useState(false);
 const boxRef=React.useRef(null);
 useEffect(()=>{api.projects().then(setProjects).catch(()=>{})},[]);
 useEffect(()=>{const el=boxRef.current;if(el)el.scrollTop=el.scrollHeight},[msgs,busy]);
 const send=async()=>{
  if(!input.trim()||busy)return;
  const history=[...msgs,{role:"user",content:input,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}];
  setMsgs(history);setInput("");setBusy(true);
  try{
   const res=await api.chat(history.map(m=>({role:m.role,content:m.content})),projectId);
   setMsgs([...history,{role:"assistant",content:res.reply,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}]);
  }catch(e){setMsgs([...history,{role:"assistant",content:"Error: "+e.message}])}
  setBusy(false);
 };
 return <div className="chatDrawer">
  <div className="chatDrawerHead"><b><span className="headDot"/><MessageSquare size={15}/> Ask Dev</b><button className="chatClose" onClick={onClose} aria-label="Close chat">✕</button></div>
  <div className="chatDrawerBody">
   <select value={projectId||""} onChange={e=>setProjectId(e.target.value?Number(e.target.value):null)}>
    <option value="">All projects…</option>
    {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
   </select>
   <ProjectGraph projectId={projectId} projectName={projects.find(p=>p.id===projectId)?.name}/>
   <div className="chatbox" ref={boxRef}>{(msgs.length?msgs:[{role:"assistant",content:"Hey! I'm Dev — your senior dev sidekick. Ask me about any project: code, services, incidents, or what to build next. 💡"}]).map((m,i)=><MsgBubble m={m} key={i}/>)}{busy?<Typing/>:null}</div>
  </div>
  <div className="chatbar"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send()}} placeholder="Ask Dev about a project…"/><button onClick={send} disabled={busy||!input.trim()}>{busy?<span className="miniSpin"/>:"Send"}</button></div>
 </div>;
}

function App(){
 const [page,setPage]=useState(()=>new URLSearchParams(location.search).get("page")||"Overview");
 const [selected,setSelected]=useState(null);
 const [chatOpen,setChatOpen]=useState(false);
 const [liveTick,setLiveTick]=useState(0);
 useEffect(()=>{const id=new URLSearchParams(location.search).get("project");if(id)api.project(id).then(setSelected).catch(()=>{})},[]);
 useEffect(()=>{
  let ws;
  try{
   ws=new WebSocket(`${API_WS}/ws/incidents`);
   ws.onmessage=()=>setLiveTick(t=>t+1);
   ws.onerror=()=>{};
  }catch(e){}
  return()=>{try{ws&&ws.close()}catch(e){}};
 },[]);
 const nav=[["Overview",LayoutDashboard],["Projects",Box],["Incidents",AlertTriangle],["AI Investigation",Bot],["AI Chat",MessageSquare],["Settings",Settings]];
 let content=selected?<ProjectDetails p={selected} back={()=>setSelected(null)} liveTick={liveTick}/>:page==="Overview"?<Overview liveTick={liveTick}/>:page==="Projects"?<Projects open={setSelected} liveTick={liveTick}/>:page==="Incidents"?<Incidents liveTick={liveTick}/>:page==="AI Investigation"?<AIPage/>:page==="AI Chat"?<ChatPage/>:<SettingsPage/>;
 return <div className="app"><aside><div className="brand"><Activity size={18}/> PulseOps</div><div className="workspace"><b>Acme Engineering</b><small>Production</small></div><nav>{nav.map(([n,I])=><button className={page===n&&!selected?"active":""} onClick={()=>{setPage(n);setSelected(null)}} key={n}><I size={17}/>{n}</button>)}</nav><div className="user">AS · Ansh Sharma</div></aside><main><header><span>{selected?.name||page}</span><div className="top"><div className="topSearch"><Search size={14}/><input placeholder="Search…"/></div><Bell size={17}/><span className="avatar">AS</span></div></header>{content}</main><button className="chatFab" onClick={()=>setChatOpen(true)} title="Ask the AI about any project"><MessageSquare size={17}/> Ask AI</button>{chatOpen?<ChatDrawer onClose={()=>setChatOpen(false)}/>:null}</div>
}
createRoot(document.getElementById("root")).render(<App/>);
