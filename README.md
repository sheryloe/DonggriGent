# DonggriGent

DonggriGent는 **브라우저 로그인 세션을 유지한 상태로** AI CLI 작업을 자동화하는 MCP 기반 데스크톱 도구입니다.  
Codex/Claude Code에서 `kgentool_*` 도구를 호출해 질의, 상태 확인, 워크플로 실행을 한 흐름으로 처리합니다.  
기본 추천 워크플로는 `*_ko`이며, 한국어 출력/리뷰 기준으로 바로 운영할 수 있게 구성되어 있습니다.

## 바로가기

- GitHub Pages: [https://sheryloe.github.io/DonggriGent/](https://sheryloe.github.io/DonggriGent/)
- 문서 홈: [./docs/index.html](./docs/index.html)
- 빠른 시작: [./docs/getting-started.html](./docs/getting-started.html)
- 설치: [./docs/install.html](./docs/install.html)
- MCP 연결: [./docs/mcp-setup.html](./docs/mcp-setup.html)
- 워크플로: [./docs/workflows.html](./docs/workflows.html)

## 누구에게 맞는가

- 브라우저 로그인 세션을 유지한 채 AI 작업을 반복 실행해야 하는 개발자
- 프로젝트별 `key`로 작업 문맥을 분리/재사용하고 싶은 팀
- 질의 → 산출물 저장 → 다음 작업 첨부까지 한 루프로 돌리고 싶은 사용자

## WSL 기준 5분 시작

> 아래 명령은 **WSL(Ubuntu)** 기준입니다.
> 요구사항: **Node.js 20+**, **npm 10+**, GUI 확인을 위한 **WSLg**(또는 Windows에서 `npm run start` 실행).

```bash
cd ~
git clone https://github.com/sheryloe/DonggriGent.git
cd DonggriGent
npm ci
npm run start
```

실행 후 데스크톱 창이 열리면 사용하려는 벤더(예: ChatGPT) 계정으로 로그인합니다.
> 아래 MCP 등록 명령은 저장소가 `/home/$USER/DonggriGent`에 clone된 기준입니다. 다른 경로면 절대경로를 바꿔서 사용하세요.

## MCP 등록 (복붙용)

### Codex

```bash
cd ~/DonggriGent
codex mcp add kgentool-desktop -- node /home/$USER/DonggriGent/mcp-server.mjs
codex mcp list
```

### Claude Code

```bash
cd ~/DonggriGent
claude mcp add --transport stdio kgentool-desktop -- node /home/$USER/DonggriGent/mcp-server.mjs
claude mcp list
```

## 기본 도구

- `kgentool_query`: 벤더 탭에 질의 전송
- `kgentool_status`: 현재 상태/런타임 확인
- `kgentool_tabs`: 탭 목록/상태 확인
- `kgentool_save_artifacts`: 최근 산출물 저장
- `kgentool_workflow_run`: 워크플로 실행

## 워크플로 추천 (기본은 *_ko)

- `cpp_refactor_ko`: C++ 리팩터링/구조 개선
- `vendor_hardening_ko`: 인증/팝업/보안 점검
- `mcp_extension_ko`: MCP 도구/계약 확장

처음 시작하거나 한국어 보고서/리뷰가 필요하면 `*_ko`를 기본으로 사용하세요. 기존 자동화 호환이 필요할 때만 non-`_ko`를 사용합니다.

## 예시 1) 질의 호출(JSON)

> 아래는 **터미널 명령이 아니라 MCP 도구 호출 예시**입니다.

```json
{
  "tool": "kgentool_query",
  "arguments": {
    "key": "repo-audit",
    "prompt": "현재 저장소에서 우선순위 높은 보안 개선 3가지를 한국어로 제시해줘."
  }
}
```

## 예시 2) 워크플로 실행(JSON)

> 아래는 **터미널 명령이 아니라 MCP 도구 호출 예시**입니다.

```json
{
  "tool": "kgentool_workflow_run",
  "arguments": {
    "workflowName": "cpp_refactor_ko",
    "prompt": "WSL 기준 실행 명령까지 포함해서 리팩터링 계획과 검증 순서를 제안해줘."
  }
}
```

## 예시 3) 워치 폴더 등록(JSON)

> 워치 폴더 계열은 현재 `agentify_*` 이름을 사용합니다(레거시 호환 API).
> 아래는 **터미널 명령이 아니라 MCP 도구 호출 예시**입니다.
> 보안상 워치 폴더는 `/home/$USER/DonggriInbox` 같은 전용 폴더만 사용하고, 홈/저장소 루트는 등록하지 마세요.

```json
{
  "tool": "agentify_add_watch_folder",
  "arguments": {
    "name": "inbox",
    "folderPath": "/home/$USER/DonggriInbox"
  }
}
```

## 주요 파일 구조

```text
DonggriGent/
├─ mcp-server.mjs
├─ http-api.mjs
├─ popup-policy.mjs
├─ core-bridge.mjs
├─ .kgentool/
│  └─ workflows.toml
├─ .codex/
│  └─ agents/
├─ docs/
│  ├─ index.html
│  ├─ getting-started.html
│  ├─ install.html
│  ├─ mcp-setup.html
│  └─ workflows.html
└─ tests/
```

## 운영 명령어

```bash
npm test
npm run docs:check
npm run docs:serve
```

선택: C++ 코어

```bash
npm run core:build
npm run core:test
```

## 문제 해결

### 1) `./scripts/quickstart.sh`가 PowerShell에서 실행 안 됨

- 해당 스크립트는 bash 기준입니다.
- 해결: WSL 또는 Git Bash에서 실행하거나, 아래 수동 경로를 사용합니다.

```bash
npm ci
npm run start
```

### 2) 포트 충돌/서버 중복 실행

```bash
ss -ltnp | grep 127.0.0.1
```

- 기존 실행 중인 프로세스를 종료 후 다시 시작합니다.

### 3) 로그인/팝업 진행 안 됨

- 데스크톱 창에서 먼저 수동 로그인 완료
- 필요 시 백엔드를 `chrome-cdp`로 전환해 SSO 안정성 확보

### 4) WSL에서 GUI 창이 안 보임

- WSLg 미지원 환경이면 Windows 터미널(또는 PowerShell)에서 `npm run start` 실행

## 보안 주의

- `~/.kgentool/`에는 로컬 인증/런타임 정보가 저장됩니다. Git, 이슈, 로그, 메신저에 공유하지 마세요.
- MCP 등록 경로는 신뢰 가능한 저장소 경로만 사용하세요. 자주 바뀌는 임시 경로는 피하세요.

## 라이선스/정책

- 라이선스 및 상표 정책은 저장소 정책 문서를 따릅니다.
- 민감 정보(토큰/쿠키/개인정보)는 이슈/PR/로그에 남기지 마세요.
