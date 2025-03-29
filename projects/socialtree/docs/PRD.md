# SocialTree PRD

## 🎯 프로젝트 개요

- **프로젝트명**: SocialTree
- **도메인**: [https://socialtree.vercel.app](https://socialtree.vercel.app)
- **디자인 방향**:
  - 테마: **모던하고 대중적인 Web2 UI**
  - primary-color: **파란색 계열**
- **목표**: 콘텐츠 제작자와 홍보자가 모두 보상을 받을 수 있는 금융 정보 SocialFi 플랫폼 구축.  
  블록체인 해커톤용 프로젝트이기 때문에 1주일 내 구현 가능한 데모용 MVP를 목표로 함. 따라서 UI는 mockup 수준으로 간단히, 핵심인 스마트컨트랙트 + 재귀 커미션 분배 로직은 실제 동작하도록 구성하는 것이 핵심.  
  콘텐츠는 유료 구독 모델로 제공되며, 초대 보상 구조는 재귀형 커미션(20%) 방식으로 동작.  
  Web2 UX에 Web3 기능(MetaMask, EVM, HashKey 연동)을 통합하여 친숙하면서 탈중앙화된 콘텐츠 플랫폼 구현.

## 🧱 핵심 구조

- **Frontend**: 구독/추천 흐름만 보여주는 mock 화면
- **Backend**: 추천 트리 관리 + 기본 API
- **Blockchain**: 실제 스마트컨트랙트 배포 및 **재귀 커미션 분배 로직 완성**

## 🧩 핵심 기능

| 기능                     | 설명                                                       |
| ------------------------ | ---------------------------------------------------------- |
| 콘텐츠 등록              | 유료 콘텐츠 정보 입력 및 목록 제공                         |
| 유저 가입/지갑 연동      | MetaMask 기반 로그인 + 추천 코드 기반 유입 추적            |
| 콘텐츠 구독              | 사용자는 유료 콘텐츠를 구독하며 추천 코드를 통해 유입 가능 |
| 추천 링크                | 콘텐츠별로 유저가 개별 추천 링크 생성                      |
| 재귀 커미션 분배         | 직접 추천자는 20%, 상위는 그 20%, 그 상위는 또 그 20% 분배 |
| 마이페이지 보상 대시보드 | 본인의 커미션 수익 확인 및 출금 가능                       |

---

## 🔧 기술 스택

- **Backend**: Next.js API Route, Supabase (DB + Auth)
- **Frontend**: Next.js, Tailwind CSS 4, shadcn, Zustand, Axios, TanStack Query, react-hook-form, lucide-react
- **Blockchain**: Solidity (EVM 기반), Ethers.js, HashKey Chain, MetaMask

---

## 📂 데이터 모델 (요약)

| 테이블          | 주요 필드                                        |
| --------------- | ------------------------------------------------ |
| `users`         | id, wallet_address                               |
| `contents`      | id, title, price, creator_id                     |
| `referrals`     | user_id, content_id, referrer_id, referral_code  |
| `subscriptions` | user_id, content_id, price                       |
| `commissions`   | user_id, content_id, from_user_id, level, amount |

---

## ✅ Task Break Checklist

### 초기 세팅 및 프로젝트 구성

- [x] Next.js 프로젝트 초기화 (`app` 디렉토리 or `pages` 디렉토리 기준 결정)
- [x] Tailwind CSS 4 + PostCSS 설치 및 설정
- [x] `shadcn/ui` 초기 설치 (`npx shadcn-ui@latest init`)
- [x] 환경 변수 세팅 (`.env.local`: Supabase, RPC 등)
- [x] Supabase 프로젝트 생성 및 키 발급
- [x] Ethers.js 및 MetaMask 연동 세팅

---

### 기본 UI 레이아웃 & 라우팅 구조 세팅

- [x] 전체 레이아웃 컴포넌트 (`<Header />`, `<Main />`, `<Footer />`)
- [x] Primary color 설정 (Tailwind에서 `blue` 계열로 설정)
- [x] 메인 페이지 (`/`) – 프로모션 배너, 플렛폼 콘텐츠 리스트 -> mockup
- [ ] 콘텐츠 리스트 페이지 (`/contents`)
- [ ] 콘텐츠 상세 페이지 (`/contents/:id`)
- [ ] 로그인 / 지갑 연결 페이지 (`/login`)
- [ ] 마이페이지 (`/mypage`) - 구독중인 콘텐츠, 추천 보상 내역, 다음달 결제 예정 금액, 커미션 출금

---

### 스마트컨트랙트 작성 및 배포

보상 구조: Recursive Commission Logic
구독시 추천자에게 20% 전달, 상위 추천자로 올라가며 20%씩 재귀 분배 (최소 단위 미만이면 중단)

- [ ] `subscribe(address referrer)` + 유저 트리 저장
- [ ] `distribute(uint256 amount)` – 재귀 분배
- [ ] `getCommission(address)` – 커미션 조회
- [ ] `withdraw()` – 수령
- [ ] 하드햇 환경 구성 + 배포 스크립트 작성

> ※ 핵심은 스마트컨트랙트에서 구동 → 백엔드는 단순 연동 보조 역할

---

### ⚙ Backend API (MVP)

- [ ] `POST /api/users/signup`: 추천코드 포함 유저 생성
- [ ] `GET /api/users/:id/referrals`: 하위 유저 리스트 조회
- [ ] `GET /api/rewards/:id`: 커미션 내역 조회 (on-chain 또는 오프체인 캐싱)

---

### 지갑 연동 및 로그인 흐름

- [ ] MetaMask 연결 (ethers.js로 주소 획득)
- [ ] 연결된 지갑 주소 상태관리 (Zustand 사용)
- [ ] Supabase 연동 (로그인 없이 지갑 기반 유저 등록)
- [ ] 지갑 서명 후 유저 등록 (signMessage → 인증용)

---

### 추천 링크 흐름 구현

- [ ] 지갑 연결 후 추천 코드 발급 (`/referral`)
- [ ] 공유 가능한 링크 생성 (`https://yourapp.com/?ref=0x123...`)
- [ ] 추천 링크로 접속 시, `referrer` 상태에 저장

---

### 콘텐츠 구독 및 보상 흐름

- [ ] 콘텐츠 카드 UI (shadcn Card 컴포넌트 활용), 내용은 mock
- [ ] "구독하기" 버튼 클릭 → 스마트컨트랙트 `subscribe()` 호출
- [ ] 구독 성공 → 대시보드 이동

---

### 커미션 보기 UI (API 또는 스마트컨트랙트 연동)

- [ ] 나의 보상 합계 표시 (`getCommission(address)`)
- [ ] 트리 구조 (직접 추천인, 간접 추천인 수 mock으로 표시)
- [ ] "보상 인출하기" 버튼 → `withdraw()` 실행

---

## ✅ 전체 아키텍처 흐름 (MVP 기준)

```plaintext
[사용자 A] → [추천 링크 공유] → [사용자 B 구독]

1. B의 지갑 → subscribe(referrer: A)
2. 스마트컨트랙트: 커미션 트리 등록 + 20% 보상 분배 (재귀 실행)
3. A, 상위 유저들에게 커미션 누적됨
4. A가 withdraw() 호출 시, 커미션 수령
```

물론입니다. 콘텐츠별 추천 트리를 포함한 보완된 설계를 반영하여, 전체 PRD와 함께 **개발 파트별 Task Breakdown (Frontend, Backend, Smart Contract)**을 정리해드리겠습니다.
