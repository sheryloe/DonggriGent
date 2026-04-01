# Installation

## 요구사항
- Node.js 20 이상(권장 22)
- npm
- GUI 환경(Electron 창 실행 가능)
- 선택: C++ 코어 빌드를 위한 CMake + C++20 컴파일러

## 권장 설치(Quickstart)
```bash
git clone https://github.com/agentify-sh/desktop.git
cd desktop
./scripts/quickstart.sh
```

자주 쓰는 옵션:
```bash
./scripts/quickstart.sh --foreground
./scripts/quickstart.sh --show-tabs
./scripts/quickstart.sh --client codex
./scripts/quickstart.sh --client all
```

## 수동 설치
```bash
npm ci
npm run start
```

락 파일 충돌 또는 의존성 이슈 시:
```bash
npm install
```

## C++ 코어 빌드
```bash
npm run core:build
npm run core:test
```

현재 저장소는 C++ 코어 skeleton 단계이며, 일부 런타임은 JS fallback 경로를 유지합니다.

## 기본 경로
- 상태 루트: `~/.kgentool/`
- 워크플로 파일: `.kgentool/workflows.toml`
- 에이전트 정의: `.codex/agents/`
- MCP 서버 엔트리: `mcp-server.mjs`

## 다음 문서
- [Quickstart](./Quickstart.md)
- [MCP-Setup](./MCP-Setup.md)
- [Browser-Backends](./Browser-Backends.md)
