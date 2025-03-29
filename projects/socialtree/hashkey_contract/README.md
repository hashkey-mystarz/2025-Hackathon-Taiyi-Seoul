# SocialTree 커미션 시스템

해시키(HashKey) 체인 기반 SocialTree 플랫폼의 월별 구독 및 추천인 커미션 관리 시스템입니다.

## 기능

이 스마트 컨트랙트 시스템은 다음 기능을 제공합니다:

- 월별 콘텐츠 구독 서비스
- 사용자 추천인 설정 및 레퍼럴 네트워크 관리
- 구독 취소 시 레퍼럴 네트워크 자동 이양
- 구독 결제 및 커미션 자동 분배
- 재귀적 다단계 커미션 구조 (각 레벨마다 20%씩 감소)
- 커미션 인출 및 관리

## 설치 및 설정

### 환경 설정

1. 프로젝트 클론 및 종속성 설치:

```bash
git clone https://github.com/your-username/socialtree-commission.git
cd socialtree-commission
npm install
```

2. `.env` 파일 생성:

```
# 테스트넷/메인넷 배포에 필요한 개인키
PRIVATE_KEY=your_wallet_private_key_here

# HSK 토큰 테스트넷 주소 (기본값: 0xf4b679Fd5b7D9dF69Dcf4c3F7a71d7B2a2A759aF)
HSK_TOKEN_ADDRESS=0xf4b679Fd5b7D9dF69Dcf4c3F7a71d7B2a2A759aF

# HSK 토큰 메인넷 주소 (기본값: 0x0ef15a1c7a49429a36cb46d4da8c43176be5ca5d)
HSK_MAINNET_TOKEN_ADDRESS=0x0ef15a1c7a49429a36cb46d4da8c43176be5ca5d
```

### 컴파일

```bash
npx hardhat compile
```

## 테스트

테스트를 실행하기 전에 지역 개발 노드를 실행하세요:

```bash
npx hardhat node
```

테스트 실행:

```bash
npx hardhat test
```

## 배포

### 테스트넷 배포

```bash
npx hardhat run scripts/deploy.js --network hashkeyTestnet
```

### 메인넷 배포

```bash
npx hardhat run scripts/deploy.js --network hashkeyMainnet
```

## HSK 토큰

### 테스트넷 HSK 토큰

테스트넷 HSK 토큰은 해시키 테스트넷 수도꼭지(faucet)에서 얻을 수 있습니다.

- 테스트넷 주소: https://hashkeychain-testnet-explorer.alt.technology
- 테스트 토큰 요청: https://faucet.hashkeychain-testnet.alt.technology/

### 메인넷 HSK 토큰

메인넷 배포 시 실제 HSK 토큰 주소를 사용합니다:

1. 메인넷 HSK 토큰 주소는 `.env` 파일에 설정되어 있습니다(기본값: `0x0ef15a1c7a49429a36cb46d4da8c43176be5ca5d`).
2. 메인넷 배포 전 충분한 HSK 토큰이 지갑에 있는지 확인하세요.
3. 해시키 메인넷 주소: https://hashkey.blockscout.com

## 해시키 체인 네트워크 정보

### 테스트넷

- 네트워크 이름: HashKey Chain Testnet
- RPC 엔드포인트: https://hashkeychain-testnet.alt.technology
- 체인 ID: 133
- 네이티브 토큰: HSK
- 블록 탐색기: https://testnet.hashscan.io

### 메인넷

- 네트워크 이름: HashKey Chain
- RPC 엔드포인트: https://mainnet.hsk.xyz
- 체인 ID: 177
- 네이티브 토큰: HSK
- 블록 탐색기: https://hashkey.blockscout.com

## 스마트 컨트랙트 사용하기

### 프론트엔드 연동

프론트엔드에서 스마트 컨트랙트와 연동하려면:

1. 컨트랙트 ABI와 주소 가져오기:

```javascript
const contractAddress = '0x8919d5A2bB03a7E76d1Dc14322a506A9AcF1FF3D'; // 배포된 컨트랙트 주소
const contractABI = require('./artifacts/contracts/SocialTreeCommission.sol/SocialTreeCommission.json').abi;
```

2. ethers.js로 컨트랙트 인스턴스 생성:

```javascript
// ethers.js 예시
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, contractABI, signer);
```

3. 컨트랙트 함수 호출:

```javascript
// 추천인 설정
await contract.setReferrer(referrerAddress);

// 구독하기 (네이티브 HSK 토큰으로 결제)
await contract.subscribe(contentId, referrerAddress, { value: ethers.parseEther('0.1') });

// 구독 취소
await contract.cancelSubscription(contentId);

// 구독 상태 확인
const [isActive, endTime] = await contract.getSubscriptionStatus(userAddress, contentId);

// 레퍼럴 목록 조회
const referredUsers = await contract.getReferredUsers(userAddress);

// 커미션 출금
await contract.withdraw();
```

## 커미션 분배 방식

1. 콘텐츠 구독 가격의 80%는 콘텐츠 생성자에게 직접 지급됩니다.
2. 나머지 20%는 추천인 트리를 따라 분배됩니다:
   - 직접 추천인: 커미션 전체 금액
   - 2단계 추천인: 1단계 금액의 20%
   - 3단계 추천인: 2단계 금액의 20%
   - 이하 동일한 방식으로 계속됨

## 레퍼럴 네트워크 이양 시스템

사용자가 모든 구독을 취소하면 다음과 같은 이양이 자동으로 이루어집니다:

1. 사용자의 하위 레퍼럴들은 모두 사용자의 상위 추천인에게 자동으로 이양됩니다.
2. 이를 통해 레퍼럴 네트워크 구조가 유지되고 커미션 흐름이 지속됩니다.
3. 이양 시 적절한 이벤트가 발생하여 프론트엔드에서 추적할 수 있습니다.
