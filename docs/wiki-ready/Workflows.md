# Workflows

## 워크플로 설정 파일
- 경로: `.kgentool/workflows.toml`
- 기본 스키마:
  - `workflow.<name>.default_vendor`
  - `tab_key_prefix`
  - `steps=[{agent,vendor,mode,input,output}]`

## 기본 워크플로
- `cpp_refactor`: `supervisor -> cpp-pro-kg -> reviewer-kg`
- `vendor_hardening`: `supervisor -> vendor-profile-kg -> reviewer-kg`
- `mcp_extension`: `supervisor -> mcp-contract-kg -> reviewer-kg`

## 실행 예시
```json
{
  "tool": "kgentool_workflow_run",
  "arguments": {
    "workflowName": "cpp_refactor",
    "prompt": "C++ 코어 전환 기준으로 리팩토링 플랜과 코드 리뷰를 수행해줘."
  }
}
```

## 탭 키 규칙
- 권장 규칙: `<workflow>:<agent>:<vendor>`
- 같은 키를 사용하면 동일 세션을 재사용
- 키 충돌을 피하기 위해 팀 표준 prefix를 정의

## 운영 가이드
1. Supervisor는 범위/입출력 규약을 명확히 정의
2. Executor는 지정된 스텝 책임 범위만 처리
3. Reviewer는 회귀 리스크와 계약 호환성 우선 검증

## 관련 문서
- [Artifacts-and-Watch-Folders](./Artifacts-and-Watch-Folders.md)
- [Architecture](./Architecture.md)
