# KGentool 소개 슬라이드
부제: MCP 도구 + AI 워크플로 허브 (한국어 우선)

---

## 1. 문제 정의
- AI CLI와 웹 로그인 세션이 분리되어 반복 전환 비용이 큽니다.
- 프로젝트별 탭/산출물/컨텍스트가 매번 초기화됩니다.
- 팀 내 운영 표준(설치, MCP 연결, 워크플로)이 문서화되지 않으면 재현성이 떨어집니다.

---

## 2. KGentool 가치 제안
- `MCP + 로컬 브라우저 제어 + 워크플로 자동화`를 단일 제품으로 통합
- 한국어 우선 문서 체계: README + Pages + Wiki-ready + Slides
- 실사용 벤더 6개를 동일한 조작 모델로 운영
- `kgentool_*` 도구와 `agentify_*` alias를 동시에 제공

---

## 3. 아키텍처
- JS Shell(Electron/UI): 브라우저 창, CDP 어댑터, UI/파일 수집
- C++ Core(daemon): 상태/정책/워크플로/메타데이터/이벤트
- Shell ↔ Core: stdio 양방향 NDJSON RPC

참고 인포그래픽:
- [아키텍처 흐름도](../assets/infographics/architecture-flow.svg)

---

## 4. 설치와 실행
1. `git clone ...`
2. `./scripts/quickstart.sh`
3. 로그인 + 탭 준비
4. MCP 등록 후 첫 `kgentool_query` 실행

선택:
- C++ 코어 빌드: `npm run core:build`, `npm run core:test`

---

## 5. MCP 연동
- Codex, Claude Code, OpenCode 등록 흐름 지원
- 표준 도구:
  - `kgentool_query`
  - `kgentool_status`
  - `kgentool_tabs`
  - `kgentool_save_artifacts`
  - `kgentool_workflow_run`
- 기존 자동화 보호를 위해 `agentify_*` alias 유지

---

## 6. 워크플로 운영
- 설정 파일: `.kgentool/workflows.toml`
- 에이전트 정의: `.codex/agents/`
- 기본 시나리오:
  - `cpp_refactor`
  - `vendor_hardening`
  - `mcp_extension`
- 안정적인 탭 키 규칙: `<workflow>:<agent>:<vendor>`

---

## 7. 차별점
- 한국어 운영 문서가 제품과 함께 버전 관리됨
- 설치 흐름, 아키텍처, 기능 매트릭스를 SVG 인포그래픽으로 제공
- README(유입) / Pages(도입) / Wiki(운영 참조) 역할 분리

참고 인포그래픽:
- [설치 흐름도](../assets/infographics/install-flow.svg)
- [기능 매트릭스](../assets/infographics/feature-matrix.svg)

---

## 8. FAQ와 운영 리스크
- CAPTCHA 자동 우회는 지원하지 않음(사람 개입 전제)
- SSO 이슈 시 `chrome-cdp` 백엔드 사용 권장
- 상태 경로는 `~/.kgentool/`, 경량 메타데이터만 마이그레이션
- 운영 장애 분석 시 `key/vendor/backend/tool` 정보를 함께 기록

---

## 링크 허브
- Pages 홈: `docs/index.html`
- 5분 시작: `docs/getting-started.html`
- 설치 가이드: `docs/install.html`
- MCP 설정: `docs/mcp-setup.html`
- Wiki 원본: `docs/wiki-ready/Home.md`
