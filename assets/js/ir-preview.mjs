// 공고문 미리보기 — IR 공고사항 줄을 누르면 저장 대신 문서를 먼저 띄운다
// (사령관 2026-09-28 "다운로드 말고 미리보기가 나오고 거기서 선택해서 다운로드").
//
// 원칙은 pager.mjs 와 같다: **스크립트가 없으면 줄은 그냥 링크다.** 껍데기를 산출물에
// 심지 않고 여기서 만든다 — 심어 두면 JS 가 꺼진 화면에 열리지 않는 판이 남고, 스물일곱
// 줄이 서는 지면마다 같은 id 를 또 뿌리게 된다. 켜는 쪽은 데이터다: `data-preview` 가
// 붙은 줄만 가로챈다(partials/compositions-rails.mjs).
//
// **좁은 화면은 가로채지 않는다.** iOS·Android 는 iframe 안의 PDF 를 그리지 않고 빈 칸을
// 내주는 쪽이 흔하다. 그 판에서 모달을 띄우면 미리보기가 아니라 빈 상자를 보여주는
// 셈이라, 줄의 기본 동작(새 탭)을 그대로 둔다 — 새 탭에서는 브라우저 기본 뷰어가 뜬다.
//
// 이게 되는 전제는 PDF 가 우리 도메인에 있다는 것이다. 원본 sims 주소는
// `attachment` + `octet-stream` 으로 내려와 무슨 수를 써도 미리보기가 되지 않는다 —
// 그래서 scripts/fetch-ir.mjs 가 파일을 이 저장소로 옮겨 담는다.

// 이 폭 아래에서는 손대지 않는다. 지면의 곁배치가 무너지는 폭과 같은 값이다.
const NARROW = 720;

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** 판을 한 벌 만들어 body 에 붙인다. 두 번 만들지 않는다 — 여는 줄마다 내용만 갈린다. */
function buildShell() {
  const el = document.createElement("div");
  el.className = "irview";
  el.hidden = true;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "공고문 미리보기");
  el.innerHTML = `<div class="irview__scrim" data-irview-close></div>
<div class="irview__panel">
  <div class="irview__top">
    <div class="irview__head">
      <span class="irview__date"></span>
      <h2 class="irview__title"></h2>
    </div>
    <button type="button" class="btn btn--sm irview__x" data-irview-close>닫기</button>
  </div>
  <div class="irview__body">
    <iframe class="irview__frame" title="공고문" src="about:blank"></iframe>
  </div>
  <div class="irview__foot">
    <a class="btn btn--md irview__tab" href="#" target="_blank" rel="noopener noreferrer">새 탭에서 열기</a>
    <a class="btn btn--solid btn--md irview__dl" href="#" download data-ga-event="ir_notice_download">↓ 다운로드</a>
  </div>
</div>`;
  document.body.append(el);
  return el;
}

export function initIrPreview() {
  const rows = document.querySelectorAll("a[data-preview]");
  if (!rows.length) return;

  let el = null;
  let opener = null;

  const frame = () => el.querySelector(".irview__frame");

  function close() {
    if (!el || el.hidden) return;
    el.hidden = true;
    // 틀을 비운다 — 두고 나가면 닫힌 판이 계속 PDF 를 물고 있다가, 다음에 열 때
    // 옛 문서가 한 박자 먼저 스친다(실측 2026-09-28).
    frame().src = "about:blank";
    document.documentElement.style.overflow = "";
    opener?.focus();
    opener = null;
  }

  function open(row) {
    if (!el) {
      el = buildShell();
      wire();
    }
    const href = row.getAttribute("href");
    // 제목은 줄의 마크업에서 읽는다 — 데이터에 또 적으면 둘 중 하나만 고쳐진다.
    const title = row.querySelector(".press__title")?.textContent?.trim() ?? "공고문";
    el.querySelector(".irview__title").textContent = title;
    const date = row.dataset.previewDate ?? "";
    const dateEl = el.querySelector(".irview__date");
    dateEl.textContent = date;
    dateEl.hidden = !date;
    // `#toolbar=0` 은 뷰어의 제 머리띠를 접는다 — 우리 판이 이미 제목과 단추를 들고 있어
    // 두 벌이 겹친다. 무시하는 브라우저가 있지만 무시해도 해가 없다.
    frame().src = `${href}#toolbar=0&navpanes=0&view=FitH`;
    el.querySelector(".irview__tab").href = href;
    const dl = el.querySelector(".irview__dl");
    dl.href = href;
    // 내려받을 이름은 사본의 파일 이름(ir-<번호>.pdf)이 아니라 사람이 읽는 제목이다.
    // 슬래시 따위가 섞이면 브라우저가 이름을 통째로 버리므로 미리 걷는다.
    dl.setAttribute("download", `${title.replace(/[\\/:*?"<>|]/g, " ").trim()}.pdf`);

    el.hidden = false;
    document.documentElement.style.overflow = "hidden";
    el.querySelector(".irview__x").focus();
  }

  function wire() {
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-irview-close]")) close();
    });
    // 판 안에서만 초점이 돌게 묶는다 — 열린 판 뒤의 목록으로 탭이 빠져나가면
    // 읽는 사람은 자기가 무엇을 누르는지 볼 수 없다(드로어와 같은 규약).
    el.addEventListener("keydown", (e) => {
      if (e.key === "Escape") return close();
      if (e.key !== "Tab") return;
      const list = [...el.querySelectorAll(FOCUSABLE)].filter(
        (n) => !n.hidden && n.offsetParent !== null,
      );
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      // iframe 안으로 들어간 초점은 document.activeElement 가 iframe 으로 보인다 —
      // 그 경우도 목록의 끝으로 취급해 다시 판 안으로 돌린다.
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  for (const row of rows) {
    row.addEventListener("click", (e) => {
      // 새 탭·다운로드를 노린 누름은 건드리지 않는다 — 가운데 단추, ⌘/Ctrl, Shift.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // 폭은 누를 때마다 다시 잰다. 창을 돌리거나 줄인 뒤 처음 누르는 사람이
      // 첫 화면의 폭으로 판정받지 않는다.
      if (window.innerWidth <= NARROW) return;
      e.preventDefault();
      opener = row;
      open(row);
    });
  }
}
