// src/App.jsx
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import confetti from "canvas-confetti";
import { ACHIEVEMENTS } from './achievements';



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

// Даты фиксированные в коде (по твоей просьбе)
// Старт от 28 ноября 2025
const SERVICE_START = "2025-11-28T00:00:00";
const DEMOBIL_DATE = "2026-10-01T00:00:00";

/* ========= APP ========= */
export default function App() {
  const tz =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Riga";

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

  // макан tap pop
  const [popped, setPopped] = useState(false);

  // PNG-надписи (система очереди с лимитом)
  const [tapCount, setTapCount] = useState(0);
  const [activePopups, setActivePopups] = useState([]);
  const [popupQueue, setPopupQueue] = useState([]);
  const popupLimit = 3; // Максимум одновременно активных надписей
  const popupConfigs = [
    { id: 1, src: "/jeb1.png", className: "popup-left", trigger: 3 },
    { id: 2, src: "/jeb2.png", className: "popup-right", trigger: 7 },
    { id: 3, src: "/jeb3.png", className: "popup-top", trigger: 10 },
    { id: 4, src: "/jeb1.png", className: "popup-left", trigger: 15 },
    { id: 5, src: "/jeb2.png", className: "popup-right", trigger: 20 },
    { id: 6, src: "/jeb3.png", className: "popup-top", trigger: 25 },
  ];

  const confettiDoneRef = useRef(false);
  
  // Новое состояние для уведомлений о достижениях
  const [achievementNotification, setAchievementNotification] = useState(false);
  const [lastAchievementDate, setLastAchievementDate] = useState(null);

  // Функция для обработки очереди
  const processQueue = () => {
    if (popupQueue.length > 0 && activePopups.length < popupLimit) {
      const nextPopup = popupQueue[0];
      const newPopup = {
        ...nextPopup,
        instanceId: Date.now() + Math.random()
      };
      
      setActivePopups(prev => [...prev, newPopup]);
      setPopupQueue(prev => prev.slice(1));
      
      // Автоудаление через 4 секунды (вместо 2.4)
      setTimeout(() => {
        setActivePopups(prev => prev.filter(p => p.instanceId !== newPopup.instanceId));
        processQueue(); // Рекурсивно обрабатываем очередь
      }, 4000);
    }
  };

  /* — системные эффекты — */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const twa = window.Telegram?.WebApp;
    try {
      twa?.expand();
      twa?.ready();
      twa?.enableClosingConfirmation();
    } catch {}
    const t = setTimeout(() => setEntered(true), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("vibrateEnabled");
    if (saved !== null) setVibrateEnabled(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("vibrateEnabled", vibrateEnabled ? "1" : "0");
  }, [vibrateEnabled]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      if (y > lastScrollY.current + 6) setBurgerHidden(true);
      else if (y < lastScrollY.current - 6) setBurgerHidden(false);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Проверка достижений при загрузке и ежедневно
  useEffect(() => {
    checkAchievements();
    
    // Проверяем каждые 10 минут на случай, если пользователь оставит приложение открытым
    const interval = setInterval(checkAchievements, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [now]);

  function checkAchievements() {
    const today = new Date().toDateString();
    const hasUnlockedToday = ACHIEVEMENTS.some(achievement => 
      achievement.unlocked && new Date(achievement.date).toDateString() === today
    );

    if (hasUnlockedToday && lastAchievementDate !== today) {
      setAchievementNotification(true);
      setLastAchievementDate(today);
      
      // Автоматически скрываем уведомление через 5 секунд
      setTimeout(() => {
        setAchievementNotification(false);
      }, 5000);
    }
  }

  /* — время службы — */
  const startTs = useMemo(() => toLocalTimestamp(SERVICE_START), []);
  const endTs = useMemo(() => toLocalTimestamp(DEMOBIL_DATE), []);
  const totalMs = Math.max(0, endTs - startTs);
  const leftMs = Math.max(0, endTs - now);
  const passedMs = Math.max(0, now - startTs);
  const pct =
    totalMs > 0 ? Math.min(100, Math.max(0, (passedMs / totalMs) * 100)) : 0;
  const leftParts = msParts(leftMs);
  const isOver = leftMs <= 0 && totalMs > 0;

  // Новый расчет: отсчет до начала службы
  const timeUntilStartMs = Math.max(0, startTs - now);
  const timeUntilStartParts = msParts(timeUntilStartMs);
  const isServiceStarted = timeUntilStartMs <= 0;

  /* — анимации — */
  function burst(p = 0.5) {
    const n = Math.floor(100 * p);
    confetti({
      particleCount: n,
      spread: 65,
      startVelocity: 38,
      origin: { x: 0.2, y: 0.4 },
    });
    confetti({
      particleCount: n,
      spread: 65,
      startVelocity: 38,
      origin: { x: 0.8, y: 0.4 },
    });
  }

  function celebrateMilestone() {
    // Сложный конфетти для особых событий
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.3 },
      colors: ['#10b981', '#059669', '#047857', '#ec4899', '#8b5cf6']
    });
    
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.4 },
        colors: ['#10b981', '#059669']
      });
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.4 },
        colors: ['#10b981', '#059669']
      });
    }, 250);
  }

  function celebrateAchievement() {
    // Особый конфетти для достижений
    confetti({
      particleCount: 200,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff6b6b', '#ffa726', '#ffd93d', '#6bcf7f', '#4ecdc4']
    });
    
    setTimeout(() => {
      confetti({
        particleCount: 150,
        angle: 45,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: ['#ff6b6b', '#ffa726']
      });
      confetti({
        particleCount: 150,
        angle: 135,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: ['#ff6b6b', '#ffa726']
      });
    }, 300);
  }

  // Отслеживание вех службы
  useEffect(() => {
    if (isOver && !confettiDoneRef.current) {
      confettiDoneRef.current = true;
      burst(0.25);
      setTimeout(() => burst(0.5), 200);
      setTimeout(() => burst(0.75), 400);
      setTimeout(
        () =>
          confetti({
            particleCount: 250,
            spread: 85,
            startVelocity: 45,
            scalar: 1.1,
            ticks: 240,
            origin: { y: 0.25 },
          }),
        900
      );
      try {
        navigator.vibrate?.(150);
      } catch {}
    }
    if (!isOver) confettiDoneRef.current = false;
  }, [isOver]);

  useEffect(() => {
    // 50% службы
    if (isServiceStarted && pct >= 50 && pct < 51) {
      celebrateMilestone();
    }
    // 75% службы  
    if (isServiceStarted && pct >= 75 && pct < 76) {
      celebrateMilestone();
    }
    // 90% службы
    if (isServiceStarted && pct >= 90 && pct < 91) {
      celebrateMilestone();
    }
  }, [pct, isServiceStarted]);

  // Автоматическое празднование достижений при уведомлении
  useEffect(() => {
    if (achievementNotification) {
      celebrateAchievement();
    }
  }, [achievementNotification]);

  /* — действия — */
  function onMakanTap() {
    setPopped(true);
    setTimeout(() => setPopped(false), 180);

    if (vibrateEnabled) {
      try {
        navigator.vibrate?.(30);
      } catch {}
      try {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
      } catch {}
    }

    setTapCount((prev) => {
      const newCount = prev + 1;
      
      // Проверяем, нужно ли показать новую надпись
      const nextPopup = popupConfigs.find(popup => popup.trigger === newCount);
      
      if (nextPopup) {
        // Добавляем в очередь если есть место, иначе ждем
        if (activePopups.length < popupLimit) {
          const newPopup = {
            ...nextPopup,
            instanceId: Date.now() + Math.random()
          };
          setActivePopups(prev => [...prev, newPopup]);
          
          // Автоудаление через 4 секунды
          setTimeout(() => {
            setActivePopups(prev => prev.filter(p => p.instanceId !== newPopup.instanceId));
            // Проверяем очередь после удаления
            processQueue();
          }, 4000);
        } else {
          // Добавляем в очередь ожидания
          setPopupQueue(prev => [...prev, nextPopup]);
        }
      }
      
      // Если все комбинации пройдены, начинаем круг заново
      const maxTrigger = Math.max(...popupConfigs.map(p => p.trigger));
      if (newCount > maxTrigger) {
        return 1; // Начинаем заново
      }
      
      return newCount;
    });
  }

  function openGroup() {
    const url = "https://t.me/zdem_makana";
    const twa = window.Telegram?.WebApp;
    if (twa?.openTelegramLink) return twa.openTelegramLink(url);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function share() {
    let text;
    if (isOver) {
      text = `🎉 ${NICK} ДЕМБЕЛЬНУЛСЯ!\n\nСлужба завершена.`;
    } else if (isServiceStarted) {
      text = `⏳ До дембеля ${NICK}: ${formatParts(leftParts)}.\nПрисоединяйся к отсчёту!`;
    } else {
      text = `⏳ До начала службы ${NICK}: ${formatParts(timeUntilStartParts)}.\nПрисоединяйся к отсчёту!`;
    }
    
    const url = window.location.href.split("?")[0];
    const twa = window.Telegram?.WebApp;

    if (twa?.shareURL) return twa.shareURL(url);
    if (twa?.shareText) return twa.shareText(`${text}\n${url}`);
    if (navigator.share)
      return navigator
        .share({ title: `Дембель ${NICK}`, text, url })
        .catch(() => {});
    navigator.clipboard?.writeText(`${text}\n${url}`);
    alert("Ссылка скопирована ✅");
  }

  function toggleVibration() {
    setVibrateEnabled((v) => !v);
    try {
      navigator.vibrate?.(10);
    } catch {}
    setMenuOpen(false);
  }

  function switchTab(next) {
    if (next === tab) return;
    const order = ["timer", "id", "medals"];
    setBlobDir(order.indexOf(next) > order.indexOf(tab) ? "right" : "left");
    setTab(next);
    setMenuOpen(false);
    
    // Если переходим на вкладку достижений и есть уведомление, сбрасываем его
    if (next === "medals" && achievementNotification) {
      setAchievementNotification(false);
    }
  }

  /* — кольцо — */
  const size = 360;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;

  const SEGMENTS = 12;
  const segmentLen = C / SEGMENTS;
  const gapLen = Math.max(4, segmentLen * 0.08);
  const dashPattern = `${segmentLen - gapLen} ${gapLen}`;

  // Прогресс для кольца (только когда служба началась)
  const progressPct = isServiceStarted ? pct : 0;
  const progressDashArray = C;
  const progressDashOffset = C * (1 - progressPct / 100);
  const animatedProgressOffset = entered ? progressDashOffset : C;

  const clipStyle = {
    clipPath: `circle(${r}px at ${size / 2}px ${size / 2}px)`,
  };

  /* — рендер — */
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0f1514] to-[#0b1110] text-zinc-50">
      {/* Контент */}
      <main className="mx-auto max-w-6xl p-4 pb-[calc(100px+env(safe-area-inset-bottom,0px))]">
        {tab === "timer" && (
          <section className="relative flex flex-col items-center justify-center rounded-3xl bg-zinc-900/60 backdrop-blur p-5 md:p-6 shadow-xl overflow-hidden section-transition">
            {/* Параллакс слои */}
            <div 
              className="absolute inset-0 -z-20 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2310b981' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                transform: 'translateY(0px)',
                animation: 'float 20s ease-in-out infinite'
              }}
            />
            
            <div 
              className="absolute inset-0 -z-10 opacity-30"
              style={{
                background: "radial-gradient(30rem 30rem at 50% 20%, rgba(16,185,129,0.18), rgba(0,0,0,0))",
                transform: 'translateY(0px)',
                animation: 'pulseGlow 8s ease-in-out infinite'
              }}
            />

            <div
              aria-hidden
              className={`absolute inset-0 -z-10 ${entered ? "glow-enter" : ""}`}
              style={{
                background: "radial-gradient(30rem 30rem at 50% 20%, rgba(16,185,129,0.18), rgba(0,0,0,0))",
              }}
            />

            <div
              className={`relative flex items-center justify-center ${
                entered ? "appear-scale" : ""
              }`}
              style={{ width: size, height: size }}
            >
              {/* Кольцо */}
              <svg
                className="absolute inset-0 z-0"
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
              >
                {/* сегменты */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke="rgba(255,255,255,0.13)"
                  strokeWidth={stroke}
                  strokeLinecap="butt"
                  strokeDasharray={dashPattern}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
                {/* прогресс (только когда служба началась) */}
                {isServiceStarted && (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.95)"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={progressDashArray}
                    strokeDashoffset={animatedProgressOffset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: "stroke-dashoffset 900ms ease" }}
                  />
                )}
              </svg>

              {/* PNG надписи, клипнутые кругом */}
              <div
                className="absolute inset-0 z-[5] pointer-events-none"
                style={clipStyle}
              >
                {activePopups.map((popup) => (
                  <img
                    key={popup.instanceId}
                    src={popup.src}
                    alt={`popup-${popup.id}`}
                    className={`absolute popup-item ${popup.className}`}
                  />
                ))}
              </div>

              {/* Индикатор очереди надписей */}
              {popupQueue.length > 0 && (
                <div className="queue-indicator">
                  +{popupQueue.length} в очереди
                </div>
              )}

              {/* Макан */}
              <img
                src="/makan.png"
                alt={NICK}
                draggable="false"
                onClick={onMakanTap}
                className={[
                  "cursor-pointer select-none",
                  "drop-shadow-[0_18px_50px_rgba(0,0,0,0.65)]",
                  "transition-transform duration-200 ease-out",
                  "animate-wobble",
                  popped ? "scale-[1.10]" : "scale-100",
                  "w-[74%] md:w-[78%] makan-layer makan-shadow",
                ].join(" ")}
              />
            </div>

            {/* Текст и прогресс */}
            <div className={`mt-2 text-center ${entered ? "appear-fade-up" : ""}`}>
              {isOver ? (
                <div className="text-2xl md:text-4xl font-extrabold stagger-item">
                  🎉 {NICK} ДЕМБЕЛЬНУЛСЯ!
                </div>
              ) : isServiceStarted ? (
                <>
                  <h1 className="text-lg md:text-xl font-semibold text-zinc-300 stagger-item">
                    До дембеля {NICK}
                  </h1>
                  <div className="text-2xl md:text-4xl font-extrabold tracking-tight mt-1 stagger-item">
                    {formatParts(leftParts)}
                  </div>
                  <div className="text-xs md:text-sm text-zinc-400 mt-1 stagger-item">
                    Таймзона: {tz}
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-lg md:text-xl font-semibold text-zinc-300 stagger-item">
                    До начала службы {NICK}
                  </h1>
                  <div className="text-2xl md:text-4xl font-extrabold tracking-tight mt-1 stagger-item">
                    {formatParts(timeUntilStartParts)}
                  </div>
                  <div className="text-xs md:text-sm text-zinc-400 mt-1 stagger-item">
                    Таймзона: {tz}
                  </div>
                </>
              )}
            </div>

            {/* Прогресс-бар (только когда служба началась) */}
            {isServiceStarted && !isOver && (
              <>
                <div className="w-full max-w-xl h-3 bg-zinc-800 rounded-full overflow-hidden mt-3 stagger-item">
                  <div className="h-full bg-white/80 transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-zinc-300 mt-1 stagger-item">
                  Выполнено службы: {pct.toFixed(2)}%
                </div>
              </>
            )}

            <div className="flex flex-col items-center gap-3 mt-4">
              <button
                onClick={share}
                className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-medium hover-lift transition-all duration-300 active:scale-95 shadow-lg hover:shadow-xl stagger-item"
              >
                Поделиться
              </button>
              <button
                onClick={openGroup}
                className="px-4 py-3 rounded-2xl bg-zinc-700 hover:bg-zinc-600 font-medium hover-lift transition-all duration-300 active:scale-95 shadow-lg hover:shadow-xl stagger-item"
              >
                Ждём вместе
              </button>
            </div>
          </section>
        )}

        {tab === "id" && (
          <section className="rounded-3xl bg-[rgba(24,24,27,0.85)] shadow-xl p-4 md:p-6 border border-zinc-800/60 max-w-2xl mx-auto section-transition">
            <SoldierCard
              profile={PROFILE}
              service={{ start: SERVICE_START, end: DEMOBIL_DATE }}
            />
          </section>
        )}

        {tab === "medals" && (
          <AchievementsSection 
            highlight={achievementNotification}
            onHighlightClick={() => setAchievementNotification(false)}
          />
        )}
      </main>

      {/* Бургер-меню в стиле островка */}
      <div
        className={`fixed left-4 bottom-[calc(25px+env(safe-area-inset-bottom,0px))] z-[60] transition-all duration-300 ${
          burgerHidden ? "translate-y-14 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="w-12 h-12 bg-[rgba(20,20,20,.85)] backdrop-blur-xl rounded-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,.35)] flex flex-col items-center justify-center gap-1.5 hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="menu"
        >
          <div className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
          <div className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0' : 'opacity-100'}`}></div>
          <div className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
        </button>

        {menuOpen && (
          <div className="absolute left-0 bottom-14 mb-2 w-48 bg-[rgba(20,20,20,.95)] backdrop-blur-xl rounded-2xl border border-white/15 p-3 shadow-[0_8px_32px_rgba(0,0,0,.35)] section-transition">
            <nav className="flex flex-col space-y-2">
              <button
                onClick={toggleVibration}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-white text-left hover-lift active:scale-95"
              >
                {vibrateEnabled ? <VibrationOnIcon /> : <VibrationOffIcon />}
                <span className="text-sm">
                  {vibrateEnabled ? "Выключить вибрацию" : "Включить вибрацию"}
                </span>
              </button>
              <a href="#" className="text-white hover:text-emerald-300 transition-colors text-sm font-medium py-2 px-3 rounded-lg hover:bg-white/10 hover-lift active:scale-95">
                О проекте
              </a>
              <a href="#" className="text-white hover:text-emerald-300 transition-colors text-sm font-medium py-2 px-3 rounded-lg hover:bg-white/10 hover-lift active:scale-95">
                Помощь
              </a>
            </nav>
          </div>
        )}
      </div>

      {/* Островок — компактный, только иконки */}
      <BottomIsland 
        tab={tab} 
        onChange={switchTab} 
        dir={blobDir}
        achievementNotification={achievementNotification}
      />
    </div>
  );
}

/* ========= ACHIEVEMENTS SECTION ========= */
function AchievementsSection({ highlight, onHighlightClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef(null);

  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.unlocked);

  const scrollToIndex = (index) => {
    if (scrollContainerRef.current) {
      const scrollWidth = scrollContainerRef.current.scrollWidth;
      const itemWidth = scrollWidth / unlockedAchievements.length;
      scrollContainerRef.current.scrollTo({
        left: index * itemWidth,
        behavior: 'smooth'
      });
    }
    setCurrentIndex(index);
  };

  const handleScroll = (e) => {
    const container = e.target;
    const scrollWidth = container.scrollWidth;
    const itemWidth = scrollWidth / unlockedAchievements.length;
    const newIndex = Math.round(container.scrollLeft / itemWidth);
    setCurrentIndex(newIndex);
  };

  return (
    <section className={`rounded-3xl bg-zinc-900/60 backdrop-blur p-6 shadow-xl border max-w-2xl mx-auto section-transition relative overflow-hidden ${
      highlight 
        ? 'border-emerald-500/60 bg-emerald-500/10 shadow-2xl shadow-emerald-500/20' 
        : 'border-zinc-800/60'
    } transition-all duration-1000`}>
      
      {/* Анимация подсветки при новом достижении */}
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent animate-pulse-slow pointer-events-none" />
      )}
      
      <div className="text-xl font-semibold mb-6 text-center stagger-item relative">
        Достижения
        {highlight && (
          <div 
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"
            onClick={onHighlightClick}
          />
        )}
      </div>
      
      {/* Индикатор прогресса */}
      <div className="flex justify-center mb-6 stagger-item">
        <div className="flex space-x-1">
          {unlockedAchievements.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-emerald-400 w-6' 
                  : 'bg-zinc-600 hover:bg-zinc-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Контейнер для скролла */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide space-x-4 pb-4 -mx-2 px-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {unlockedAchievements.map((achievement, index) => (
          <div 
            key={achievement.id}
            className="flex-shrink-0 w-64 snap-center stagger-item"
          >
            <div className={`bg-zinc-800/60 rounded-2xl p-6 border text-center hover-lift transition-all duration-300 ${
              highlight && index === 0 
                ? 'border-emerald-400 shadow-lg shadow-emerald-400/20' 
                : 'border-emerald-500/30'
            }`}>
              {/* Иконка достижения */}
              <div className="text-4xl mb-4">{achievement.icon}</div>
              
              {/* Название */}
              <h3 className="text-lg font-semibold text-white mb-2">
                {achievement.title}
              </h3>
              
              {/* Описание */}
              <p className="text-zinc-300 text-sm mb-4">
                {achievement.description}
              </p>
              
              {/* Дата */}
              <div className="text-emerald-400 text-xs font-medium">
                {new Date(achievement.date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        ))}
        
        {/* Блок следующих событий */}
        <div className="flex-shrink-0 w-64 snap-center stagger-item">
          <div className="bg-zinc-800/30 rounded-2xl p-6 border border-zinc-600/50 text-center hover-lift transition-all duration-300">
            <div className="text-4xl mb-4 opacity-50">🔮</div>
            <h3 className="text-lg font-semibold text-zinc-500 mb-2">
              Следующие события
            </h3>
            <p className="text-zinc-500 text-sm mb-4">
              Следите за обновлениями
            </p>
            <div className="text-zinc-600 text-xs font-medium">
              Скоро появятся
            </div>
          </div>
        </div>
      </div>

      {/* Подсказка для скролла */}
      <div className="text-center mt-4 stagger-item">
        <p className="text-zinc-400 text-sm">
          Листайте в сторону для просмотра достижений
        </p>
      </div>
    </section>
  );
}

/* ========= ID CARD ========= */
function SoldierCard({ profile, service }) {
  const start = shortDate(service.start);
  const end = shortDate(service.end);

  // Поля с категорией здоровья на втором месте
  const fields = [
    ["Реальное имя", profile.realName],
    ["Категория годности", profile.fitnessCategory, true], // true - специальная анимация
    ["Псевдоним", profile.nickname],
    ["Дата рождения", formatBirth(profile.birth.date)],
    ["Место рождения", profile.birth.place],
    ["Страна", profile.country],
    ["Профессия", profile.profession],
    ["Жанры", profile.genres.join(", ")],
    ["Псевдонимы", profile.aliases.join(", ")],
    ["Место службы", profile.assignment],
    ["Дата призыва", start],
    ["Дембель", end],
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 stagger-item">
        <div className="h-12 w-12 rounded-full bg-emerald-600/25 border border-emerald-500/40 grid place-items-center hover-lift transition-all duration-300">
          <span className="text-emerald-300 font-semibold">ЖМ</span>
        </div>
        <div>
          <div className="uppercase tracking-wider text-xs text-emerald-300/90">
            личное дело
          </div>
          <div className="text-lg font-bold leading-tight -mt-0.5">
            {profile.nickname}
          </div>
          <div className="text-[11px] text-zinc-400">{profile.realName}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {fields.map(([k, v, isSpecial], index) => (
          <div
            key={k}
            className={`flex items-center justify-between rounded-xl bg-zinc-900/60 border border-zinc-800 px-3 py-2 stagger-item hover-lift transition-all duration-300 ${
              isSpecial ? 'category-special' : ''
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <span className="text-xs text-zinc-400">{k}</span>
            <span className={`text-sm font-medium text-right ${
              isSpecial 
                ? 'text-emerald-300 category-letter animate-category-landing' 
                : 'text-zinc-200'
            }`}>
              {v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========= ОСТРОВОК — только иконки ========= */
function BottomIsland({ tab, onChange, dir, achievementNotification }) {
  const contRef = useRef(null);
  const b1 = useRef(null),
    b2 = useRef(null),
    b3 = useRef(null);

  // диаметр пузырька/капли и самих кнопок
  const D = 50;

  const [bubble, setBubble] = useState({ x: 0, w: D });
  const [blob, setBlob] = useState({ x: 0, w: D });
  const [mounted, setMounted] = useState(false);

  const currentBtn = (name) => (name === "timer" ? b1 : name === "id" ? b2 : b3);

  const centerOf = (btn) => {
    const cont = contRef.current;
    if (!cont || !btn?.current) return { x: 0, w: D };
    const c = cont.getBoundingClientRect();
    const b = btn.current.getBoundingClientRect();
    return { x: b.left - c.left + b.width / 2, w: b.width };
  };

  useLayoutEffect(() => {
    setMounted(true);
    const recalc = () => {
      const { x, w } = centerOf(currentBtn(tab));
      const size = Math.max(46, Math.min(D, w));
      setBubble({ x, w: size });
      setBlob({ x, w: size });
    };

    const ro = new ResizeObserver(recalc);
    if (contRef.current) ro.observe(contRef.current);

    setTimeout(recalc, 0);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const { x, w } = centerOf(currentBtn(tab));
    const size = Math.max(46, Math.min(D, w));
    setBubble({ x, w: size });
    setBlob({ x, w: size });
  }, [tab]);

  return (
    <nav className="fixed left-0 right-0 bottom-[calc(16px+env(safe-area-inset-bottom,0px))] z-[55] flex justify-end px-4 pointer-events-none">
      <div
        ref={contRef}
        className="pointer-events-auto rounded-[28px] bg-[rgba(20,20,20,.85)] border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,.35)] backdrop-blur-xl px-3 section-transition"
        style={{ width: "min(380px, 75vw)", height: 62 }}
      >
        {/* Пузырёк над активной иконкой */}
        <div
          className={`ui-bubble ${mounted ? "bubble-mounted" : ""}`}
          style={{ "--x": `${bubble.x}px`, "--w": `${bubble.w}px` }}
        >
          <div className="ui-bubble-core" />
        </div>

        {/* Капля под иконками */}
        <div
          className={`ui-blob ${dir === "right" ? "to-right" : "to-left"} ${
            mounted ? "blob-mounted" : ""
          }`}
          style={{ "--x": `${blob.x}px`, "--w": `${blob.w}px` }}
        >
          <div className="ui-blob-core" />
        </div>

        {/* Кнопки — без лишних эффектов, всегда видны */}
        <div className="ui-row" style={{ height: 62 }}>
          <button
            ref={b1}
            className={`ui-btn ${tab === "timer" ? "active" : ""} transition-all duration-300 hover:scale-110 active:scale-95`}
            aria-label="Timer"
            onClick={() => onChange("timer")}
            style={{ "--d": `${D}px` }}
          >
            <HelmetIcon />
          </button>

          <button
            ref={b2}
            className={`ui-btn ${tab === "id" ? "active" : ""} transition-all duration-300 hover:scale-110 active:scale-95`}
            aria-label="ID"
            onClick={() => onChange("id")}
            style={{ "--d": `${D}px` }}
          >
            <IdCardIcon />
          </button>

          <button
            ref={b3}
            className={`ui-btn ${tab === "medals" ? "active" : ""} transition-all duration-300 hover:scale-110 active:scale-95 relative`}
            aria-label="Medal"
            onClick={() => onChange("medals")}
            style={{ "--d": `${D}px` }}
          >
            <MedalIcon />
            {achievementNotification && (
              <>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ========= УТИЛИТЫ ========= */
function formatBirth(yyyy_mm_dd) {
  const d = new Date(yyyy_mm_dd + "T00:00:00");
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function shortDate(iso) {
  const ts = toLocalTimestamp(iso);
  const d = new Date(ts);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
function toLocalTimestamp(input) {
  if (!input) return Date.now();
  const hasTZ = /Z|[+-]\d{2}:?\d{2}$/.test(input);
  if (hasTZ) return new Date(input).getTime();
  const [date, time = "00:00:00"] = String(input).split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm, ss] = time.split(":").map(Number);
  return new Date(
    y,
    (m || 1) - 1,
    d || 1,
    hh || 0,
    mm || 0,
    ss || 0,
    0
  ).getTime();
}
function msParts(ms) {
  let s = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(s / 86400);
  s -= days * 86400;
  const hours = Math.floor(s / 3600);
  s -= hours * 3600;
  const minutes = Math.floor(s / 60);
  s -= minutes * 60;
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

/* ========= SVG ICONS ========= */
function BurgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function VibrationOnIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect
        x="7"
        y="3"
        width="10"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M2 8l2 2-2 2 2 2-2 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 8l-2 2 2 2-2 2 2 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function VibrationOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect
        x="7"
        y="3"
        width="10"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M2 8l2 2-2 2 2 2-2 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".35"
      />
      <path
        d="M22 8l-2 2 2 2-2 2 2 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".35"
      />
      <path
        d="M5 5l14 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function HelmetIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 13a9 9 0 1118 0v4H3v-4z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M12 4v5h9" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IdCardIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="9" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M14 10h5M14 13h5M14 16h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function MedalIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="14" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M7 3l5 6 5-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}