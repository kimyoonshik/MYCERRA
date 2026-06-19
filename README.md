# MYCERRA Harness Agent OS

로컬 전용(local-only) 운영 시스템입니다. 외부 전송·이메일·웹검색·캘린더·공개 게시는
어디에도 없으며, 서비스는 공개적으로 노출되지 않습니다.

- **백엔드**: FastAPI + SQLAlchemy + SQLite (`backend/app`)
- **대시보드**: Streamlit, Korean-first (`dashboard/app.py`)
- **테스트**: pytest (`tests/`)

> **MYCERRA Agent OS (web)** — A separate, local-first internal web app built
> with **Next.js + TypeScript + PostgreSQL + Prisma + Tailwind** lives in
> [`web/`](web/). It is the command center for B2B sales, sample review,
> proposals, content drafts, risk review (Green/Yellow/Red/Black) and Wadiz
> prep. See [`web/README.md`](web/README.md) for setup. Like the rest of this
> repo, it never sends email, never auto-publishes, and never auto-approves
> sample requests.

## 실행 / Run (local only)

```bash
pip install -r requirements.txt
bash run.sh          # FastAPI(127.0.0.1:8000) + Streamlit(127.0.0.1)
# 또는 개별 실행
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
streamlit run dashboard/app.py
pytest -q            # 테스트
```

---

## Phase 14A — Simplified Korean-First Operator UX & Agent Consolidation

### 단순화 이유 (Reason for simplification)
시스템이 강력해졌지만 일상 운영에는 너무 복잡해졌습니다. 워크벤치·에이전트·메뉴·API
용어·영어 라벨·기술적 상태·분산된 결과 위치가 많았습니다. Phase 14A는 **기능을 줄이지
않고** 매일 쓰는 화면만 단순화합니다. 자동화가 또 다른 관리 대상이 되지 않도록,
입력 → 분류 → 에이전트 실행 → 검수 → 보관 → 검색 흐름을 자연스럽게 만듭니다.

### Korean-first UI 정책 (Korean-first UI policy)
모든 운영자용 라벨은 한글 주표기 + 작은 영어 보조표기입니다.

```
오늘                      검수 / 외부공개
HOME / Daily Command     Review / Release
```

상태 라벨도 동일합니다: `초안/Draft`, `진행 중/In Progress`, `검수 대기/Pending QA`,
`수정 필요/Revision Required`, `법무 검토 필요/Legal Review Needed`,
`대표 승인 필요/Human Approval Needed`, `외부공개 가능/Release Ready`, `차단됨/Blocked`.
기밀등급: `내부용/Internal`, `제한기밀/Restricted`, `투자자 NDA용/Investor-NDA`,
`파트너 NDA용/Partner-NDA`, `공개용/Public`.

오류·빈 상태도 한글 우선입니다 (예: "FastAPI에 연결할 수 없습니다.",
"아직 표시할 기록이 없습니다.", "제한기밀 정보가 포함되어 있어 공개용으로 사용할 수 없습니다.").

### 단순화된 운영 메뉴 (Simplified menu model)
기본 사이드바는 7개 한글 메뉴이며, 기본 화면은 **오늘**입니다.

1. **오늘** — HOME / Daily Command
2. **오늘 입력** — Daily Input
3. **R&D / 샘플** — R&D / Samples
4. **사업 / 펀딩 / 투자** — Business / Funding / Investment
5. **검수 / 외부공개** — Review / Release
6. **찾기 / 자료보관** — Search / Archive
7. **고급 메뉴** — Advanced (기본 접힘)

### 고급 메뉴 개념 (Advanced menu concept)
기존 상세 페이지(Agent Runs, MASTER Briefings, PROCESS/R&D Workbench, Crowdfunding
Workbench, Approval & Release Gate, Documents & KB, Debates, Scheduler & AUTO-OPS,
Risk & Policy Flags, Backup & Restore, QA/Review, Daily Logs, Investor/Partner CRM,
IR/Data Room, Legal/IP/Claims, Market Radar, System Health)는 **삭제하지 않고**
`고급 메뉴 열기` 아래로 이동했습니다. 기본은 접힘, 필요할 때만 펼칩니다.

### 일일 입력 워크플로 (Daily input workflow)
**오늘 입력**에서 자유 입력 한 번이면 됩니다.
필드: 날짜 / 작성자 / 자유 입력 / 중요도 / 기밀등급 / 첨부(선택) / 관련 샘플(선택).
버튼: `저장만 하기`, `AI가 자동 분류하기`, `자동 분석 및 다음 액션 만들기`,
`검수 필요한 항목 찾기`.

시스템이 자동으로 분류(R&D / 샘플·QC / 클라우드펀딩 / 투자자·파트너 / 법무·검수 /
일정·할 일 / 자료보관)하고 관련 레코드(daily_execution_logs, rd_experiment_logs,
sample_status_records, meeting_interaction_logs, CRM interaction, crowdfunding task,
decision/risk log, next_actions, 필요 시 policy_flags)를 생성합니다.
가능한 경우 저장 전에 **자동 분류 결과**를 보여줍니다. 민감 R&D는 기본 **제한기밀**입니다.

### 통합 검색 워크플로 (Unified search workflow)
**찾기 / 자료보관**에서 한 번의 검색으로 문서·document_chunks·결과물·브리핑·일일로그·
R&D 로그·샘플·CRM 조직/상호작용·크라우드펀딩·QA·법무/IP·시장 신호·릴리스 패키지를
가로질러 검색합니다. 필터: 전체/R&D/샘플/펀딩/투자자·파트너/검수/문서/브리핑/날짜/기밀등급.
결과: 제목·유형·날짜·기밀등급·요약·상세보기. (외부 웹검색은 전혀 없음 — 로컬 DB만 조회)

### 에이전트 통합 맵 (Agent consolidation map)
기존 상세 에이전트는 내부에 유지하고, 운영자에게는 5개 그룹만 노출합니다.

| 보이는 그룹 | 내부 상세 에이전트 |
|---|---|
| 마스터 | MASTER Agent |
| R&D | PROCESS/R&D Agent + 배양·수확/매트선별·가소·염색·히트프레스·엠보싱·후가공·PHA/aPHA·QC/시험·스케일업/생산 |
| 사업 | Crowdfunding, IR, CRM, Market Radar |
| 검수 | QA/Review + Legal/IP/Risk + Release Gate |
| 찾기 | Documents/KB + Search |

운영자는 "에이전트"를 직접 고르지 않습니다. R&D는 "어떤 분야의 기록인가요?"로만 묻습니다.

### 보존된 안전 장치 (Safety gates preserved)
Phase 14A는 어떤 게이트도 약화하지 않습니다.
- **분류 검증**: 알 수 없는 분류는 거부됩니다.
- **QA 검수 → 법무/IP/리스크 검토 → 대표 승인 → 릴리스 게이트** 순서가 강제됩니다.
  QA 통과 전 법무 불가, QA·법무 통과 전 승인 불가, 게이트 통과 전 외부공개 불가.
- **민감 주제 감지**: 배합비·균주·배양 조건·공정 변수·가소 SOP·생산원가·실패 데이터·
  미공개 파트너명·MYCERRA Engine 구조가 감지되면 자동 **제한기밀** + 공개용 차단.
- **민감 R&D 기본 제한기밀**, 요청 등급이 더 약하면 무시(상향만 허용).
- 백업/복구·로그·정책 플래그·데이터 모델 모두 보존.

### 한계 (Limitations)
- 분류기는 결정론적 키워드 휴리스틱입니다(LLM 미사용). 필요 시 백엔드 분류 로직만
  교체하면 UX는 그대로입니다.
- 외부 전송·이메일·웹검색·캘린더·공개 게시 기능은 **의도적으로 없습니다**.
  릴리스 게이트 통과 후 `exports/`로의 **로컬 내보내기**만 가능합니다.
- 서비스는 127.0.0.1에만 바인딩되며 공개 노출되지 않습니다.
- 보호 대상 정보(공식/SOP/원가/실패 데이터/엔진 내부 구조 등)는 코드·UI 어디에도
  저장/노출하지 않습니다.
