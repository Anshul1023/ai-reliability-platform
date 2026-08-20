import React,{useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import {LayoutDashboard,Box,AlertTriangle,Bot,Settings,Activity,Github,ChevronRight,Plus,Search,Bell,CheckCircle2,Sparkles,MessageSquare,RefreshCw,User,BarChart3,Phone,Mail,MapPin,Linkedin,GraduationCap,Send} from "lucide-react";
import {ResponsiveContainer,AreaChart,Area,BarChart,Bar,XAxis,YAxis,Tooltip} from "recharts";
import {motion} from "framer-motion";
import {CircularGallery} from "./reactbits";
import {SplitText,DriftWall,Folder} from "./aboutbits";
import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {SplitText as GSAPSplitText} from "gsap/SplitText";
gsap.registerPlugin(ScrollTrigger, GSAPSplitText);
import {api,API_WS,getApiKey,setApiKey,isOwner} from "./services/api";
import "./styles.css";
import "./about.css";const demo=[{time:"09:00",error:1.1},{time:"10:00",error:1.4},{time:"11:00",error:1.2},{time:"12:00",error:2.1},{time:"13:00",error:3.2},{time:"14:00",error:2.4},{time:"15:00",error:1.1}];
function HReel({children,className=""}){
 const viewRef=useRef(null);
 const trackRef=useRef(null);
 const drag=useRef(null);
 const snapT=useRef(null);
 const posRef=useRef(0);     /* current translate (px) */
 const targetRef=useRef(0);   /* eased destination (px) */
 const maxRef=useRef(0);      /* max travel */
 const loopT=useRef(null);
 const canLRef=useRef(false);
 const canRRef=useRef(false);
 const [canL,setCanL]=useState(false);
 const [canR,setCanR]=useState(false);
 /* The track moves via transform, NOT scrollLeft. Setting scrollLeft from
    JS forces a synchronous layout pass every frame (that's the choppiness);
    a transform is compositor-only — the same reason GSAP and native page
    scroll are smooth. */
 const apply=()=>{const t=trackRef.current;if(!t)return;t.style.transform=`translate3d(${(-posRef.current).toFixed(2)}px,0,0)`};
 const updateBtns=()=>{
  const l=posRef.current>2;
  const r=posRef.current<maxRef.current-2;
  if(l!==canLRef.current){canLRef.current=l;setCanL(l)}
  if(r!==canRRef.current){canRRef.current=r;setCanR(r)}
 };
 const measure=()=>{
  const w=viewRef.current,t=trackRef.current;
  if(!w||!t)return;
  maxRef.current=Math.max(0,t.scrollWidth-w.clientWidth);
  posRef.current=Math.min(posRef.current,maxRef.current);
  targetRef.current=Math.min(targetRef.current,maxRef.current);
  apply();updateBtns();
 };
 const stopLoop=()=>{if(loopT.current){clearTimeout(loopT.current);loopT.current=null}};
 const startLoop=()=>{
  if(loopT.current)return;
  let last=performance.now();
  const step=()=>{
   loopT.current=null;
   const diff=targetRef.current-posRef.current;
   if(Math.abs(diff)<0.5){posRef.current=targetRef.current;apply();updateBtns();return}
   const now=performance.now();
   const dt=Math.min(120,Math.max(4,now-last));
   last=now;
   posRef.current+=diff*(1-Math.exp(-dt/75));
   apply();
   loopT.current=setTimeout(step,16);
  };
  loopT.current=setTimeout(step,16);
 };
 const cardStep=()=>{const t=trackRef.current;const c=t?t.querySelector(".hCard"):null;const gap=parseFloat(getComputedStyle(t||document.body).gap||"24");return(c?c.getBoundingClientRect().width:420)+gap};
 const snapTo=()=>{
  /* Only snap once the glide has actually settled — snapping mid-glide
     yanks the track backward and feels like a stutter. */
  if(Math.abs(targetRef.current-posRef.current)>8){scheduleSnap();return}
  const w=viewRef.current,t=trackRef.current;
  if(!w||!t)return;
  const cards=[...t.querySelectorAll(".hCard")];
  if(!cards.length)return;
  const vc=w.clientWidth/2;
  let best=null,bestD=1e9;
  for(const c of cards){
   const r=c.getBoundingClientRect();
   const d=Math.abs(r.left+r.width/2-vc);
   if(d<bestD){bestD=d;best=r}
  }
  if(!best)return;
  targetRef.current=Math.max(0,Math.min(maxRef.current,posRef.current+(best.left+best.width/2-vc)));
  startLoop();
 };
 const scheduleSnap=()=>{clearTimeout(snapT.current);snapT.current=setTimeout(snapTo,150)};
 useEffect(()=>{
  const w=viewRef.current;if(!w)return;
  measure();
  const ro=new ResizeObserver(measure);
  ro.observe(w);
  if(trackRef.current)ro.observe(trackRef.current);
  const onWheel=e=>{
   const d=Math.abs(e.deltaY)>Math.abs(e.deltaX)?e.deltaY:e.deltaX;
   if(!d)return;
   if(maxRef.current<=0)return;
   const atL=posRef.current<=0&&d<0;
   const atR=posRef.current>=maxRef.current-1&&d>0;
   if((atL||atR)&&Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;
   e.preventDefault();
   targetRef.current=Math.max(0,Math.min(maxRef.current,targetRef.current+d));
   startLoop();
   scheduleSnap();
  };
  w.addEventListener("wheel",onWheel,{passive:false});
  const onKey=e=>{
   if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;
   e.preventDefault();
   const step=cardStep();
   targetRef.current=Math.max(0,Math.min(maxRef.current,targetRef.current+(e.key==="ArrowRight"?step:-step)));
   startLoop();
  };
  w.addEventListener("keydown",onKey);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>setTimeout(measure,80)).catch(()=>{});
  return ()=>{clearTimeout(snapT.current);stopLoop();ro.disconnect();w.removeEventListener("wheel",onWheel);w.removeEventListener("keydown",onKey)};
 },[]);
 const startDrag=e=>{
  const w=viewRef.current;if(!w)return;
  clearTimeout(snapT.current);stopLoop();
  drag.current={x:e.clientX,p:posRef.current,id:e.pointerId};
  try{w.setPointerCapture(e.pointerId)}catch(_){/* synthetic / edge pointers */}
  w.classList.add("dragging");
 };
 const moveDrag=e=>{
  const w=viewRef.current;const d=drag.current;
  if(!d||!w)return;
  posRef.current=Math.max(0,Math.min(maxRef.current,d.p-(e.clientX-d.x)));
  targetRef.current=posRef.current;
  apply();
 };
 const endDrag=e=>{
  const w=viewRef.current;const d=drag.current;
  if(!d||!w)return;
  if(w.hasPointerCapture(e.pointerId))w.releasePointerCapture(e.pointerId);
  drag.current=null;w.classList.remove("dragging");
  scheduleSnap();
 };
 const nudge=dir=>{
  const step=cardStep();
  targetRef.current=Math.max(0,Math.min(maxRef.current,targetRef.current+dir*step));
  startLoop();
  setTimeout(snapTo,380);
 };
 return <div className={"hReel "+className}>
  <div className="hReelView" ref={viewRef} tabIndex={0} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
   <div className="hReelTrack" ref={trackRef}>{children}</div>
  </div>
  <button className="hNav hPrev" onClick={()=>nudge(-1)} disabled={!canL} aria-label="Scroll left">‹</button>
  <button className="hNav hNext" onClick={()=>nudge(1)} disabled={!canR} aria-label="Scroll right">›</button>
 </div>;
}

function StoryReel(){
 const cards=[
  {t:"img",img:"/about/fast.jpg",n:"01",head:"Ship fast",d:"Fast products win. I obsess over every millisecond, every frame."},
  {t:"gif",gif:"/about/cat.gif",head:"I build with AI",d:"RAG agents, vector search and automation at Odds Fitness — the boring work does itself."},
  {t:"img",img:"/about/stack.jpg",n:"02",head:"Own the full stack",d:"From React pixels to Postgres queries — the whole path is mine."},
  {t:"img",img:"/about/metrics.jpg",n:"03",head:"Observe everything",d:"Prometheus, Grafana, error rates. I trust metrics, not vibes."},
  {t:"img",img:"/about/servers.jpg",n:"04",head:"Production first",d:"Docker, CI/CD, Redis caching — shipped and monitored, never just demoed."},
  {t:"gif",gif:"/about/yes.gif",head:"And when it works",d:"That feeling when the deploy goes green and latency drops."},
  {t:"img",img:"/about/team.jpg",n:"05",head:"Team player",d:"From startup to agency — I ship alongside great people."},
  {t:"img",img:"/about/cloud.jpg",n:"06",head:"Scale quietly",d:"Simple systems that hold up under load."}
 ];
 const tilt=e=>{const c=e.currentTarget;const r=c.getBoundingClientRect();c.style.transform=`perspective(900px) rotateY(${((e.clientX-r.left)/r.width-.5)*10}deg) rotateX(${-((e.clientY-r.top)/r.height-.5)*8}deg) translateY(-6px) scale(1.04)`};
 const untilt=e=>{e.currentTarget.style.transform=""};
 return <div className="abReelWrap">
  <div className="reelHead"><span className="reelTag">The journey in motion</span><b className="reelHint">Drag · scroll <span>→</span></b></div>
  <HReel>
   {cards.map((c,i)=>c.t==="img"?<div className="reelCard hCard reelImg" key={i} onMouseMove={tilt} onMouseLeave={untilt}><img src={c.img} alt=""/><div className="reelCap"><span className="reelNum">{c.n}</span><b>{c.head}</b><small>{c.d}</small></div></div>:<div className="reelCard hCard reelGif" key={i} onMouseMove={tilt} onMouseLeave={untilt}><img src={c.gif} alt=""/><div className="reelCap reelCapDark"><b>{c.head}</b><small>{c.d}</small></div></div>)}
   <div className="reelCard hCard reelEnd"><b>That's my story.</b><small>One commit at a time.</small><a className="titleBtn" href="#contact">Let's build together</a></div>
  </HReel>
 </div>;
}

function ExpReel({experience,education}){
 const imgs=["/about/fitness.jpg","/about/sgson.jpg","/about/interpe.jpg"];
 return <div className="abReelWrap">
  <HReel>
   {experience.map((e,i)=><div className="expCard hCard" key={i}>
    <div className="expMedia"><img src={imgs[i%imgs.length]} alt=""/><span className="expPeriod">{e.period}</span></div>
    <div className="expBody"><b>{e.role}</b><small>{e.company}</small><ul>{e.points.map((pt,j)=><li key={j}>{pt}</li>)}</ul></div>
   </div>)}
   {education.map((e,i)=><div className="expCard hCard expEdu" key={"e"+i}><span className="expEduIcon"><GraduationCap size={22}/></span><b>{e.degree}</b><small>{e.school}</small><span className="expPeriod">{e.period}</span></div>)}
   <div className="expCard hCard expEnd"><b>That's the journey so far.</b><small>Always shipping, always learning.</small><a className="titleBtn" href="#projects">See the work →</a></div>
  </HReel>
 </div>;
}

/* SkillsOrbit — circular skill wheel (reference: orbit cards + center panel).
   Rotation is driven by a CSS variable so scroll/wheel/click never re-render
   React per frame — keeps it as smooth as the rest of the page. */
const SKILL_META={
 "React.js":{display:"React",short:"⚛",color:"#22d3ee",tags:["COMPONENTS","HOOKS","VIRTUAL DOM"],desc:"Component-based library for building fast, interactive interfaces."},
 "JavaScript (ES6+)":{display:"JavaScript",short:"JS",color:"#facc15",tags:["ES6+","EVENT-DRIVEN","JIT"],desc:"The language of the web — event-driven, dynamic, everywhere."},
 "TypeScript":{display:"TypeScript",short:"TS",color:"#38bdf8",tags:["TYPED","COMPILE-SAFE","SCALABLE"],desc:"Typed JavaScript that keeps large codebases safe and scalable."},
 "HTML5":{display:"HTML5",short:"H5",color:"#f97316",tags:["SEMANTIC","ACCESSIBLE","MEDIA"],desc:"Semantic, accessible markup that structures the modern web."},
 "CSS3":{display:"CSS3",short:"CS",color:"#3b82f6",tags:["FLEXBOX","GRID","ANIMATIONS"],desc:"Flexbox, Grid and animations — the polish behind every pixel."},
 "Tailwind CSS":{display:"Tailwind CSS",short:"TW",color:"#22d3ee",tags:["UTILITY-FIRST","RESPONSIVE","FAST"],desc:"Utility-first styling for shipping consistent UIs fast."},
 "Vite":{display:"Vite",short:"V",color:"#646cff",tags:["HMR","DEV-FAST","BUILD"],desc:"Blazing-fast dev server and build tool for modern frontends."},
 "Python":{display:"Python",short:"PY",color:"#facc15",tags:["VERSATILE","READABLE","ECOSYSTEM"],desc:"Versatile language for backends, automation, AI and data."},
 "FastAPI":{display:"FastAPI",short:"FA",color:"#22c55e",tags:["ASYNC","PYDANTIC","OPENAPI"],desc:"High-performance async Python framework for production APIs."},
 "PostgreSQL":{display:"PostgreSQL",short:"PG",color:"#3b82f6",tags:["ACID","EXTENSIBLE","HIGH PERFORMANCE"],desc:"Reliable open-source relational database with advanced features."},
 "Docker":{display:"Docker",short:"DK",color:"#38bdf8",tags:["CONTAINERS","PORTABLE","ISOLATED"],desc:"Packages apps with their dependencies for consistent deploys."},
 "Git & GitHub":{display:"Git & GitHub",short:"GH",color:"#ffffff",tags:["VERSIONING","COLLABORATION","CI-READY"],desc:"Version control and collaboration that power every project."},
 "CI/CD (Basic)":{display:"CI/CD",short:"CI",color:"#22c55e",tags:["AUTOMATED","TESTED","SHIPPED"],desc:"Automated pipelines that test and ship every change."},
 "Prometheus & Grafana":{display:"Observability",short:"OB",color:"#e6522c",tags:["METRICS","TRACES","ALERTS"],desc:"Metrics, logs and traces — I trust data, not vibes."},
 "Redis":{display:"Redis",short:"R",color:"#ef4444",tags:["IN-MEMORY","CACHING","SUB-MILLISECOND"],desc:"In-memory store for caching, queues and real-time systems."},
 "AI Tools: ChatGPT, Copilot, Cursor.dev, LangChain":{display:"AI Tools",short:"AI",color:"#a95cff",tags:["LLMs","RAG","AGENTS"],desc:"LLMs, RAG and agents — AI-powered development workflows."}
};
const SPLIT_NAME={"PostgreSQL":["Postgre","SQL"],"FastAPI":["Fast","API"],"JavaScript":["Java","Script"],"TypeScript":["Type","Script"],"Tailwind CSS":["Tailwind ","CSS"],"Git & GitHub":["Git & ","GitHub"],"AI Tools":["AI ","Tools"],"Observability":["Observa","bility"],"CI/CD":["CI","/CD"]};
function SkillsOrbit({skills}){
 const data=skills.map(s=>{const m=SKILL_META[s]||{display:s,short:(s[0]||"").toUpperCase(),color:"#7aa2ff",tags:["SHIPPED","MONITORED","SCALED"],desc:`${s} — shipped, monitored, scaled.`};return{name:s,...m}});
 const [selected,setSelected]=useState(0);
 const stageRef=useRef(null);
 const rotRef=useRef(0);
 const inViewRef=useRef(false);
 const lastYRef=useRef(0);
 const lastRunRef=useRef(0);
 const stepT=useRef(null);
 const dragRef=useRef(null);
 const setRot=(deg,animate)=>{const s=stageRef.current;if(!s)return;if(animate){s.classList.add("ow-anim");clearTimeout(stepT.current);stepT.current=setTimeout(()=>s.classList.remove("ow-anim"),520)}s.style.setProperty("--rot",`${deg}deg`)};
 useEffect(()=>{
  const stage=stageRef.current;if(!stage)return;
  const io=new IntersectionObserver(([e])=>{inViewRef.current=e.isIntersecting;if(e.isIntersecting)lastYRef.current=window.scrollY},{threshold:.05});
  io.observe(stage);
  lastYRef.current=window.scrollY;
  const onScroll=()=>{
   if(!inViewRef.current)return;
   /* time-throttled (no rAF dependency — rAF stalls in throttled tabs):
      direct CSS-var write, no React re-render, keeps scroll buttery */
   const now=performance.now();
   if(now-lastRunRef.current<16)return;
   lastRunRef.current=now;
   const delta=window.scrollY-lastYRef.current;
   lastYRef.current=window.scrollY;
   if(delta)setRot(rotRef.current+delta*0.08);
  };
  window.addEventListener("scroll",onScroll,{passive:true});
  const onResize=()=>{setRot(rotRef.current,false)};
  window.addEventListener("resize",onResize);
  return ()=>{io.disconnect();window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onResize);clearTimeout(stepT.current)};
 },[]);
 const handleWheel=e=>{
  e.preventDefault();
  const dir=e.deltaY>0?1:-1;
  rotRef.current+=dir*18;
  setRot(rotRef.current,true);
  setSelected(prev=>(prev+dir+data.length)%data.length);
 };
 const startDrag=e=>{dragRef.current={x:e.clientX,r:rotRef.current,id:e.pointerId};try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}};
 const moveDrag=e=>{const d=dragRef.current;if(!d)return;rotRef.current=d.r+(e.clientX-d.x)*0.35;setRot(rotRef.current,false)};
 const endDrag=e=>{if(!dragRef.current)return;dragRef.current=null};
 const clickCard=i=>{setSelected(i);rotRef.current-=(i-selected)*12;setRot(rotRef.current,true)};
 if(!data.length)return null;
 const s=data[selected];
 const radius=typeof window!=="undefined"&&window.innerWidth<768?185:285;
 const split=name=>{const p=SPLIT_NAME[name]||(()=>{const i=name.lastIndexOf(" ");return i>0?[name.slice(0,i+1),name.slice(i+1)]:null})();if(!p)return name;return <>{p[0]}<span>{p[1]}</span></>};
 return <div className="skills-section">
  <div className="skills-noise"/><div className="skills-glow skills-glow-one"/><div className="skills-glow skills-glow-two"/>
  <div className="skills-header">
   <div className="skills-eyebrow"><span/>MY SKILLS<span/></div>
   <h2 className="skills-title"><span className="skills-title-ghost">SKILLS</span><span className="skills-title-main">THE <span className="gradient-blue">STACK</span> <span className="divider">|</span> <span className="white">SHIP</span> <span className="gradient-purple">WITH</span></span></h2>
   <p className="skills-description">A living wheel of the tools I use daily — <strong>{data.length} technologies</strong>, from React to Redis.<br/><span>Scroll, drag or click</span> to spin it.</p>
  </div>
  <div className="skills-stage" ref={stageRef} onWheel={handleWheel} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
   <div className="radial-ring ring-one"/><div className="radial-ring ring-two"/><div className="radial-ring ring-three"/>
   <div className="skills-wheel">
    {data.map((skill,i)=>{const angle=(i/data.length)*360-90;const x=Math.cos(angle*Math.PI/180)*radius;const y=Math.sin(angle*Math.PI/180)*radius;return(
     <button key={skill.name} className={"skill-card"+(selected===i?" skill-card-active":"")} style={{"--x":`${x}px`,"--y":`${y}px`,"--skill-color":skill.color}} onClick={()=>clickCard(i)}>
      <div className="skill-icon" style={{color:skill.color,textShadow:`0 0 24px ${skill.color}`}}>{skill.short}</div>
      <span>{skill.display}</span>
      {selected===i?<div className="skill-card-line"/>:null}
     </button>)})}
   </div>
   <div className="skill-info">
    <div className="selected-label"><span className="selected-star">✦</span>SELECTED SKILL<span className="selected-star">✦</span></div>
    <h3>{split(s.display)}</h3>
    <p>{s.desc}</p>
    <div className="skill-tags">{s.tags.map(t=><div className="skill-tag" key={t}><span>◈</span>{t}</div>)}</div>
    <div className="skill-progress"><div className="progress-line"/><span>{String(selected+1).padStart(2,"0")} / {String(data.length).padStart(2,"0")}</span><div className="progress-line progress-right"/></div>
    <div className="skill-instruction"><span className="mouse-icon">⌁</span>scroll · drag · click to spin</div>
   </div>
  </div>
  <div className="skills-cta">EXPLORE THE WHEEL<span>↓</span></div>
 </div>;
}

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
/* Simple markdown renderer for AI chat responses */
function renderMd(text){
 if(!text)return null;
 const lines=text.split('\n');
 const out=[];
 let inList=false;
 for(let i=0;i<lines.length;i++){
  let ln=lines[i];
  if(ln.match(/^#{2}\s+(.+)/)){out.push(<div className="mdH3" key={i}>{ln.replace(/^#{2}\s+/,'')}</div>);inList=false;continue}
  if(ln.match(/^#{1}\s+(.+)/)){out.push(<div className="mdH2" key={i}>{ln.replace(/^#\s+/,'')}</div>);inList=false;continue}
  if(ln.match(/^[-*]\s+/)){out.push(<div className="mdLi" key={i}>• {ln.replace(/^[-*]\s+/,'')}</div>);inList=true;continue}
  if(ln.match(/^\d+\.\s+/)){out.push(<div className="mdLi" key={i}>{ln.match(/^(\d+\.)/)[1]} {ln.replace(/^\d+\.\s+/,'')}</div>);inList=true;continue}
  if(ln.match(/^```/)){out.push(<div className="mdCode" key={i}><pre>{lines.slice(i+1,lines.findIndex((l,j)=>j>i&&l.match(/^```/))).join('\n')}</pre></div>);i=lines.findIndex((l,j)=>j>i&&l.match(/^```/));continue}
  if(ln.match(/^\|(.+)\|$/)){out.push(<div className="mdTable" key={i}><code>{ln}</code></div>);continue}
  if(ln.trim()===""){out.push(<div key={i} className="mdBr"/>);inList=false;continue}
  const formatted=ln.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`(.+?)`/g,'<code class="mdInline">$1</code>');
  out.push(<div className="mdP" key={i} dangerouslySetInnerHTML={{__html:formatted}}/>);
 }
 return out;
}
function MsgBubble({m}){
 return <div className={"bubble "+(m.role==="user"?"me":"bot")}>
  <span className="bAvatar">{m.role==="user"?<User size={13}/>:<Bot size={13}/>}</span>
  <div className="bBody"><span className="bName">{m.role==="user"?"You":"Dev"}</span><div className="bText">{m.role==="user"?m.content:renderMd(m.content)}</div>{m.provider?<small className="bMeta">· {m.provider}</small>:null}</div>
 </div>;
}
function Typing(){
 return <div className="bubble bot typing"><span className="bAvatar"><Bot size={13}/></span><div className="bBody"><span className="bName">Dev</span><div className="dots"><i/><i/><i/></div></div></div>;
}
function getVisitorId(){let v=localStorage.getItem("pulseops_visitor");if(!v){v="v_"+Math.random().toString(36).slice(2,10);localStorage.setItem("pulseops_visitor",v)}return v}

function FeedbackModal({open,setOpen}){
 const [name,setName]=useState("");
 const [busy,setBusy]=useState(false);
 const [done,setDone]=useState(false);
 const close=()=>{setOpen(false);setDone(false);setName("")};
 const submit=async()=>{
  if(busy||!name.trim())return;
  setBusy(true);
  try{
   await Promise.race([api.feedback({name:name.trim(),message:"",visitor_id:getVisitorId()}),new Promise(r=>setTimeout(r,8000))]);
   setDone(true);
   setTimeout(close,1600);
  }catch(e){}
  setBusy(false);
 };
 if(!open)return null;
 return <div className="fbModal" onClick={e=>{if(e.target===e.currentTarget)close()}}><div className="fbCard">{done?<div className="fbDone"><CheckCircle2 size={30}/><b>Thanks, {name.trim()||"friend"}! 🎉</b><p className="muted">Appreciate you stopping by.</p></div>:<><h3>Hi there! 👋</h3><p className="muted">Leave your name so I know who visited — that's all, I promise.</p><input placeholder="Your name…" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")submit()}} autoFocus/><div className="fbActions"><button className="ppChange" onClick={close}>Skip</button><button className="titleBtn" onClick={submit} disabled={busy||!name.trim()}>{busy?"Saving…":"Save name"}</button></div></>}</div></div>;
}

function AnalyticsPage(){
 const [range,setRange]=useState("7d");
 const [data,setData]=useState(null);
 const [feedback,setFeedback]=useState([]);
 const [contacts,setContacts]=useState([]);
 const owner=isOwner();
 useEffect(()=>{if(!owner)return;api.analytics(range).then(setData).catch(()=>{});api.listFeedback().then(setFeedback).catch(()=>{});api.listContacts().then(setContacts).catch(()=>{})},[range,owner]);
 if(!owner)return <div className="page"><div className="title"><div><h1>Analytics</h1><p>Owner only.</p></div></div><Card><p className="muted">This page is only visible to the owner. Go to Settings and save your email to gain owner access.</p></Card></div>;
 const d=data||{total_views:0,unique_visitors:0,per_project:[],per_path:[],daily:[]};
 return <div className="page"><div className="title"><div><h1>Analytics</h1><p>Who's looking at your dashboard.</p></div><select className="rangeSel" value={range} onChange={e=>setRange(e.target.value)}><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="all">All time</option></select></div>
 <div className="stats"><Stat title="Total views" count={d.total_views} sub={range==="24h"?"last 24 hours":range==="7d"?"last 7 days":range==="30d"?"last 30 days":"all time"}/><Stat title="Unique visitors" count={d.unique_visitors} sub="by visitor id"/><Stat title="Feedback" count={feedback.length} sub="visitor responses"/><Stat title="Contact requests" count={contacts.length} sub="waiting for you"/></div>
 <div className="grid2">
  <Card title="Views over time" action={<Badge tone="blue">live</Badge>}><div className="chart"><ResponsiveContainer width="100%" height={220}><BarChart data={d.daily}><XAxis dataKey="date" stroke="#39435c" tick={{fill:"#8b96b3",fontSize:9}}/><YAxis stroke="#39435c" tick={{fill:"#8b96b3",fontSize:9}}/><Tooltip contentStyle={{background:"#222733",border:"1px solid #39435c",borderRadius:8}} labelStyle={{color:"#dfe6f5"}}/><Bar dataKey="views" fill="#3b5bdb" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></Card>
  <Card title="Top projects" action={<Badge>{d.per_project.length} tracked</Badge>}><div className="rows">{d.per_project.length?d.per_project.map(p=><div className="row" key={p.id}><span className="dot"/><b>{p.name}</b><span>{p.views} view{p.views===1?"":"s"}</span></div>):<p className="muted">No project views yet.</p>}</div></Card>
 </div>
 <Card title="Top pages" action={<Badge>{d.per_path.length}</Badge>}><div className="rows">{d.per_path.length?d.per_path.map(p=><div className="row" key={p.path}><code className="mono">{p.path}</code><span>{p.views} view{p.views===1?"":"s"}</span></div>):<p className="muted">No views recorded yet.</p>}</div></Card>
 <div className="grid2">
  <Card title="Visitor feedback" action={<Badge tone="purple">{feedback.length}</Badge>}><div className="rows">{feedback.length?feedback.map(f=><div className="row" key={f.id}><div className="incidentIcon"><Sparkles size={15}/></div><div><b>{f.name}</b><small>{new Date(f.created_at).toLocaleString()}</small></div><p style={{flex:2,margin:0}}>{f.message}</p></div>):<p className="muted">No feedback yet — visitors see a popup after a few seconds.</p>}</div></Card>
  <Card title="Contact requests" action={<Badge tone="blue">{contacts.length}</Badge>}><div className="rows">{contacts.length?contacts.map(c=><div className="row" key={c.id}><div className="incidentIcon"><Mail size={15}/></div><div><b>{c.name} · {c.topic||"General"}</b><small>{c.email} · {new Date(c.created_at).toLocaleString()}</small></div><p style={{flex:2,margin:0}}>{c.message}</p></div>):<p className="muted">No contact requests yet — visitors reach you from the About page.</p>}</div></Card>
 </div>
 </div>;
}

function imageForRepo(repo,i){
 const k=(repo||"").toLowerCase();
 const map=[["portfolio","/about/portfolio.jpg"],["reliability","/about/pulseops.jpg"],["fastapi","/about/fastapi.jpg"],["camera","/about/camera.jpg"],["snake","/about/game.jpg"],["agentflow","/about/ai.jpg"],["agent","/about/ai.jpg"],["interview","/about/office.jpg"],["adaptive","/about/space.jpg"],["engine","/about/space.jpg"],["school","/about/office.jpg"],["billing","/about/pulseops.jpg"],["workflow","/about/code.jpg"],["crafty","/about/portfolio.jpg"],["canvas","/about/portfolio.jpg"],["resume","/about/code.jpg"],["audio","/about/desk.jpg"],["browser","/about/camera.jpg"],["usage","/about/mountain.jpg"],["download","/about/mountain.jpg"]];
 for(const [key,img] of map){if(k.includes(key))return img}
 const pool=["/about/mask.jpg","/about/story.jpg","/about/abstract.jpg","/about/fast.jpg","/about/stack.jpg","/about/metrics.jpg","/about/servers.jpg","/about/team.jpg","/about/rocket.jpg","/about/cloud.jpg","/about/arch.jpg","/about/peak.jpg","/about/dark.jpg","/about/space.jpg","/about/desk.jpg","/about/ai.jpg"];
 return pool[(i||0)%pool.length];
}

function SecTitle({children}){
 return <motion.h2 className="secTitle" initial={{y:64,opacity:0}} whileInView={{y:0,opacity:1}} viewport={{once:false,amount:.3}} transition={{duration:.8,ease:[.22,1,.36,1]}}>{children}</motion.h2>;
}

function StoryLine({text,idx}){
 const ref=useRef(null);
 const align=["slLeft","slRight","slCenter"][idx%3];
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  let split=null,tween=null;
  const run=()=>{
   try{
    split=new GSAPSplitText(el,{type:"chars",charsClass:"slChar"});
    tween=gsap.fromTo(split.chars,
     {yPercent:130,opacity:0,rotateX:-55},
     {yPercent:0,opacity:1,rotateX:0,duration:.9,ease:"power3.out",stagger:.026,
      scrollTrigger:{trigger:el,start:"top 88%",once:true}});
   }catch(e){/* split failed — text stays visible */}
  };
  if(document.fonts&&document.fonts.status==="loaded")run();
  else if(document.fonts&&document.fonts.ready)document.fonts.ready.then(run).catch(()=>run());
  else run();
  return ()=>{try{if(tween){tween.scrollTrigger?.kill();tween.kill()}if(split)split.revert()}catch(e){}};
 },[]);
 const hl=["feel fast","never break"];
 return <p ref={ref} className={"storyBigLine "+align}>{text.split(/(feel fast|never break)/g).map((t,j)=>hl.includes(t)?<span className="storyBigHl" key={j}>{t}</span>:t)}</p>;
}

function AboutPage(){
 const [p,setP]=useState(null);
 const [allProjects,setAllProjects]=useState([]);
 const [form,setForm]=useState({name:"",topic:"",email:"",message:""});
 const [sent,setSent]=useState(false);
 const [busy,setBusy]=useState(false);
 const heroRef=useRef(null);
 useEffect(()=>{api.profile().then(setP).catch(()=>{})},[]);
 useEffect(()=>{
  if(!p||!heroRef.current)return;
  const ctx=gsap.context(()=>{
   gsap.to(".heroTitle",{yPercent:-9,ease:"none",scrollTrigger:{trigger:heroRef.current,start:"top top",end:"bottom top",scrub:1.2}});
  },heroRef);
  const settle=setTimeout(()=>{
   const root=heroRef.current;if(!root)return;
   root.querySelectorAll(".heroLine").forEach(el=>{el.style.animation="none";el.style.transform="translateY(0)"});
   root.querySelectorAll(".heroEyebrow,.heroSub,.heroCtaRow,.heroChips,.heroArtEl").forEach(el=>{el.style.animation="none";el.style.opacity="1"});
  },2800);
  return ()=>{clearTimeout(settle);ctx.revert();};
 },[p]);
 useEffect(()=>{
  /* rAF-throttled, once-per-element settle guard: no layout/style reads per frame,
     no interval — keeps scrolling compositor-smooth while still never leaving
     an in-view reveal stuck hidden. */
  let ticking=false;
  const force=()=>{
   ticking=false;
   document.querySelectorAll(".abSec,.secTitle,.storyTitle,.storyLead,.storyBigLine,.storyCta").forEach(el=>{
    if(el.dataset.settled)return;
    const r=el.getBoundingClientRect();
    if(r.top<window.innerHeight&&r.bottom>0&&parseFloat(getComputedStyle(el).opacity)<.5){
     el.dataset.settled="1";
     el.style.setProperty("opacity","1","important");
     if(el.classList.contains("secTitle")||el.classList.contains("storyTitle")||el.classList.contains("storyLead")){
      el.style.setProperty("transform","none","important");
     }
    }
   });
  };
  const onScroll=()=>{if(!ticking){ticking=true;requestAnimationFrame(force)}};
  window.addEventListener("scroll",onScroll,{passive:true});
  const t=setTimeout(force,4500);
  return ()=>{window.removeEventListener("scroll",onScroll);clearTimeout(t)};
 },[]);
 useEffect(()=>{api.projects().then(list=>{setAllProjects(list.filter(x=>x.repo&&x.repo.includes("/")).map((x,i)=>({label:x.name,text:x.name,image:imageForRepo(x.repo,i),link:`https://github.com/${x.repo}`,title:x.name}))) }).catch(()=>{})},[]);
 const tilt=e=>{const c=e.currentTarget;const r=c.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;c.style.transform=`perspective(800px) rotateY(${x*7}deg) rotateX(${-y*7}deg) translateY(-4px)`};
 const untilt=e=>{e.currentTarget.style.transform=""};
 const sendContact=async()=>{
  if(!form.name.trim()||!form.email.trim()||!form.message.trim()||busy)return;
  setBusy(true);
  try{const r=await api.contact(form);setSent(true);setTimeout(()=>setSent(false),4000);setForm({name:"",topic:"",email:"",message:""})}catch(e){}
  setBusy(false);
 };
 if(!p)return <div className="page"><p className="muted">Loading profile…</p></div>;
 const secAnim={initial:{opacity:0,y:56,scale:.98},whileInView:{opacity:1,y:0,scale:1},viewport:{once:false,margin:"-40px",amount:0.15},transition:{duration:.8,ease:[.22,1,.36,1]}};
 
 const driftItems=["/about/mask.jpg","/about/story.jpg","/about/abstract.jpg","/about/desk.jpg","/about/mountain.jpg","/about/space.jpg","/about/office.jpg","/about/code.jpg","/about/ai.jpg","/about/fitness.jpg"].map((img,i)=>({image:img,title:`tile${i}`}));

 return <div className="about">
  <section className="abHero" id="top" ref={heroRef}>
   <div className="abHeroBg"><DriftWall items={driftItems} columns={7} tileWidth={210} tileHeight={140} gap={16} speed={36} fade={0.55} dim={0.82} tilt={14} turn={-12} overlayColor="#080a14"/></div>
   <div className="abHeroInner">
    <div className="heroEditorial">
     <p className="heroEyebrow">Full Stack Developer <span>·</span> Portfolio MMXXVI</p>
     <h1 className="heroTitle" aria-label="Anshul Rawat">
      <span className="heroLineWrap"><span className="heroLine">Anshul</span></span>
      <span className="heroLineWrap"><span className="heroLine heroLineAlt">Rawat</span></span>
     </h1>
     <p className="heroSub">I build fast, resilient web apps. From pixel-perfect React to async FastAPI backends with Docker, Redis and real observability.</p>
     <div className="heroCtaRow"><a className="titleBtn" href="#contact">💬 Work with me</a><a className="titleBtn ghost" href={p.links.portfolio} target="_blank" rel="noreferrer">View my portfolio ↗</a></div>
     <div className="aboutChips heroChips">
      <a className="aboutChip" href={`tel:${p.phone.replace(/\s/g,"")}`}><Phone size={13}/>{p.phone}</a>
      <a className="aboutChip" href={`mailto:${p.email}`}><Mail size={13}/>{p.email}</a>
      <span className="aboutChip"><MapPin size={13}/>{p.location}</span>
      <a className="aboutChip" href={p.links.github} target="_blank" rel="noreferrer"><Github size={13}/>GitHub</a>
      <a className="aboutChip" href={p.links.linkedin} target="_blank" rel="noreferrer"><Linkedin size={13}/>LinkedIn</a>
     </div>
    </div>
   </div>
   <div className="abHeroScroll">SCROLL<span>↓</span></div>
  </section>
  <section className="abSec abStory" id="story">
   <div className="abSecInner storyText">
    <div className="storyScroll">Scroll<span>↓</span></div>
    <motion.h2 className="storyTitle" initial={{x:-220,opacity:0}} whileInView={{x:0,opacity:1}} viewport={{once:false,amount:.4}} transition={{duration:.85,ease:[.22,1,.36,1]}}>MY STORY<span className="storyDot">.</span></motion.h2>
    <span className="storyRule"/>
    <motion.h3 className="storyLead" initial={{x:220,opacity:0}} whileInView={{x:0,opacity:1}} viewport={{once:false,amount:.4}} transition={{duration:.85,delay:.1,ease:[.22,1,.36,1]}}>I turn ideas into products<br/>that <span>feel fast</span> and <span>never break</span></motion.h3>
    <div className="storyParas">
     <div className="storyBigLines">
      {p.summary.split(/\.\s+/).map(s=>s.trim()).filter(Boolean).map((s,i)=><StoryLine key={i} text={s} idx={i}/>)}
     </div>
    </div>
    <motion.div className="storyCta" initial={{x:-240,opacity:0}} whileInView={{x:0,opacity:1}} viewport={{once:false,amount:.4}} transition={{duration:.85,delay:.25,ease:[.22,1,.36,1]}}><a className="titleBtn" href="#contact">Let's build something</a></motion.div>
   </div>
   <StoryReel/>
  </section>
  <motion.section {...secAnim} className="abSec abExp" id="experience">
   <SecTitle>EXPERIENCE</SecTitle>
   <div className="abSecInner">
    <div className="abHeadWrap"><SplitText text="Where I've Worked" tag="h2" className="abHead" splitType="words" delay={80} duration={1} textAlign="center"/><p className="abSub"><span className="hl">Three roles</span>, one obsession: building products that <b>feel fast</b> and never break. Keep scrolling — the road keeps moving <span className="hl2">→</span></p></div>
    <ExpReel experience={p.experience} education={p.education}/>
   </div>
  </motion.section>
  <motion.section {...secAnim} className="abSec abSkills" id="skills">
   <SkillsOrbit skills={p.skills}/>
  </motion.section>
  <motion.section {...secAnim} className="abSec abProjects" id="projects">
   <SecTitle>PROJECTS</SecTitle>
   <div className="abSecInner">
    <div className="abHeadWrap"><SplitText text="Every Project, One Place" tag="h2" className="abHead" splitType="words" delay={80} duration={1} textAlign="center"/><p className="abSub">Spin through <b>all {allProjects.length}</b> repos from my GitHub — every card carries the <span className="hl2">repo name</span>, border-free. Click any to open it.</p></div>
    <div className="carouselWrap cgFree">{allProjects.length?<CircularGallery items={allProjects} bend={2.4} textColor="#cfe0ff" borderRadius={0.08} font="bold 26px Inter, system-ui, sans-serif" scrollSpeed={3} scrollEase={0.03}/>:<p className="muted">Loading projects…</p>}</div>
    <div className="abProjectsMeta">{allProjects.slice(0,8).map((x,i)=><span className="aboutChip" key={i} onClick={()=>window.open(x.link,"_blank")} style={{cursor:"pointer"}}>{x.label}</span>)}</div>
   </div>
  </motion.section>
  <motion.section {...secAnim} className="abSec abContact" id="contact">
   <SecTitle>CONTACT</SecTitle>
   <div className="abSecInner">
    <div className="abHeadWrap"><SplitText text="Let's Build Together" tag="h2" className="abHead" splitType="words" delay={80} duration={1} textAlign="center"/><p className="abSub">Have a project, a role, or just want to say hi? Your message lands <b>straight in my inbox</b> — I reply within 24 hours.</p></div>
    <div className="contactWrap">
     <div className="contactInfo">
      <div className="contactLines">
       <div className="contactLine"><Mail size={17}/><div><b>Email</b><a href={`mailto:${p.email}`}>{p.email}</a></div></div>
       <div className="contactLine"><Phone size={17}/><div><b>Phone</b><a href={`tel:${p.phone.replace(/\s/g,"")}`}>{p.phone}</a></div></div>
       <div className="contactLine"><MapPin size={17}/><div><b>Location</b><span>{p.location}</span></div></div>
       <div className="contactLine"><Github size={17}/><div><b>GitHub</b><a href={p.links.github} target="_blank" rel="noreferrer">{p.links.github.replace("https://","")}</a></div></div>
       <div className="contactLine"><Linkedin size={17}/><div><b>LinkedIn</b><a href={p.links.linkedin} target="_blank" rel="noreferrer">{p.links.linkedin.replace("https://","")}</a></div></div>
      </div>
      <div className="abFolder"><Folder color="#5a7dff" size={1.4} items={["📄","✨","💙"]}/></div>
     </div>
     <div className="contactForm">
      <input placeholder="Your name…" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <input placeholder="Your email…" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
      <input placeholder="Topic (job, project, collab…)…" value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})}/>
      <textarea placeholder="What would you like to talk about?" rows={5} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/>
      <button className="titleBtn" onClick={sendContact} disabled={busy}>{busy?"Sending…":<><Send size={15}/> Send message</>}</button>
      {sent?<p className="sentOk"><CheckCircle2 size={14}/> Message sent! I'll get back to you.</p>:null}
     </div>
    </div>
    <div className="contactFoot"><span>© 2026 {p.name}</span><span>Built with ❤️ and a lot of observability</span></div>
   </div>
  </motion.section>
 </div>;
}

function StoryBoard(){
 const [playing,setPlaying]=useState(true);
 const [rev,setRev]=useState(0);
 const steps=["🔗 Connect repos","📡 Monitor live","⚠️ Detect outages","🤖 AI investigates","✅ Resolve & learn"];
 return <Card title="How PulseOps works — a story" action={<span className="chatActions"><button className="ppChange" onClick={()=>setPlaying(p=>!p)}>{playing?"⏸ Pause":"▶ Play"}</button><button className="ppChange" onClick={()=>{setPlaying(true);setRev(r=>r+1)}}>↻ Replay</button></span>}>
  <div className={"story"+(playing?"":" paused")} key={rev}>
   <div className="storyLine"><i/></div>
   <div className="storySteps">{steps.map((s,i)=><div className="storyStep" key={i}><span className="storyDot"/><b>{s}</b><small>Step {i+1}</small></div>)}</div>
  </div>
 </Card>;
}

function Overview({liveTick}){
 const [incidents,setIncidents]=useState([]);
 const [projects,setProjects]=useState([]);
 useEffect(()=>{api.incidents().then(setIncidents).catch(()=>{})},[liveTick]);
 useEffect(()=>{api.projects().then(setProjects).catch(()=>{})},[liveTick]);
 const [archId,setArchId]=useState(null);
 useEffect(()=>{if(projects.length&&!archId){const real=projects.find(p=>p.repo.includes("/")&&!p.repo.startsWith("demo/"));setArchId(real?real.id:projects[0].id)}},[projects,archId]);
 return <div className="page"><div className="title"><div><h1>Overview</h1><p>Production health across connected projects.</p></div><button><Plus size={15}/> Add project</button></div>
 <div className="stats"><Stat title="System uptime" count={99.96} suffix="%" sub="+0.04% this month"/><Stat title="Active incidents" count={incidents.length||2} sub="1 critical · 1 warning"/><Stat title="Avg latency" count={242} suffix=" ms" sub="-8.4% vs yesterday"/><Stat title="Deployments" count={24} sub="22 passed · 2 failed"/></div>
 <StoryBoard/>
 <div className="topProjects"><Card title="Top projects" action={<Badge tone="blue">Live</Badge>}><div className="miniProjects">{(projects.length?projects:[{id:1,name:"Demo Production API",repo:"demo/reliability-api",status:"Healthy",uptime:99.96}]).slice(0,6).map(p=><div className="miniProject" key={p.id}><span className={"dot "+(p.status==="Healthy"?"":"warn")}/><div><b>{p.name}</b><small>{p.repo}</small></div><span className="miniUptime"><CountUp n={p.uptime}/>%</span></div>)}</div></Card></div>
 <div className="archCard"><Card title="Live architecture" action={<select value={archId||""} onChange={e=>setArchId(e.target.value?Number(e.target.value):null)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>}><ProjectGraph projectId={archId} projectName={projects.find(p=>p.id===archId)?.name}/></Card></div>
 <div className="grid2"><Card title="Error rate" action={<Badge tone="green">Normal</Badge>}><div className="chart"><ResponsiveContainer width="100%" height={250}><AreaChart data={demo}><XAxis dataKey="time" stroke="#39435c" tick={{fill:"#8b96b3",fontSize:10}}/><YAxis stroke="#39435c" tick={{fill:"#8b96b3",fontSize:10}}/><Tooltip contentStyle={{background:"#222733",border:"1px solid #39435c",borderRadius:8,color:"#dfe6f5"}} labelStyle={{color:"#dfe6f5"}}/><Area dataKey="error" type="monotone" stroke="#8fa5ff" fill="#8fa5ff" fillOpacity=".10" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></Card>
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
 const owner=isOwner();
 const delProject=async p=>{
  if(!window.confirm(`Delete "${p.name}"? This removes its services, deployments, incidents and stored documents.`))return;
  try{await api.deleteProject(p.id);setData(d=>d.filter(x=>x.id!==p.id))}catch(e){window.alert("Delete failed: "+e.message)}
 };
 return <div className="page"><div className="title"><div><h1>Projects</h1><p>Connected repositories and production systems.</p></div>{owner?<button><Plus size={15}/> Connect repository</button>:<Badge tone="blue">Public read-only view</Badge>}</div>
 <div className="filters"><div className="search"><Search size={14}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search projects…"/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option>All</option><option>Healthy</option><option>Degraded</option><option>Down</option></select><select value={sort} onChange={e=>setSort(e.target.value)}><option value="name">Sort: Name</option><option value="uptime">Sort: Uptime</option></select><span className="muted filterCount">{sorted.length} project{sorted.length===1?"":"s"}</span></div>
 <div className="projectGrid">{sorted.map(p=><div className="card project" key={p.id} onClick={()=>open(p)}><div className="projectTop"><span className="projectIcon"><Github size={16}/></span><Badge tone={p.status==="Healthy"?"green":"yellow"}>{p.status}</Badge></div><h3>{p.name}</h3><small className="repoPath">{p.repo}</small><div className="metrics"><div><span>Uptime</span><b><CountUp n={p.uptime}/>%</b></div><div><span>Services</span><b>{summary.services[p.id]||0}</b></div><div><span>Incidents</span><b>{summary.incidents[p.id]||0}</b></div></div><div className="projectFoot"><strong>Open project <ChevronRight size={14}/></strong>{owner?<button className="ppChange del" onClick={e=>{e.stopPropagation();delProject(p)}} title={`Delete ${p.name}`}>🗑</button>:null}</div></div>)}{sorted.length===0?<p className="muted full">No projects match your filters.</p>:null}</div></div>
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
 const [email,setEmail]=useState(localStorage.getItem("pulseops_owner_email")||"");
 const [password,setPassword]=useState("");
 const [saved,setSaved]=useState(false);
 const [showLogin,setShowLogin]=useState(false);
 const [loggedIn,setLoggedIn]=useState(!!localStorage.getItem("pulseops_owner_email"));
 const [loginError,setLoginError]=useState("");
 const login=async()=>{
  if(!email.trim()||!password){setLoginError("Enter email and password");return}
  try{
   const r=await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim(),password,action:"login"})});
   const data=await r.json();
   if(!r.ok){setLoginError(data.error||"Invalid credentials");return}
   localStorage.setItem("pulseops_owner_email",email.trim());
   localStorage.setItem("pulseops_jwt",data.access_token);
   localStorage.setItem("pulseops_user",JSON.stringify(data.user));
   setApiKey(data.access_token);
   setLoggedIn(true);setShowLogin(false);setSaved(true);setLoginError("");
   setTimeout(()=>setSaved(false),2000);
  }catch(e){setLoginError("Login failed: "+e.message)}
 };
 const logout=()=>{localStorage.removeItem("pulseops_owner_email");localStorage.removeItem("pulseops_api_key");localStorage.removeItem("pulseops_jwt");localStorage.removeItem("pulseops_user");setLoggedIn(false);setShowLogin(false);setEmail("");setPassword("")};
 return <div className="page"><div className="title"><div><h1>Settings</h1><p>Dashboard configuration and system status.</p></div></div>
 {loggedIn?<>
 <Card title="Logged in" action={<Badge tone="green">Admin</Badge>}>
  <p className="muted">You are signed in as <b>{email}</b> with full admin access to all dashboard features.</p>
  <div className="row"><button onClick={logout}>Sign out</button></div>
 </Card>
 </>:showLogin?<>
 <Card title="Admin Sign In">
  <div style={{display:"flex",flexDirection:"column",gap:16}}>
   <input value={email} onChange={e=>{setEmail(e.target.value);setLoginError("")}} placeholder="Email address" type="email" style={{padding:"14px 16px",borderRadius:10,border:"1px solid #1e293b",fontSize:15,background:"#1a1f2e"}}/>
   <input value={password} onChange={e=>{setPassword(e.target.value);setLoginError("")}} placeholder="Password" type="password" onKeyDown={e=>{if(e.key==="Enter")login()}} style={{padding:"14px 16px",borderRadius:10,border:"1px solid #1e293b",fontSize:15,background:"#1a1f2e"}}/>
   {loginError?<p style={{color:"#f87171",fontSize:13,margin:0}}>{loginError}</p>:null}
   <div style={{display:"flex",gap:10}}>
    <button onClick={login} className="titleBtn" style={{padding:"12px 24px",fontSize:14,borderRadius:10,fontWeight:700}}>{saved?"✓ Signed in":"Sign in"}</button>
    <button onClick={()=>setShowLogin(false)} style={{padding:"12px 24px",fontSize:14,borderRadius:10,border:"1px solid #1e293b",background:"transparent",color:"#94a3b8",cursor:"pointer"}}>Cancel</button>
   </div>
  </div>
 </Card>
 </>:<Card title="Admin Access" action={<button onClick={()=>setShowLogin(true)} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #3b82f6",background:"transparent",color:"#60a5fa",cursor:"pointer",fontSize:13}}>Sign In</button>}>
  <p className="muted">Dashboard is fully public. Sign in as admin to manage projects, view analytics, and configure settings.</p>
 </Card>}
 <Card title="AI Assistant"><div className="row"><Bot size={20}/><div><b>Groq AI</b><small>Connected · openai/gpt-oss-20b</small></div><Badge tone="green">Active</Badge></div></Card>
 <Card title="GitHub integration"><div className="row"><Github size={20}/><div><b>GitHub</b><small>Connected · 19 repos synced</small></div><Badge tone="green">Live</Badge></div></Card>
 <Card title="Database"><div className="row"><Activity size={20}/><div><b>Supabase PostgreSQL</b><small>Connected · 19 projects</small></div><Badge tone="green">Healthy</Badge></div></Card>
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
 const [folderPath,setFolderPath]=useState(null);
 const openFile=async path=>{try{const c=await api.contents(p.repo,path);if(c.type==="file")setPreview({path,content:atob(c.content||"")})}catch(e){}};
 return <div className="page"><button className="back" onClick={back}>← Projects</button>
 <div className="title"><div><h1>{p.name}</h1><p><Github size={14}/> {p.repo}</p></div><Badge tone={p.status==="Healthy"?"green":"yellow"}>{p.status}</Badge></div>
 <div className="pgraphWrap"><ProjectGraph projectId={p.id} projectName={p.name} onOpenFolder={name=>setFolderPath(p=>p===name?null:name)} activeFolder={folderPath?folderPath.split("/")[0]:null}/></div>
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
 <Card title={folderPath?`📂 ${folderPath}/`:"Repository files"} action={<span className="chatActions">{folderPath?<button className="ppChange" onClick={()=>setFolderPath(null)}>← All files</button>:filesPaths.length?<Badge tone="blue">{filesPaths.length} files</Badge>:null}</span>}>
  {folderPath?<FolderView repo={p.name} folderPath={folderPath} files={filesPaths} onOpenFile={openFile} onNavigate={setFolderPath}/>:<FileTree paths={filesPaths} onOpenFile={openFile}/>}
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
 const [fileQ,setFileQ]=useState("");
 useEffect(()=>{api.projects().then(setProjects).catch(()=>{})},[]);
 const project=projects.find(p=>p.id===projectId)||null;
 const boxRef=React.useRef(null);
 useEffect(()=>{const el=boxRef.current;if(el)el.scrollTop=el.scrollHeight},[msgs,busy]);
 const dirty=React.useRef(false);
 useEffect(()=>{setMsgs([]);dirty.current=false},[projectId]);
 const clearHistory=async()=>{try{await api.clearChat(projectId);dirty.current=true;setMsgs([])}catch(e){}};
 const send=async()=>{
  if(!input.trim()||busy)return;
  dirty.current=true;
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
  <Card title="Conversation" action={<span className="chatActions"><button className="ppChange" onClick={clearHistory} title="Clear saved chat history">🗑 Clear</button><Badge tone="purple"><Sparkles size={13}/> RAG</Badge></span>}>
   <div className="chatbox" ref={boxRef}>{(msgs.length?msgs:[{role:"assistant",content:"Hey! I'm Dev — your senior dev sidekick. Pick a project (or ask across all of them) — code, services, incidents, or what to build next. 💡"}]).map((m,i)=><MsgBubble m={m} key={i}/>)}{busy?<Typing/>:null}</div>
   <div className="chatbar"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send()}} placeholder="Ask Dev about a project…"/><button onClick={send} disabled={busy||!input.trim()}>{busy?<span className="miniSpin"/>:"Send"}</button></div>
  </Card>
  <div>
   <Card title="Project" action={project?<Badge tone="green">{project.name}</Badge>:null}>
    <div className="row"><select value={projectId||""} onChange={e=>{setProjectId(e.target.value?Number(e.target.value):null);setFiles(null);setCurFile(null);setFileQ("")}}><option value="">Select a project…</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button onClick={browse}>Browse repo</button></div>
    <p className="muted">Chat and changes need the API key from Settings.</p>
   </Card>
   <Card title="Repository files">
    {files?<div className="treeSearch"><Search size={12}/><input value={fileQ} onChange={e=>setFileQ(e.target.value)} placeholder="Search files by name…"/>{fileQ?<button onClick={()=>setFileQ("")} aria-label="Clear file search">✕</button>:null}</div>:null}
    {files?(fileQ.trim()?<FileResults files={files} q={fileQ.trim()} onOpenFile={openFile}/>:files.length?<FileTree paths={files} onOpenFile={openFile}/>:<p className="muted">Empty repository.</p>):<p className="muted">Browse a repo to see its files, then edit and propose a change — it opens a pull request, never pushes to main directly.</p>}
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
function FileTree({paths,onOpenFile,autoOpen}){
 const [open,setOpen]=useState({});
 useEffect(()=>{
  if(!autoOpen)return;
  setOpen(s=>{const o={...s};for(const p of paths||[]){const i=p.indexOf("/");if(i>0)o[p.slice(0,i)]=true}return o});
 },[paths,autoOpen]);
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
function FolderView({repo,folderPath,files,onOpenFile,onNavigate}){
 const segs=folderPath.split("/");
 const prefix=folderPath+"/";
 const subs=new Set();const direct=[];
 for(const f of files){
  if(!f.startsWith(prefix))continue;
  const rest=f.slice(prefix.length);const i=rest.indexOf("/");
  if(i<0)direct.push(f);else subs.add(rest.slice(0,i));
 }
 const crumbs=[repo||"repo",...segs];
 return <div className="folderView">
  <div className="crumbs">{crumbs.map((c,i)=><span key={i}>{i>0?<span className="crumbSep">/</span>:null}{i===crumbs.length-1?<b className="crumb cur">{c}</b>:<button className="crumb" onClick={()=>onNavigate(i===0?null:segs.slice(0,i).join("/"))}>{c}</button>}</span>)}</div>
  <div className="folderList">{[...subs].sort().map(s=><button key={s} className="fileResult folderRow" onClick={()=>onNavigate(folderPath+"/"+s)}><span>📁</span><b>{s}</b><small>folder</small></button>)}
   {direct.map(f=><button key={f} className="fileResult" onClick={()=>onOpenFile(f)}><span>📄</span><b>{f.split("/").pop()}</b><small>{f}</small></button>)}
   {!subs.size&&!direct.length?<p className="muted" style={{padding:8}}>Empty folder.</p>:null}
  </div>
 </div>;
}
function FileResults({files,q,onOpenFile}){
 const ql=q.toLowerCase();
 const matches=(files||[]).filter(f=>{const name=f.split("/").pop().toLowerCase();return name.includes(ql)||f.toLowerCase().includes(ql)}).slice(0,60);
 if(!matches.length)return <p className="muted" style={{padding:8}}>No files match "{q}".</p>;
 return <div className="fileResults">{matches.map((f,i)=><button key={f} className="fileResult" style={{animationDelay:(i*14)+"ms"}} onClick={()=>onOpenFile&&onOpenFile(f)} title={f}><span>📄</span><b>{f.split("/").pop()}</b><small>{f}</small></button>)}</div>;
}

function ProjectPicker({projects,value,onChange}){
 const [open,setOpen]=useState(false);
 const [q,setQ]=useState("");
 const sel=projects.find(p=>p.id===value)||null;
 const list=projects.filter(p=>!q||p.name.toLowerCase().includes(q.toLowerCase())||p.repo.toLowerCase().includes(q.toLowerCase()));
 return <div className="ppick">
  {sel?<div className="ppickSel"><span className={"dot "+(sel.status==="Healthy"?"":"warn")}/><div><b>{sel.name}</b><small>{sel.repo}</small></div><div className="ppickActions"><a className="ppOpen" href={`/?project=${sel.id}`} target="_blank" rel="noreferrer" title="Open in dashboard">↗</a><button className="ppChange" onClick={()=>setOpen(true)}>Change</button></div></div>:<button className="ppSel" onClick={()=>setOpen(true)}>Select a project…</button>}
  {open?<div className="ppList"><div className="ppSearch"><Search size={13}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search projects…"/></div><div className="ppItems">{list.map(p=><button key={p.id} className={"ppItem"+(p.id===value?" on":"")} onClick={()=>{onChange(p.id);setOpen(false);setQ("")}}><span className={"dot "+(p.status==="Healthy"?"":"warn")}/><span><b>{p.name}</b><small>{p.repo}</small></span></button>)}{list.length===0?<p className="muted">No matches.</p>:null}</div></div>:null}
 </div>;
}

function ProjectGraph({projectId,projectName,docs,onOpenFolder,activeFolder}){
 const [localDocs,setLocalDocs]=useState(null);
 useEffect(()=>{
  if(docs!==undefined||!projectId){setLocalDocs(null);return}
  setLocalDocs(null);
  api.projectData(projectId).then(setLocalDocs).catch(()=>setLocalDocs(null));
 },[projectId,docs]);
 if(!projectId)return null;
 const m={};(docs||localDocs||[]).forEach(d=>{m[d.data_type]=d.payload});
 const repo=m.repository||{};
 const services=Array.isArray(m.services)?m.services:[];
 const tech=Array.isArray((m.tech||{}).tech)?m.tech.tech:[];
 const files=Array.isArray(m.files)?m.files:[];
 const incidents=Array.isArray(m.incidents)?m.incidents:[];
 const svcs=services.slice(0,2);
 const color=s=>s==="Healthy"?"#36a667":s==="Degraded"?"#d79b2b":"#c54d4d";
 const openUrl=u=>{if(u)window.open(u,"_blank","noopener")};
 const dirs={};
 for(const f of files){const i=f.indexOf("/");if(i>0){const d=f.slice(0,i);if(!dirs[d])dirs[d]={files:0,subs:new Set()};const rest=f.slice(i+1);if(rest.indexOf("/")<0)dirs[d].files++;else dirs[d].subs.add(rest.slice(0,rest.indexOf("/")))}}
 const folders=Object.entries(dirs).map(([name,c])=>[name,c.files+c.subs.size]).sort((a,b)=>b[1]-a[1]).slice(0,6);
 const fx=[80,180,280,80,180,280],fy=[175,175,175,218,218,218];
 const short=n=>n.length>11?n.slice(0,10)+"…":n;
 return <div className="pgraph">
  <svg viewBox="0 0 360 270" style={{maxHeight:260}}>
   {svcs.map((s,i)=>(<path key={"e"+i} className="pedge" d={i===0?"M180 46 C 220 58, 250 66, 284 85":"M180 46 C 220 70, 250 100, 284 137"}/>))}
   <path className="pedge" d="M180 46 C 140 60, 110 75, 78 93"/>
   {folders.map((f,i)=>(<path key={"fe"+i} className="pedge" style={{animationDelay:(i*0.12)+"s"}} d={`M180 46 C 180 108, ${fx[i]} 128, ${fx[i]} ${fy[i]-8}`}/>))}
   <g className="pnode" style={{animationDelay:"0s"}}>
    <rect x="110" y="6" width="140" height="40" rx="10" fill="#e6ecff" stroke="#bcc9f2"/>
    <circle cx="132" cy="26" r="4" className="pdot" fill="#36a667"/>
    <text x="180" y="25" textAnchor="middle" fontSize="11" fontWeight="700" fill="#3a4a8f">{projectName||(repo.full_name||"Project").split("/").pop()}</text>
    <text x="180" y="38" textAnchor="middle" fontSize="8.5" fill="#7d88b8">{repo.full_name||"loading…"}</text>
   </g>    <g className="pnode pclick" style={{animationDelay:".12s"}} onClick={()=>openUrl(repo.full_name&&"https://github.com/"+repo.full_name)} title={repo.full_name?`Open ${repo.full_name} on GitHub`:"GitHub"}>
    <rect x="8" y="82" width="130" height="42" rx="10" fill="#fbfdff" stroke="#d5def6"/>
    <text x="73" y="97" textAnchor="middle" fontSize="10" fontWeight="700" fill="#182234">GitHub</text>
    <text x="73" y="108" textAnchor="middle" fontSize="8.5" fill="#687386">{repo.language||"—"}</text>
    <text x="73" y="119" textAnchor="middle" fontSize="8.5" fill="#8992a2">{repo.default_branch?"branch: "+repo.default_branch:""}</text>
   </g>
   {svcs.map((s,i)=>(<g key={"s"+i} className={"pnode"+(s.check_url?" pclick":"")} style={{animationDelay:`.2${i}s`}} onClick={()=>s.check_url&&openUrl(s.check_url)} title={s.check_url?`Open ${s.name} (${s.check_url})`:s.name}>
    <rect x="226" y={i===0?82:128} width="126" height="38" rx="10" fill="#fbfdff" stroke="#d5def6"/>
    <circle cx="240" cy={i===0?97:143} r="4" className="pdot" fill={color(s.status)}/>
    <text x="256" y={i===0?95:141} fontSize="9.5" fontWeight="700" fill="#182234">{s.name}</text>
    <text x="256" y={i===0?108:154} fontSize="8.5" fill="#687386">{s.status} · <SvcLatency n={s.latency_ms}/>ms</text>
   </g>))}
   {folders.map((f,i)=>(<g key={"f"+i} className={"pnode pfolder"+(activeFolder===f[0]?" active":"")} style={{animationDelay:(0.24+i*0.1)+"s"}} onClick={()=>onOpenFolder&&onOpenFolder(f[0])} role="button" title={(activeFolder===f[0]?"Show all files":"Show "+f[0]+" files")}>
    <rect x={fx[i]-42} y={fy[i]-18} width="84" height="38" rx="9" fill="#fbfdff" stroke="#c9d3f7"/>
    <text x={fx[i]} y={fy[i]-2} textAnchor="middle" fontSize="9" fontWeight="700" fill="#33405e">📁 {short(f[0])}</text>
    <text x={fx[i]} y={fy[i]+11} textAnchor="middle" fontSize="8" fill="#7d88b8">{f[1]} files</text>
   </g>))}
  </svg>
  {(tech.length||files.length||incidents.length)?<div className="pchips">{tech.slice(0,7).map((t,i)=><span className="pchip" key={i}>{t}</span>)}{files.length?<span className="pchip ghost">📄 {files.length} files</span>:null}{incidents.length?<span className="pchip warn">⚠ {incidents.length} incident{incidents.length>1?"s":""}</span>:null}</div>:null}
 </div>;
}

function ChatDrawer({onClose}){
 const [projects,setProjects]=useState([]);
 const [projectId,setProjectId]=useState(null);
 const [docs,setDocs]=useState(null);
 const [msgs,setMsgs]=useState([]);
 const [input,setInput]=useState("");
 const [busy,setBusy]=useState(false);
 const [curFile,setCurFile]=useState(null);
 const [fileContent,setFileContent]=useState("");
 const [folderPath,setFolderPath]=useState(null);
 const [fileQ,setFileQ]=useState("");
 const boxRef=React.useRef(null);
 const dirty=React.useRef(false);
 useEffect(()=>{api.projects().then(setProjects).catch(()=>{})},[]);
 useEffect(()=>{const el=boxRef.current;if(el)el.scrollTop=el.scrollHeight},[msgs,busy]);
 useEffect(()=>{if(!projectId){setDocs(null);setCurFile(null);setFolderPath(null);setFileQ("");return}setDocs(null);setCurFile(null);setFolderPath(null);setFileQ("");api.projectData(projectId).then(setDocs).catch(()=>setDocs(null))},[projectId]);
 useEffect(()=>{setMsgs([]);dirty.current=false},[projectId]);
 const clearHistory=async()=>{try{await api.clearChat(projectId);dirty.current=true;setMsgs([])}catch(e){}};
 const send=async()=>{
  if(!input.trim()||busy)return;
  dirty.current=true;
  const history=[...msgs,{role:"user",content:input,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}];
  setMsgs(history);setInput("");setBusy(true);
  try{
   const res=await api.chat(history.map(m=>({role:m.role,content:m.content})),projectId);
   setMsgs([...history,{role:"assistant",content:res.reply,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}]);
  }catch(e){setMsgs([...history,{role:"assistant",content:"Error: "+e.message}])}
  setBusy(false);
 };
 const project=projects.find(p=>p.id===projectId)||null;
 const m={};(docs||[]).forEach(d=>{m[d.data_type]=d.payload});
 const files=Array.isArray(m.files)?m.files:[];
 const visibleFiles=folderPath?files.filter(f=>f.startsWith(folderPath+"/")):files;
 const openFile=async path=>{
  if(!project)return;
  try{const c=await api.contents(project.repo,path);if(c.type!=="file")return;setCurFile(path);setFileContent(atob(c.content||""))}catch(e){setCurFile(path);setFileContent("// Could not read "+path+"\n"+e.message)}
 };
 return <div className="chatDrawer">
  <div className="chatDrawerHead"><b><span className="headDot"/><MessageSquare size={15}/> Ask Dev</b><div className="drawerHeadActions"><a className="ppOpen dash" href="/" target="_blank" rel="noreferrer" title="Open full dashboard in new tab">Dashboard ↗</a><button className="chatClose" onClick={clearHistory} title="Clear saved chat history" aria-label="Clear chat history">🗑</button><button className="chatClose" onClick={onClose} aria-label="Close chat">✕</button></div></div>
  <div className="chatDrawerBody">
   <ProjectPicker projects={projects} value={projectId} onChange={setProjectId}/>
   {project?<div className="drawerSection"><ProjectGraph projectId={projectId} projectName={project.name} docs={docs} onOpenFolder={name=>setFolderPath(p=>p===name?null:name)} activeFolder={folderPath?folderPath.split("/")[0]:null}/></div>:null}
   {project?<div className="drawerSection filesSec"><div className="drawerSecHead"><b>{folderPath?`📂 ${folderPath}/`:"📂 Repository files"}</b>{folderPath?<button className="ppChange" onClick={()=>setFolderPath(null)}>← All files</button>:<span className="muted">{files.length?files.length+" files":"…"}</span>}</div><div className="treeSearch"><Search size={12}/><input value={fileQ} onChange={e=>setFileQ(e.target.value)} placeholder="Search files by name…"/>{fileQ?<button onClick={()=>setFileQ("")} aria-label="Clear file search">✕</button>:null}</div><div className="drawerTree">{fileQ.trim()?<FileResults files={visibleFiles} q={fileQ.trim()} onOpenFile={openFile}/>:folderPath?<FolderView repo={project.name} folderPath={folderPath} files={files} onOpenFile={openFile} onNavigate={setFolderPath}/>:visibleFiles.length?<FileTree paths={visibleFiles} onOpenFile={openFile} autoOpen/>:<p className="muted" style={{padding:8}}>Loading files…</p>}</div>{curFile?<div className="filePreview"><div className="fpHead"><code className="mono">{curFile}</code><button onClick={()=>setCurFile(null)} aria-label="Close preview">✕</button></div><pre>{fileContent}</pre></div>:null}</div>:null}
   <div className="chatbox" ref={boxRef}>{(msgs.length?msgs:[{role:"assistant",content:"Hey! I'm Dev — your senior dev sidekick. Pick a project to see its live graph + repo tree, or just ask about any of them. 💡"}]).map((m,i)=><MsgBubble m={m} key={i}/>)}{busy?<Typing/>:null}</div>
  </div>
  <div className="chatbar"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send()}} placeholder="Ask Dev about a project…"/><button onClick={send} disabled={busy||!input.trim()}>{busy?<span className="miniSpin"/>:"Send"}</button></div>
 </div>;
}

function App(){
 const owner=isOwner();
 const [page,setPage]=useState(()=>new URLSearchParams(location.search).get("page")||"Overview");
 const [selected,setSelected]=useState(null);
 const [chatOpen,setChatOpen]=useState(false);
 const [fbOpen,setFbOpen]=useState(false);
 const [liveTick,setLiveTick]=useState(0);
 useEffect(()=>{const id=new URLSearchParams(location.search).get("project");if(id)api.project(id).then(setSelected).catch(()=>{})},[]);
 useEffect(()=>{try{api.recordView({path:location.pathname+location.search,visitor_id:getVisitorId(),referrer:document.referrer||null})}catch(e){}},[]);
 useEffect(()=>{
  if(!API_WS)return;
  let ws;
  try{
   ws=new WebSocket(`${API_WS}/ws/incidents`);
   ws.onmessage=()=>setLiveTick(t=>t+1);
   ws.onerror=()=>{};
  }catch(e){}
  return()=>{try{ws&&ws.close()}catch(e){}};
 },[]);
 const nav=[["Overview",LayoutDashboard],["Projects",Box],["Incidents",AlertTriangle],["AI Investigation",Bot],["AI Chat",MessageSquare],["About",User],["Analytics",BarChart3],["Settings",Settings]];
 let content=selected?<ProjectDetails p={selected} back={()=>setSelected(null)} liveTick={liveTick}/>:page==="Overview"?<Overview liveTick={liveTick}/>:page==="Projects"?<Projects open={setSelected} liveTick={liveTick}/>:page==="Incidents"?<Incidents liveTick={liveTick}/>:page==="AI Investigation"?<AIPage/>:page==="AI Chat"?<ChatPage/>:page==="About"?<AboutPage/>:page==="Analytics"?<AnalyticsPage/>:<SettingsPage/>;
 return <div className="app"><aside><div className="brand"><Activity size={18}/> PulseOps</div><div className="workspace"><b>Acme Engineering</b><small>Production</small></div><nav>{nav.map(([n,I])=><button className={page===n&&!selected?"active":""} onClick={()=>{setPage(n);setSelected(null)}} key={n}><I size={17}/>{n}</button>)}</nav><div className="user">AS · Ansh Sharma</div></aside> <main><header><span>{selected?.name||page}</span><span className="liveBadge"><i/>LIVE</span><div className="top">{owner?<Badge tone="green">Owner</Badge>:<Badge tone="blue">Public view</Badge>}<div className="topSearch"><Search size={14}/><input placeholder="Search…"/></div><button className="fbBtn" onClick={()=>setFbOpen(true)} title="Leave your name so I know who visited"><MessageSquare size={13}/> Feedback</button><Bell size={17}/><span className="avatar">AS</span></div></header>{content}</main><button className="chatFab" onClick={()=>setChatOpen(true)} title="Ask the AI about any project"><MessageSquare size={17}/> Ask AI</button>{chatOpen?<ChatDrawer onClose={()=>setChatOpen(false)}/>:null}<FeedbackModal open={fbOpen} setOpen={setFbOpen}/></div>
}
createRoot(document.getElementById("root")).render(<App/>);
