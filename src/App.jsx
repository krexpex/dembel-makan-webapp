import React, { useEffect, useMemo, useRef, useState } from "react";

/** ====== КОНСТАНТЫ ТАЙМЕРА ====== */
// дата начала службы (известная дата ухода) — меняй при необходимости
const SERVICE_START = new Date("2025-11-28T00:00:00"); // локальное время
// длительность службы
const SERVICE_DAYS = 365;
// дата дембеля
const DEMOBIL_DATE = new Date(SERVICE_START.getTime() + SERVICE_DAYS * 24 * 60 * 60 * 1000);

// имя фиксировано
const SOLDIER_NAME = "Макан";

/** Форматирование времени */
function formatLeft(msLeft) {
  if (msLeft < 0) msLeft = 0;
  const totalSec = Math.floor(msLeft / 1000);
  const days = Math.floor(totalSec / (24 * 3600));
  const hours = Math.floor((totalSec % (24 * 3600)) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const pad = (n) => n.toString().padStart(2, "0");
  return {
    days,
    hms: `${pad(hours)}:${pad(mins)}:${pad(secs)}`
  };
}

/** 12-сегментное кольцо прогресса */
function SegmentedRing({ progress /* 0..1 */ }) {
  const segments = 12;
  const filled = Math.floor(progress * segments);

  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full absolute inset-0"
      aria-hidden
    >
      <defs>
        <linearGradient id="seg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
        </linearGradient>
      </defs>
      {Array.from({ length: segments }).map((_, i) => {
        const start = (i / segments) * 2 * Math.PI;
        const end = ((i + 0.75) / segments) * 2 * Math.PI; // небольшой зазор
        const rOuter = 92;
        const rInner = 82;

        const x1 = 100 + rOuter * Math.cos(start);
        const y1 = 100 + rOuter * Math.sin(start);
        const x2 = 100 + rOuter * Math.cos(end);
        const y2 = 100 + rOuter * Math.sin(end);

        const x3 = 100 + rInner * Math.cos(end);
        const y3 = 100 + rInner * Math.sin(end);
        const x4 = 100 + rInner * Math.cos(start);
        const y4 = 100 + rInner * Math.sin(start);

        const large = end - start > Math.PI ? 1 : 0;

        const d = `
          M ${x1} ${y1}
          A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2}
          L ${x3} ${y3}
          A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4}
          Z
        `;

        const isFilled = i < filled;
        return (
          <path
            key={i}
            d={d}
            fill={isFilled ? "url(#seg)" : "rgba(255,255,255,0.08)"}
          />
        );
      })}
    </svg>
  );
}

/** Иконки (stroke=white) */
const IconHome = () => (
  <svg viewBox="0 0 24 24">
    <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-5H10v5H5a1 1 0 0 1-1-1v-9.5Z" />
  </svg>
);
const IconID = () => (
  <svg viewBox="0 0 24 24">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <circle cx="8" cy="12" r="2.2" />
    <path d="M12.5 10.5h6M12.5 13h6M12.5 15.5h4.3" />
  </svg>
);
const IconMedal = () => (
  <svg viewBox="0 0 24 24">
    <path d="M7 3h10l-2.3 6.2a4 4 0 1 1-5.4 0L7 3Z" />
    <circle cx="12" cy="14" r="3.2" />
  </svg>
);

/** Карточка «Личное дело» */
function IdCard() {
  return (
    <div className="px-5 w-full max-w-xl mx-auto">
      <div className="bg-[#121416]/80 border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="text-green-400/80 tracking-widest text-xs">ЛИЧНОЕ ДЕЛО</div>
        <div className="text-2xl font-semibold">{SOLDIER_NAME}</div>
        <div className="text-white/70 text-sm">Андрей Кириллович Косолапов</div>

        <div className="grid gap-2 pt-2">
          {[
            ["Реальное имя", "Андрей Кириллович Косолапов"],
            ["Псевдоним", "Макан"],
            ["Дата рождения", "6 января 2002 г."],
            ["Место рождения", "Москва, Россия"],
            ["Страна", "Россия"],
            ["Профессия", "рэпер"],
            ["Жанры", "рэп"],
            ["Категория годности", "A"],
            ["Место службы", "Может быть направлен в Семёновский полк (уточняется)"],
            ["Дата призыва", SERVICE_START.toLocaleDateString()],
          ].map(([k, v], idx) => (
            <div
              key={idx}
              className="bg-white/5 rounded-xl px-3 py-3 flex items-center justify-between"
            >
              <span className="text-white/55">{k}</span>
              <span className="text-white">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Главный экран с кольцом и таймером */
function HomeScreen() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const left = Math.max(0, DEMOBIL_DATE.getTime() - now);
  const total = DEMOBIL_DATE.getTime() - SERVICE_START.getTime();
  const done = Math.min(1, 1 - left / total);

  const { days, hms } = formatLeft(left);

  return (
    <div className="w-full max-w-xl mx-auto px-5">
      <div className="relative aspect-square max-w-[560px] mx-auto">
        {/* 12-сегментное кольцо */}
        <SegmentedRing progress={done} />
        {/* Макан */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/makan.png"
            alt="Макан"
            className="makan-layer w-[54%] max-w-[360px] object-contain pointer-events-none select-none"
            draggable={false}
          />
        </div>
      </div>

      <div className="text-center mt-6">
        <div className="text-2xl sm:text-3xl font-semibold">До дембеля {SOLDIER_NAME}</div>
        <div className="text-4xl sm:text-5xl font-extrabold mt-2">
          {days}д {hms}
        </div>

        <div className="mt-4 text-white/70 text-sm">
          Таймзона: {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </div>

        <div className="mt-4 w-full h-4 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-white/70 rounded-r-full"
            style={{ width: `${Math.max(1.5, done * 100)}%` }}
          />
        </div>
        <div className="mt-2 text-white/70 text-sm">
          Выполнено службы: {(done * 100).toFixed(2)}%
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(
              window.location.href
            )}&text=${encodeURIComponent("Ждём вместе 🫡")}`}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 transition"
          >
            Поделиться таймером
          </a>
          <a
            href="https://t.me/zdem_makana"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-2xl bg-white/15 hover:bg-white/25 transition"
          >
            Ждём вместе
          </a>
        </div>
      </div>
    </div>
  );
}

/** Заглушка «Достижения» */
function Achievements() {
  return (
    <div className="px-5 w-full max-w-xl mx-auto">
      <div className="bg-[#121416]/80 border border-white/10 rounded-2xl p-6 text-center">
        <div className="text-white/80 text-lg">Достижения</div>
        <div className="text-white/55 mt-2">Скоро здесь появятся значки и прогресс.</div>
      </div>
    </div>
  );
}

/** Главный компонент с нижним островком */
export default function App() {
  const [tab, setTab] = useState("home"); // "home" | "id" | "medal"

  // refs для расчёта центров иконок
  const rowRef = useRef(null);
  const btnRefs = useRef({
    home: React.createRef(),
    id: React.createRef(),
    medal: React.createRef(),
  });
  const [x, setX] = useState(0);
  const [diameter, setDiameter] = useState(64); // должен совпадать с --d из CSS

  // вычисляем центр кнопки внутри .island-row
  const recalc = useMemo(
    () => () => {
      const row = rowRef.current;
      const btn = btnRefs.current[tab]?.current;
      if (!row || !btn) return;

      const rowRect = row.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();

      const centerX = btnRect.left + btnRect.width / 2 - rowRect.left;
      setX(centerX);
      setDiameter(btnRect.width); // если меняли размер на адаптиве — подхватим
    },
    [tab]
  );

  useEffect(() => {
    recalc();
    const ro = new ResizeObserver(recalc);
    if (rowRef.current) ro.observe(rowRef.current);
    const onResize = () => recalc();
    window.addEventListener("resize", onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [recalc]);

  // для CSS переменных
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    row.style.setProperty("--x", `${x}px`);
    row.style.setProperty("--d", `${diameter}px`);
    row.style.setProperty("--offsetY", "0px"); // если вдруг надо — поменяй на 1px/-1px
  }, [x, diameter]);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Шапка (простая) */}
      <div className="px-5 py-3 flex items-center justify-between">
        <div className="text-amber-400">Закрыть</div>
        <div className="text-lg font-semibold">Жду {SOLDIER_NAME} 🪖</div>
        <div className="opacity-80">•••</div>
      </div>

      {/* Контент */}
      <div className="flex-1 pb-28">
        {tab === "home" && <HomeScreen />}
        {tab === "id" && <IdCard />}
        {tab === "medal" && <Achievements />}
      </div>

      {/* Нижний островок */}
      <div className="fixed left-0 right-0 bottom-3 safe-bottom">
        <div className="island island-compact not-full px-4">
          <div ref={rowRef} className="island-row">
            {/* КАПЛЯ (под пузырьком) */}
            <div
              className="blob-real"
              style={{ "--x": `${x}px`, "--d": `${diameter}px` }}
            >
              <div className="blob-core" />
            </div>

            {/* ПУЗЫРЁК */}
            <div
              className="active-bubble"
              style={{ "--x": `${x}px`, "--d": `${diameter}px` }}
            >
              <div className="active-bubble-core" />
            </div>

            {/* КНОПКИ */}
            <button
              ref={btnRefs.current.home}
              className={`island-btn ${tab === "home" ? "active" : ""}`}
              onClick={() => setTab("home")}
              aria-label="Таймер"
            >
              <IconHome />
            </button>
            <button
              ref={btnRefs.current.id}
              className={`island-btn ${tab === "id" ? "active" : ""}`}
              onClick={() => setTab("id")}
              aria-label="ID карта"
            >
              <IconID />
            </button>
            <button
              ref={btnRefs.current.medal}
              className={`island-btn ${tab === "medal" ? "active" : ""}`}
              onClick={() => setTab("medal")}
              aria-label="Достижения"
            >
              <IconMedal />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
