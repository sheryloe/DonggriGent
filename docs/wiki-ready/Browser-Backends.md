# Browser-Backends

KGentool은 두 가지 브라우저 백엔드를 지원합니다.

## 비교
| 구분 | `electron` | `chrome-cdp` |
|---|---|---|
| 장점 | 설치/시작이 단순함 | SSO/로그인 안정성이 높음 |
| 단점 | 특정 SSO 플로우에서 실패 가능 | 초기 설정이 다소 복잡 |
| 추천 상황 | 빠른 데모, 로컬 단독 사용 | 운영 환경, 인증 민감 워크플로 |

## 선택 기준
1. 기본은 `electron`으로 시작
2. 인증 팝업/SSO 이슈가 있으면 `chrome-cdp` 전환
3. 팀 운영 문서에는 백엔드 기준을 명시해 환경 편차를 줄임

## 운영 팁
- 일반 Chrome이 동일 프로필을 점유 중이면 충돌할 수 있습니다.
- 로그인/캡차 처리 구간은 자동화 대상이 아닙니다.
- 탭 키를 백엔드별로 분리하면 디버깅이 수월합니다.

## 관련 문서
- [Installation](./Installation.md)
- [Troubleshooting](./Troubleshooting.md)
