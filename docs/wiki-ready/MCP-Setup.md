# MCP-Setup

## 목표
Codex/Claude Code/OpenCode에서 KGentool MCP 서버를 등록하고, 도구 호출이 가능한 상태로 만드는 문서입니다.

## 서버 엔트리
- 파일: `mcp-server.mjs`
- 권장 서버명: `kgentool-desktop`

## Codex 등록
```bash
codex mcp add kgentool-desktop -- node /ABS/PATH/TO/desktop/mcp-server.mjs
```

## Claude Code 등록
```bash
claude mcp add --transport stdio kgentool-desktop -- node /ABS/PATH/TO/desktop/mcp-server.mjs
```

## OpenCode 등록
`scripts/quickstart.sh`에서 자동 등록:
```bash
./scripts/quickstart.sh --client opencode
```

## 주요 도구 이름공간
- 신규: `kgentool_query`, `kgentool_status`, `kgentool_tabs`, `kgentool_save_artifacts`, `kgentool_workflow_run`
- 호환 alias: `agentify_*` (v1 유지)

## 연결 검증
1. MCP 클라이언트에서 도구 목록 조회
2. `kgentool_query` 최소 1회 실행
3. `kgentool_status`로 상태 확인
4. 기존 자동화가 있으면 `agentify_*` alias 호출도 회귀 확인

## 문제 발생 시
- [Troubleshooting](./Troubleshooting.md)
- [FAQ](./FAQ.md)
