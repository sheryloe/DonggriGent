# KGentool Wiki Home

KGentool Wiki는 운영형 참조 문서입니다.  
README는 유입/개요, GitHub Pages는 도입/설치, Wiki는 실무 운영 기준을 담당합니다.

## 빠른 링크
- [Installation](./Installation.md)
- [Quickstart](./Quickstart.md)
- [MCP-Setup](./MCP-Setup.md)
- [Browser-Backends](./Browser-Backends.md)
- [Workflows](./Workflows.md)
- [Artifacts-and-Watch-Folders](./Artifacts-and-Watch-Folders.md)
- [Architecture](./Architecture.md)
- [Troubleshooting](./Troubleshooting.md)
- [FAQ](./FAQ.md)

## 제품 요약
- 한국어 우선 AI 데스크톱 워크플로 도구
- 로컬 브라우저 제어 + MCP 연동 + 워크플로 자동화
- 지원 벤더(6개): `chatgpt`, `claude`, `perplexity`, `gemini`, `grok`, `aistudio`
- 기본 상태 경로: `~/.kgentool/`

## 핵심 운영 원칙
1. 탭 키(`key`)를 명시해 세션을 고정합니다.
2. 산출물 저장 루프를 표준화합니다.
3. 워치 폴더를 통해 입력 파일 흐름을 자동화합니다.
4. 워크플로는 `.kgentool/workflows.toml` 기준으로 버전 관리합니다.
5. 신규 도구는 `kgentool_*` 기준, 기존 자동화는 `agentify_*` alias로 점진 이전합니다.

## 문서 구조
- 도입형 문서(GitHub Pages): `docs/*.html`
- 운영형 문서(Wiki-ready): `docs/wiki-ready/*.md`
- 발표 자료: `docs/slides/kgentool-overview.md`
- 시각 자료: `docs/assets/infographics/*.svg`
