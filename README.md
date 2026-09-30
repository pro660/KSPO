# CheChe 프론트엔드

Figma의 **기존 사용자 화면 + 관리자 MVP**를 Next.js App Router, TypeScript, Tailwind CSS로 구현했습니다. 모바일 402px 디자인을 기준으로 작은 화면에서도 사용할 수 있습니다.

## 실행

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

기본 주소: http://localhost:3000 · 전체 화면 안내: http://localhost:3000/screens

`.env.local`의 `CHECHE_API_BASE_URL`에 Gateway 주소를 설정합니다(기본값 `http://localhost:8080`). 기존 `NEXT_PUBLIC_CHECHE_API_BASE_URL`도 호환되며, 두 값이 있으면 서버용 `CHECHE_API_BASE_URL`이 우선합니다. 현재 주소를 바꿀 필요 없이 기존 설정을 그대로 사용할 수 있습니다. 환경변수 변경 후 개발 서버를 재시작하고, 배포 시에는 다시 빌드·배포하세요. 컨테이너에서 호스트의 Gateway를 사용할 때는 `http://host.docker.internal:8080` 등 컨테이너에서 접근 가능한 주소가 필요합니다.

브라우저는 같은 출처의 `/gateway/auth/...`, `/gateway/api/...`를 호출하고 Next.js 서버가 설정된 Gateway로 전달합니다. 브라우저의 교차 출처 CORS 사전 요청과 HTTP/HTTPS 혼합 콘텐츠 문제를 줄이며, Gateway의 JWT 인증·권한 검사는 유지됩니다. ngrok 주소에는 서버에서 공식 `ngrok-skip-browser-warning` 헤더를 붙입니다. API 응답과 로그인 정보는 캐시하지 않으며 쿠키와 내부 `X-User-*` 헤더는 전달하지 않습니다. 이 방식은 Next.js 서버가 필요하며 정적 파일만 배포하는 방식은 지원하지 않습니다.

## 화면

| 구분                                         | 경로                                                                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 시작 / 회원가입 / 로그인                     | `/`, `/register`, `/login`                                                                                            |
| 사용자 지역 설정                             | `/setup-region`                                                                                                       |
| 사용자 홈 / AI 대화 / 시설 탐색              | `/home`, `/chat`, `/facilities`                                                                                       |
| 시설 상세 / 달력 / 예약                      | `/facilities/:id`, `/facilities/:id/reserve`                                                                          |
| 예약 목록 / 상세 / 취소                      | `/reservations`, `/reservations/:id`                                                                                  |
| 마이 / 개선 요청                             | `/my`, `/reports`, `/reports/new?facilityId=1`, `/reports/:id`                                                        |
| 관리자 인증 / 최초 지역 설정                 | `/admin/login`, `/admin/register`, `/admin/setup-region`                                                              |
| 지역 관리자 / 슈퍼 관리자 홈                 | `/admin` (서버 역할에 따라 분기)                                                                                      |
| 시설 조회 / 등록 / 수정 / 동기화             | `/admin/facilities`, `/admin/facilities/new`, `/admin/facilities/:id`, `/admin/facilities/:id/edit`                   |
| 사진 점검 / 분석 / 검토 / 보고서             | `/admin/inspections/new`, `/admin/inspections/:id`, `/admin/inspections/:id/confirm`, `/admin/inspections/:id/report` |
| 전체 점검 / 조치 / 안전 이력                 | `/admin/inspections`, `/admin/actions`, `/admin/history`                                                              |
| 슈퍼 관리자 지역 현황 / 관리자 관리 / 미조치 | `/admin/regions`, `/admin/admins`, `/admin/urgent`                                                                    |

지역 선택과 날짜 선택은 접근 가능한 dialog 팝업입니다. 없는 주소는 404 화면을 표시합니다.

사용자 전용 `/setup-region`은 관리 지역 설정과 별도 화면으로 구성했습니다. 서울 자치구 검색·선택, 이용 지역 미리보기, 현재 지역 자동 선택을 제공하며 마이의 **내 지역 변경**에서 다시 열 수 있습니다. 최초 로그인 시 지역이 없으면 이 화면으로 이동합니다. 저장은 `PUT /api/users/me/region`에 `{ regionCode }`를 보내고 프로필을 다시 조회하여 화면에 반영한 뒤 홈으로 이동합니다. 기존과 같은 지역은 저장 요청 없이 홈으로 이동합니다. 관리자의 최초 1회 설정 제한은 사용자에게 적용하지 않습니다.

선택·설정은 하단 시트, 짧은 안내·예약 취소는 중앙 팝업으로 표시합니다. 제목·닫기·하단 버튼은 유지하고 긴 본문만 스크롤됩니다. 처리 중에는 중복 제출과 닫기를 막습니다. 회원가입 완료는 다음 행동 하나만 제공하며, 예약·등록·수정·설정 저장은 6초간 표시되는 닫기 가능한 완료 안내를 사용합니다. 오류는 작업 위치에 유지하고 중복 표시하지 않습니다. 운동 선호 설정은 저장 전 닫으면 기존 선택을 유지합니다.

전역 기본 스타일은 `@layer base`, 화면 컴포넌트 스타일은 `@layer components`에 둡니다. `mt-*`, `gap-*`, `space-y-*` 유틸리티가 정상 적용되도록 새 전역 스타일도 해당 레이어 안에 추가하세요. 유사 사례 카드 사이와 하단 안내 사이에는 12px 간격을 사용하며, 폼과 상세 정보의 기존 16~20px 간격도 유지합니다. [Tailwind CSS 레이어 가이드](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes).

화면 상단에는 휴대폰을 흉내 낸 시계·노치·통신·배터리 표시를 넣지 않습니다. 페이지 제목과 실제 서비스 콘텐츠부터 표시하며, 모바일 화면 높이는 가상 상태 표시줄 없이 전체 뷰포트를 기준으로 계산합니다.

## API 연동

- 모든 API는 Gateway만 호출합니다. 관리자·사용자 JWT를 `checheAdminToken`, `checheUserToken`으로 분리하며 내부 `X-User-*` 헤더는 전송하지 않습니다.
- 401은 해당 토큰 제거 후 만료 안내가 있는 로그인 화면으로, 428은 지역 설정으로 이동합니다. 로그인 자체의 401은 아이디·비밀번호 확인 안내로 표시합니다. 빈 오류 응답, 204, 400/403/404/409/502/503/504, 네트워크 오류를 처리합니다. 서버 전달은 60초, 브라우저 요청은 65초 제한이 있으며 사용자 취소 신호도 유지합니다.
- 사진 등록은 FormData를 사용하며 Content-Type boundary는 브라우저가 설정합니다. 이미지 최대 크기는 15MB입니다.
- 예약은 내부 ID가 있는 운영 중 시설만 허용합니다. 06~21시 정각 1시간 슬롯, 인원 상한, 시작 전 취소, 중복 예약의 409 후 시간표 갱신을 처리합니다. 최종 권한·수용 인원·중복 검증은 서버 책임입니다.
- 지역 선택 옵션과 관리자 권한은 서버 데이터를 사용합니다. 슈퍼 관리자 통계는 서울 25개 자치구 범위이며 시설·관리자·점검 데이터를 집계합니다.
- 분석 결과는 읽기 전용입니다. 현재 명세에 결함 유형·위험도 수정 API가 없어 담당자 검토 결과와 예정일을 조치 메모로 저장합니다. 사진 한 장당 점검 한 건입니다. 재분석은 새 사진 점검으로 연결됩니다.
- 점검 상세 조회 API가 없으므로 점검 목록에서 ID로 선택합니다. 보고서는 제공된 API의 UTF-8 텍스트를 `.txt`로 다운로드합니다. PDF 생성·추가 첨부 API는 가정하지 않습니다.
- 찜한 시설과 선호 운동은 계정별 브라우저 로컬 설정입니다. 계정 찾기·비밀번호 변경은 API가 없어 준비 중 안내를 제공합니다.

### 로그인 요청이 백엔드 로그에 없을 때

- 브라우저 Network에서 `POST /gateway/auth/user/login` 또는 `/gateway/auth/admin/login` 요청을 확인합니다. 요청이 없으면 필수 입력·브라우저 검증 오류를 확인합니다. 로그인에는 회원가입 전용 최소 길이·아이디 패턴을 강제하지 않습니다.
- Next.js 실행 터미널의 `[gateway] POST /auth/user/login <상태> requestId=<ID>`로 실제 전달 시도를 확인합니다. 응답의 `X-Cheche-Request-Id`와 Gateway로 보내는 `X-Request-Id`가 같습니다. 비밀번호·토큰·요청 본문·쿼리는 로그에 남기지 않습니다. 백엔드가 해당 헤더를 로그에 기록하는지는 백엔드 설정에 달려 있습니다.
- `ERR_NGROK_6024`는 ngrok 안내 페이지, `ERR_NGROK_3004`는 불완전한 HTTP 응답(대상 포트와 HTTP/HTTPS 설정 확인), `ERR_NGROK_3200`은 오프라인 터널입니다. 터널이 꺼졌으면 프론트엔드 수정만으로 복구되지 않습니다. 백엔드 머신에서 Gateway와 ngrok를 실행하고 현재 터널 주소가 환경변수와 같은지 확인하세요.
- `NEXT_PUBLIC_CHECHE_DEMO_MODE=true`에서는 실제 백엔드를 호출하지 않습니다. 정상 연동은 demo/guard 설정을 모두 false로 두고 검증하세요.
- 상대 사진 경로는 `/gateway`를 통해 요청합니다. 외부 절대 이미지 URL은 원래 호스트를 사용하므로 해당 호스트가 직접 접근 가능해야 합니다.

### 사진 등록과 조회 오류 구분

- 사진 등록은 `POST /gateway/api/inspections`(multipart)이며, 응답의 `photoUrl`을 불러오는 `GET /gateway/inspection-photos/...`는 별도 요청입니다. GET의 404만으로 등록 실패라고 판단하지 않습니다.
- 점검·개선 요청 사진은 `RemotePhoto`에서 동일 출처 Gateway에 해당 계정의 JWT를 보내 조회하고 Blob URL로 표시합니다. 외부 이미지 호스트에는 JWT를 보내지 않습니다. 이미 `/gateway/`로 시작하는 사진 경로에는 접두사를 중복 추가하지 않습니다.
- 로딩 실패는 깨진 이미지 대신 오류 안내와 재시도 버튼으로 표시합니다. 404를 성공 이미지로 대체하거나 파일 경로를 추측해 우회하지 않습니다.
- `X-Cheche-Request-Id`가 있고 오류 JSON의 `path`가 `/inspection-photos/...`라면 프론트엔드 중계 이후 upstream에서 반환된 오류입니다. 파일 제공 경로·파일 존재 여부는 프론트엔드만으로 확인 또는 복구할 수 없습니다.

참고: [Next.js 16.3.7 서버 중계](https://nextjs.org/docs/app/guides/backend-for-frontend), [ngrok API 안내 헤더](https://ngrok.com/docs/pricing-limits/free-plan-limits), [ngrok 3004](https://ngrok.com/docs/errors/err_ngrok_3004), [ngrok 3200](https://ngrok.com/docs/errors/err_ngrok_3200).

제공된 텍스트에는 사용자 홈·검색·예약 가능 시간·예약·이용 안내 및 일부 관리자 프로필의 전체 응답 스키마가 없습니다. `src/lib/types.ts`에서 해당 응답을 정의했고, 목록은 배열 또는 `content/items/results`, 홈은 `facilities/recommendedFacilities`, 검색은 `facilities/results`, 시간표는 `slots/availableTimes`를 처리합니다. 실제 `openapi.yaml`과 Gateway 응답에 따라 이 타입과 정규화 함수를 최종 대조해야 합니다. 서버 장애를 샘플 데이터로 대체하지 않습니다.

## 샘플 미리보기

프로덕션 빌드에서는 `NEXT_PUBLIC_CHECHE_DISABLE_AUTH_GUARD` 값과 관계없이 인증·권한 가드가 적용됩니다.

페이지 접근 가드만 임시 해제하려면 `.env.local`에 `NEXT_PUBLIC_CHECHE_DISABLE_AUTH_GUARD=true`를 설정하고 개발 서버를 재시작하세요. 로그인·지역 설정 자동 이동, 관리자 화면 권한 가드, 프로필 조회 중·실패 시 화면 차단을 생략합니다. API의 401·428 응답도 자동 이동 없이 오류로 표시합니다. 실제 Gateway 인증은 유지되므로 인증이 필요한 데이터는 로그인 후 조회·저장할 수 있습니다. 원복은 해당 값을 `false`로 바꾸고 재시작하면 됩니다.

Gateway 없이 UI를 확인하려면 `.env.local`에서 `NEXT_PUBLIC_CHECHE_DEMO_MODE=true`로 명시하고 개발 서버를 재시작하세요. 샘플 배지가 표시되고 변경 사항은 브라우저에만 저장됩니다. 실제 API를 호출하지 않습니다.

- 사용자: `cheche_user` / `password123`
- 지역 관리자: `seoul-admin` / `password123`
- 슈퍼 관리자: `super-admin` / `password123`

로그인 화면의 **샘플 계정 입력** 버튼을 사용할 수 있습니다. 샘플 초기화는 브라우저 저장소의 `checheDemo:*` 항목을 삭제하세요. 실제 연동 시 반드시 demo 모드를 false로 설정하세요.

## 검증

```powershell
npm run typecheck
npm test
npm run build
```

단위 테스트는 Gateway 요청 헤더, FormData 원본 전송, 인증·오류 처리, 중계 경로 제한, 다운로드·이미지, 예약 규칙을 검증합니다. lint 스크립트는 아직 설정되어 있지 않습니다. 실제 계정 로그인·Gateway 통합 검증은 백엔드를 실행한 환경에서 진행해야 합니다.

화면 검증용 로컬 가짜 서버는 `node tests/fixtures/gateway.mjs`로 실행합니다. 별도 PowerShell 터미널에서 `$env:CHECHE_API_BASE_URL='http://127.0.0.1:9091'; node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3001`로 빌드된 앱을 실행한 뒤 `http://127.0.0.1:3001`에서 검증합니다. 이 서버는 실제 계정을 사용하지 않으며 재시작하면 초기화됩니다. 예약 취소 첫 시도는 오류, 다음 시도는 성공하도록 구성해 오류·완료 안내를 점검할 수 있습니다. 실제 연동 터미널의 환경변수는 변경하지 마세요.

로컬 화면 검증 서버에서 `first_user`로 로그인하면 지역이 없는 신규 사용자 흐름을 확인할 수 있습니다(가짜 비밀번호 사용). 지역을 저장하면 다음 프로필 조회에 반영됩니다.

테스트 관리자 아이디는 `regional`(지역 관리자), `super`(슈퍼 관리자), `suspended`(정지 계정)입니다. 기존 개발 서버와 동시에 검증하려면 별도 터미널에서 `CHECHE_DIST_DIR=.next-qa` 환경변수와 다른 포트를 사용하세요. 빌드와 실행에 동일한 출력 경로를 지정해야 합니다.

프록시는 `src/lib/paths.ts`의 명세 경로·HTTP 메서드만 전달합니다. JSON 등 일반 요청은 64KiB, 사진 multipart 요청 전체는 16MiB로 제한하며 사진 1장 제한은 15MB입니다. 신규 API를 연동할 때는 허용 목록도 갱신하세요. 서버의 JWT·리소스 소유권 검사는 별도로 유지해야 합니다.

관리자 로그인 후 `/admin/inspections/1`은 인증 헤더가 있어야 표시되는 테스트 사진과 유사 사례 카드 간격을, `/admin/inspections/2`는 사진 404 안내와 재시도를 검증합니다. 두 화면의 데이터는 로컬 fixture 전용입니다.

Figma 원본 SVG는 `public/figma`에 저장되어 임시 원격 URL에 의존하지 않습니다. 글꼴은 `@fontsource-variable/42dot-sans`를 로컬 번들링합니다.

구성 참고: [Next.js App Router](https://nextjs.org/docs/app/getting-started), [Tailwind CSS Next.js 설치](https://tailwindcss.com/docs/installation/framework-guides/nextjs).
