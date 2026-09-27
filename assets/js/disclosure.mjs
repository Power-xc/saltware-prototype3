// 펼침 UI — FAQ 아코디언, 사례 필터 칩.
// 마크업의 aria 상태를 정본으로 삼고 hidden 을 따라 움직인다.

import { track } from './analytics.mjs';

export function initFaq() {
  document.querySelectorAll('[data-faq]').forEach((root) => {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.faq__q');
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
      track('case_filter_click', { filter: chip.textContent.trim() });
    });
  });
}
