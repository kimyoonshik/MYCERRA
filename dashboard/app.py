"""MYCERRA Harness Agent OS — Korean-first operator dashboard (Phase 14A).

Seven Korean-first main menus + a collapsed 고급 메뉴 expander. Default view is
오늘. The dashboard is a thin client: every safety gate runs in the backend.

Run locally only:
    streamlit run dashboard/app.py
It is NOT exposed publicly and performs NO external sending/search/publishing.
"""

from __future__ import annotations

import datetime as _dt

import streamlit as st

from api_client import ApiError, get, post

st.set_page_config(page_title="MYCERRA 운영", page_icon="🍄", layout="wide")

# Seven Korean-first main menus (Part 1). Korean primary, English helper small.
MAIN_MENUS = [
    ("오늘", "HOME / Daily Command"),
    ("오늘 입력", "Daily Input"),
    ("R&D / 샘플", "R&D / Samples"),
    ("사업 / 펀딩 / 투자", "Business / Funding / Investment"),
    ("검수 / 외부공개", "Review / Release"),
    ("찾기 / 자료보관", "Search / Archive"),
]


def menu_label(ko: str, en: str) -> str:
    return f"{ko}  ·  {en}"


def sidebar() -> str:
    st.sidebar.title("MYCERRA")
    st.sidebar.caption("Korean-first 운영 환경 · 로컬 전용")
    choice = st.sidebar.radio(
        "메뉴",
        [menu_label(ko, en) for ko, en in MAIN_MENUS],
        label_visibility="collapsed",
    )
    selected = MAIN_MENUS[[menu_label(k, e) for k, e in MAIN_MENUS].index(choice)][0]

    # 고급 메뉴 — collapsed by default (Part 13).
    with st.sidebar.expander("고급 메뉴 열기  ·  Advanced", expanded=False):
        try:
            data = get("/advanced/menus")
            for m in data["advanced_menus"]:
                st.write(f"• {m['ko']}  ·  {m['en']}")
            st.caption("상세 워크벤치/원시 에이전트 실행/디버그/백업·복구/스케줄러/시스템 상태는 여기에 보존됩니다.")
        except ApiError as exc:
            st.error(str(exc))
    return selected


def show_error(exc: ApiError):
    st.error(str(exc))


# ---------------------------------------------------------------- 오늘
def view_today():
    st.header("오늘")
    st.caption("MYCERRA Daily Command")
    try:
        data = get("/today/")
    except ApiError as exc:
        return show_error(exc)

    st.subheader("오늘의 마스터 브리핑")
    st.info(data["master_briefing"])

    st.subheader("오늘 해야 할 일 Top 3")
    if data["top3"]:
        cols = st.columns(len(data["top3"]))
        for col, a in zip(cols, data["top3"]):
            col.metric(f"우선순위 {a['priority']}", a["title"][:40])
    else:
        st.write("아직 표시할 기록이 없습니다.")

    st.subheader("긴급 경고")
    u = data["urgent"]
    if not (u["critical_flags"] or u["blocked_outputs"] or u["overdue_tasks"]):
        st.success("현재 긴급 경고가 없습니다.")
    for f in u["critical_flags"]:
        st.error(f"제한기밀 경고: {f['reason']}")
    for b in u["blocked_outputs"]:
        st.warning(f"차단된 산출물: {b['title']}")
    for t in u["overdue_tasks"]:
        st.warning(f"기한 초과: {t['title']}")

    st.subheader("검수 대기")
    pr = data["pending_reviews"]
    c1, c2, c3 = st.columns(3)
    c1.metric("QA 대기", len(pr["qa"]))
    c2.metric("법무 검토 대기", len(pr["legal"]))
    c3.metric("대표 승인 대기", len(pr["human_approval"]))

    st.subheader("최근 결과물")
    if data["recent_outputs"]:
        for o in data["recent_outputs"]:
            with st.container(border=True):
                st.write(f"**{o['title']}** — {o['status_ko']} · {o['confidentiality_ko']}")
                st.button("상세보기", key=f"detail_{o['id']}")
    else:
        st.write("아직 표시할 기록이 없습니다.")

    st.subheader("빠른 실행")
    cols = st.columns(5)
    for col, label in zip(cols, data["quick_actions"]):
        col.button(label, key=f"qa_{label}")

    st.subheader("무엇을 하고 싶으신가요?")
    gcols = st.columns(3)
    for i, card in enumerate(data["guided_cards"]):
        gcols[i % 3].button(card, key=f"card_{card}")


# ---------------------------------------------------------------- 오늘 입력
def view_daily_input():
    st.header("오늘 입력")
    st.caption("Daily Input")
    st.write("오늘 한 일, 실험 결과, 만난 사람, 문제, 아이디어, 펀딩 준비사항을 자유롭게 적어주세요.")

    col1, col2 = st.columns(2)
    log_date = col1.date_input("날짜", _dt.date.today()).isoformat()
    author = col2.text_input("작성자", "대표")
    raw_text = st.text_area("자유 입력", height=160)
    c1, c2, c3 = st.columns(3)
    importance = c1.selectbox("중요도", ["낮음", "보통", "높음"], index=1)
    conf = c2.selectbox(
        "기밀등급",
        ["자동", "internal", "restricted", "investor_nda", "partner_nda", "public"])
    related_sample = c3.text_input("관련 샘플 (선택)")

    requested = None if conf == "자동" else conf

    b1, b2, b3, b4 = st.columns(4)
    if b1.button("저장만 하기"):
        _ingest(log_date, author, raw_text, importance, requested,
                related_sample, auto=False)
    if b2.button("AI가 자동 분류하기"):
        _classify_preview(raw_text, requested)
    if b3.button("자동 분석 및 다음 액션 만들기"):
        _ingest(log_date, author, raw_text, importance, requested,
                related_sample, auto=True)
    if b4.button("검수 필요한 항목 찾기"):
        _classify_preview(raw_text, requested, review_hint=True)


def _classify_preview(raw_text, requested, review_hint=False):
    if not raw_text.strip():
        st.warning("아직 표시할 기록이 없습니다. 내용을 입력해주세요.")
        return
    try:
        res = post("/daily-input/classify",
                   json={"raw_text": raw_text, "confidentiality": requested})
    except ApiError as exc:
        return show_error(exc)
    st.subheader("자동 분류 결과")
    st.write(f"분류: **{res['category']}** (신뢰도 {res['confidence']})")
    st.write(f"기밀등급: **{res['confidentiality']}**")
    if res["sensitive"]:
        st.error("제한기밀 정보가 포함되어 있어 공개용으로 사용할 수 없습니다.")
    if review_hint and (res["sensitive"] or res["category"] == "법무/검수"):
        st.warning("이 항목은 검수가 필요합니다. 검수 / 외부공개 메뉴로 보내세요.")
    st.caption("생성 예정 기록: " + ", ".join(res["proposed_records"]))


def _ingest(log_date, author, raw_text, importance, requested, related_sample, auto):
    if not raw_text.strip():
        st.warning("내용을 입력해주세요.")
        return
    try:
        res = post(
            "/daily-input/ingest",
            params={"auto_classify": str(auto).lower()},
            json={
                "log_date": log_date, "author": author, "raw_text": raw_text,
                "importance": importance, "confidentiality": requested,
                "related_sample": related_sample or None,
            })
    except ApiError as exc:
        return show_error(exc)
    st.success("저장되었습니다.")
    st.json(res)


# ---------------------------------------------------------------- R&D / 샘플
def view_rnd():
    st.header("R&D / 샘플")
    st.caption("R&D / Samples")
    try:
        sec = get("/rnd/sections")
    except ApiError as exc:
        return show_error(exc)
    st.write("· " + "  · ".join(sec["sections"]))

    st.subheader("새 실험 기록")
    title = st.text_input("제목", key="rnd_title")
    st.write(sec["subdomain_question"])
    subdomain = st.selectbox("분야", sec["subdomains"], key="rnd_sub")
    summary = st.text_area("내용", key="rnd_sum")
    if st.button("실험 기록 저장"):
        try:
            res = post("/rnd/experiments",
                       json={"title": title, "subdomain": subdomain, "summary": summary})
            st.success(f"저장됨 · 기밀등급 {res['confidentiality']} (민감 R&D 기본 제한기밀)")
        except ApiError as exc:
            show_error(exc)

    st.subheader("샘플 상태")
    try:
        samples = get("/rnd/samples")
        if samples:
            st.table(samples)
        else:
            st.write("아직 표시할 기록이 없습니다.")
    except ApiError as exc:
        show_error(exc)


# ---------------------------------------------------------------- 사업
def view_business():
    st.header("사업 / 펀딩 / 투자")
    st.caption("Business / Funding / Investment")
    try:
        tabs_data = get("/business/tabs")
    except ApiError as exc:
        return show_error(exc)
    tabs = st.tabs(tabs_data["tabs"])
    with tabs[0]:
        for card in tabs_data["와디즈 준비"]:
            st.button(card, key=f"wadiz_{card}")
    with tabs[1]:
        for card in tabs_data["투자자 대응"]:
            st.button(card, key=f"inv_{card}")
    with tabs[2]:
        for card in tabs_data["파트너 / B2B"]:
            st.button(card, key=f"ptn_{card}")
    with tabs[3]:
        st.write("IR 자료는 검수/승인 후 데이터룸에서 관리됩니다.")
    with tabs[4]:
        st.write("시장 레이더 — 내부 신호만 표시 (외부 웹검색 없음).")


# ---------------------------------------------------------------- 검수
def view_review():
    st.header("검수 / 외부공개")
    st.caption("Review / Release")
    try:
        q = get("/review/queue")
    except ApiError as exc:
        return show_error(exc)
    buckets = ["검수 대기", "수정 필요", "법무/IP/표현 검토 필요",
               "대표 승인 필요", "외부공개 가능", "차단된 산출물"]
    for b in buckets:
        st.subheader(b)
        items = q.get(b, [])
        if not items:
            st.caption("해당 항목 없음")
            continue
        for it in items:
            with st.container(border=True):
                st.write(f"**{it['title']}** · 용도: {it.get('purpose') or '-'}")
                st.write(f"기밀등급: {it['confidentiality_ko']}")
                st.write(f"위험요소: {it.get('risk_notes') or '-'}")
                st.write(f"필요한 조치 / 다음: **{it['next_action']}**")

    st.subheader("사용 가능 / 주의 / 금지 문구")
    pl = q["phrase_library"]
    c1, c2, c3 = st.columns(3)
    c1.success("사용 가능\n\n" + "\n".join(f"- {x}" for x in pl["사용 가능"]))
    c2.warning("주의\n\n" + "\n".join(f"- {x}" for x in pl["주의"]))
    c3.error("금지\n\n" + "\n".join(f"- {x}" for x in pl["금지"]))
    st.caption("외부 전송/공개 없음 — 릴리스 게이트 통과 후 로컬 내보내기만 가능합니다.")


# ---------------------------------------------------------------- 찾기
def view_search():
    st.header("찾기 / 자료보관")
    st.caption("Search / Archive")
    try:
        f = get("/search/filters")
    except ApiError as exc:
        return show_error(exc)
    q = st.text_input("검색", placeholder=f["placeholder"])
    filt = st.selectbox("필터", f["filters"])
    if st.button("검색 실행") or q:
        try:
            res = get("/search/", params={"q": q, "filter": filt})
        except ApiError as exc:
            return show_error(exc)
        st.caption(f"{res['count']}건")
        if not res["results"]:
            st.write("아직 표시할 기록이 없습니다.")
        for r in res["results"]:
            with st.container(border=True):
                st.write(f"**{r['title']}**  ·  {r['type']}  ·  {r['classification']}")
                st.caption(f"{r['date'] or ''} — {r['summary']}")
                st.button("상세보기", key=f"open_{r['model']}_{r['id']}")


VIEWS = {
    "오늘": view_today,
    "오늘 입력": view_daily_input,
    "R&D / 샘플": view_rnd,
    "사업 / 펀딩 / 투자": view_business,
    "검수 / 외부공개": view_review,
    "찾기 / 자료보관": view_search,
}


def main():
    selected = sidebar()
    VIEWS[selected]()


if __name__ == "__main__":
    main()
