// 스크롤 진행률로 **몇 번째인지**를 고르는 판. 붙박인 판 하나 안에서 칸이 차례로
// 온다(인재채용의 사내복지 서랍과 지원 절차 카드 줄, careers.css).
// 결은 toss.im/business/pg 다(실측 2026-09-28 — 판이 화면 위 160px 에 붙박인 채
// 칸당 약 450px 을 지나며 하나씩 온다).
//
// 여기서 하는 일은 **번호 하나를 고르는 것**뿐이다. 칸이 어떻게 생겼는지, 붙박이는
// 높이, 스크롤 예산은 전부 CSS 가 정한다 — pillars.mjs 와 같은 약속이다.
// 칸에 붙는 표시는 둘이다:
//   is-on    지금 칸 하나
//   is-past  이미 지나온 칸들
// 사내복지 서랍은 is-on 만 본다(한 번에 하나만 열린다). 지원 절차는 둘을 합쳐
// 본다(온 것은 그대로 남고 다음이 더해진다). 같은 수 하나로 두 결을 낸다.
//
// 없어도 되는 기능이다:
//  - 스크립트가 안 돌면 html.js-scrollcord 가 안 붙는다. 접는 규칙이 전부 그 클래스
//    안에 있으므로 세 묶음이 다 펼쳐진 채 세로로 늘어선다 — 읽는 데에 빠지는 것이 없다.
//  - prefers-reduced-motion 이면 아무것도 하지 않는다(클래스도 붙이지 않는다).
//  - 좁은 폭에서는 CSS 가 붙박이를 켜지 않는다. 이 스크립트는 그래도 돌지만, 판이
//    흘러가는 동안 읽는 줄을 고르는 것뿐이라 해가 없다.
import { scrollStage } from "./frame.mjs?v=d4b964853b2e";

export function initScrollcord() {
  const stages = [...document.querySelectorAll("[data-scrollcord]")];
  if (!stages.length) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // 첫 칠 전에 붙여야 세 묶음이 다 펼쳐졌다가 접히는 것이 보이지 않는다.
  document.documentElement.classList.add("js-scrollcord");

  const state = new Map();
  for (const stage of stages) {
    // 칸은 클래스가 아니라 표시로 찾는다 — 서랍(.crsup__row)과 절차 카드
    // (.crstep__item)가 같은 배선을 쓴다. 클래스로 찾으면 한 벌을 더 복사해야 하고,
    // 두 벌이 갈리는 순간 한쪽만 고쳐진다(disclosure.mjs 가 같은 이유로 aria 를 본다).
    const rows = [...stage.querySelectorAll("[data-scrollcord-item]")];
    // 스크롤 예산은 칸 수에 비례한다(careers.css 의 판 높이). 그 수를 조판이 style
    // 로 적을 수 없어(빌드가 인라인 style 을 막는다) 여기서 센다.
    stage.style.setProperty("--rows", String(rows.length));
    state.set(stage, { rows, at: -1 });
    mountFlat(stage);
  }

  /* 한눈에 보기 — 서랍을 풀어 묶음을 한꺼번에 세운다 `[2026-10-01]`.
     서랍은 한 번에 하나만 연다. 둘을 견주려는 사람에게는 길이 없었다 —
     붙박이 액자(1440×900 에서 836px, 머리 50 빼고 786) 안에 열린 줄 둘(485+485)
     이 들어가지 않으므로, 액자 안에서 풀 수 있는 문제가 아니다. 그래서 액자를 푼다:
     is-flat 이 붙으면 붙박이도 여닫이도 꺼지고, 스크립트가 없는 날 서는 **기본형**
     (다 펼친 세 단)이 그대로 선다. 조판도 CSS 도 그 판을 이미 갖고 있다.

     단추는 조판이 아니라 여기서 만든다. 조판은 빈 칸과 글자 둘만 준다
     (data-scrollcord-flat · data-scrollcord-drawer) — 스크립트가 안 도는 날 접힐
     일이 없는데 접는 단추만 남으면 그게 dead control 이다(careersSupport 의 같은 주석).

     글자는 **다음에 누르면 되는 것**을 말한다. 켠 뒤에도 "한눈에 보기"가 그대로면
     이미 그 모양인데 같은 말을 또 거는 꼴이라, 켜지면 "스크롤로 보기"로 바뀐다.

     `[2026-10-01]` 끌 때는 자리를 되돌리는 것으로 끝나지 않는다(사령관 "이거 다시
     누르면 스크롤 이벤트 볼 수 있게"). 액자가 다시 붙더라도 서 있던 자리가 판의
     중간이면 진행률이 이미 0.6 쯤이라, 서랍이 셋째 줄에서 시작하고 볼 것이 한 줄
     남는다. 그래서 끌 때는 **판의 머리**로 데려간다 — 진행률 0 이 거기다(paint 의
     셈과 같은 자리). 그 자리에서 내려가면 서랍이 첫 줄부터 다시 돈다. */
  function mountFlat(stage) {
    const slot = stage.querySelector("[data-scrollcord-flat]");
    if (!slot) return;
    const label = {
      off: slot.dataset.scrollcordFlat,
      on: slot.dataset.scrollcordDrawer || slot.dataset.scrollcordFlat,
    };
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "crsup__flat";
    btn.textContent = label.off;
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      // 켤 때: 줄 뭉치가 화면에서 서 있던 자리를 기억했다가 되돌린다. 액자를 풀면
      // 판 높이가 화면 셋 몫만큼 줄어, 그냥 바꾸면 읽던 줄이 화면 밖으로 튄다.
      const rows = stage.querySelector(".crsup");
      const was = rows?.getBoundingClientRect().top ?? 0;
      const on = stage.classList.toggle("is-flat");
      btn.setAttribute("aria-pressed", String(on));
      btn.textContent = on ? label.on : label.off;
      if (on) {
        const now = rows?.getBoundingClientRect().top ?? 0;
        if (now !== was) scrollBy(0, now - was);
        return;
      }
      // 끌 때: 판의 머리로 간다. 서랍이 첫 줄부터 다시 돈다.
      // 다음 paint 가 번호를 다시 고르도록 기억한 번호를 지운다 — 지우지 않으면
      // 자리는 0 인데 열린 줄은 아까 그 줄인 채로 남는다(open 이 같은 번호를 거른다).
      const s = state.get(stage);
      if (s) s.at = -1;
      scrollTo({
        top: stage.getBoundingClientRect().top + scrollY,
        behavior: "smooth",
      });
    });
    slot.append(btn);
  }

  function open(stage, n) {
    const s = state.get(stage);
    if (!s || s.at === n) return;
    s.at = n;
    s.rows.forEach((row, i) => {
      row.classList.toggle("is-on", i === n);
      row.classList.toggle("is-past", i < n);
    });
  }

  const paint = (stage) => {
    const s = state.get(stage);
    if (!s || !s.rows.length) return;
    // 풀어 놓은 판은 진행률을 보지 않는다 — 줄은 전부 열려 있고, 여기서 번호를
    // 골라 봐야 제목 색만 혼자 따라다닌다.
    if (stage.classList.contains("is-flat")) return;
    const r = stage.getBoundingClientRect();
    if (r.height <= 0) return;
    // 진행률: 판의 머리가 화면 꼭대기를 지난 거리를, **판이 지나갈 수 있는 거리**로
    // 나눈다. 판 높이에서 화면 한 판을 빼는 것이 그 거리다 — 판의 꼬리가 화면
    // 바닥에 닿는 순간이 끝이다. 붙박인 줄 뭉치의 실제 높이로 재지 않는다:
    // 그 높이는 줄이 열리고 접히며 바뀌므로, 진행률이 제가 만든 변화를 다시 읽는
    // 되먹임이 된다(줄 경계에서 두 줄이 번갈아 깜빡인다).
    const travel = r.height - innerHeight;
    if (travel <= 0) return;
    const p = Math.max(0, Math.min(0.9999, -r.top / travel));
    // 진행률 그대로(--p)를 내주던 줄은 걷었다(2026-09-30) — 받던 것은 인재상 가로 레일
    // 하나였고 그 레일이 걷혔다. 남은 둘(사내복지 서랍 · 지원 절차)은 번호만 본다.
    open(stage, Math.floor(p * s.rows.length));
  };

  scrollStage(stages, paint, { rootMargin: "25% 0px" });
}
