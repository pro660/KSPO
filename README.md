# CheChe 프론트엔드

Figma의 **기존 사용자 화면 + 관리자 MVP**를 Next.js App Router, TypeScript, Tailwind CSS로 구현했습니다. 모바일 402px 디자인을 기준으로 작은 화면에서도 사용할 수 있습니다.

## 실행

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

기본 주소: http://localhost:3000 · 전체 화면 안내: http://localhost:3000/screens

`.env.local`의 `NEXT_PUBLIC_CHECHE_API_BASE_URL` 기본값은 `http://localhost:8080`입니다. Gateway에서 프론트엔드 출처의 CORS 요청과 Authorization 헤더를 허용해야 합니다. HTTPS 배포 환경에서는 Gateway도 HTTPS 주소를 사용하세요.

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

## API 연동

- 모든 API는 Gateway만 호출합니다. 관리자·사용자 JWT를 `checheAdminToken`, `checheUserToken`으로 분리하며 내부 `X-User-*` 헤더는 전송하지 않습니다.
- 401은 해당 토큰 제거 후 로그인, 428은 지역 설정으로 이동합니다. 빈 오류 응답, 204, 400/403/404/409/503, 네트워크 오류를 처리합니다.
- 사진 등록은 FormData를 사용하며 Content-Type boundary는 브라우저가 설정합니다. 이미지 최대 크기는 15MB입니다.
- 예약은 내부 ID가 있는 운영 중 시설만 허용합니다. 06~21시 정각 1시간 슬롯, 인원 상한, 시작 전 취소, 중복 예약의 409 후 시간표 갱신을 처리합니다. 최종 권한·수용 인원·중복 검증은 서버 책임입니다.
- 지역 선택 옵션과 관리자 권한은 서버 데이터를 사용합니다. 슈퍼 관리자 통계는 서울 25개 자치구 범위이며 시설·관리자·점검 데이터를 집계합니다.
- 분석 결과는 읽기 전용입니다. 현재 명세에 결함 유형·위험도 수정 API가 없어 담당자 검토 결과와 예정일을 조치 메모로 저장합니다. 사진 한 장당 점검 한 건입니다. 재분석은 새 사진 점검으로 연결됩니다.
- 점검 상세 조회 API가 없으므로 점검 목록에서 ID로 선택합니다. 보고서는 제공된 API의 UTF-8 텍스트를 `.txt`로 다운로드합니다. PDF 생성·추가 첨부 API는 가정하지 않습니다.
- 찜한 시설과 선호 운동은 계정별 브라우저 로컬 설정입니다. 계정 찾기·비밀번호 변경은 API가 없어 준비 중 안내를 제공합니다.

제공된 텍스트에는 사용자 홈·검색·예약 가능 시간·예약·이용 안내 및 일부 관리자 프로필의 전체 응답 스키마가 없습니다. `src/lib/types.ts`에서 해당 응답을 정의했고, 목록은 배열 또는 `content/items/results`, 홈은 `facilities/recommendedFacilities`, 검색은 `facilities/results`, 시간표는 `slots/availableTimes`를 처리합니다. 실제 `openapi.yaml`과 Gateway 응답에 따라 이 타입과 정규화 함수를 최종 대조해야 합니다. 서버 장애를 샘플 데이터로 대체하지 않습니다.

## 샘플 미리보기

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

단위 테스트는 Gateway 요청 헤더, FormData, 인증·오류 처리와 예약 규칙을 검증합니다. 실제 Gateway 통합 검증은 백엔드를 실행한 환경에서 진행해야 합니다.

Figma 원본 SVG는 `public/figma`에 저장되어 임시 원격 URL에 의존하지 않습니다. 글꼴은 `@fontsource-variable/42dot-sans`를 로컬 번들링합니다.

구성 참고: [Next.js App Router](https://nextjs.org/docs/app/getting-started), [Tailwind CSS Next.js 설치](https://tailwindcss.com/docs/installation/framework-guides/nextjs).
