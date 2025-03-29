# Social Tree

소셜 네트워크상의 콘텐츠 구독 및 수수료 분배를 위한 탈중앙화 어플리케이션

## 프로젝트 개요

Social Tree는 콘텐츠 생성자와 추천인들 사이의 투명한 수수료 분배 시스템을 구현한 Web3 기반 애플리케이션입니다.
사용자는 콘텐츠에 구독할 때 추천인 코드를 통해 참여할 수 있으며, 구독 수수료는 스마트 컨트랙트를 통해
콘텐츠 생성자와 추천인 사이에 자동으로 분배됩니다.

## 주요 기능

- 지갑 주소를 통한 사용자 등록
- 추천 코드를 통한 추천인 연결
- 콘텐츠 구독 및 수수료 분배
- 추천 관계에 따른 멀티 레벨 수수료 분배
- 온체인/오프체인 수수료 조회

## 기술 스택

- 프론트엔드: Next.js, TypeScript, React
- 백엔드: Next.js API Routes, Supabase
- 블록체인: Solidity, Hardhat, HashKey Chain (테스트넷)
- 데이터베이스: Supabase (PostgreSQL)

## 시작하기

### 설치

```bash
git clone https://github.com/your-username/socialtree.git
cd socialtree
npm install
```

### 환경 변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 필요한 환경 변수를 설정합니다:

```bash
cp .env.example .env.local
```

필요한 환경 변수:

- Supabase URL 및 API 키
- 스마트 컨트랙트 주소
- HashKey 체인 RPC URL

### 개발 서버 실행

```bash
npm run dev
```

### 스마트 컨트랙트 배포

```bash
cd hashkey_contract
npm install
npx hardhat run scripts/deploy.js --network hashkey
```

## API 엔드포인트

### 사용자 관리

- `POST /api/users/signup`: 지갑 주소로 사용자 생성
- `GET /api/users/:id/commissions`: 사용자의 콘텐츠별 수수료 내역 조회

### 콘텐츠 관리

- `POST /api/contents`: 콘텐츠 생성
- `GET /api/contents`: 콘텐츠 목록 조회
- `GET /api/contents/:id`: 콘텐츠 상세 정보 조회
- `GET /api/contents/:id/referrals`: 특정 콘텐츠의 직접 추천 내역 조회

### 구독 관리

- `POST /api/subscriptions`: 콘텐츠 구독 생성 (추천 코드 처리 포함)
- `GET /api/subscriptions/:id`: 구독 상세 정보 조회

## Demo

- Demo Video: [YouTube link]()
- Project Deck: [Google Slides link]()

## Team

- Jongyong Lim - Full Stack Developer
- Huiwon Lim - Full Stack Developer
- Changmin Oh - Product Designer, Marketer
