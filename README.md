# SICU LINK

외과 ICU 병상 현황과 간호 업무를 살펴보는 공개 시연 사이트입니다.
화면과 데이터는 기존 공개 시연 버전 그대로이며, 가상 시연 데이터로 동작합니다.

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

- 기존 시연: https://sicu-care-board-v3-20261016.spicyroot128.chatgpt.site/
- 공개 버전: 25
- 원본 소스 커밋: `d4a36f1535bafdccb2297ca332a889e714c97dc3`
- 화면 파일과 시연 데이터는 기존 배포 파일을 변경 없이 복사했습니다.
- `/api/state`는 브라우저 안의 스냅샷 어댑터가 제공하며, 실제 병원 서버나 모델 API를 호출하지 않습니다.

GitHub Pages 공식 안내: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
