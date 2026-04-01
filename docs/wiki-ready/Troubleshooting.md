# Troubleshooting

## 1. 앱은 켜졌는데 질의가 진행되지 않음
확인 순서:
1. 벤더 탭이 실제로 열려 있는지 확인
2. 로그인 완료 후 입력창 ready 상태 확인
3. 같은 `key`에서 이미 active query가 실행 중인지 확인
4. `kgentool_status` 호출 결과 확인

## 2. SSO/로그인 실패
대응:
1. 인증 팝업 차단 해제
2. 백엔드를 `chrome-cdp`로 전환
3. 기존 Chrome 프로필 충돌 여부 확인

## 3. MCP 도구가 보이지 않음
점검:
1. 등록 커맨드의 `mcp-server.mjs` 경로 확인
2. 서버명(`kgentool-desktop`) 일치 여부 확인
3. MCP 클라이언트 재시작 후 도구 목록 재조회

## 4. 기존 자동화 스크립트가 깨짐
원인:
- 신규 이름공간(`kgentool_*`) 전환 중 alias 호출 누락

대응:
1. 단기: `agentify_*` alias 유지 호출
2. 중기: 스크립트를 `kgentool_*` 기준으로 순차 전환

## 5. 산출물 저장 실패
점검:
1. 파일 권한/경로 존재 여부
2. 해당 탭에서 직전 생성물 존재 여부
3. 모드(`images/files/all`) 설정 확인

## 장애 보고 템플릿
아래 6개를 함께 전달하면 재현 속도가 빨라집니다.
- `key`
- `vendor`
- `browser backend`
- 호출한 tool 이름
- 에러 메시지
- 재현 절차
