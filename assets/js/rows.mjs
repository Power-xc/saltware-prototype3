// 줄 목록의 공통 손질 — 쪽 넘김(pager.mjs)과 분류 칩(filters.mjs)이 같이 쓴다.
//
// 왜 필요한가: 줄 사이 실선은 `.press + .press` 가 그리고, 맨 윗줄만
// `.presses > .press--first` 가 지운다(styles/components.css). `+` 는 숨은 줄도 형제로
// 세기 때문에, 앞줄을 감추면(쪽을 넘기거나 분류를 거르면) 목록 맨 위에 실선 하나가 뜬다.
// 감춘 쪽이 감춘 뒤에 이 표시를 다시 매겨야 한다.

/** 보이는 첫 자식에만 `cls` 를 남긴다. 형제 선택자로 그린 윗줄을 지우는 표시다. */
export function markFirstVisible(box, cls = "press--first") {
  if (!box) return;
  let first = true;
  for (const row of box.children) {
    const on = first && !row.hidden;
    if (on) first = false;
    row.classList.toggle(cls, on);
  }
}
