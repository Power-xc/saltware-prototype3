// 쪽 넘김 — 긴 줄 목록을 한 쪽씩 끊는다(사령관 2026-09-10, /insights/technology).
//
// 원칙: 스크립트가 없으면 목록이 통째로 선다. 그래서 단추를 산출물에 미리 심지 않고
// 여기서 만든다 — 심어 두면 JS 가 꺼진 화면에 눌리지 않는 단추만 남는다.
// 켜는 쪽은 데이터다: `data-paged="10"` 이 붙은 묶음만 나뉜다(partials/compositions.mjs).
//
// 쪽은 주소에 남기지 않는다. 이 목록은 갈래 하나의 최근분이라 3쪽을 남에게 보낼 일이
// 없고, 히스토리에 쌓이면 뒤로 가기가 목록 안을 맴돈다.
import { markFirstVisible } from "./rows.mjs?v=390f21cfb88b";

const SIZE_MIN = 1;

export function initPagers() {
  for (const box of document.querySelectorAll("[data-paged]")) {
    const size = Number(box.dataset.paged);
    if (!Number.isFinite(size) || size < SIZE_MIN) continue;
    const all = [...box.children];
    // 칩 줄이 바로 앞에 선 묶음은 걸러질 수 있다(filters.mjs) — 지금은 한 쪽이어도
    // 칩을 풀면 다시 여러 쪽이 되므로 넘김 줄을 만들어 두고 숨긴다.
    const filtered = box.previousElementSibling?.hasAttribute("data-filter");
    if (!filtered && Math.ceil(all.length / size) < 2) continue;

    const nav = document.createElement("nav");
    nav.className = "pager";
    nav.setAttribute("aria-label", "목록 쪽 넘김");

    const prev = button("‹", "이전 쪽");
    const next = button("›", "다음 쪽");
    const nums = document.createElement("div");
    nums.className = "pager__nums";
    prev.addEventListener("click", () => go(now - 1, true));
    next.addEventListener("click", () => go(now + 1, true));
    nav.append(prev, nums, next);
    box.after(nav);

    let rows = all;
    let last = 1;
    let now = 0;
    let pages = [];
    // 쪽을 센다 — 칩이 걸러 낸 카드(data-filter-out)는 어느 쪽에도 들지 않는다.
    function layout() {
      rows = all.filter((row) => !row.hasAttribute("data-filter-out"));
      for (const row of all) if (row.hasAttribute("data-filter-out")) row.hidden = true;
      last = Math.max(1, Math.ceil(rows.length / size));
      pages = [];
      nums.replaceChildren();
      for (let n = 1; n <= last; n += 1) {
        const b = button(String(n), `${n}쪽`);
        b.className = "pager__num";
        b.addEventListener("click", () => go(n, true));
        nums.append(b);
        pages.push(b);
      }
      // 한 쪽뿐이면 넘김 줄을 치운다(components.css 의 .pager[hidden]).
      nav.hidden = last < 2;
      now = 0;
      go(1, false);
    }
    box.addEventListener("filterchange", layout);

    function go(n, moved) {
      const page = Math.min(Math.max(n, 1), last);
      if (page === now) return;
      now = page;
      const from = (page - 1) * size;
      rows.forEach((row, i) => {
        const on = i >= from && i < from + size;
        row.hidden = !on;
        // 등장 애니메이션의 순번은 보이는 줄 기준으로 다시 매긴다 — 원래 순번을 두면
        // 뒤쪽 쪽수가 스무 칸치 늦게 뜬다(styles/components.css 모션 구획).
        if (on) row.style.setProperty("--i", i - from);
      });
      // 첫 줄의 윗줄은 지운다 — 앞 줄이 숨어도 `.press + .press` 는 그대로 걸려
      // 두 쪽부터 목록 맨 위에 실선이 하나 뜬다(rows.mjs 에 이유가 적혀 있다).
      markFirstVisible(box);
      // 폰 폭에서는 지금 쪽 둘레 넷만 세운다(components.css .pager__num--far) — 아홉 쪽이
      // 44px 단추로 다 서면 390 폭에서 세 줄로 접혔다(지난 행사, 2026-09-27 실측). 넷인 것은
      // 390 폭 목록 칸(326px)에 화살표 둘과 함께 한 줄로 서는 최대 수라서다(44px × 6 + 틈).
      const lo = Math.max(1, Math.min(page - 2, last - 3));
      pages.forEach((b, i) => {
        if (i + 1 === page) b.setAttribute("aria-current", "page");
        else b.removeAttribute("aria-current");
        b.classList.toggle("pager__num--far", i + 1 < lo || i + 1 > lo + 3);
      });
      prev.disabled = page === 1;
      next.disabled = page === last;
      // 첫 그림에서는 움직이지 않는다 — 화면을 연 사람이 목록으로 끌려간다.
      if (moved) box.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    layout();
  }
}

function button(text, label) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "pager__step";
  b.textContent = text;
  b.setAttribute("aria-label", label);
  return b;
}
