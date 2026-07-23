# K-Watch — 대한민국 AI 통합 관제 콘솔

**Korea-first, AI-powered situational awareness console** — 한반도 권역의 뉴스·해양·항공·안보·재난 신호를 한 화면에서 실시간으로 감시하는 오픈소스 통합 관제 대시보드입니다.

🔗 **라이브 데모**: https://k-watch.onpod.ai

[![Live Demo](https://img.shields.io/badge/%EB%9D%BC%EC%9D%B4%EB%B8%8C%20%EB%8D%B0%EB%AA%A8-k--watch.onpod.ai-brightgreen?style=flat&logo=googlechrome&logoColor=white)](https://k-watch.onpod.ai)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 프로젝트 소개

K-Watch는 [World Monitor](https://github.com/koala73/worldmonitor)(© Elie Habib, AGPL-3.0)의 뛰어난 대시보드 아키텍처를 기반으로 출발해, **한국 상황인식(situational awareness)에 필요한 거의 모든 것을 다시 만든 파생 프로젝트**입니다. UI 골격 외 데이터 계층 대부분을 한국 중심으로 재구축했고, 그 결과물 전체를 AGPL-3.0으로 다시 커뮤니티에 공개합니다.

원본 대비 주요 변경·신규 개발:

| 영역 | 내용 |
|---|---|
| 🗺 **지도·권역** | 한반도 중심 권역 프리셋, 한국 근해 감시 타일 설계, 레이어 전면 재구성 |
| 📰 **뉴스** | 한국 주요 미디어(통신사·방송·신문) 실시간 피드 통합, 종합/해양/항공/안보/재난 채널 분류, 실시간 속보 스트림 |
| 🤖 **AI 분석** | 한국어 AI 인사이트 브리프(뉴스 클러스터 요약·정세 분석), 국가별 AI 브리핑 — OpenAI 호환 어떤 LLM으로도 동작, [BizRouter](https://bizrouter.ai) 스마트 라우팅 권장 |
| 🚢 **선박(AIS)** | aisstream 웹소켓(주) + VesselAPI 스윕(보강) 이중 소스 릴레이, 월 쿼터 원자적 예약 엔진, 부산·인천·울산 입출항 이벤트 |
| 🌊 **해양 기상·수온** | [BluePin](https://bluepin.ai) 해양 관측·예측 API — 국립해양조사원·기상청 해양부이·수산과학원 통합, 연안 6구역 수온·파고·돌풍 |
| ✈️ **항공** | adsb.lol 기반 무키 실데이터 군용기 추적, 비상 스쿼크(7500/7600/7700) 감지 |
| 🎯 **관심 대상 추적** | 선박·항공기 워치리스트: 항적 오버레이, 신호 소실·장기 정지·급변침·민감 해역 진입·급강하 알림 |
| 🌏 **국가 정보** | 원본의 유료(PRO) 잠금 전면 제거 — IMF·미 재무부(국가부채), OFAC(제재), UN Comtrade(수입품목·무역흐름), World Bank(관세) 등 **전부 무료 공공 데이터로 대체** |
| 🇰🇷 **한글화** | UI·데이터 라벨·AI 출력까지 전면 한국어 |
| 📦 **셀프호스팅** | 단일 컨테이너 all-in-one 이미지(redis·릴레이·API·nginx 내장) |

원본 제작자 Elie Habib의 엔지니어링에 깊은 존경과 감사를 표합니다. 이 프로젝트가 마음에 든다면 [원본 World Monitor](https://github.com/koala73/worldmonitor)에도 ⭐를 눌러 주세요.

---

## 빠른 시작 (셀프호스팅)

```bash
git clone https://github.com/latemonk/k-watch.git
cd k-watch

# all-in-one 이미지 (redis + AIS 릴레이 + API + nginx)
docker build -f Dockerfile.onpod -t k-watch .

docker run -p 8080:8080 \
  -e AISSTREAM_API_KEY=... \
  -e VESSELAPI_API_KEY=... \
  -e LLM_API_URL=https://api.openai.com/v1 \
  -e LLM_API_KEY=... \
  -e LLM_MODEL=gpt-4o-mini \
  k-watch
```

→ http://localhost:8080

모든 키는 **선택**입니다. 키가 없으면 해당 기능만 비활성화되고 나머지는 그대로 동작합니다. 멀티 컨테이너 구성은 [SELF_HOSTING.md](SELF_HOSTING.md), 로컬 개발은 `.env.example`을 참고하세요.

## API 키 발급 안내

| 환경변수 | 기능 | 발급처 | 비고 |
|---|---|---|---|
| `AISSTREAM_API_KEY` | 실시간 선박(AIS) 웹소켓 | https://aisstream.io — 가입 후 대시보드에서 무료 발급 | 무료. 한반도 박스 구독으로 사용 |
| `VESSELAPI_API_KEY` | 선박 스윕 보강·검색·항적·입출항 | https://vesselapi.com — 가입 후 API 키 발급 | 유료(월 콜 쿼터). 내장 쿼터 엔진이 월 1,500콜 기준으로 예산 관리. `VESSELAPI_MAX_SWEEP_CALLS`, `VESSELAPI_SWEEP_INTERVAL_MS`로 조정 |
| `BIZROUTER_API_KEY` | AI 인사이트·브리프·요약 (권장) | https://bizrouter.ai — 가입 후 API 키 발급 | OpenAI 호환 LLM 게이트웨이. 기본 `route` 모델이 요청마다 최적 모델을 자동 선택(스마트 라우팅), 한국어 출력 품질 우수. `BIZROUTER_MODEL`로 모델 고정 가능 |
| `LLM_API_URL` / `LLM_API_KEY` / `LLM_MODEL` | AI 인사이트·브리프 생성 (직접 지정 시) | OpenAI 호환 엔드포인트 아무거나 — OpenAI(platform.openai.com), 자체 호스팅 vLLM 등 | 한국어 출력 품질이 좋은 모델 권장 |
| `GROQ_API_KEY` | (선택) 요약 폴백 체인 | https://console.groq.com | 무료 티어 일 14,400건 |
| `BLUEPIN_API_URL` / `BLUEPIN_API_KEY` | (선택) 해양 기상·수온(연안 6구역) | https://bluepin.ai — BluePin 해양 관측·예측 API | 기본 공개 미리보기 엔드포인트는 **키 없이 동작**해요. 전용 플랜 사용 시에만 설정 |
| `WM_SESSION_SECRET` | 브라우저 세션 HMAC | 임의 랜덤 문자열 | 미설정 시 부팅마다 자동 생성(단일 replica면 그대로 OK) |

항공(군용기) 데이터는 [adsb.lol](https://adsb.lol) 공개 API를 사용하므로 **키가 필요 없습니다.** 국가 정보 카드(국가부채·제재·무역·관세)도 IMF·OFAC·UN Comtrade·World Bank 공개 API로 동작하므로 키가 필요 없습니다. 해양 기상·수온 패널은 [BluePin](https://bluepin.ai) 해양 관측·예측 API(국립해양조사원·기상청 해양부이·수산과학원 통합)를 사용하며, 기본 공개 엔드포인트는 키 없이 동작합니다. 그 밖의 선택 키(FRED, NASA FIRMS 등 원본 기능용)는 `.env.example`에 정리돼 있습니다.

---

## English Summary

K-Watch is a Korea-focused, AI-powered situational awareness console derived from [World Monitor](https://github.com/koala73/worldmonitor) by Elie Habib (AGPL-3.0). While it inherits the excellent dashboard architecture of the original, most of the data plane has been rebuilt for the Korean theater: Korean major-media news feeds and breaking-news streams, a dual-source AIS vessel relay (aisstream websocket + VesselAPI sweeps with an atomic monthly-quota engine), keyless military aviation tracking via adsb.lol, vessel/aircraft watchlists with anomaly alerts (signal loss, loitering, sharp turns, sensitive-water entry, emergency squawks), Korean-language AI insight briefs that work with any OpenAI-compatible LLM, port arrival/departure events for Busan/Incheon/Ulsan, full Korean localization, and a single-container self-hosting image. The upstream paid (PRO) gates were removed entirely and replaced with free public data sources (IMF, US Treasury, OFAC, UN Comtrade, World Bank).

We are deeply grateful to the original author — if you like this project, please star the [original World Monitor](https://github.com/koala73/worldmonitor) too.

---

## 라이선스

이 프로젝트는 **GNU AGPL-3.0**으로 배포됩니다. [LICENSE](LICENSE) 참조.

- 원본: World Monitor — Copyright (C) 2024-2026 Elie Habib ([koala73/worldmonitor](https://github.com/koala73/worldmonitor))
- 수정본: K-Watch modifications — Copyright (C) 2026 AI3 Inc. ([latemonk](https://github.com/latemonk))
- 이 저장소는 원본을 수정한 파생 저작물이며(수정일: 2026-07), 전체 소스가 AGPL-3.0 조건으로 공개됩니다. 네트워크로 이 소프트웨어를 서비스하는 경우 AGPL §13에 따라 이용자에게 소스 접근을 제공해야 합니다.

## 기여

이슈·PR 환영합니다. 보안 취약점은 공개 이슈 대신 [GitHub 비공개 취약점 신고](../../security/advisories/new)를 이용해 주세요.
