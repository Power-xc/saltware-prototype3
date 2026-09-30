// 펼침 UI — FAQ 아코디언, 사례 필터 칩.
// 마크업의 aria 상태를 정본으로 삼고 hidden 을 따라 움직인다.

import { track } from './analytics.mjs';

/** 아코디언. `[data-faq]` 판 안에서 패널을 가리키는 버튼을 누르면 그 패널이 열린다.
    `[2026-09-28]` 버튼을 `.faq__q` 가 아니라 **aria 로** 찾는다 — 파트너사 지면이 같은
    장치를 제 조판(.pmark__q)으로 쓰기 때문이다. 클래스로 찾으면 같은 배선을 한 벌 더
    복사해야 하고, 두 벌이 갈리는 순간 한쪽만 고쳐진다. 조건은 그대로다: 판 안에 있고,
    열림 상태를 말하며(aria-expanded), 무엇을 여는지 가리킨다(aria-controls).
    FAQ 마크업은 이 조건을 이미 다 만족한다. */
export function initFaq() {
  document.querySelectorAll('[data-faq]').forEach((root) => {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[aria-expanded][aria-controls]');
      if (!btn || !root.contains(btn)) return;
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      const panel = btn.nextElementSibling;
      if (panel) panel.hidden = open;
    });
  });
}

/** 푸터 링크 열 — 데스크톱은 열린 표, 모바일만 접는다. 마크업은 open 으로 나가
    JS 가 없어도 전부 보인다. 폭 경계는 토큰(--bp-md)에서 읽는다 — 스타일시트와
    어긋난 숫자를 여기 따로 두지 않는다. */
export function initFooterGroups() {
  const groups = document.querySelectorAll('.footer__group');
  if (!groups.length) return;
  const bp = getComputedStyle(document.documentElement).getPropertyValue('--bp-md').trim();
  const narrow = window.matchMedia(`(max-width: ${bp})`);
  const apply = () => {
    groups.forEach((g) => {
      g.open = !narrow.matches;
      const s = g.querySelector('summary');
      if (s) s.tabIndex = narrow.matches ? 0 : -1;
    });
  };
  apply();
  narrow.addEventListener('change', apply);
}

export function initCaseFilter() {
  document.querySelectorAll('[data-case-filter]').forEach((root) => {
    const chips = [...root.querySelectorAll('.chip')];
    root.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', 'true');
      // 판이 제 분류(data-case-group)를 달고 있으면 실제로 거른다 — 클라우드의 대표 판(cases-feature.mjs).
      // 이름표가 없는 격자에서는 눌림 표시만 바뀐다(앞 동작 그대로).
      if (chip.hasAttribute('data-filter')) {
        const key = chip.dataset.filter;
        const scope = root.closest('section') ?? document;
        scope.querySelectorAll('[data-case-group]').forEach((card) => {
          card.hidden = Boolean(key) && card.dataset.caseGroup !== key;
        });
      }
      track('case_filter_click', { filter: (chip.firstChild?.textContent ?? chip.textContent).trim() });
    });
  });
}
