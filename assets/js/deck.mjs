// 겹친 행사 카드 넘기기 — partials/compositions-cards.mjs agendaCards 가 찍은 [data-deck] 마다 하나.
//
// 자리는 장마다 data-deck-at(0 이 앞) 하나다. 넘기면(단추 · 오른쪽으로 비친 끝) 앞장이 .is-out 으로 빠지는 동안 뒤 장이 한 칸씩 앞으로 오고,
// 빠진 장은 맨 뒤 자리로 옮겨 스며든다(pages/home.css .deck). 앞장만 누를 수 있다 — 뒤 장은 inert 다.
// 모션 최소 설정이면 빠지는 장면 없이 바로 바뀐다. 손가락으로는 더미를 왼쪽으로 밀어도 넘어간다 — 그때는 앞장 링크가 열리지 않는다.

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");
const OUT_MS = 220;
const SWIPE_PX = 36;

function init(deck) {
  const cards = [...deck.querySelectorAll("[data-deck-at]")];
  const btn = deck.querySelector("[data-deck-next]");
  const count = deck.querySelector("[data-deck-count]");
  const n = cards.length;
  if (!btn || n < 2) return;
  const what = deck.querySelector(".deck__what")?.textContent ?? "";
  let front = 0; // 앞에 선 장의 원래 순번 — 수 표시용
  let busy = false;

  const place = (el, at) => {
    el.dataset.deckAt = String(at);
    el.inert = at !== 0;
    if (at === 0) el.removeAttribute("aria-hidden");
    else el.setAttribute("aria-hidden", "true");
  };

  const next = () => {
    if (busy) return;
    busy = true;
    const out = cards.find((c) => c.dataset.deckAt === "0");
    // 뒤 장은 지금 올라온다. 빠지는 장은 .is-out 이 제 자리 값을 덮고 있다가 맨 뒤로 간다.
    for (const c of cards) if (c !== out) place(c, Number(c.dataset.deckAt) - 1);
    out.inert = true;
    out.setAttribute("aria-hidden", "true");
    front = (front + 1) % n;
    count.textContent = `${front + 1} / ${n}`;
    btn.setAttribute("aria-label", `${what} — ${n}장 중 ${front + 1}번째`);
    const settle = () => {
      place(out, n - 1);
      out.classList.remove("is-out");
      busy = false;
    };
    if (REDUCED.matches) return settle();
    out.classList.add("is-out");
    setTimeout(settle, OUT_MS);
  };
  btn.addEventListener("click", next);
  // 오른쪽으로 비친 끝을 눌러도 넘어간다 — 쪽 끝을 엄지로 넘기는 손짓(사령관 2026-09-30 "오른쪽 끝에 옆으로").
  deck.querySelector("[data-deck-edge]")?.addEventListener("click", next);

  // 밀어 넘기기 — 손가락만. 가로로 SWIPE_PX 넘게 밀었고 세로보다 많이 움직였을 때만 넘긴다(세로 스크롤은 그대로).
  const pile = deck.querySelector(".deck__pile");
  let start = null;
  let swiped = false;
  pile.addEventListener("pointerdown", (e) => {
    start = e.pointerType === "touch" ? { x: e.clientX, y: e.clientY } : null;
    swiped = false;
  });
  pile.addEventListener("pointerup", (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiped = true;
      next();
    }
  });
  pile.addEventListener("pointercancel", () => (start = null));
  pile.addEventListener(
    "click",
    (e) => {
      if (!swiped) return;
      swiped = false;
      e.preventDefault();
    },
    true,
  );

  deck.classList.add("is-live");
}

export function initDecks() {
  document.querySelectorAll("[data-deck]").forEach(init);
}
