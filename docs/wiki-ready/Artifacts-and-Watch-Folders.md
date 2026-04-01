# Artifacts and Watch Folders

## 목적
브라우저에서 생성된 결과물을 로컬 파일 시스템으로 안전하게 저장하고, 다음 작업 입력으로 재활용하기 위한 운영 문서입니다.

## 산출물 저장
기본 도구:
- `kgentool_save_artifacts`

예시:
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

운영 팁:
1. 탭 키를 작업 단위로 분리
2. 저장 대상 경로/보존 기간을 팀 규칙으로 고정
3. 재사용할 파일만 attachments로 선별 투입

## 워치 폴더
핵심 동작:
- 특정 로컬 폴더를 등록
- 변경 파일을 스캔/인덱싱
- 다음 질의 문맥에 포함 가능

권장 정책:
- 입력 폴더(`incoming`)와 완료 폴더(`processed`)를 분리
- 대용량 바이너리는 별도 보관소로 이동
- 실패 파일은 `failed` 폴더로 분리해 재처리

## 상태/관측
- `kgentool_status`로 active query와 최근 결과 확인
- 탭 단위로 저장/조회하면 추적성이 좋아집니다

## 관련 문서
- [Workflows](./Workflows.md)
- [Troubleshooting](./Troubleshooting.md)
