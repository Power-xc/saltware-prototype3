// 행사 책자 넘기기 — partials/event-booklet.mjs 가 찍은 [data-ebook] 을 한 권으로 세운다.
//
// 넓은 화면(860 이상)은 펼침 단위다 — 왼쪽 · 오른쪽 두 쪽이 서고, 넘기면 오른쪽 쪽이 책등을 축으로
// 왼쪽으로 넘어간다. 그보다 좁으면 한 쪽씩 선다 — 넘기면 지금 쪽이 왼쪽 끝을 축으로 들려 나간다.
// 넘어가는 종이는 복제본(ebook__turner)이다: 앞면은 지금 쪽, 뒷면은 넘어가서 드러날 쪽. 밑에는 넘긴 뒤의
// 두 쪽이 먼저 깔려 있어서, 종이가 다 넘어가면 복제본만 걷으면 된다.
//
// 이전 · 다음 단추, 차례 탭과 차례 줄(data-ebook-go), 좌우 화살표 키, 손가락 밀기가 같은 go() 로 모인다.
// 모션 최소 설정이면 넘기는 장면 없이 바로 바뀐다. 보이지 않는 쪽은 inert 라 탭 키가 들어가지 않는다.

const SPREAD = matchMedia("(min-width: 860px)");
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");
const pad = (n) => String(n).padStart(2, "0");

function init(root) {
  const book = root.querySelector("[data-ebook-book]");
  const pages = [...root.querySelectorAll(".ebook__page")];
  if (!book || pages.length < 2) return;
  const tabs = [...root.querySelectorAll(".ebook__tab")];
  const jumps = [...root.querySelectorAll("[data-ebook-go]")];
  const prev = root.querySelector("[data-ebook-prev]");
  const next = root.querySelector("[data-ebook-next]");
  const folio = root.querySelector("[data-ebook-folio]");
  const total = pages.length;
  let at = 0;
  let busy = false;

  const per = () => (SPREAD.matches ? 2 : 1);
  // 펼침에서는 언제나 짝수 쪽(0 · 2 · 4 …)이 왼쪽이다.
  const snap = (i) =>
    Math.max(0, Math.min(total - 1, per() === 2 ? i - (i % 2) : i));

  function show(slots) {
    pages.forEach((p, i) => {
      const slot = slots.get(i) ?? "";
      if (slot) p.dataset.slot = slot;
      else delete p.dataset.slot;
      const on = Boolean(slot);
      p.inert = !on;
      p.setAttribute("aria-hidden", on ? "false" : "true");
    });
  }

  function place() {
    const slots = new Map(
      per() === 2
        ? [
            [at, "l"],
            [at + 1, "r"],
          ]
        : [[at, "c"]],
    );
    show(slots);
    const last = Math.min(total, at + per());
    folio.textContent = `${per() === 2 ? `${pad(at + 1)}–${pad(last)}` : pad(at + 1)} / ${pad(total)}`;
    prev.disabled = at === 0;
    next.disabled = at + per() >= total;
    // 탭은 펼침 머리(짝수 쪽)를 가리킨다 — 한 쪽씩 보는 화면에서도 그 펼침 안이면 켠다.
    const head = at - (at % 2);
    tabs.forEach((t) =>
      t.setAttribute(
        "aria-current",
        Number(t.dataset.ebookGo) === head ? "true" : "false",
      ),
    );
  }

  // 복제본 — 링크 · 그림이 그대로 따라오지만 누를 수도, 읽힐 수도 없다. edge 는 그 면이 다 넘어갔을 때
  // 서는 자리(l · r · c)다 — 모서리 둥글림과 책등 그늘이 그 자리를 따른다.
  const face = (page, side, edge) => {
    const f = page.cloneNode(true);
    f.removeAttribute("id");
    f.removeAttribute("data-slot");
    f.dataset.edge = edge;
    f.classList.add("ebook__face", `ebook__face--${side}`);
    f.inert = true;
    return f;
  };

  function go(target) {
    const to = snap(target);
    if (busy || to === at) return;
    const fwd = to > at;
    if (REDUCED.matches) {
      at = to;
      place();
      return;
    }
    busy = true;
    const turner = document.createElement("div");
    turner.className = `ebook__turner ebook__turner--${per() === 2 ? "spread" : "single"} is-${fwd ? "fwd" : "back"}`;
    turner.setAttribute("aria-hidden", "true");
    let under;
    if (per() === 2) {
      // 앞으로: 오른쪽 쪽(at+1)이 넘어가며 뒷면에 새 왼쪽(to)을 보인다. 밑에는 지금 왼쪽 · 새 오른쪽.
      // 뒤로: 왼쪽 쪽(at)이 넘어오며 뒷면에 새 오른쪽(to+1)을 보인다. 밑에는 새 왼쪽 · 지금 오른쪽.
      const front = fwd ? pages[at + 1] : pages[at];
      const back = fwd ? pages[to] : pages[to + 1];
      turner.append(
        face(front, "front", fwd ? "r" : "l"),
        face(back, "back", fwd ? "l" : "r"),
      );
      under = fwd
        ? new Map([
            [at, "l"],
            [to + 1, "r"],
          ])
        : new Map([
            [to, "l"],
            [at + 1, "r"],
          ]);
    } else {
      // 한 쪽씩: 앞으로는 지금 쪽이 들려 나가고 밑에 새 쪽이, 뒤로는 새 쪽이 들어와 지금 쪽을 덮는다.
      turner.append(face(fwd ? pages[at] : pages[to], "front", "c"));
      under = new Map([[fwd ? to : at, "c"]]);
    }
    show(under);
    book.append(turner);
    const done = () => {
      turner.remove();
      at = to;
      busy = false;
      place();
    };
    turner.addEventListener(
      "animationend",
      (e) => e.target === turner && done(),
    );
    // 애니메이션이 어떤 까닭으로 끝나지 않아도 책이 멈춘 채 남지 않게.
    setTimeout(() => busy && done(), 1400);
  }

  prev.addEventListener("click", () => go(at - per()));
  next.addEventListener("click", () => go(at + per()));
  for (const j of jumps) {
    j.addEventListener("click", (e) => {
      e.preventDefault();
      go(Number(j.dataset.ebookGo));
    });
  }
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") go(at + per());
    else if (e.key === "ArrowLeft") go(at - per());
    else return;
    e.preventDefault();
  });

  // 손가락 밀기 — 가로로 48px 넘게, 세로보다 크게 밀었을 때만. 민 뒤의 클릭(링크 열림)은 한 번 삼킨다.
  let x0 = null;
  let y0 = 0;
  let swallow = false;
  book.addEventListener("pointerdown", (e) => {
    x0 = e.clientX;
    y0 = e.clientY;
  });
  book.addEventListener("pointerup", (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    x0 = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    swallow = true;
    go(dx < 0 ? at + per() : at - per());
  });
  book.addEventListener(
    "click",
    (e) => {
      if (!swallow) return;
      swallow = false;
      e.preventDefault();
      e.stopPropagation();
    },
    true,
  );

  // 펼침에서 쪽의 빈 곳을 누르면 — 오른쪽 쪽은 다음, 왼쪽 쪽은 이전. 링크 · 단추는 제 일을 한다.
  book.addEventListener("click", (e) => {
    if (per() !== 2 || e.target.closest("a, button")) return;
    const slot = e.target.closest(".ebook__page")?.dataset.slot;
    if (slot === "r") go(at + 2);
    else if (slot === "l") go(at - 2);
  });

  SPREAD.addEventListener("change", () => {
    at = snap(at);
    place();
  });

  root.classList.add("is-live");
  place();
}

export function initBooklets() {
  document.querySelectorAll("[data-ebook]").forEach(init);
}
