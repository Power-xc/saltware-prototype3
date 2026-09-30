// 겹친 행사 카드 넘기기 — partials/compositions-cards.mjs agendaCards 가 찍은 [data-deck] 마다 하나.
//
// 자리는 장마다 data-deck-at(0 이 앞) 하나다. 넘기면(단추 · 오른쪽으로 비친 끝) 앞장이 .is-out 으로 빠지는 동안 뒤 장이 한 칸씩 앞으로 오고,
// 빠진 장은 맨 뒤 자리로 옮겨 스며든다(pages/home.css .deck). 앞장만 누를 수 있다 — 뒤 장은 inert 다.
// 모션 최소 설정이면 빠지는 장면 없이 바로 바뀐다.

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");
const OUT_MS = 220;

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
    btn.setAttribute("aria-label", `${what} 넘겨 보기 — ${n}장 중 ${front + 1}번째`);
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

  deck.classList.add("is-live");
}

export function initDecks() {
  document.querySelectorAll("[data-deck]").forEach(init);
}
