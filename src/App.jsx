import React, { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";

/** ───────── НАСТРОЙКИ ───────── */
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
const SERVICE_START = "2025-10-01T00:00:00";
const DEMOBIL_DATE  = "2026-10-01T00:00:00";
/** ──────────────────────────── */

export default function App() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Riga";
  const [now, setNow] = useState(Date.now());
  const [popped, setPopped] = useState(false);
  const [entered, setEntered] = useState(false);

  // вибрация
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  // меню
  const [menuOpen, setMenuOpen] = useState(false);

  // счётчик и флаги появления изображений
  const [tapCount, setTapCount] = useState(0);
  const [show1, setShow1] = useState(false); // jeb1.png — 3-й тап
  const [show2, setShow2] = useState(false); // jeb2.png — 7-й тап
  const [show3, setShow3] = useState(false); // jeb3.png — 10-й тап

  const confettiDoneRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const twa = window.Telegram?.WebApp;
    try { twa?.expand(); twa?.ready(); twa?.enableClosingConfirmation(); } catch {}
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []);

  // загрузка/сохранение вибрации
  useEffect(() => {
    const saved = localStorage.getItem("vibrateEnabled");
    if (saved !== null) setVibrateEnabled(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("vibrateEnabled", vibrateEnabled ? "1" : "0");
  }, [vibrateEnabled]);

  // Автопропадание надписей спустя ~2.4с
  useEffect(() => {
    if (show1) { const t = setTimeout(() => setShow1(false), 2400); return () => clearTimeout(t); }
  }, [show1]);
  useEffect(() => {
    if (show2) { const t = setTimeout(() => setShow2(false), 2400); return () => clearTimeout(t); }
  }, [show2]);
  useEffect(() => {
    if (show3) { const t = setTimeout(() => setShow3(false), 2400); return () => clearTimeout(t); }
  }, [show3]);

  // время службы
  const startTs = useMemo(() => toLocalTimestamp(SERVICE_START), []);
  const endTs   = useMemo(()   => toLocalTimestamp(DEMOBIL_DATE), []);
  const totalMs  = Math.max(0, endTs - startTs);
  const leftMs   = Math.max(0, endTs - now);
  const passedMs = Math.max(0, now - startTs);

  const pct = totalMs > 0 ? Math.min(100, Math.max(0, (passedMs / totalMs) * 100)) : 0;
  const leftParts = msParts(leftMs);
  const isOver = leftMs <= 0 && totalMs > 0;

  // конфетти при нуле
  useEffect(() => {
    if (isOver && !confettiDoneRef.current) {
      confettiDoneRef.current = true;
      burst(0.25); setTimeout(() => burst(0.5), 200); setTimeout(() => burst(0.75), 400);
      setTimeout(() => {
        confetti({ particleCount: 250, spread: 85, startVelocity: 45, scalar: 1.1, ticks: 240, origin: { y: 0.25 } });
      }, 900);
      try { navigator.vibrate?.(150); } catch {}
    }
    if (!isOver) confettiDoneRef.current = false;
  }, [isOver]);

  function burst(p = 0.5) {
    const n = Math.floor(100 * p);
    confetti({ particleCount: n, spread: 65, startVelocity: 38, origin: { x: 0.2, y: 0.4 } });
    confetti({ particleCount: n, spread: 65, startVelocity: 38, origin: { x: 0.8, y: 0.4 } });
  }

  function share() {
    const text = isOver
      ? `🎉 ${NICK} ДЕМБЕЛЬНУЛСЯ!\n\nСлужба завершена.`
      : `⏳ До дембеля ${NICK}: ${formatParts(leftParts)}.\nПрисоединяйся к отсчёту!`;
    const url = window.location.href.split("?")[0];

    const twa = window.Telegram?.WebApp;
    if (twa?.shareURL) return twa.shareURL(url);
    if (twa?.shareText) return twa.shareText(`${text}\n${url}`);
    if (navigator.share) { navigator.share({ title: `Дембель ${NICK}`, text, url }).catch(() => {}); return; }
    navigator.clipboard?.writeText(`${text}\n${url}`); alert("Ссылка скопирована в буфер обмена ✅");
  }

  /* ── Кольцо ── */
  const size = 360, stroke = 10, r = (size - stroke) / 2, C = 2 * Math.PI * r;
  // сегментированный серый трек
  const SEGMENTS = 12, segmentLen = C / SEGMENTS, gapLen = Math.max(4, segmentLen * 0.08);
  const dashPattern = `${segmentLen - gapLen} ${gapLen}`;
  // непрерывный белый прогресс
  const progressDashArray = C;
  const progressDashOffset = C * (1 - pct / 100);
  const animatedProgressOffset = entered ? progressDashOffset : C;

  // тап по Макану
  function onMakanTap() {
    setPopped(true);
    setTimeout(() => setPopped(false), 180);

    // вибрация (если включена)
    if (vibrateEnabled) {
      try { navigator.vibrate?.(30); } catch {}
      // лёгкая haptic через Telegram API (если поддерживает)
      try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light"); } catch {}
    }

    setTapCount((prev) => {
      const next = prev + 1;
      if (next === 3) setShow1(true);
      if (next === 7) setShow2(true);
      if (next === 10) setShow3(true);
      return next;
    });
  }

  function openGroup() {
    const url = "https://t.me/zdem_makana";
    const twa = window.Telegram?.WebApp;
    if (twa?.openTelegramLink) { twa.openTelegramLink(url); return; }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  // clip-path для JEB-изображений строго ВНУТРИ круга
  const clipStyle = { clipPath: `circle(${r}px at ${size/2}px ${size/2}px)` };

  // переключатель вибрации
  function toggleVibration() {
    setVibrateEnabled(v => !v);
    // микро-тик при смене состояния
    try { navigator.vibrate?.(10); } catch {}
    setMenuOpen(false);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0f1514] to-[#0b1110] text-zinc-50">
      {/* Бургер меню (fixed, слева сверху) */}
      <div className="fixed left-3 top-3 z-[60]">
        <button
          aria-label="Открыть меню"
          onClick={() => setMenuOpen(o => !o)}
          className="glass-btn h-10 w-10 grid place-items-center rounded-xl"
        >
          <BurgerIcon />
        </button>

        {/* Выпадающее меню */}
        {menuOpen && (
          <div className="mt-2 w-60 glass-menu rounded-2xl p-2 shadow-xl border border-white/10">
            <button
              onClick={toggleVibration}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/8 transition-colors"
            >
              {vibrateEnabled ? <VibrationOnIcon /> : <VibrationOffIcon />}
              <span className="text-sm">
                {vibrateEnabled ? "Выключить вибрацию" : "Включить вибрацию"}
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl grid md:grid-cols-[320px,1fr] gap-4 md:gap-6 p-4 pb-28">
        {/* Анкета слева */}
        <section className={`order-2 md:order-1 ${entered ? "appear-fade-up" : ""}`}>
          <SoldierCard profile={PROFILE} service={{ start: SERVICE_START, end: DEMOBIL_DATE }} />
        </section>

        {/* Таймер / сцена */}
        <section className="order-1 md:order-2 relative flex flex-col items-center justify-start md:justify-center rounded-3xl bg-zinc-900/60 backdrop-blur p-5 md:p-6 shadow-xl overflow-hidden">
          <div
            aria-hidden
            className={`absolute inset-0 -z-10 ${entered ? "glow-enter" : ""}`}
            style={{ background: "radial-gradient(30rem 30rem at 50% 20%, rgba(16,185,129,0.18), rgba(0,0,0,0))" }}
          />

          <div className={`relative flex items-center justify-center ${entered ? "appear-scale" : ""}`} style={{ width: size, height: size }}>
            {/* Кольцо */}
            <svg className="absolute inset-0 z-0" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle
                cx={size/2} cy={size/2} r={r}
                fill="none"
                stroke="rgba(255,255,255,0.13)"
                strokeWidth={stroke}
                strokeLinecap="butt"
                strokeDasharray={dashPattern}
                transform={`rotate(-90 ${size/2} ${size/2})`}
              />
              <circle
                cx={size/2} cy={size/2} r={r}
                fill="none"
                stroke="rgba(255,255,255,0.95)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={progressDashArray}
                strokeDashoffset={animatedProgressOffset}
                transform={`rotate(-90 ${size/2} ${size/2})`}
                style={{ transition: "stroke-dashoffset 900ms ease" }}
              />
            </svg>

            {/* Зона для JEB-изображений: строго внутри круга и ниже Макана */}
            <div className="absolute inset-0 z-[5] pointer-events-none" style={clipStyle}>
              {/* 1) 3-й тап — слева снизу */}
              {show1 && (
                <img
                  src="/jeb1.png"
                  alt="ДЖЕБ"
                  className="absolute left-[6%] bottom-[20%] w-[40%] md:w-[34%] max-w-[280px] jeb-layer jeb-img animate-rise-left auto-fade-out"
                />
              )}

              {/* 2) 7-й тап — справа по центру */}
              {show2 && (
                <img
                  src="/jeb2.png"
                  alt="УШЁЛ ДЖЕБ"
                  className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[46%] md:w-[38%] max-w-[320px] jeb-layer jeb-img animate-slide-from-right auto-fade-out"
                />
              )}

              {/* 3) 10-й тап — дугой сверху (картинка) */}
              {show3 && (
                <div className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[78%] md:w-[68%] grid place-items-center jeb-layer auto-fade-out">
                  <img src="/jeb3.png" alt="ДЖЕБ, УШЁЛ ДЖЕБ" className="w-full jeb-img" />
                </div>
              )}
            </div>

            {/* Макан — поверх всего */}
            <img
              src="/makan.png"
              alt={NICK}
              onClick={onMakanTap}
              className={[
                "cursor-pointer select-none",
                "drop-shadow-[0_18px_50px_rgba(0,0,0,0.65)]",
                "transition-transform duration-200 ease-out",
                "animate-wobble",
                popped ? "scale-[1.10]" : "scale-100",
                "w-[74%] md:w-[78%] makan-layer makan-shadow"
              ].join(" ")}
              draggable="false"
            />
          </div>

          {/* Тексты под сценой */}
          <div className={`mt-2 text-center ${entered ? "appear-fade-up" : ""}`}>
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

          {/* Линейный прогресс */}
          <div className="w-full max-w-xl h-3 bg-zinc-800 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-white/80" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-zinc-300 mt-1">Выполнено службы: {pct.toFixed(2)}%</div>

          {/* Кнопки */}
          <div className="flex flex-col items-center gap-3 mt-4">
            <button onClick={share} className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-medium">
              Поделиться таймером
            </button>
            <button onClick={openGroup} className="px-4 py-3 rounded-2xl bg-zinc-700 hover:bg-zinc-600 font-medium">
              Ждём вместе
            </button>
          </div>
        </section>
      </div>

      {/* Нижняя «liquid glass» панель */}
      <nav className="fixed left-0 right-0 bottom-3 z-[55] flex justify-center px-4">
        <div className="glass-bar w-full max-w-md h-14 rounded-2xl px-4 flex items-center justify-between">
          <button className="glass-item" aria-label="Каска">
            <HelmetIcon />
          </button>
          <button className="glass-item" aria-label="ID карта">
            <IdCardIcon />
          </button>
          <button className="glass-item" aria-label="Медали / достижения">
            <MedalIcon />
          </button>
        </div>
      </nav>

      <footer className="text-xs text-zinc-400 text-center pb-5 pt-1">
        Сделано с любовью и иронией • {new Date().getFullYear()}
      </footer>
    </div>
  );
}

/* ───────── Анкета ───────── */
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
    <div className="rounded-3xl bg-[rgba(24,24,27,0.85)] shadow-xl p-4 md:p-5 border border-zinc-800/60">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-emerald-600/25 border border-emerald-500/40 grid place-items-center">
          <span className="text-emerald-300 font-semibold">ЖМ</span>
        </div>
        <div>
          <div className="uppercase tracking-wider text-xs text-emerald-300/90">личное дело</div>
          <div className="text-lg font-bold leading-tight -mt-0.5">{profile.nickname}</div>
          <div className="text-[11px] text-zinc-400">{profile.realName}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {fields.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-xl bg-zinc-900/60 border border-zinc-800 px-3 py-2">
            <span className="text-xs text-zinc-400">{label}</span>
            <span className="text-sm font-medium text-zinc-200 text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- utils ---------- */
function formatBirth(yyyy_mm_dd) {
  const d = new Date(yyyy_mm_dd + "T00:00:00");
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}
function shortDate(iso) {
  const ts = toLocalTimestamp(iso);
  const d = new Date(ts);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function toLocalTimestamp(input) {
  if (!input) return Date.now();
  const hasTZ = /Z|[+-]\d{2}:?\d{2}$/.test(input);
  if (hasTZ) return new Date(input).getTime();
  const [date, time = "00:00:00"] = String(input).split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm, ss] = time.split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0, 0).getTime();
}
function msParts(ms) {
  let s = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(s / 86400); s -= days * 86400;
  const hours = Math.floor(s / 3600); s -= hours * 3600;
  const minutes = Math.floor(s / 60); s -= minutes * 60;
  const seconds = s;
  return { days, hours, minutes, seconds };
}
function formatParts(p) {
  const dd = p.days > 0 ? `${p.days}д ` : "";
  const hh = String(p.hours).padStart(2, "0");
  const mm = String(p.minutes).padStart(2, "0");
  const ss = String(p.seconds).padStart(2, "0");
  return `${dd}${hh}:${mm}:${ss}`;
}

/* ───────── МИНИ-ИКОНКИ (inline SVG) ───────── */
function BurgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function VibrationOnIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M2 8l2 2-2 2 2 2-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 8l-2 2 2 2-2 2 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function VibrationOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M2 8l2 2-2 2 2 2-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".35"/>
      <path d="M22 8l-2 2 2 2-2 2 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".35"/>
      <path d="M5 5l14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function HelmetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 13a9 9 0 1118 0v4H3v-4z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12 4v5h9" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IdCardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="9" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M14 10h5M14 13h5M14 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function MedalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="14" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M7 3l5 6 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
