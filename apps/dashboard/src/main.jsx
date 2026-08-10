import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import {LayoutDashboard,Box,AlertTriangle,Bot,Settings,Activity,Github,ChevronRight,Plus,Search,Bell,CheckCircle2,Sparkles} from "lucide-react";
import {ResponsiveContainer,AreaChart,Area,XAxis,YAxis,Tooltip} from "recharts";
import {api,API_WS,getApiKey,setApiKey} from "./services/api";
import "./styles.css";

const demo=[{time:"09:00",error:1.1},{time:"10:00",error:1.4},{time:"11:00",error:1.2},{time:"12:00",error:2.1},{time:"13:00",error:3.2},{time:"14:00",error:2.4},{time:"15:00",error:1.1}];

function Badge({children,tone="neutral"}){return <span className={"badge "+tone}>{children}</span>}
function Card({title,children,action}){return <section className="card"><div className="head"><h3>{title}</h3>{action}</div>{children}</section>}
function Stat({title,value,sub}){return <div className="card stat"><span>{title}</span><b>{value}</b><small>{sub}</small></div>}

function Overview({liveTick}){
 const [incidents,setIncidents]=useState([]);
 useEffect(()=>{api.incidents().then(setIncidents).catch(()=>{})},[liveTick]);
 return <div className="page"><div className="title"><div><h1>Overview</h1><p>Production health across connected projects.</p></div><button><Plus size={15}/> Add project</button></div>
 <div className="stats"><Stat title="System uptime" value="99.96%" sub="+0.04% this month"/><Stat title="Active incidents" value={incidents.length||2} sub="1 critical · 1 warning"/><Stat title="Avg latency" value="242 ms" sub="-8.4% vs yesterday"/><Stat title="Deployments" value="24" sub="22 passed · 2 failed"/></div>
 <div className="grid2"><Card title="Error rate" action={<Badge tone="green">Normal</Badge>}><div className="chart"><ResponsiveContainer width="100%" height={250}><AreaChart data={demo}><XAxis dataKey="time"/><YAxis/><Tooltip/><Area dataKey="error" type="monotone" fill="currentColor" fillOpacity=".08" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></Card>
 <Card title="Service health"><div className="rows">{["API Gateway","Payments API","AI Worker","PostgreSQL","Redis"].map((x,i)=><div className="row" key={x}><span className={"dot "+(i===2?"warn":"")}/><b>{x}</b><span>{i===2?"Degraded":"Healthy"}</span><small>{i===2?"612":"220"}ms</small></div>)}</div></Card></div>
 <Card title="Active incidents"><div className="rows">{(incidents.length?incidents:[{id:1042,title:"Payment API latency spike",service:"Payments API",severity:"Critical",status:"Investigating"}]).map(x=><div className="row" key={x.id}><AlertTriangle size={15}/><div><b>{x.title}</b><small>{x.service}</small></div><Badge tone="red">{x.status}</Badge></div>)}</div></Card>
 </div>
}
function Projects({open,liveTick}){const [data,setData]=useState([]);useEffect(()=>{api.projects().then(setData).catch(()=>{})},[liveTick]);return <div className="page"><div className="title"><div><h1>Projects</h1><p>Connected repositories and production systems.</p></div><button><Plus size={15}/> Connect repository</button></div><div className="projectGrid">{(data.length?data:[{id:1,name:"Demo Production API",repo:"demo/reliability-api",status:"Healthy",uptime:99.96}]).map(p=><div className="card project" key={p.id} onClick={()=>open(p)}><div className="projectTop"><Github size={20}/><Badge tone={p.status==="Healthy"?"green":"yellow"}>{p.status}</Badge></div><h3>{p.name}</h3><small>{p.repo}</small><div className="metrics"><div><span>Uptime</span><b>{p.uptime}%</b></div><div><span>Services</span><b>5</b></div><div><span>Deploy</span><b>18m</b></div></div><strong>Open project <ChevronRight size={14}/></strong></div>)}</div></div>}
function Incidents({liveTick}){const [data,setData]=useState([]);useEffect(()=>{api.incidents().then(setData).catch(()=>{})},[liveTick]);return <div className="page"><div className="title"><div><h1>Incidents</h1><p>Investigate production anomalies.</p></div><div className="search"><Search size={14}/><input placeholder="Search incidents"/></div></div><Card title="Incident timeline"><div className="rows">{(data.length?data:[{id:1042,title:"Payment API latency spike",service:"Payments API",severity:"Critical",status:"Investigating"}]).map(x=><div className="row" key={x.id}><div className="incidentIcon"><AlertTriangle size={15}/></div><div><b>{x.title}</b><small>INC-{x.id} · {x.service}</small></div><Badge tone={x.severity==="Critical"?"red":"yellow"}>{x.status}</Badge><ChevronRight size={15}/></div>)}</div></Card></div>}
function AIPage(){return <div className="page"><div className="title"><div><h1>AI Investigation</h1><p>Evidence-backed incident analysis.</p></div><Badge tone="purple"><Sparkles size={13}/> Agent online</Badge></div><div className="stats"><Stat title="Investigations today" value="18" sub="16 completed"/><Stat title="Average confidence" value="86%" sub="+4.2% this week"/><Stat title="Evidence sources" value="142" sub="GitHub + metrics + logs"/><Stat title="Awaiting approval" value="2" sub="Human review required"/></div><Card title="Current investigation"><div className="ai"><Bot size={22}/><div><b>Payment API incident</b><p>Checking recent deployments, metrics and previous incident patterns…</p><div className="progress"><i/></div></div></div></Card></div>}
function SettingsPage(){
 const [key,setKey]=useState(getApiKey());
 const [saved,setSaved]=useState(false);
 const save=()=>{setApiKey(key.trim());setSaved(true);setTimeout(()=>setSaved(false),2000)};
 return <div className="page"><div className="title"><div><h1>Settings</h1><p>Integrations and workspace preferences.</p></div></div>
 <Card title="API access" action={key?<Badge tone="green">Configured</Badge>:<Badge>Not set</Badge>}>
  <p className="muted">API key for write actions (starting investigations, AI analysis). Stored only in this browser — never in the app bundle. Reads stay public.</p>
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
 useEffect(()=>{
  setRepo(null);setCommits([]);setServices([]);setDeployments([]);setIncidents([]);
  api.github(p.repo).then(setRepo).catch(()=>{});
  api.commits(p.repo).then(setCommits).catch(()=>{});
  api.services(p.id).then(setServices).catch(()=>{});
  api.deployments(p.id).then(setDeployments).catch(()=>{});
  api.incidents().then(x=>setIncidents(x.filter(i=>i.project_id===p.id))).catch(()=>{});
 },[p,liveTick]);
 const short=s=>s?s.slice(0,7):"";
 const open=incidents.filter(i=>i.status!=="Resolved").length;
 return <div className="page"><button className="back" onClick={back}>← Projects</button>
 <div className="title"><div><h1>{p.name}</h1><p><Github size={14}/> {p.repo}</p></div><Badge tone={p.status==="Healthy"?"green":"yellow"}>{p.status}</Badge></div>
 <div className="stats"><Stat title="Uptime" value={p.uptime+"%"} sub="Last 30 days"/><Stat title="Services" value={services.length} sub={services.length?"Monitored":"Not monitored yet"}/><Stat title="Deployments" value={deployments.length} sub="Tracked here"/><Stat title="Open incidents" value={open} sub="Needs attention"/></div>
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
 </div>}
function App(){
 const [page,setPage]=useState("Overview"),[selected,setSelected]=useState(null);
 const [liveTick,setLiveTick]=useState(0);
 useEffect(()=>{
  let ws;
  try{
   ws=new WebSocket(`${API_WS}/ws/incidents`);
   ws.onmessage=()=>setLiveTick(t=>t+1);
   ws.onerror=()=>{};
  }catch(e){}
  return()=>{try{ws&&ws.close()}catch(e){}};
 },[]);
 const nav=[["Overview",LayoutDashboard],["Projects",Box],["Incidents",AlertTriangle],["AI Investigation",Bot],["Settings",Settings]];
 let content=selected?<ProjectDetails p={selected} back={()=>setSelected(null)} liveTick={liveTick}/>:page==="Overview"?<Overview liveTick={liveTick}/>:page==="Projects"?<Projects open={setSelected} liveTick={liveTick}/>:page==="Incidents"?<Incidents liveTick={liveTick}/>:page==="AI Investigation"?<AIPage/>:<SettingsPage/>;
 return <div className="app"><aside><div className="brand"><Activity size={18}/> PulseOps</div><div className="workspace"><b>Acme Engineering</b><small>Production</small></div><nav>{nav.map(([n,I])=><button className={page===n&&!selected?"active":""} onClick={()=>{setPage(n);setSelected(null)}} key={n}><I size={17}/>{n}</button>)}</nav><div className="user">AS · Ansh Sharma</div></aside><main><header><span>{selected?.name||page}</span><div className="top"><div className="topSearch"><Search size={14}/><input placeholder="Search…"/></div><Bell size={17}/><span className="avatar">AS</span></div></header>{content}</main></div>
}
createRoot(document.getElementById("root")).render(<App/>);
