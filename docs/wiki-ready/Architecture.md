# Architecture

## 고수준 구조
- UI + Electron Shell: 창/탭 생성, 브라우저 액션 실행, 파일 업로드/수집
- Browser Backend: `electron` 또는 `chrome-cdp`
- C++ Core Daemon: 상태/정책/워크플로/메타데이터/이벤트
- MCP Server + HTTP API: 외부 인터페이스 제공

## Shell ↔ Core RPC
전송 방식:
- stdio 양방향 NDJSON

Envelope:
```json
{ "id": "1", "type": "command", "name": "session.ensure", "payload": {} }
{ "id": "1", "type": "response", "ok": true, "result": {} }
{ "type": "event", "name": "runtime.progress", "requestId": "1", "payload": {} }
```

Shell → Core 명령:
- `session.ensure`
- `query.run`
- `query.stop`
- `status.get`
- `artifacts.save`
- `artifacts.list`
- `bundles.list/get/save/delete`
- `watch_folders.list/add/delete/open/scan`
- `config.read/write`
- `workflow.run`

Core → Shell 브라우저 액션:
- `browser.open_tab`
- `browser.navigate`
- `browser.ensure_ready`
- `browser.query`
- `browser.stop`
- `browser.read_page`
- `browser.save_artifacts`

## 벤더 제어 구조
- 기존 단일 `ChatGPTController` 중심 구조를 분해
- `VendorControllerRegistry + WebPromptController`로 분리
- `vendor-profiles/`에서 벤더별 selector/ready/popup/artifact 규칙 관리

## 호환성 전략
- 신규 이름공간: `kgentool_*`
- v1 호환 alias: `agentify_*` 동일 스키마 유지
- 외부 자동화는 즉시 중단하지 않고 점진 이전

## 관련 문서
- [Workflows](./Workflows.md)
- [MCP-Setup](./MCP-Setup.md)
