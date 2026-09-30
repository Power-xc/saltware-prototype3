// 인트로 — 필름을 틀고, 끝나면(또는 건너뛰면) 필름의 마지막 점이 원형 창이 되어 커지며 히어로를 연다.
//
// 필름은 design-resources/35-intro-film 이 굽는다. 마지막 장면은 지면 바탕색 위 가운데에 점 하나다 — 로고의 가장 큰
// 결정이다. 여기서 같은 자리 · 같은 크기의 원을 세워 그 점을 이어받는다. 크기는 판 높이의 END_DOT 이다(edl.mjs 와
// 같은 값 — spec 시험이 둘을 대조한다).
//
// 넘김은 원형 와이프다(사령관 2026-09-30 "그 솔트웨어 동그라미 단색으로 가도 되니까 그게 커지면서 히어로 섹션으로 쭉
// 나오게"). 앞 벌은 면이 위에서부터 걷히고 점이 제목의 마침표로 날아갔다 — 그 비행은 걷었다. 이제 지면 전체(body)를
// 그 점 크기의 원으로 오려 두고, 원을 화면 모서리까지 키운다. 원 밖은 캔버스의 지면 바탕색이라 필름의 마지막 판과 같고,
// 가림막의 주황 면(__dot)은 그 원 안에서만 보여 처음에는 필름의 점 그대로다. 원이 커지는 사이 주황이 스러지며 원 안으로
// 히어로가 선다 — 제목 · 카드의 등장(intro-done)도 원 안에서 같이 흐른다. 마침표는 제 등장(dot-in)대로 원이 다 열리기
// 전에 제자리에 앉는다. 움직이는 것은 clip-path(원)와 주황 면의 opacity 뿐이다 — 배치는 한 번도 건드리지 않는다.
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
// 움직임 줄이기를 켠 사람은 부팅 스크립트가 애초에 필름을 틀지 않는다. ?intro 로 억지로 틀었으면 원은 열리지 않고
// 가림막이 곧장 사라져 히어로가 다 선 채로 드러난다.

const FALLBACK_MS = 3600;
const WIPE_MS = 1300; // CSS intro-wipe 와 같은 값 — 원이 화면 모서리까지 커지는 시간
// 주황 면이 스러지는 시간 — 원이 막 커지기 시작하는 동안이다. 이름은 점이 제목으로 날던 앞 벌의 것이다
// (spec 시험이 뒷정리 순서를 이 이름으로 잰다).
const FLIGHT_MS = 600;
// 원도 주황도 다 끝난 뒤에 지운다. 먼저 지우면 원이 열리다 만 채 지면이 튀어나온다.
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

/**
 * 필름의 마지막 점 자리 · 크기로 원형 창을 세우고 연다. 원의 자리는 몸(body) 기준 좌표다 — 지면이 스크롤돼 있어도
 * 화면 가운데(필름의 점)에서 열린다. 열지 못하면 false — 그때는 가림막을 곧장 치운다(움직임 줄이기 · 잴 수 없음).
 */
function openIris(veil, film) {
  const dot = veil.querySelector(".intro__dot");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || typeof dot?.animate !== "function") return false;
  const view = veil.getBoundingClientRect();
  if (!view.width || !view.height) return false;
  const page = document.body.getBoundingClientRect();
  const set = (name, v) => document.body.style.setProperty(name, `${v.toFixed(1)}px`);
  set("--iris-x", view.left + view.width / 2 - page.left);
  set("--iris-y", view.top + view.height / 2 - page.top);
  set("--iris-r0", (END_DOT * filmScale(film)) / 2);
  // 화면 모서리까지 — 다 열린 원이 곧 오리지 않은 지면이라, 뒷정리에서 원을 걷어도 아무것도 튀지 않는다.
  set("--iris-r1", Math.hypot(view.width, view.height) / 2 + 2);
  document.documentElement.classList.add("intro-iris");
  // 점이 지름 160px 쯤으로 부풀 때까지(1440 실측)는 필름의 점 그대로 주황이고, 그다음 곧 스러지며 원 안의 히어로가
  // 비친다. 일찍 옅어지기 시작하면 연한 주황 원판이 크게 번져 한동안 화면을 물들였다(실측 — 앞 판 0.45).
  dot.animate([{ opacity: 1 }, { opacity: 1, offset: 0.66 }, { opacity: 0 }], {
    duration: FLIGHT_MS,
    easing: "linear",
    fill: "forwards",
  });
  return true;
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
  // 원을 여는 일과 면을 걷는 일(intro--out — 면이 투명해지고 원 밖은 캔버스가 받는다)은 한 프레임에 같이 일어나야 한다.
  // 하나라도 먼저 오면 한 프레임 동안 지면 전체가 드러나거나 필름 없는 빈 면이 선다.
  function finish() {
    if (root.classList.contains("intro-done")) return;
    film.pause();
    removeEventListener("keydown", onKey);
    veil.removeEventListener("pointerdown", onPress);
    const opened = openIris(veil, film);
    root.classList.add("intro-done");
    veil.classList.add("intro--out");
    const clean = () => {
      veil.remove();
      root.classList.remove("js-intro", "intro-iris");
      for (const k of ["--iris-x", "--iris-y", "--iris-r0", "--iris-r1"]) document.body.style.removeProperty(k);
    };
    if (opened) setTimeout(clean, CLEAN_MS);
    else clean();
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
