# SICU LINK

외과 ICU 병상 현황과 간호 업무를 살펴보는 공개 시연 사이트입니다.
가상 시연 데이터로 동작하며, SICU LINK · FINAL 공개본의 상세 기능을 포함합니다.

## 포함된 화면

- 환자 기록·활력 추이·검사 결과 검색·영상 이력·환자 기록 기반 상담과 SBAR
- 월별 병상 재생, 입실 준비와 LINK 제안, 기존 지도에 연결된 운영 시연
- 시연용 예측 배지와 입실 이야기·운영 검토 보조 화면

AI 상담은 원본 공개 사이트와 동일하게 **미리 작성된 시연 응답**을 표시합니다.
실제 LLM 호출은 별도 서버와 모델 설정이 필요하며, GitHub Pages에 API 키를 넣지 않습니다.
영상 탭의 흉부 도식은 설명용 그림이며 실제 환자 X-ray가 아닙니다.
처음 로딩 화면과 진행 막대는 요청에 따라 2.35초를 유지합니다.

## GitHub Pages 배포

1. `yerinx/sicu-link` 공개 저장소의 기본 브랜치에 이 폴더의 **내용물**을 올립니다.
2. Settings → Pages → Source에서 **Deploy from a branch**를 선택합니다.
3. 기본 브랜치와 **/(root)**를 선택하고 Save를 누릅니다.
4. 배포가 끝나면 `https://yerinx.github.io/sicu-link/`를 엽니다.

한국어 SICU 화면:
`https://yerinx.github.io/sicu-link/?lang=ko&workspace=hospital&hospital=A&ward=SICU#ward`

방문자는 GitHub 로그인 없이 접속할 수 있습니다.
설치와 별도 서버가 필요하지 않습니다. HTML 파일을 더블클릭하면 브라우저의 로컬 파일 제한으로 데이터가 로드되지 않을 수 있으므로 웹서버로 제공해야 합니다.

## 로컬 확인

이 폴더에서 `python -m http.server 8080`을 실행한 뒤 `http://localhost:8080/`에 접속합니다.

## 출처

- 상세 기능의 원본: https://sicu-link-final-20261017.spicyroot128.chatgpt.site/
- 상세 기능의 공개 버전: 3
- 상세 기능의 소스 커밋: `a34e47fabba5d1ee2c261fc9c6506e0953e22d2b`
- 상세 공개본의 전체 화면·시연 모듈을 가져오고 기존 2.35초 로딩을 유지했습니다.
- 정적 상태 경로 `api/demo/status`는 실제 LLM이 연결되지 않았음을 반환합니다.
- `/api/state`는 브라우저 안의 스냅샷 어댑터가 제공하며, 실제 병원 서버나 모델 API를 호출하지 않습니다.

GitHub Pages 공식 안내: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
