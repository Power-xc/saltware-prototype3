// 분류 칩 — 누른 분류만 남긴다(사령관 UX 시안 2026-09-08).
//
// 두 벌이 있다.
//
//   한 축   칩 줄 바로 뒤의 묶음에서 [data-filter-group] 을 켜고 끈다. 목표 레일과
//           프로젝트 뉴스가 이 벌을 쓴다 — 레일은 걸린 뒤 눈금·번호를 다시 세야
//           하므로 filterchange 로 알린다. 대표 카드가 있는 묶음(data-stories)은
//           남은 첫 장을 대표로 올린다 — 대표가 걸러지면 왼쪽 큰 칸이 통째로 비어
//           고장으로 보인다.
//
//   여러 축 [data-filters] 판 안에 칩 줄이 둘 이상 서고(각 줄이 data-filter-axis 로
//           제 축을 말한다), 항목은 축마다 제 값을 들고 있다(data-filter-{축}).
//           걸리는 조건은 AND 다 — 고른 축을 전부 만족하는 항목만 남는다.
//           고객 사례가 이 벌이다(산업 × 사업, 2026-09-16).
//
// 두 벌을 한 함수로 합치지 않는다. 한 축 쪽은 "칩 줄의 바로 다음 형제가 목록"이라는
// 자리 규약으로 도는데, 여러 축 판에서는 칩 줄 다음이 또 칩 줄이라 그 규약이 성립하지
// 않는다. 판 안의 줄은 아래에서 건너뛴다.
import { markFirstVisible } from "./rows.mjs?v=e2184d6454f7";

/* 여러 축. 판 하나가 칩 줄 N 개와 목록 상자 하나를 갖는다.
   JS 가 없으면 첫 칩만 눌린 채 전부 보인다 — 거르기가 죽어도 사례는 다 읽힌다. */
function initPanel(panel) {
  const rows = [...panel.querySelectorAll("[data-filter][data-filter-axis]")];
  const box = panel.querySelector("[data-filter-box]");
  if (!rows.length || !box) return;
  const items = [...box.querySelectorAll("[data-filter-item]")];
  if (!items.length) return;
  // 하나도 안 남는 조합이 있다(제조 × 포털). 빈 격자만 남기면 무엇이 잘못됐는지
  // 알 수 없으므로 그 자리에 한 줄을 세운다 — 있으면 쓰고, 없으면 조용히 넘어간다.
  const empty = panel.querySelector("[data-filter-empty]");
  const state = new Map(rows.map((r) => [r.dataset.filterAxis, "all"]));

  const apply = () => {
    let shown = 0;
    for (const el of items) {
      const hit = [...state].every(
        ([axis, key]) =>
          key === "all" || el.getAttribute(`data-filter-${axis}`) === key,
      );
      el.hidden = !hit;
      if (hit) shown += 1;
    }
    if (empty) empty.hidden = shown > 0;
    box.dispatchEvent(new CustomEvent("filterchange", { bubbles: true }));
  };

  for (const row of rows) {
    const chips = [...row.querySelectorAll("[data-filter-key]")];
    for (const chip of chips) {
      chip.addEventListener("click", () => {
        for (const c of chips)
          c.setAttribute("aria-pressed", String(c === chip));
        state.set(row.dataset.filterAxis, chip.dataset.filterKey);
        apply();
      });
    }
  }
}

export function initFilters() {
  for (const panel of document.querySelectorAll("[data-filters]"))
    initPanel(panel);

  for (const row of document.querySelectorAll("[data-filter]")) {
    // 여러 축 판 안의 줄은 위에서 이미 배선됐다 — 여기서 다시 잡으면 같은 칩에
    // 리스너가 둘 붙고, 뒤엣것이 "다음 형제"를 목록으로 착각한다.
    if (row.closest("[data-filters]")) continue;
    const box = row.nextElementSibling;
    if (!box) continue;
    const chips = [...row.querySelectorAll("[data-filter-key]")];
    const items = [...box.querySelectorAll("[data-filter-group]")];
    if (!chips.length || !items.length) continue;

    // 대표가 걸러지면 왼쪽 큰 칸이 통째로 빈다 — 남은 첫 장을 그 자리로 옮긴다.
    const side = box.querySelector(".stories__side");
    const promote = () => {
      if (!side) return;
      const shown = items.filter((el) => !el.hidden);
      let first = true;
      for (const el of items) {
        const lead = first && el === shown[0];
        if (lead) first = false;
        el.classList.toggle("story--lead", lead);
        el.classList.toggle("story--row", !lead);
        // 순서는 원래 순서를 지킨다 — 대표만 앞으로 나오고 나머지는 뒤따른다.
        if (lead) box.prepend(el);
        else side.append(el);
      }
    };

    for (const chip of chips) {
      chip.addEventListener("click", () => {
        const key = chip.dataset.filterKey;
        for (const c of chips) c.setAttribute("aria-pressed", String(c === chip));
        for (const el of items) {
          const out = key !== "all" && el.dataset.filterGroup !== key;
          el.hidden = out;
          // 쪽 넘김이 같은 묶음에 걸려 있으면(pager.mjs) hidden 만으로는 "칩이 감춘 것"과
          // "다른 쪽이라 감춘 것"이 갈리지 않는다 — 칩이 감춘 것에 표식을 따로 남긴다.
          el.toggleAttribute("data-filter-out", out);
        }
        promote();
        // 줄 목록(.presses)에서는 감춘 뒤 맨 윗줄 표시를 다시 매긴다 — 그러지 않으면
        // 걸러낸 목록 맨 위에 실선 하나가 뜬다(rows.mjs). 카드 묶음은 그 규칙이 없고,
        // 대표를 옮기느라 자식이 행이 아닐 수도 있어 줄 목록만 손댄다.
        if (box.classList.contains("presses")) markFirstVisible(box);
        box.dispatchEvent(new CustomEvent("filterchange", { bubbles: true }));
      });
    }
  }
}
