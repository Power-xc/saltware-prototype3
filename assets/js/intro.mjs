// 인트로 — 필름을 틀고, 끝나면(또는 건너뛰면) 점이 로고의 결정 넷으로 갈라져 한 바퀴 돈 뒤, 면이 걷히며
// 넷이 차례로 제목의 마침표로 날아든다.
//
// 필름은 design-resources/35-intro-film 이 굽는다. 마지막 장면은 지면 바탕색 위 가운데에 점 하나다 —
// 여기서 같은 자리 · 같은 크기의 DOM 점을 세워 그 점을 이어받는다. 크기는 판 높이의
// END_DOT 이다(edl.mjs 와 같은 값 — spec 시험이 둘을 대조한다).
//
// 끝맺음(사령관 2026-09-30 "기존의 마침표로 가는 게 더 좋았던 것 같은데 원형이 여러개 돌면서 마침표 기존처럼 +
// 히어로 섹션 만들어지는 과정처럼"). 앞 벌(674cc86)은 점이 원형 창으로 커지며 히어로를 열었다 — 그 창을 걷고
// 마침표 비행을 되살렸다. 두 박자다.
//   모임(GATHER_MS) 크림 면 위에서 점이 로고의 결정 넷으로 갈라져 벌어졌다 모이며 한 바퀴 돈다 — 끝에 로고의 네 점
//                   그대로 선다.
//   조립             면이 위에서부터 걷히고 히어로가 한 켜씩 선다(제목 구절 → 리드 → 층 띠 → 카드 여섯, CSS
//                   intro-done). 그사이 결정 넷이 작은 것부터 마침표로 날아들고, 가장 큰 점(필름의 점)이
//                   마지막에 앉는다 — 그 밑에서 제목의 마침표가 켜지며 둘이 겹쳐 바뀐다(.hero__dot dot-land).
//
// 소리: 브라우저는 누르기 전의 소리를 막는다. 소리부터 틀어 보고, 막히면 소리 없이 틀고
// "소리 켜기"를 세운다. 같은 사이트에서 이미 누른 적이 있으면 처음부터 소리가 난다.
// 막혔을 때는 첫 누름 · 첫 키가 넘기지 않고 소리를 켠다(사령관 2026-09-30 "소리 1차적으로 자동으로 켜지게"
// — 아래 "아무 데나 누르면 넘긴다"(09-24)보다 앞선다). 두 번째부터 넘긴다. Escape 는 늘 넘긴다.
//
// 나가는 문: 건너뛰기 · 다시 보지 않기(이 브라우저에서는 다음부터 안 튼다) · 아무 키 · 화면 아무 데나
// 누르기(사령관 2026-09-24 "다른 키 누르면 넘어가게", "화면 터치하거나 키보드 쳐도"). Tab 과 보조키만은
// 넘기지 않는다 — 키보드로 단추까지 가는 길이고, 단추에 초점이 있을 때의 Enter · Space 는 그 단추의
// 몫이다. 단추 줄 위를 누른 것도 넘기지 않는다 — "소리 켜기"가 필름을 끝내 버리면 안 된다.
// 누름은 pointerdown 으로 받는다: 폰에서 쓸어 올리는 손짓도 넘긴다. 가림막은 걷히는 동안에도 자리에
// 있으므로 뒤따르는 click 이 아래 지면의 링크에 떨어지지 않는다.
//
// 갇히지 않게: 필름이 FALLBACK_MS 안에 시작하지 못하면(느린 망 · 자동재생 금지) 곧장 넘긴다.
// 스크립트가 못 내려오면 가림막은 CSS 의 intro-gone 으로 같은 시각에 사라진다.

const FALLBACK_MS = 3600;
const GATHER_MS = 1150; // 결정 넷이 갈라져 한 바퀴 돌고 로고로 서는 시간 — 그다음 면이 걷힌다
const WIPE_MS = 660; // CSS intro-wipe 와 같은 값 — 면이 걷히는 시간
// 가장 큰 점이 날아 마침표에 겹쳐 스러지기까지. 닿는 것은 LAND 지점이고, 그때 CSS 의 마침표(.hero__dot 의
// dot-land 0.66s)가 밑에서 켜진다 — 둘이 겹쳐 바뀌어 점이 한 번도 꺼지지 않는다.
const FLIGHT_MS = 820;
const LAND = 0.8;
// 로고의 결정 넷 — public/brand/saltware-logo.svg 의 원(필름 bake.mjs readLogo 와 같은 원본). 첫째가 가장 큰
// 점이고 필름의 마지막 점이다. 둘레(cx · cy)는 네 점의 한가운데를 원점으로 옮겨 쓴다.
const LOGO_DOTS = [
  { cx: 13.69, cy: 49.61, r: 13.77 },
  { cx: 54.07, cy: 12.3, r: 11.68 },
  { cx: 54.08, cy: 49.61, r: 11.29 },
  { cx: 13.67, cy: 12.3, r: 8.18 },
];
// 면도 점도 다 끝난 뒤에 지운다. 먼저 지우면 점이 날다 만다.
const CLEAN_MS = Math.max(WIPE_MS, FLIGHT_MS) + 80;
const END_DOT = 0.026;
const PASS_KEYS = new Set(["Tab", "Shift", "Control", "Alt", "Meta", "CapsLock"]);

/** 필름이 화면에 깔린 상자(object-fit: cover)에서 판 높이가 몇 px 인지. */
function filmScale(film) {
  const r = film.getBoundingClientRect();
  const vw = film.videoWidth || 16;
  const vh = film.videoHeight || 9;
  return (vh * Math.max(r.width / vw, r.height / vh)) || r.height;
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * 필름의 마지막 점 자리에 결정 넷을 세운다(첫째가 필름의 점 그대로). 넷은 가운데에서 갈라져 벌어졌다가 로고 간격으로
 * 모이며 한 바퀴 돈다. 돌릴 수 없으면(움직임 줄이기 · 잴 수 없음) 점 하나만 두고 null.
 */
function gatherDots(veil, film) {
  const lead = veil.querySelector(".intro__dot");
  if (!lead || typeof lead.animate !== "function") return null;
  const d0 = END_DOT * filmScale(film);
  lead.style.setProperty("--intro-dot", `${d0.toFixed(1)}px`);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !d0) {
    lead.hidden = true;
    return null;
  }
  const unit = d0 / (2 * LOGO_DOTS[0].r);
  const mid = LOGO_DOTS.reduce((a, d) => [a[0] + d.cx / 4, a[1] + d.cy / 4], [0, 0]);
  const dots = LOGO_DOTS.map((d, k) => {
    const el = k === 0 ? lead : lead.cloneNode();
    if (k) {
      el.style.setProperty("--intro-dot", `${(2 * d.r * unit).toFixed(1)}px`);
      lead.after(el);
    }
    return { el, x: (d.cx - mid[0]) * unit, y: (d.cy - mid[1]) * unit };
  });
  // 한 바퀴를 조각으로 나눠 그린다 — 벌어짐(spread)은 가운데서 부풀었다가 로고 간격(1)으로 돌아온다.
  const STEPS = 24;
  for (const { el, x, y } of dots) {
    const frames = [];
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const out = Math.min(1, t / 0.28);
      const spread = (1 - (1 - out) ** 3) * (1 + 1.7 * Math.sin(Math.PI * Math.min(1, t / 0.9)));
      const a = easeInOut(t) * Math.PI * 2;
      const px = (x * Math.cos(a) - y * Math.sin(a)) * spread;
      const py = (x * Math.sin(a) + y * Math.cos(a)) * spread;
      frames.push({ translate: `${px.toFixed(1)}px ${py.toFixed(1)}px`, scale: el === lead ? 1 : Math.min(1, t / 0.2) });
    }
    el.animate(frames, { duration: GATHER_MS, easing: "linear", fill: "forwards" });
  }
  return dots;
}

/**
 * 마침표의 잉크(글자 "." 의 점)가 화면 어디에 몇 px 로 찍히는지. 글자 상자의 가운데는 점이 아니다 — 점은
 * 기준선 위에 앉는다(앞 벌은 상자 가운데로 날아 20px 위에 내려앉았다, 1440 실측). 캔버스가 잉크를 못 재면 상자 가운데.
 */
function periodInk(target) {
  const range = document.createRange();
  range.selectNodeContents(target);
  const box = range.getBoundingClientRect();
  const cs = getComputedStyle(target);
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = ctx.measureText(target.textContent);
  if (!box.width || !m.fontBoundingBoxAscent) return { x: box.left + box.width / 2, y: box.top + box.height / 2, d: box.height * 0.14 };
  const base = box.top + m.fontBoundingBoxAscent;
  return {
    x: box.left + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2,
    y: base - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2,
    d: m.actualBoundingBoxRight + m.actualBoundingBoxLeft,
  };
}

/**
 * 결정 넷을 제목 끝의 마침표로 날린다. 작은 것부터 먼저 떠나 먼저 스며들고, 가장 큰 점(필름의 점)이 마지막에
 * 마침표 크기로 줄어 앉는다. 목적지는 면이 걷히기 전에 잰다 — 히어로가 아직 등장 전(제자리 · 제 크기)이라 끝 자리가
 * 곧 잰 자리다.
 */
function flyDots(dots, target) {
  const to = target ? periodInk(target) : null;
  // 제목이 아직 자리를 안 잡았으면 날리지 않는다 — 엉뚱한 곳으로 가느니 그냥 사라지는 게 낫다.
  if (!to?.d) {
    for (const { el } of dots) el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: "forwards" });
    return;
  }
  dots.forEach(({ el, x, y }, k) => {
    const from = el.getBoundingClientRect();
    if (!from.width) return;
    const dx = to.x - (from.left + from.width / 2) + x;
    const dy = to.y - (from.top + from.height / 2) + y;
    const s = Math.min(1, to.d / from.width);
    const lead = k === 0;
    const order = dots.length - 1 - k; // 작은 점(뒤쪽)부터 떠난다
    // 이징은 비행 구간에만 건다 — 전체에 걸면 LAND 지점이 앞당겨져 CSS 마침표가 켜지기 전에 점이 흐려진다.
    el.animate(
      [
        { translate: `${x}px ${y}px`, scale: 1, opacity: 1, easing: "cubic-bezier(0.62, 0, 0.2, 1)" },
        { translate: `${dx}px ${dy}px`, scale: lead ? s : s * 0.7, opacity: 1, offset: lead ? LAND : 0.82 },
        { translate: `${dx}px ${dy}px`, scale: lead ? s : 0, opacity: 0 },
      ],
      {
        duration: lead ? FLIGHT_MS : FLIGHT_MS - 180 - order * 30,
        delay: lead ? 0 : order * 70,
        fill: "both",
      },
    );
  });
}

/**
 * 소리는 켜고 시작한다(사령관 2026-09-30 "인트로는 소리 1차적으로 자동으로 켜지게"). 브라우저가 첫 방문의 소리
 * 자동재생을 막으면 무음으로 틀고 소리를 "붙잡아" 둔다 — 그동안 화면을 처음 누르거나 키를 치면 건너뛰지 않고
 * 소리가 켜진다(단추가 숨 쉬며 알린다). 소리를 켜는 건 사용자 동작 안에서만 되므로, 터치는 pointerdown 이 아니라
 * click 에서 켠다(터치의 pointerdown 은 브라우저가 동작으로 치지 않는다). Escape 와 단추 셋은 늘 제 일을 한다.
 */
function soundControl(veil, film) {
  const btn = veil.querySelector("[data-intro-sound]");
  const sync = () => {
    btn.textContent = film.muted ? btn.dataset.off : btn.dataset.on;
    btn.setAttribute("aria-pressed", String(!film.muted));
  };
  const hold = (on) => veil.classList.toggle("intro--held", on);
  const set = (muted) => {
    hold(false);
    film.muted = muted;
    if (film.paused) film.play().catch(() => {});
    sync();
  };
  btn.addEventListener("click", () => set(!film.muted));
  return { sync, hold, held: () => veil.classList.contains("intro--held"), unmute: () => set(false) };
}

export function initIntro() {
  const veil = document.querySelector("[data-intro]");
  const root = document.documentElement;
  // 부팅 스크립트가 "틀지 않기로" 정했으면 가림막은 애초에 display:none 이다.
  if (!veil || !root.classList.contains("js-intro")) return;
  const film = veil.querySelector("[data-intro-film]");
  // 모듈이 대비책보다 늦게 왔다 — 가림막은 이미 사라졌다. 보이지 않는 필름이 소리를 내게 두지 않는다.
  if (getComputedStyle(veil).visibility === "hidden") {
    veil.remove();
    return;
  }

  const sound = soundControl(veil, film);
  const onKey = (e) => {
    if (PASS_KEYS.has(e.key) || e.repeat) return;
    if (e.target.closest?.(".intro__bar") && (e.key === "Enter" || e.key === " ")) return;
    if (sound.held() && e.key !== "Escape") return sound.unmute();
    finish();
  };
  const onPress = (e) => {
    if (e.button !== 0 || e.target.closest(".intro__bar")) return;
    if (sound.held()) return; // 이 누름은 소리를 켠다 — 뒤따르는 click 에서(onTap)
    finish();
  };
  const onTap = (e) => {
    if (sound.held() && !e.target.closest(".intro__bar")) sound.unmute();
  };
  // 두 박자 — 모임(크림 면 위 결정 넷) 뒤에 조립(면 걷힘 · 히어로 등장 · 마침표 비행). 돌릴 수 없으면 곧장 조립.
  function finish() {
    if (veil.classList.contains("intro--gather")) return;
    veil.classList.add("intro--gather");
    film.pause();
    removeEventListener("keydown", onKey);
    veil.removeEventListener("pointerdown", onPress);
    veil.removeEventListener("click", onTap);
    sound.hold(false);
    const dots = gatherDots(veil, film);
    const build = () => {
      if (dots) flyDots(dots, document.querySelector(".hero__dot"));
      root.classList.add("intro-done");
      veil.classList.add("intro--out");
      // js-intro 는 떼지 않는다 — 떼면 intro-done 규칙이 풀려 아직 도는 카드 · 마침표 등장이 제 규칙으로 처음부터 다시 돈다
      // (마침표가 한 번 꺼졌다 켜졌다, 1440 실측).
      setTimeout(() => veil.remove(), CLEAN_MS);
    };
    if (dots) setTimeout(build, GATHER_MS);
    else build();
  }

  // 여기서부터는 스크립트가 시계를 쥔다 — CSS 의 대비책(intro-gone)을 멈춘다.
  veil.classList.add("intro--film");
  const watchdog = setTimeout(finish, FALLBACK_MS);
  film.addEventListener("playing", () => clearTimeout(watchdog), { once: true });
  film.addEventListener("ended", finish);
  veil.querySelector("[data-intro-skip]").addEventListener("click", finish);
  veil.querySelector("[data-intro-never]").addEventListener("click", (e) => {
    try {
      localStorage.setItem(e.currentTarget.dataset.introNever, "off");
    } catch {}
    finish();
  });
  addEventListener("keydown", onKey);
  veil.addEventListener("pointerdown", onPress);
  veil.addEventListener("click", onTap);

  film.muted = false;
  film
    .play()
    .catch(() => {
      film.muted = true;
      sound.hold(true);
      return film.play();
    })
    .then(sound.sync)
    .catch(finish);
}
