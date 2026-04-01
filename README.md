# KGentool: MCP 도구 + AI 워크플로 허브 (한국어)

KGentool은 **로컬 브라우저 제어 + MCP 연동 + 워크플로 자동화**를 한 번에 제공하는 한국형 AI 데스크톱입니다.  
이미 로그인된 ChatGPT/Claude/Gemini 같은 웹 세션을 그대로 활용해, Codex/Claude Code/OpenCode에서 반복 작업을 실행할 수 있습니다.

## 설치하기 전에 바로 보는 핵심 CTA
- [5분 시작 가이드](./docs/getting-started.html)
- [설치/실행 문서](./docs/install.html)
- [MCP 연결 가이드](./docs/mcp-setup.html)
- [GitHub Pages 문서 홈](./docs/index.html)
- [공식 GitHub Pages 주소](https://sheryloe.github.io/DonggriGent/)

## KGentool이 해결하는 문제
AI CLI를 쓰다 보면 아래가 반복됩니다.
- 웹에서 로그인한 세션과 CLI 흐름이 분리되어 작업 전환 비용이 큼
- 프로젝트별 맥락(탭/첨부/산출물/워치 폴더)이 매번 초기화됨
- 이미지/파일 결과를 다음 프롬프트로 재활용하기 번거로움

KGentool은 이 문제를 다음 방식으로 줄입니다.
- `MCP`로 CLI와 브라우저 세션을 연결
- `탭 키(key)`로 프로젝트별 상태를 지속
- `산출물 저장`과 `워치 폴더`로 파일 루프를 자동화
- `workflow.run`으로 멀티 에이전트 실행을 표준화

## 왜 KGentool인가
- **MCP 우선 설계**: `kgentool_*` 도구와 `agentify_*` 호환 alias를 동시에 제공
- **실사용 세션 기반**: 별도 API 키 마이그레이션 없이 웹 UI 구독을 활용
- **한국어 우선 UX**: 제어 센터/문서/운영 흐름을 한국어 중심으로 구성
- **아키텍처 분리**: JS Shell(브라우저 제어) + C++ Core(런타임/워크플로) 구조로 확장성 확보

## 지원 벤더(현재 v1)
- `chatgpt.com`
- `claude.ai`
- `perplexity.ai`
- `aistudio.google.com`
- `gemini.google.com`
- `grok.com`

## 5분 시작
1. 저장소 클론
```bash
git clone https://github.com/agentify-sh/desktop.git
cd desktop
```
2. 빠른 시작 스크립트 실행
```bash
./scripts/quickstart.sh
```
3. 제어 센터에서 기본 탭 열기 후 벤더 로그인
4. CLI에서 MCP 서버 등록 후 첫 질의 실행

상세 절차는 [getting-started](./docs/getting-started.html) 문서에 정리되어 있습니다.

## 설치 및 실행
### 빠른 시작(권장)
```bash
./scripts/quickstart.sh
```

옵션 예시:
```bash
./scripts/quickstart.sh --show-tabs
./scripts/quickstart.sh --foreground
./scripts/quickstart.sh --client codex
./scripts/quickstart.sh --client all
```

### 수동 실행
```bash
npm ci
npm run start
```

### C++ 코어 빌드(선택)
```bash
npm run core:build
npm run core:test
```

## MCP 연결 예시
### Codex
```bash
codex mcp add kgentool-desktop -- node /ABS/PATH/TO/desktop/mcp-server.mjs
```

### Claude Code
```bash
claude mcp add --transport stdio kgentool-desktop -- node /ABS/PATH/TO/desktop/mcp-server.mjs
```

### OpenCode
`quickstart.sh`의 `--client opencode` 또는 `--client all`로 자동 등록할 수 있습니다.

## 브라우저 백엔드 선택 가이드
KGentool은 2개 백엔드를 지원합니다.
- `electron`: 앱 내장 창으로 단순하고 빠른 시작에 유리
- `chrome-cdp`: 실제 Chrome 계열 브라우저를 붙여 SSO/로그인 안정성이 높음

권장:
- 일반 사용: `electron`
- Google/Microsoft/Apple SSO 이슈가 있으면: `chrome-cdp`

자세한 비교는 [browser-backends](./docs/browser-backends.html) 참고.

## 핵심 기능 맵
### 탭 기반 병렬 실행
- 프로젝트마다 `key`를 고정하면 동일 탭/세션을 재사용
- 병렬 작업은 탭 단위로 격리

### 산출물 루프
- `kgentool_save_artifacts`로 결과물을 로컬에 저장
- 다음 `attachments` 입력으로 바로 재사용

### 워치 폴더
- 폴더에 파일을 넣으면 인덱싱 후 작업 문맥에서 재활용 가능

### 워크플로 실행
- `.kgentool/workflows.toml` 정의를 기준으로 `kgentool_workflow_run` 실행
- `.codex/agents/` 정의를 재사용해 supervisor/implement/reviewer 체인 구성

### 벤더 프로파일 레지스트리
- `vendor-profiles/`에서 벤더별 selector/규칙을 분리 관리

## 실전 사용 예시
### 1) 코드베이스 요약
```json
{
  "tool": "kgentool_query",
  "arguments": {
    "key": "repo-triage",
    "prompt": "이 저장소 아키텍처를 8개 핵심 포인트로 요약해줘."
  }
}
```

### 2) 이미지 산출물 저장
```json
{
  "tool": "kgentool_save_artifacts",
  "arguments": {
    "key": "sprite-lab",
    "mode": "images",
    "maxImages": 3
  }
}
```

### 3) 워크플로 실행
```json
{
  "tool": "kgentool_workflow_run",
  "arguments": {
    "workflowName": "cpp_refactor",
    "prompt": "이 모듈을 C++ 중심 구조로 리팩토링하기 위한 실행 계획과 리뷰를 진행해줘."
  }
}
```

## 문서 허브
### GitHub Pages 문서
- [공식 주소](https://sheryloe.github.io/DonggriGent/)
- [문서 홈](./docs/index.html)
- [설치](./docs/install.html)
- [MCP 연결](./docs/mcp-setup.html)
- [워크플로](./docs/workflows.html)
- [아키텍처](./docs/architecture.html)
- [FAQ](./docs/faq.html)
- [슬라이드 뷰](./docs/slides.html)

### Wiki 원본(이관용)
- [Wiki Home](./docs/wiki-ready/Home.md)
- [Wiki Sidebar](./docs/wiki-ready/_Sidebar.md)

### 슬라이드 원본
- [KGentool 소개 슬라이드(마크다운)](./docs/slides/kgentool-overview.md)

## GitHub Pages 배포 방법
1. 저장소 `Settings > Pages`로 이동
2. Source를 `Deploy from a branch`로 선택
3. Branch를 기본 브랜치로 두고 폴더는 `/docs` 선택
4. 배포 URL 확인 후 `docs/robots.txt`, `docs/sitemap.xml`의 placeholder 도메인 교체

## Wiki 이관 방법
1. GitHub 저장소의 Wiki를 활성화
2. `docs/wiki-ready/`의 `.md` 파일을 Wiki 저장소 루트로 복사
3. `_Sidebar.md`, `_Footer.md`를 함께 반영해 탐색 구조 적용
4. Home/Installation/Quickstart 순서로 링크 점검

## FAQ (요약)
### CAPTCHA를 우회하나요?
아니요. KGentool은 CAPTCHA를 자동 우회하지 않습니다. 사람 개입 방식만 지원합니다.

### 기존 `agentify_*` 호출은 깨지나요?
v1에서는 호환 alias를 유지합니다. 신규 구현은 `kgentool_*` 사용을 권장합니다.

### 상태 디렉터리는 어디인가요?
기본은 `~/.kgentool/` 입니다.

## 로드맵
- C++ 코어 런타임 기능 확장(세션/거버너/워크플로 실행 고도화)
- 문서 자동 배포 및 운영 템플릿 강화
- 벤더 프로파일 운영 자동화(검증/회귀 체크)

## 라이선스/브랜딩
- 라이선스 및 상표는 저장소 내 관련 문서를 따릅니다.
- 파생 프로젝트는 기존 Agentify 상표 정책을 확인해야 합니다.
