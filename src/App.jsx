import React, { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";

/** ───────── НАСТРОЙКИ (редактируются здесь) ───────── */
// Псевдоним, который показываем в таймере и заголовках:
const NICK = "Макан";

// Реальная анкета (удобно править одно место)
const PROFILE = {
  realName: "Андрей Кириллович Косолапов",
  nickname: "Макан",
  birth: {
    date: "2002-01-06",              // YYYY-MM-DD
    place: "Москва, Россия"
  },
  country: "Россия",
  profession: "рэпер",
  genres: ["рэп"],
  aliases: ["MC Гай Фокс", "Nemo MC", "Young Chaser", "Macan"],
  fitnessCategory: "А",
  assignment: "Может быть направлен в Семёновский полк (уточняется)"
};

// Даты службы — жёстко зашиты (локальное время устройства)
const SERVICE_START = "2025-10-01T00:00:00";
const DEMOBIL_DATE  = "2026-10-01T00:00:00";

// Ссылка на паблик/канал (вставь позже)
const WEB_PUBLIC_URL = "";
/** ─────────────────────────────────────────────────── */

export default function App() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Riga";
  const [now, setNow] = useState(Date.now());
  const confettiDoneRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Инициализация Telegram WebApp
  useEffect(() => {
    const twa = window.Telegram?.WebApp;
    if (!twa) return;
    try { twa.expand(); twa.ready(); twa.enableClosingConfirmation(); } catch {}
  }, []);

  // Служба (время)
  const startTs = useMemo(() => toLocalTimestamp(SERVICE_START), []);
  const endTs   = useMemo(()   => toLocalTimestamp(DEMOBIL_DATE), []);
  const totalMs  = Math.max(0, endTs - startTs);
  const leftMs   = Math.max(0, endTs - now);
  const passedMs = Math.max(0, now - startTs);

  const pct = totalMs > 0 ? Math.min(100, Math.max(0, (passedMs / totalMs) * 100)) : 0;
  const leftParts = msParts(leftMs);
  const isOver = leftMs <= 0 && totalMs > 0;

  // Конфетти при нуле
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

  // Круговой прогресс
  const size = 360, stroke = 10, r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const dashoffset = C * (1 - pct / 100);
  const hasPublic = Boolean(WEB_PUBLIC_URL);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-900 to-zinc-800 text-zinc-50">
      <div className="mx-auto max-w-6xl grid md:grid-cols-[320px,1fr] gap-4 md:gap-6 p-4">

        {/* Анкета слева */}
        <section className="order-2 md:order-1">
          <SoldierCard profile={PROFILE} service={{ start: SERVICE_START, end: DEMOBIL_DATE }} />
        </section>

        {/* Таймер */}
        <section className="order-1 md:order-2 relative flex flex-col items-center justify-start md:justify-center rounded-3xl bg-zinc-900/60 backdrop-blur p-5 md:p-6 shadow-xl">
          <div aria-hidden className="absolute inset-0 -z-10" style={{ background:
            "radial-gradient(30rem 30rem at 50% 20%, rgba(16,185,129,0.18), rgba(0,0,0,0))" }} />

          <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="absolute inset-0" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
              <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth={stroke}
                      strokeLinecap="round" strokeDasharray={C} strokeDashoffset={dashoffset}
                      transform={`rotate(-90 ${size/2} ${size/2})`}
                      style={{ transition: "stroke-dashoffset 0.8s ease" }} />
            </svg>

            <img src="/makan.png" alt={NICK}
                 className="w-[55%] md:w-[60%] drop-shadow-[0_18px_50px_rgba(0,0,0,0.65)] select-none pointer-events-none animate-wobble"
                 draggable="false" />
          </div>

          <div className="mt-2 text-center">
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
            <div className="h-full bg-white/80" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-zinc-300 mt-1">Выполнено службы: {pct.toFixed(2)}%</div>

          <div className="flex flex-col items-center gap-3 mt-4">
            <button onClick={share} className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-medium">
              Поделиться таймером
            </button>

            <div className="text-sm text-zinc-300">Ждём вместе</div>
            <a
              href={hasPublic ? WEB_PUBLIC_URL : undefined}
              target="_blank" rel="noopener noreferrer"
              onClick={(e) => { if (!hasPublic) { e.preventDefault(); alert("Вставь ссылку на паблик в WEB_PUBLIC_URL"); } }}
              className="px-4 py-3 rounded-2xl bg-zinc-700 hover:bg-zinc-600 font-medium"
            >
              Открыть паблик
            </a>
          </div>
        </section>
      </div>

      <footer className="text-xs text-zinc-400 text-center pb-4">
        Сделано с любовью и иронией • {new Date().getFullYear()}
      </footer>
    </div>
  );
}

/* ───────── Компонент «Анкета бойца» ───────── */
function SoldierCard({ profile, service }) {
  const start = shortDate(service.start);
  const end   = shortDate(service.end);

  // Удобная структура анкеты
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
      {/* Шеврон */}
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

      {/* Поля анкеты */}
      <div className="grid grid-cols-1 gap-2">
        {fields.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-xl bg-zinc-900/60 border border-zinc-800 px-3 py-2">
            <span className="text-xs text-zinc-400">{label}</span>
            <span className="text-sm font-medium text-zinc-200 text-right">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-zinc-500">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/80" />
        Карточка формируется из объекта PROFILE в начале файла.
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
