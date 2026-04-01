# Quickstart (5분 시작)

## 1) 앱 실행
```bash
./scripts/quickstart.sh
```

## 2) 벤더 로그인
1. 제어 센터에서 기본 탭을 엽니다.
2. 벤더(ChatGPT/Claude/Gemini 등) 계정으로 로그인합니다.
3. 입력창이 활성화되어 있는지 확인합니다.

## 3) MCP 등록 (필요 시)
Codex:
```bash
codex mcp add kgentool-desktop -- node /ABS/PATH/TO/desktop/mcp-server.mjs
```

Claude Code:
```bash
claude mcp add --transport stdio kgentool-desktop -- node /ABS/PATH/TO/desktop/mcp-server.mjs
```

## 4) 첫 질의 실행
```json
{
  "tool": "kgentool_query",
  "arguments": {
    "key": "quickstart",
    "prompt": "현재 저장소 아키텍처를 핵심 5줄로 요약해줘."
  }
}
```

## 5) 상태 확인
```json
{
  "tool": "kgentool_status",
  "arguments": {
    "key": "quickstart"
  }
}
```

## 빠른 점검 체크리스트
- 제어 센터가 정상 표시되는가
- 로그인 후 프롬프트 입력이 가능한가
- `kgentool_query` 응답이 도착하는가
- `kgentool_status`에 runtime 정보가 보이는가

## 다음 문서
- [MCP-Setup](./MCP-Setup.md)
- [Workflows](./Workflows.md)
- [Troubleshooting](./Troubleshooting.md)
