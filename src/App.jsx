import React, { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";

/** ── ПРАВИМ ТОЛЬКО ЗДЕСЬ ─────────────────────────────────────────────
 * Жёстко заданные даты службы (локальное время).
 * Поменяешь при необходимости.
 */
const SERVICE_START = "2025-10-01T00:00:00"; // 1 октября 2025
const DEMOBIL_DATE  = "2026-10-01T00:00:00"; // 1 октября 2026
/** ─────────────────────────────────────────────────────────────────── */

export default function App() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Riga";

  const NAME = "Макан";
  const [now, setNow] = useState(Date.now());
  const [compact] = useState(false); // интерфейс без переключателя

  // чтобы конфетти не стреляли бесконечно
  const confettiDoneRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Telegram WebApp init
  useEffect(() => {
    const twa = window.Telegram?.WebApp;
    if (!twa) return;
    try {
      twa.expand();
      twa.ready();
      twa.enableClosingConfirmation();
    } catch {}
  }, []);

  useEffect(() => localStorage.setItem("dm_name", name), [name]);

  // Парсим зашитые даты как локальные
  const startTs = useMemo(() => toLocalTimestamp(SERVICE_START), []);
  const endTs   = useMemo(()   => toLocalTimestamp(DEMOBIL_DATE), []);

  const totalMs  = Math.max(0, endTs - startTs);
  const leftMs   = Math.max(0, endTs - now);
  const passedMs = Math.max(0, now - startTs);

  const pct = totalMs > 0 ? Math.min(100, Math.max(0, (passedMs / totalMs) * 100)) : 0;

  const leftParts   = msParts(leftMs);
  const totalParts  = msParts(totalMs);
  const passedParts = msParts(passedMs);

  const isOver = leftMs <= 0 && totalMs > 0;

  // ---- CONFETTI: один раз при достижении нуля
  useEffect(() => {
    if (isOver && !confettiDoneRef.current) {
      confettiDoneRef.current = true;
      burst(0.25);
      setTimeout(() => burst(0.5), 200);
      setTimeout(() => burst(0.75), 400);
      setTimeout(() => {
        confetti({
          particleCount: 250,
          spread: 85,
          startVelocity: 45,
          scalar: 1.1,
          ticks: 240,
          origin: { y: 0.25 }
        });
      }, 900);
    }
    if (!isOver) confettiDoneRef.current = false;
  }, [isOver]);

  function burst(power = 0.5) {
    const count = Math.floor(100 * power);
    confetti({ particleCount: count, spread: 65, startVelocity: 38, origin: { x: 0.2, y: 0.4 } });
    confetti({ particleCount: count, spread: 65, startVelocity: 38, origin: { x: 0.8, y: 0.4 } });
  }

  function share() {
    const text = isOver
      ? `🎉 ${name} ДЕМБЕЛЬНУЛСЯ!\n\nСлужба завершена.`
      : `⏳ До дембеля ${name}: ${formatParts(leftParts)}.\nПрисоединяйся к отсчёту!`;
    const url = window.location.href.split("?")[0];

    const twa = window.Telegram?.WebApp;
    if (twa?.shareURL) return twa.shareURL(url);
    if (twa?.shareText) return twa.shareText(`${text}\n${url}`);

    if (navigator.share) {
      navigator.share({ title: `Дембель ${name}`, text, url }).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(`${text}\n${url}`);
    alert("Ссылка скопирована в буфер обмена ✅");
  }

  // ----- параметры кругового индикатора
  const size = 360;                 // px (SVG width/height)
  const stroke = 10;                // толщина кольца
  const r = (size - stroke) / 2;    // радиус
  const C = 2 * Math.PI * r;        // длина окружности
  const progress = pct / 100;
  const dashoffset = C * (1 - progress);

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-zinc-900 to-zinc-800 text-zinc-50">
      {/* HERO: Макан по центру */}
      <section className="relative flex-1 flex items-center justify-center p-6">
        {/* мягкая подсветка позади */}
        <div
          aria-hidden
          className="absolute w-[28rem] h-[28rem] rounded-full blur-3xl opacity-50"
          style={{
            background:
              "radial-gradient(closest-side, rgba(16,185,129,0.22), rgba(0,0,0,0))"
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
          {/* Круговой прогресс вокруг Макана */}
          <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg
              className="absolute inset-0"
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
            >
              <circle
                cx={size/2}
                cy={size/2}
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={stroke}
              />
              <circle
                cx={size/2}
                cy={size/2}
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={dashoffset}
                transform={`rotate(-90 ${size/2} ${size/2})`}
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>

            {/* Изображение Макана с лёгким покачиванием */}
            <img
              src="/makan.png"
              alt="Макан"
              className="w-[55%] md:w-[60%] drop-shadow-[0_18px_50px_rgba(0,0,0,0.65)] select-none pointer-events-none animate-wobble"
              draggable="false"
            />
          </div>

          {isOver ? (
            <div className="text-3xl md:text-5xl font-extrabold">🎉 {name} ДЕМБЕЛЬНУЛСЯ!</div>
          ) : (
            <>
              <h1 className="text-xl md:text-2xl font-semibold text-zinc-300">
                До дембеля {name}
              </h1>
              <div className="text-3xl md:text-5xl font-extrabold tracking-tight">
                {formatParts(leftParts)}
              </div>
              <div className="text-sm text-zinc-400">Таймзона: {tz}</div>
            </>
          )}

          {/* Прогресс-бар (линейный, для наглядности) */}
          <div className="w-full max-w-xl h-3 bg-zinc-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-white/80"
              style={{ width: `${pct}%` }}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="text-xs text-zinc-300">Выполнено службы: {pct.toFixed(2)}%</div>

          {/* Кнопки */}
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <button
              onClick={share}
              className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-medium"
            >
              Поделиться таймером
            </button>
          </div>
        </div>
      </section>

      

          <p className="text-xs md:text-sm text-zinc-400">
            Прошло: {formatParts(passedParts)} • Всего службы: {formatParts(totalParts)}
          </p>
          <p className="text-xs text-zinc-500">
            Даты фиксированы в коде (см. константы <code>SERVICE_START</code> и <code>DEMOBIL_DATE</code>).
          </p>
        </div>
      </section>

      <footer className="text-xs text-zinc-400 text-center pb-4">
        Сделано с любовью и иронией • {new Date().getFullYear()}
      </footer>
    </div>
  );
}

/* ---------- utils ---------- */

// Преобразуем строку вида 'YYYY-MM-DDTHH:mm:ss' как локальное время устройства
function toLocalTimestamp(input) {
  if (!input) return Date.now();
  // если указан Z или +hh:mm — оставим как есть
  const hasTZ = /Z|[+-]\d{2}:?\d{2}$/.test(input);
  if (hasTZ) return new Date(input).getTime();
  const [date, time = "00:00:00"] = String(input).split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm, ss] = time.split(":").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0, 0);
  return dt.getTime();
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
