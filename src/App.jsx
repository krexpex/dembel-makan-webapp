import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";

/* ========= ДАННЫЕ ========= */
const NICK = "Макан";
const PROFILE = {
  realName: "Андрей Кириллович Косолапов",
  nickname: "Макан",
  birth: { date: "2002-01-06", place: "Москва, Россия" },
  country: "Россия",
  profession: "рэпер",
  genres: ["рэп"],
  aliases: ["MC Гай Фокс", "Nemo MC", "Young Chaser", "Macan"],
  fitnessCategory: "А",
  assignment: "Может быть направлен в Семёновский полк (уточняется)",
};
const SERVICE_START = "2025-11-28T00:00:00";
const DEMOBIL_DATE  = "2026-10-01T00:00:00";

/* ========= APP ========= */
export default function App() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Riga";

  // вкладки/островок
  const [tab, setTab] = useState("timer");
  const [blobDir, setBlobDir] = useState("right");

  // бургер
  const [menuOpen, setMenuOpen] = useState(false);
  const [burgerHidden, setBurgerHidden] = useState(false);
  const lastScrollY = useRef(0);

  // вибрация
  const [vibrateEnabled, setVibrateEnabled] = useState(true);

  // таймер
  const [now, setNow] = useState(Date.now());
  const [entered, setEntered] = useState(false);

  // макан
  const [popped, setPopped] = useState(false);

  // «ДЖЕБ» PNG
  const [tapCount, setTapCount] = useState(0);
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);

  const confettiDoneRef = useRef(false);

  /* — системные эффекты — */
  useEffect(() => { const id=setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(id);},[]);
  useEffect(() => {
    const twa = window.Telegram?.WebApp;
    try { twa?.expand(); twa?.ready(); twa?.enableClosingConfirmation(); } catch {}
    const t=setTimeout(()=>setEntered(true),40); return ()=>clearTimeout(t);
  },[]);
  useEffect(() => { const saved=localStorage.getItem("vibrateEnabled"); if(saved!==null) setVibrateEnabled(saved==="1");},[]);
  useEffect(() => { localStorage.setItem("vibrateEnabled",vibrateEnabled?"1":"0"); },[vibrateEnabled]);

  useEffect(() => {
    const onScroll=()=>{ const y=window.scrollY||0;
      if (y>lastScrollY.current+6) setBurgerHidden(true);
      else if (y<lastScrollY.current-6) setBurgerHidden(false);
      lastScrollY.current=y; };
    window.addEventListener("scroll",onScroll,{passive:true});
    return ()=>window.removeEventListener("scroll",onScroll);
  },[]);

  useEffect(() => { if(show1){const t=setTimeout(()=>setShow1(false),2400); return ()=>clearTimeout(t);} },[show1]);
  useEffect(() => { if(show2){const t=setTimeout(()=>setShow2(false),2400); return ()=>clearTimeout(t);} },[show2]);
  useEffect(() => { if(show3){const t=setTimeout(()=>setShow3(false),2400); return ()=>clearTimeout(t);} },[show3]);

  /* — время службы — */
  const startTs = useMemo(() => toLocalTimestamp(SERVICE_START), []);
  const endTs   = useMemo(()   => toLocalTimestamp(DEMOBIL_DATE), []);
  const totalMs  = Math.max(0, endTs - startTs);
  const leftMs   = Math.max(0, endTs - now);
  const passedMs = Math.max(0, now - startTs);
  const pct = totalMs>0 ? Math.min(100, Math.max(0,(passedMs/totalMs)*100)) : 0;
  const leftParts = msParts(leftMs);
  const isOver = leftMs<=0 && totalMs>0;

  useEffect(() => {
    if (isOver && !confettiDoneRef.current) {
      confettiDoneRef.current = true;
      burst(0.25); setTimeout(()=>burst(0.5),200); setTimeout(()=>burst(0.75),400);
      setTimeout(()=>confetti({ particleCount: 250, spread: 85, startVelocity: 45, scalar: 1.1, ticks: 240, origin: { y: 0.25 } }), 900);
      try { navigator.vibrate?.(150); } catch {}
    }
    if (!isOver) confettiDoneRef.current = false;
  }, [isOver]);
  function burst(p=0.5){ const n=Math.floor(100*p);
    confetti({ particleCount:n, spread:65, startVelocity:38, origin:{x:0.2,y:0.4} });
    confetti({ particleCount:n, spread:65, startVelocity:38, origin:{x:0.8,y:0.4} });
  }

  /* — действия — */
  function onMakanTap(){
    setPopped(true); setTimeout(()=>setPopped(false),180);
    if (vibrateEnabled) {
      try { navigator.vibrate?.(30); } catch {}
      try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light"); } catch {}
    }
    setTapCount(prev=>{
      const next=prev+1;
      if(next===3) setShow1(true);
      if(next===7) setShow2(true);
      if(next===10) setShow3(true);
      return next;
    });
  }
  function openGroup(){
    const url="https://t.me/zdem_makana";
    const twa=window.Telegram?.WebApp;
    if (twa?.openTelegramLink) return twa.openTelegramLink(url);
    window.open(url,"_blank","noopener,noreferrer");
  }
  function share(){
    const text = isOver ? `🎉 ${NICK} ДЕМБЕЛЬНУЛСЯ!\n\nСлужба завершена.` :
      `⏳ До дембеля ${NICK}: ${formatParts(leftParts)}.\nПрисоединяйся к отсчёту!`;
    const url = window.location.href.split("?")[0];
    const twa = window.Telegram?.WebApp;
    if (twa?.shareURL) return twa.shareURL(url);
    if (twa?.shareText) return twa.shareText(`${text}\n${url}`);
    if (navigator.share) return navigator.share({ title:`Дембель ${NICK}`, text, url }).catch(()=>{});
    navigator.clipboard?.writeText(`${text}\n${url}`); alert("Ссылка скопирована ✅");
  }
  function toggleVibration(){ setVibrateEnabled(v=>!v); try{navigator.vibrate?.(10);}catch{} setMenuOpen(false); }
  function switchTab(next){
    if (next===tab) return;
    const order=["timer","id","medals"];
    setBlobDir(order.indexOf(next)>order.indexOf(tab)?"right":"left");
    setTab(next);
  }

  /* — кольцо — */
  const size=360, stroke=10, r=(size-stroke)/2, C=2*Math.PI*r;
  const SEGMENTS=12, segmentLen=C/SEGMENTS, gapLen=Math.max(4, segmentLen*0.08);
  const dashPattern=`${segmentLen-gapLen} ${gapLen}`;
  const progressDashArray=C;
  const progressDashOffset=C*(1-pct/100);
  const animatedProgressOffset=entered?progressDashOffset:C;
  const clipStyle={ clipPath:`circle(${r}px at ${size/2}px ${size/2}px)` };

  /* — рендер — */
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0f1514] to-[#0b1110] text-zinc-50">

      {/* Бургер */}
      <div className={`fixed left-3 top-3 z-[60] transition-transform duration-250 ${burgerHidden?"-translate-y-14 opacity-0":"translate-y-0 opacity-100"}`}>
        <button onClick={()=>setMenuOpen(o=>!o)} className="glass-btn h-11 w-11 grid place-items-center rounded-2xl" aria-label="menu"><BurgerIcon/></button>
        {menuOpen && (
          <div className="mt-2 w-60 glass-menu rounded-2xl p-2 shadow-xl border border-white/10">
            <button onClick={toggleVibration} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/8 transition-colors">
              {vibrateEnabled? <VibrationOnIcon/> : <VibrationOffIcon/>}
              <span className="text-sm">{vibrateEnabled? "Выключить вибрацию" : "Включить вибрацию"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Контент */}
      <main className="mx-auto max-w-6xl p-4 pb-[calc(120px+env(safe-area-inset-bottom,0px))]">

        {tab==="timer" && (
          <section className="relative flex flex-col items-center justify-center rounded-3xl bg-zinc-900/60 backdrop-blur p-5 md:p-6 shadow-xl overflow-hidden">
            <div aria-hidden className={`absolute inset-0 -z-10 ${entered?"glow-enter":""}`}
                 style={{background:"radial-gradient(30rem 30rem at 50% 20%, rgba(16,185,129,0.18), rgba(0,0,0,0))"}}/>
            <div className={`relative flex items-center justify-center ${entered?"appear-scale":""}`} style={{width:size,height:size}}>
              <svg className="absolute inset-0 z-0" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size/2} cy={size/2} r={r} fill="none"
                        stroke="rgba(255,255,255,0.13)" strokeWidth={stroke} strokeLinecap="butt"
                        strokeDasharray={dashPattern} transform={`rotate(-90 ${size/2} ${size/2})`}/>
                <circle cx={size/2} cy={size/2} r={r} fill="none"
                        stroke="rgba(255,255,255,0.95)" strokeWidth={stroke} strokeLinecap="round"
                        strokeDasharray={progressDashArray} strokeDashoffset={animatedProgressOffset}
                        transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dashoffset 900ms ease"}}/>
              </svg>

              {/* PNG надписи */}
              <div className="absolute inset-0 z-[5] pointer-events-none" style={clipStyle}>
                {show1 && <img src="/jeb1.png" alt="jeb1" className="absolute left-[6%] bottom-[20%] w-[40%] md:w-[34%] max-w-[280px] jeb-layer jeb-img animate-rise-left auto-fade-out"/>}
                {show2 && <img src="/jeb2.png" alt="jeb2" className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[46%] md:w-[38%] max-w-[320px] jeb-layer jeb-img animate-slide-from-right auto-fade-out"/>}
                {show3 && (
                  <div className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[78%] md:w-[68%] grid place-items-center jeb-layer auto-fade-out">
                    <img src="/jeb3.png" alt="jeb3" className="w-full jeb-img"/>
                  </div>
                )}
              </div>

              {/* Макан */}
              <img
                src="/makan.png" alt={NICK} draggable="false" onClick={onMakanTap}
                className={[
                  "cursor-pointer select-none",
                  "drop-shadow-[0_18px_50px_rgba(0,0,0,0.65)]",
                  "transition-transform duration-200 ease-out",
                  "animate-wobble",
                  popped ? "scale-[1.10]" : "scale-100",
                  "w-[74%] md:w-[78%] makan-layer makan-shadow"
                ].join(" ")}
              />
            </div>

            <div className={`mt-2 text-center ${entered?"appear-fade-up":""}`}>
              {isOver ? (
                <div className="text-2xl md:text-4xl font-extrabold">🎉 {NICK} ДЕМБЕЛЬНУЛСЯ!</div>
              ) : (
                <>
                  <h1 className="text-lg md:text-xl font-semibold text-zinc-300">До дембеля {NICK}</h1>
                  <div className="text-2xl md:text-4xl font-extrabold tracking-tight mt-1">{formatParts(leftParts)}</div>
                  <div className="text-xs md:text-sm text-zinc-400 mt-1">Таймзона: {tz}</div>
                </>
              )}
            </div>

            <div className="w-full max-w-xl h-3 bg-zinc-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-white/80" style={{width:`${pct}%`}}/>
            </div>
            <div className="text-xs text-zinc-300 mt-1">Выполнено службы: {pct.toFixed(2)}%</div>

            <div className="flex flex-col items-center gap-3 mt-4">
              <button onClick={share} className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-medium">Поделиться таймером</button>
              <button onClick={openGroup} className="px-4 py-3 rounded-2xl bg-zinc-700 hover:bg-zinc-600 font-medium">Ждём вместе</button>
            </div>
          </section>
        )}

        {tab==="id" && (
          <section className="rounded-3xl bg-[rgba(24,24,27,0.85)] shadow-xl p-4 md:p-6 border border-zinc-800/60 max-w-2xl mx-auto">
            <SoldierCard profile={PROFILE} service={{start:SERVICE_START,end:DEMOBIL_DATE}}/>
          </section>
        )}

        {tab==="medals" && (
          <section className="rounded-3xl bg-zinc-900/60 backdrop-blur p-6 shadow-xl border border-zinc-800/60 max-w-2xl mx-auto text-center">
            <div className="text-xl font-semibold mb-2">Достижения</div>
            <div className="text-zinc-400 text-sm">Скоро здесь появятся медали и трофеи.</div>
          </section>
        )}
      </main>

      {/* Островок */}
      <BottomIsland tab={tab} onChange={switchTab} dir={blobDir}/>
    </div>
  );
}

/* ========= ID ========= */
function SoldierCard({ profile, service }) {
  const start = shortDate(service.start);
  const end   = shortDate(service.end);
  const fields = [
    ["Реальное имя", profile.realName],
    ["Псевдоним", profile.nickname],
    ["Дата рождения", formatBirth(profile.birth.date)],
    ["Место рождения", profile.birth.place],
    ["Страна", profile.country],
    ["Профессия", profile.profession],
    ["Жанры", profile.genres.join(", ")],
    ["Псевдонимы", profile.aliases.join(", ")],
    ["Категория годности", profile.fitnessCategory],
    ["Место службы", profile.assignment],
    ["Дата призыва", start],
    ["Дембель", end],
  ];
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-emerald-600/25 border border-emerald-500/40 grid place-items-center">
          <span className="text-emerald-300 font-semibold">ЖМ</span>
        </div>
        <div>
          <div className="uppercase tracking-wider text-xs text-emerald-300/90">личное дело</div>
          <div className="text-lg font-bold leading-tight -mt-0.5">{profile.nickname}</div>
          <div className="text-[11px] text-zinc-400">{profile.realName}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {fields.map(([k,v])=>(
          <div key={k} className="flex items-center justify-between rounded-xl bg-zinc-900/60 border border-zinc-800 px-3 py-2">
            <span className="text-xs text-zinc-400">{k}</span>
            <span className="text-sm font-medium text-zinc-200 text-right">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========= ОСТРОВОК (компактный, пузырёк + капля) ========= */
function BottomIsland({ tab, onChange, dir }) {
  const contRef = useRef(null);
  const b1 = useRef(null), b2 = useRef(null), b3 = useRef(null);

  const [bubble, setBubble] = useState({ x: 0, w: 56 });
  const [blob, setBlob]     = useState({ x: 0, w: 56 });
  const [mounted, setMounted] = useState(false);

  function currentBtn(name){ return name==="timer"?b1 : name==="id"?b2 : b3; }
  function centerOf(btn){
    const cont=contRef.current; if(!cont||!btn?.current) return {x:0,w:56};
    const c=cont.getBoundingClientRect(); const b=btn.current.getBoundingClientRect();
    return { x: b.left - c.left + b.width/2, w: b.width };
  }

  useLayoutEffect(()=>{
    setMounted(true);
    const ro=new ResizeObserver(()=>{ const {x,w}=centerOf(currentBtn(tab)); setBubble({x, w:Math.max(52, w*0.92)}); setBlob({x, w:Math.max(52, w*0.92)}); });
    if(contRef.current) ro.observe(contRef.current);
    setTimeout(()=>{ const {x,w}=centerOf(currentBtn(tab)); setBubble({x, w:Math.max(52, w*0.92)}); setBlob({x, w:Math.max(52, w*0.92)}); },0);
    return ()=>ro.disconnect();
  },[]);
  useEffect(()=>{ const {x,w}=centerOf(currentBtn(tab)); setBubble({x, w:Math.max(52, w*0.92)}); setBlob({x, w:Math.max(52, w*0.92)}); },[tab]);

  return (
    <nav className="fixed left-0 right-0 bottom-[calc(10px+env(safe-area-inset-bottom,0px))] z-[55] flex justify-center px-4">
      <div ref={contRef} className="island island-compact not-full h-[64px] px-3 relative">
        {/* defs для goo */}
        <svg className="absolute opacity-0 pointer-events-none" width="0" height="0">
          <defs>
            <filter id="goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b"/>
              <feColorMatrix in="b" mode="matrix" values="
                   1 0 0 0 0
                   0 1 0 0 0
                   0 0 1 0 0
                   0 0 0 18 -9" result="g"/>
              <feComposite in="SourceGraphic" in2="g" operator="atop"/>
            </filter>
          </defs>
        </svg>

        {/* Пузырёк вокруг активной иконки */}
        <div className={`active-bubble ${mounted?"bubble-mounted":""}`} style={{ "--x": `${bubble.x}px`, "--w": `${bubble.w}px` }}>
          <div className="active-bubble-core"/>
          <div className="active-bubble-gloss"/>
        </div>

        {/* Капля-перетекание под иконками */}
        <div className={`blob-real ${dir==="right"?"stretch-r":"stretch-l"} ${mounted?"blob-mounted":""}`} style={{ "--x": `${blob.x}px`, "--w": `${blob.w}px` }}>
          <div className="blob-core"/><div className="blob-spec"/>
        </div>

        {/* Кнопки — компактный шаг, всегда видны */}
        <div className="island-row">
          <button ref={b1} className={`island-btn ${tab==="timer"?"active":""}`} aria-label="Timer"  onClick={()=>onChange("timer")}><HelmetIcon/></button>
          <button ref={b2} className={`island-btn ${tab==="id"?"active":""}`}     aria-label="ID"     onClick={()=>onChange("id")}><IdCardIcon/></button>
          <button ref={b3} className={`island-btn ${tab==="medals"?"active":""}`} aria-label="Medal"  onClick={()=>onChange("medals")}><MedalIcon/></button>
        </div>
      </div>
    </nav>
  );
}

/* ========= УТИЛИТЫ ========= */
function formatBirth(yyyy_mm_dd){ const d=new Date(yyyy_mm_dd+"T00:00:00"); return d.toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"}); }
function shortDate(iso){ const ts=toLocalTimestamp(iso); const d=new Date(ts); return d.toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric"}); }
function toLocalTimestamp(input){ if(!input) return Date.now(); const hasTZ=/Z|[+-]\d{2}:?\d{2}$/.test(input); if(hasTZ) return new Date(input).getTime(); const [date,time="00:00:00"]=String(input).split("T"); const [y,m,d]=date.split("-").map(Number); const [hh,mm,ss]=time.split(":").map(Number); return new Date(y,(m||1)-1,d||1,hh||0,mm||0,ss||0,0).getTime(); }
function msParts(ms){ let s=Math.max(0,Math.floor(ms/1000)); const days=Math.floor(s/86400); s-=days*86400; const hours=Math.floor(s/3600); s-=hours*3600; const minutes=Math.floor(s/60); s-=minutes*60; const seconds=s; return {days,hours,minutes,seconds}; }
function formatParts(p){ const dd=p.days>0?`${p.days}д `:""; const hh=String(p.hours).padStart(2,"0"); const mm=String(p.minutes).padStart(2,"0"); const ss=String(p.seconds).padStart(2,"0"); return `${dd}${hh}:${mm}:${ss}`; }

/* ========= SVG ICONS ========= */
function BurgerIcon(){return(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);}
function VibrationOnIcon(){return(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M2 8l2 2-2 2 2 2-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M22 8l-2 2 2 2-2 2 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);}
function VibrationOffIcon(){return(<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M2 8l2 2-2 2 2 2-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".35"/><path d="M22 8l-2 2 2 2-2 2 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".35"/><path d="M5 5l14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);}
function HelmetIcon(){return(<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M3 13a9 9 0 1118 0v4H3v-4z" stroke="currentColor" strokeWidth="2"/><path d="M12 4v5h9" stroke="currentColor" strokeWidth="2"/></svg>);}
function IdCardIcon(){return(<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="12" r="2" stroke="currentColor" strokeWidth="2"/><path d="M14 10h5M14 13h5M14 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);}
function MedalIcon(){return(<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="14" r="4" stroke="currentColor" strokeWidth="2"/><path d="M7 3l5 6 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);}
