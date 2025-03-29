# 데이터베이스 스키마

## 개요

SocialTree 애플리케이션은 Supabase PostgreSQL 데이터베이스를 사용합니다. 아래는 주요 테이블 스키마입니다.

## 테이블 스키마

### users

사용자 정보를 저장하는 테이블

| 컬럼           | 타입      | 설명               | 제약 조건        |
| -------------- | --------- | ------------------ | ---------------- |
| id             | uuid      | 사용자 고유 식별자 | Primary Key      |
| wallet_address | text      | 사용자 지갑 주소   | Unique, Not Null |
| referral_code  | text      | 사용자별 추천 코드 | Unique, Not Null |
| referrer_id    | uuid      | 추천인 ID          | Foreign Key      |
| created_at     | timestamp | 계정 생성 시간     | Default: now()   |
| updated_at     | timestamp | 계정 업데이트 시간 | Default: now()   |

외래 키: `referrer_id` → `users.id`

> **참고**: `referrer_id`는 사용자 가입 시점에 설정되지 않으며, 콘텐츠 구독 시점에 추천인이 있는 경우 설정됩니다. 사용자 가입은 지갑 주소만으로 이루어지며, 추천 코드는 자동으로 지갑 주소의 앞 6자리로 생성됩니다.

### contents

콘텐츠 정보를 저장하는 테이블

| 컬럼        | 타입      | 설명                 | 제약 조건      |
| ----------- | --------- | -------------------- | -------------- |
| id          | uuid      | 콘텐츠 고유 식별자   | Primary Key    |
| creator_id  | uuid      | 콘텐츠 생성자 ID     | Foreign Key    |
| title       | text      | 콘텐츠 제목          | Not Null       |
| description | text      | 콘텐츠 설명          |                |
| price       | numeric   | 구독 가격            | Not Null       |
| created_at  | timestamp | 콘텐츠 생성 시간     | Default: now() |
| updated_at  | timestamp | 콘텐츠 업데이트 시간 | Default: now() |

외래 키: `creator_id` → `users.id`

### subscriptions

사용자 구독 정보를 저장하는 테이블

| 컬럼             | 타입      | 설명                   | 제약 조건      |
| ---------------- | --------- | ---------------------- | -------------- |
| id               | uuid      | 구독 고유 식별자       | Primary Key    |
| user_id          | uuid      | 구독자 ID              | Foreign Key    |
| content_id       | uuid      | 구독한 콘텐츠 ID       | Foreign Key    |
| referrer_id      | uuid      | 추천인 ID              | Foreign Key    |
| transaction_hash | text      | 블록체인 트랜잭션 해시 |                |
| amount           | numeric   | 구독 금액              | Not Null       |
| status           | text      | 구독 상태              | Not Null       |
| start_date       | timestamp | 구독 시작일            | Not Null       |
| end_date         | timestamp | 구독 종료일            |                |
| created_at       | timestamp | 레코드 생성 시간       | Default: now() |
| updated_at       | timestamp | 레코드 업데이트 시간   | Default: now() |

외래 키:

- `user_id` → `users.id`
- `content_id` → `contents.id`
- `referrer_id` → `users.id`

> **참고**: `status` 필드는 구독 상태를 나타내며 다음 값들을 가질 수 있습니다:
>
> - `active`: 현재 활성화된 구독
> - `expired`: 기간이 만료된 구독
> - `cancelled`: 사용자에 의해 취소된 구독
> - `pending`: 결제 진행 중인 구독

### commissions

수수료 분배 내역을 저장하는 테이블

| 컬럼             | 타입      | 설명                   | 제약 조건      |
| ---------------- | --------- | ---------------------- | -------------- |
| id               | uuid      | 수수료 고유 식별자     | Primary Key    |
| subscription_id  | uuid      | 관련 구독 ID           | Foreign Key    |
| user_id          | uuid      | 수수료 수령자 ID       | Foreign Key    |
| from_user_id     | uuid      | 수수료 지불자 ID       | Foreign Key    |
| content_id       | uuid      | 관련 콘텐츠 ID         | Foreign Key    |
| level            | integer   | 추천 레벨              | Not Null       |
| amount           | numeric   | 수수료 금액            | Not Null       |
| transaction_hash | text      | 블록체인 트랜잭션 해시 |                |
| status           | text      | 처리 상태              | Not Null       |
| created_at       | timestamp | 레코드 생성 시간       | Default: now() |
| updated_at       | timestamp | 레코드 업데이트 시간   | Default: now() |

외래 키:

- `subscription_id` → `subscriptions.id`
- `user_id` → `users.id`
- `from_user_id` → `users.id`
- `content_id` → `contents.id`

> **참고**: `level` 필드는 재귀적 커미션 분배에서의 추천 레벨을 나타냅니다:
>
> - `1`: 직접 추천인 (20% 수수료)
> - `2`: 2차 추천인 (직접 추천인의 추천인, 20%의 20% = 4%)
> - `3`: 3차 추천인 (20%의 20%의 20% = 0.8%)
>
> `status` 필드는 수수료 처리 상태를 나타내며 다음 값들을 가질 수 있습니다:
>
> - `pending`: 처리 대기 중
> - `paid`: 온체인에서 지급 완료
> - `failed`: 처리 실패

## 설치 방법

### Supabase SQL 에디터에서 실행할 SQL 스크립트

```sql
-- UUID 확장 활성화 (아직 활성화되지 않은 경우)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 테이블 삭제 (기존 테이블이 있는 경우를 대비해서)
DROP TABLE IF EXISTS commissions;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS contents;
DROP TABLE IF EXISTS users;

-- users 테이블 생성
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  referrer_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- contents 테이블 생성
CREATE TABLE contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- subscriptions 테이블 생성
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  content_id UUID NOT NULL REFERENCES contents(id),
  referrer_id UUID REFERENCES users(id),
  transaction_hash TEXT,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- commissions 테이블 생성
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  from_user_id UUID REFERENCES users(id),
  content_id UUID REFERENCES contents(id),
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  amount NUMERIC NOT NULL,
  transaction_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX users_wallet_address_idx ON users(wallet_address);
CREATE INDEX users_referral_code_idx ON users(referral_code);
CREATE INDEX users_referrer_id_idx ON users(referrer_id);
CREATE INDEX commissions_user_id_idx ON commissions(user_id);
CREATE INDEX commissions_from_user_id_idx ON commissions(from_user_id);
CREATE INDEX commissions_subscription_id_idx ON commissions(subscription_id);
CREATE INDEX commissions_content_id_idx ON commissions(content_id);
CREATE INDEX subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX subscriptions_content_id_idx ON subscriptions(content_id);
CREATE INDEX subscriptions_referrer_id_idx ON subscriptions(referrer_id);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);

-- 업데이트 트리거 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER contents_update_timestamp
BEFORE UPDATE ON contents
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER subscriptions_update_timestamp
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER commissions_update_timestamp
BEFORE UPDATE ON commissions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 함수: 지갑 주소에서 추천 코드 생성
CREATE OR REPLACE FUNCTION generate_referral_code(wallet TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(SUBSTRING(wallet FROM 3 FOR 6));
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자에게 조회 권한 부여
CREATE POLICY users_select_policy ON users FOR SELECT USING (true);
CREATE POLICY contents_select_policy ON contents FOR SELECT USING (true);
CREATE POLICY subscriptions_select_policy ON subscriptions FOR SELECT USING (true);
CREATE POLICY commissions_select_policy ON commissions FOR SELECT USING (true);

-- 테스트 데이터 삽입 (선택 사항)
-- 테스트 사용자 생성
INSERT INTO users (wallet_address, referral_code) VALUES
('0x1234567890123456789012345678901234567890', generate_referral_code('0x1234567890123456789012345678901234567890')),
('0x2345678901234567890123456789012345678901', generate_referral_code('0x2345678901234567890123456789012345678901')),
('0x3456789012345678901234567890123456789012', generate_referral_code('0x3456789012345678901234567890123456789012'));

-- 테스트 콘텐츠 생성
INSERT INTO contents (creator_id, title, description, price) VALUES
((SELECT id FROM users WHERE wallet_address = '0x1234567890123456789012345678901234567890'), '프리미엄 콘텐츠 1', '고급 정보 제공', 100),
((SELECT id FROM users WHERE wallet_address = '0x2345678901234567890123456789012345678901'), '프리미엄 콘텐츠 2', '최신 트렌드 정보', 150);

COMMIT;
```
