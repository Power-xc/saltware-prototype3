// 연혁 — 오른쪽을 내릴수록 왼쪽 사진 위 연도가 바뀐다(사령관 2026-09-11, saltlux 연혁).
//
// 기준은 화면 한가운데다. 붙박이 사진이 화면 높이를 거의 채우므로, 그 한가운데에
// 걸린 덩이가 곧 지금 읽고 있는 해다. 교차 비율로 고르지 않는다 — 한 해에 항목이
// 하나뿐인 덩이(2011·2014…)는 비율로는 절대 이기지 못하고 건너뛰어진다.
//
// 없어도 되는 기능이다. 이 파일이 안 돌면 왼쪽은 첫 해에 멈추고, 오른쪽 연혁은
// 덩이마다 제 연도를 이고 있어 그대로 다 읽힌다.
import { scrollStage } from "./frame.mjs?v=a25d5217f2e7";

export function initYearStage() {
  for (const box of document.querySelectorAll("[data-year-stage]")) {
    const out = box.querySelector("[data-year-out]");
    const dot = box.querySelector("[data-year-dot]");
    const steps = [...box.querySelectorAll("[data-year]")];
    if (!out || steps.length < 2) continue;

    let shown = "";
    const mark = () => {
      const line = innerHeight / 2;
      let now = steps[0];
      for (const s of steps) {
        if (s.getBoundingClientRect().top <= line) now = s;
      }
      // 맨 아래에 닿으면 마지막 해를 켠다 — 끝 덩이는 짧으면 한가운데까지
      // 올라오지 못한 채로 스크롤이 끝난다.
      if (innerHeight + scrollY >= document.body.scrollHeight - 2) now = steps[steps.length - 1];
      const year = now.dataset.year;
      if (year === shown) return;
      shown = year;
      out.textContent = year;
      // 숫자가 툭 바뀌지 않게 한 번 깜빡인다. 클래스를 뗐다 붙여 애니메이션을
      // 다시 태운다 — 같은 클래스를 그대로 두면 두 번째부터 재생되지 않는다.
      out.classList.remove("is-turn");
      void out.offsetWidth;
      out.classList.add("is-turn");
      for (const s of steps) s.classList.toggle("is-now", s === now);
      // 눈금 위의 점. 왼쪽 끝이 가장 오래된 해라 목록 순서(최신순)를 뒤집어 잰다.
      // 연도 값의 크기가 아니라 칸 수로 잰다 — 2003 과 2011 사이가 비어 있어도
      // 점이 한참 멈춰 있지 않고 한 칸씩 고르게 움직인다.
      if (dot) {
        const i = steps.indexOf(now);
        dot.style.setProperty("--at", `${((steps.length - 1 - i) / (steps.length - 1)) * 100}%`);
      }
    };

    // 프레임에 한 번, 그리고 연혁이 화면에 있을 때만 잰다 — 한 번에 덩이 열몇 개의
    // 위치를 읽는 일이라 지면 어디서나 돌면 다른 페이지의 스크롤까지 무거워진다.
    scrollStage([box], mark, { rootMargin: "25% 0px" });
  }
}
