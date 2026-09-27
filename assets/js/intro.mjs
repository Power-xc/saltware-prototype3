// 인트로 — 필름을 틀고, 끝나면(또는 건너뛰면) 면을 걷으며 점을 제목의 마침표로 날린다.
//
// 필름은 design-resources/35-intro-film 이 굽는다. 마지막 장면은 지면 바탕색 위 가운데에 점 하나다 —
// 여기서 같은 자리 · 같은 크기의 DOM 점을 세워 그 점을 이어받는다. 크기는 판 높이의
// END_DOT 이다(edl.mjs 와 같은 값 — spec 시험이 둘을 대조한다).
//
// 소리: 브라우저는 누르기 전의 소리를 막는다. 소리부터 틀어 보고, 막히면 소리 없이 틀고
// "소리 켜기"를 세운다. 같은 사이트에서 이미 누른 적이 있으면 처음부터 소리가 난다.
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
const WIPE_MS = 660; // CSS intro-wipe 와 같은 값 — 면이 걷히는 시간
const FLIGHT_MS = 820; // 점이 제목의 마침표에 닿는 시간
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

/** 필름의 마지막 점 자리에 DOM 점을 세우고 제목 끝의 마침표로 날린다. 둘은 같은 주황이다. */
function flyDot(veil, film) {
  const dot = veil.querySelector(".intro__dot");
  const target = document.querySelector(".hero__dot");
  if (!dot || !target || typeof dot.animate !== "function") return;
  dot.style.setProperty("--intro-dot", `${(END_DOT * filmScale(film)).toFixed(1)}px`);
  const from = dot.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  // 제목이 아직 자리를 안 잡았으면 날리지 않는다 — 엉뚱한 곳으로 가느니 그냥 사라지는 게 낫다.
  if (!to.width || !from.width) return;
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  // 목적지는 마침표 글자 상자다 — 점의 지름은 그 줄 높이의 7분의 1쯤이다.
  const s = Math.min(1, (to.height * 0.14) / from.width);
  dot.animate(
    [
      { translate: "0 0", scale: 1, opacity: 1 },
      { translate: `${dx}px ${dy}px`, scale: s, opacity: 1, offset: 0.88 },
      { translate: `${dx}px ${dy}px`, scale: s, opacity: 0 },
    ],
    { duration: FLIGHT_MS, easing: "cubic-bezier(0.62, 0, 0.2, 1)", fill: "forwards" },
  );
}

function soundButton(veil, film) {
  const btn = veil.querySelector("[data-intro-sound]");
  const sync = () => {
    btn.textContent = film.muted ? btn.dataset.off : btn.dataset.on;
    btn.setAttribute("aria-pressed", String(!film.muted));
  };
  btn.addEventListener("click", () => {
    film.muted = !film.muted;
    sync();
  });
  return sync;
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

  const onKey = (e) => {
    if (PASS_KEYS.has(e.key) || e.repeat) return;
    if (e.target.closest?.(".intro__bar") && (e.key === "Enter" || e.key === " ")) return;
    finish();
  };
  const onPress = (e) => {
    if (e.button !== 0 || e.target.closest(".intro__bar")) return;
    finish();
  };
  function finish() {
    if (root.classList.contains("intro-done")) return;
    root.classList.add("intro-done");
    veil.classList.add("intro--out");
    film.pause();
    flyDot(veil, film);
    removeEventListener("keydown", onKey);
    veil.removeEventListener("pointerdown", onPress);
    setTimeout(() => {
      veil.remove();
      root.classList.remove("js-intro");
    }, CLEAN_MS);
  }

  // 여기서부터는 스크립트가 시계를 쥔다 — CSS 의 대비책(intro-gone)을 멈춘다.
  veil.classList.add("intro--film");
  const sync = soundButton(veil, film);
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

  film.muted = false;
  film
    .play()
    .catch(() => {
      film.muted = true;
      return film.play();
    })
    .then(sync)
    .catch(finish);
}
