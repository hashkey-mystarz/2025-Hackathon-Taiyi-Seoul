'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Calendar, Users, Tag } from 'lucide-react';
import { useWalletStore } from '@/store/walletStore';

// Mock data - 실제 구현 시 API 호출로 대체
const MOCK_CONTENTS = [
	{
		id: 1,
		title: '주식 시장 분석: 2025년 하반기 전망',
		description: '글로벌 경제 동향과 주요 섹터별 투자 전략 분석',
		price: 50,
		creator: '김재무',
		creatorAddress: '0x1234...5678',
		subscriberCount: 1243,
		category: '주식',
		thumbnail: '/images/stock-analysis.jpg',
		createdAt: '2025-06-15',
		content: `
      # 2025년 하반기 주식 시장 전망
      
      ## 글로벌 경제 환경
      
      2025년 하반기에는 글로벌 경제가 완만한 성장세를 이어갈 것으로 예상됩니다. 주요국 중앙은행의 통화정책 정상화가 진행 중이며, 인플레이션 압력은 점차 완화될 것으로 전망됩니다.
      
      ## 주요 투자 섹터
      
      ### 기술 섹터
      AI 및 클라우드 관련 기업들의 성장이 지속될 전망입니다. 특히 생성형 AI 기술을 활용한 비즈니스 모델을 갖춘 기업들에 주목할 필요가 있습니다.
      
      ### 금융 섹터
      금리 안정화에 따라 은행 및 금융 서비스 기업들의 실적 개선이 예상됩니다.
      
      ### 헬스케어 섹터
      바이오테크 및 디지털 헬스케어 기업들의 혁신적인 솔루션에 주목해야 합니다.
      
      ## 투자 전략
      
      1. 포트폴리오 다각화: 섹터 및 지역별 분산 투자
      2. 배당주 비중 확대: 불확실성 대비 안정적인 수익 추구
      3. 기술 및 혁신 기업에 선별적 투자
      
      ## 리스크 요인
      
      - 지정학적 불안정성 증가
      - 예상보다 높은 인플레이션 지속 가능성
      - 글로벌 공급망 이슈
      
      이러한 요소들을 고려하여 2025년 하반기에는 방어적인 투자 전략과 기회 포착을 위한 공격적 전략의 균형이 중요할 것입니다.
    `,
		relatedContents: [2, 4, 6],
	},
	{
		id: 2,
		title: '암호화폐 투자 가이드: 초보자를 위한 완벽 안내서',
		description: '블록체인 기술과 암호화폐 시장의 기초부터 고급 투자 전략까지',
		price: 30,
		creator: '이블록',
		creatorAddress: '0xabcd...ef12',
		subscriberCount: 987,
		category: '암호화폐',
		thumbnail: '/images/crypto-guide.jpg',
		createdAt: '2025-05-28',
		content: `
      # 암호화폐 투자 가이드: 초보자를 위한 완벽 안내서
      
      ## 블록체인 기술의 이해
      
      블록체인은 분산형 원장 기술로, 중앙 통제 기관 없이 거래 정보를 안전하게 기록할 수 있게 합니다. 이 기술은 암호화폐의 기반이 되며, 데이터의 무결성과 보안을 보장합니다.
      
      ## 주요 암호화폐 소개
      
      ### 비트코인 (Bitcoin)
      최초의 암호화폐로, 디지털 금(Digital Gold)으로 불립니다. 제한된 공급량(2100만 개)과 분산화된 특성이 장점입니다.
      
      ### 이더리움 (Ethereum)
      스마트 계약 기능을 제공하는 플랫폼으로, DeFi, NFT 등 다양한 애플리케이션의 기반이 됩니다.
      
      ## 투자 전략
      
      1. 장기 투자(HODL): 시장의 단기 변동성을 무시하고 장기적인 가치 상승에 투자
      2. 달러 코스트 애버리징(DCA): 정기적으로 일정 금액을 투자하여 평균 매수 단가를 낮추는 전략
      3. 포트폴리오 분산: 다양한 코인에 분산 투자하여 리스크 관리
      
      ## 보안 및 지갑 관리
      
      - 콜드 월렛 사용: 하드웨어 지갑으로 오프라인 보관
      - 2단계 인증: 모든 거래소 계정에 2FA 설정
      - 개인 키 관리: 백업 구문(시드 구문)을 안전하게 보관
      
      암호화폐 투자는 높은 수익 가능성과 함께 큰 위험도 따릅니다. 투자 금액은 감당할 수 있는 범위 내에서 신중하게 결정하세요.
    `,
		relatedContents: [1, 3, 5],
	},
	{
		id: 3,
		title: '부동산 투자의 비밀: 수익형 부동산 포트폴리오 구축',
		description: '현명한 부동산 투자로 안정적인 현금 흐름 창출하기',
		price: 40,
		creator: '박부동',
		creatorAddress: '0x7890...1234',
		subscriberCount: 568,
		category: '부동산',
		thumbnail: '/images/real-estate.jpg',
		createdAt: '2025-06-02',
		content: `
      # 부동산 투자의 비밀: 수익형 부동산 포트폴리오 구축
      
      ## 수익형 부동산의 이해
      
      수익형 부동산은 임대 수익을 목적으로 하는 투자용 부동산을 의미합니다. 월 임대 수익과 장기적인 자산 가치 상승이라는 두 가지 수익 루트를 가지고 있습니다.
      
      ## 주요 수익형 부동산 유형
      
      ### 오피스텔 및 원룸
      소액으로 시작할 수 있어 초보 투자자에게 적합합니다. 관리가 비교적 수월하고 임대 수요가 안정적입니다.
      
      ### 상가 및 점포
      임대료가 높고 장기 계약이 가능한 장점이 있지만, 경기 변동에 민감하고 입지 선정이 매우 중요합니다.
      
      ### 다세대/다가구 주택
      여러 세대를 한 번에 관리할 수 있어 효율적이며, 세대별 독립적인 현금 흐름을 확보할 수 있습니다.
      
      ## 투자 전략
      
      1. 입지 분석: 교통, 생활 편의시설, 개발 계획 등을 종합적으로 분석
      2. 수익률 계산: 순수익률(ROI)을 정확히 계산하여 투자 결정
      3. 레버리지 활용: 적절한 대출을 활용하여 투자 효율성 극대화
      
      ## 관리 및 운영 팁
      
      - 세입자 선정: 신중한 세입자 심사로 임대 리스크 최소화
      - 정기 점검: 건물 상태 정기 점검으로 대규모 수리 예방
      - 세금 계획: 부동산 세금 전략으로 세후 수익 극대화
      
      부동산 투자는 장기적인 관점에서 안정적인 현금 흐름을 창출할 수 있는 좋은 투자 수단입니다. 하지만 충분한 시장 조사와 신중한 계획이 선행되어야 합니다.
    `,
		relatedContents: [1, 5],
	},
	{
		id: 4,
		title: '퀀트 투자 전략: 데이터 기반 알고리즘 트레이딩',
		description: '퀀트 분석을 활용한 체계적인 투자 시스템 구축 방법',
		price: 60,
		creator: '정퀀트',
		creatorAddress: '0xfedc...ba98',
		subscriberCount: 432,
		category: '퀀트',
		thumbnail: '/images/quant-trading.jpg',
		createdAt: '2025-06-10',
		content: `
      # 퀀트 투자 전략: 데이터 기반 알고리즘 트레이딩
      
      ## 퀀트 투자의 기본 개념
      
      퀀트 투자는 수학적 모델과 알고리즘을 활용하여 투자 결정을 내리는 방식입니다. 감정을 배제하고 데이터에 기반한 객관적인 투자가 가능합니다.
      
      ## 주요 퀀트 전략
      
      ### 팩터 투자(Factor Investing)
      특정 팩터(가치, 성장, 모멘텀, 퀄리티 등)에 기반하여 종목을 선정하는 전략입니다.
      
      ### 평균 회귀(Mean Reversion)
      가격이 평균으로 회귀하는 성질을 이용한 전략으로, 과매도/과매수 상태에서 반대 포지션을 취합니다.
      
      ### 트렌드 팔로잉(Trend Following)
      시장의 추세를 파악하여 그 방향성에 베팅하는 전략입니다.
      
      ## 알고리즘 개발 및 백테스팅
      
      1. 전략 설계: 투자 아이디어를 명확한 규칙으로 정의
      2. 알고리즘 구현: Python, R 등의 언어로 구현
      3. 백테스팅: 과거 데이터로 성능 검증 및 최적화
      4. 리스크 관리: 포트폴리오 분산 및 손절매 전략 구현
      
      ## 실전 적용 및 모니터링
      
      - API 연동: 증권사/거래소 API를 활용한 자동 매매 시스템 구축
      - 실시간 모니터링: 알고리즘 성능 및 시장 조건 상시 체크
      - 정기 재조정: 시장 환경 변화에 따른 알고리즘 파라미터 조정
      
      퀀트 투자는 체계적인 접근법과 기술적 이해가 필요하지만, 감정을 배제한 일관된 투자가 가능하다는 장점이 있습니다. 단, 과거 성과가 미래 수익을 보장하지 않는다는 점을 항상 유의하세요.
    `,
		relatedContents: [1, 2],
	},
	{
		id: 5,
		title: '세금 최적화 전략: 투자자를 위한 절세 가이드',
		description: '합법적인 세금 계획과 투자 수익 최대화 방법',
		price: 35,
		creator: '최세금',
		creatorAddress: '0x2468...1357',
		subscriberCount: 756,
		category: '절세',
		thumbnail: '/images/tax-guide.jpg',
		createdAt: '2025-05-15',
		content: `
      # 세금 최적화 전략: 투자자를 위한 절세 가이드
      
      ## 투자와 세금의 관계
      
      투자 수익에 대한 세금은 실질 수익률에 큰 영향을 미칩니다. 효과적인 세금 계획은 장기적인 자산 증식의 핵심 요소입니다.
      
      ## 주요 투자 유형별 세금 전략
      
      ### 주식 투자
      장기 보유 시 양도소득세 혜택, 배당소득 공제 활용, 손실 상계 전략 등을 활용할 수 있습니다.
      
      ### 부동산 투자
      감가상각 공제, 양도소득세 이연, 1031 교환(미국 등), 비용 공제 최적화 등의 전략이 있습니다.
      
      ### 암호화폐 투자
      세무 처리 기준 이해, 장/단기 양도 구분, 코인 간 교환 시 세금 처리 등을 고려해야 합니다.
      
      ## 세금 유형별 절세 방법
      
      1. 소득세: 적격 연금 계좌 활용, 소득 시기 조정, 공제 항목 최대화
      2. 양도소득세: 보유 기간 최적화, 손익 통산, 비과세/감면 요건 활용
      3. 상속/증여세: 생전 증여 계획, 신탁 활용, 가업 승계 지원제도 활용
      
      ## 세금 계획 및 관리 팁
      
      - 세금 캘린더 유지: 주요 세금 일정 관리로 불필요한 가산세 방지
      - 전문가 활용: 복잡한 투자 구조는 세무사/회계사 상담 권장
      - 기록 유지: 모든 투자 거래와 비용에 대한 증빙 자료 보관
      
      현명한 세금 계획은 합법적인 범위 내에서 세부담을 최소화하는 것입니다. 탈세가 아닌 절세를 통해 투자 수익을 극대화하세요.
    `,
		relatedContents: [1, 3],
	},
	{
		id: 6,
		title: '글로벌 ETF 완전 분석: 분산 투자의 핵심',
		description: '국제 시장을 아우르는 ETF 투자 포트폴리오 구성 전략',
		price: 45,
		creator: '황글로벌',
		creatorAddress: '0x1357...2468',
		subscriberCount: 621,
		category: 'ETF',
		thumbnail: '/images/global-etf.jpg',
		createdAt: '2025-06-05',
		content: `
      # 글로벌 ETF 완전 분석: 분산 투자의 핵심
      
      ## ETF의 기본 이해
      
      ETF(상장지수펀드)는 특정 지수를 추종하는 펀드로, 주식처럼 거래소에서 실시간 매매가 가능합니다. 낮은 비용과 높은 유동성, 그리고 효과적인 분산 투자가 가능한 장점이 있습니다.
      
      ## 글로벌 ETF 유형별 분석
      
      ### 지역별 ETF
      미국, 유럽, 신흥국 등 특정 지역이나 국가에 집중 투자하는 ETF입니다. 지역 경제 성장에 베팅할 수 있습니다.
      
      ### 섹터별 ETF
      기술, 금융, 에너지, 헬스케어 등 특정 산업 섹터에 투자하는 ETF입니다. 성장 산업에 집중 투자할 수 있습니다.
      
      ### 테마형 ETF
      ESG, 로보틱스, 클린에너지 등 특정 테마에 맞는 기업들에 투자하는 ETF입니다. 미래 트렌드에 투자할 수 있습니다.
      
      ## 글로벌 ETF 포트폴리오 구성 전략
      
      1. 코어-새틀라이트 전략: 광범위한 시장 ETF를 코어로, 특화된 ETF를 새틀라이트로 구성
      2. 리스크 패리티: 자산군별 위험 기여도를 균등하게 배분하는 전략
      3. 글로벌 자산배분: 전 세계 주요 자산군에 분산 투자하는 전략
      
      ## ETF 투자 실전 팁
      
      - 비용 비교: 유사한 ETF 중 총비용률(TER)이 낮은 상품 선택
      - 추적 오차 확인: 벤치마크 지수와의 괴리율 최소화
      - 유동성 체크: 거래량과 스프레드를 확인하여 유동성 높은 ETF 선택
      
      글로벌 ETF를 활용한 분산 투자는 국가나 지역 위험을 줄이면서 세계 경제 성장에 참여할 수 있는 효과적인 방법입니다. 장기 투자자에게 특히 적합한 전략입니다.
    `,
		relatedContents: [1, 4],
	},
];

// 콘텐츠 타입 정의
interface Content {
	id: number;
	title: string;
	description: string;
	price: number;
	creator: string;
	creatorAddress: string;
	subscriberCount: number;
	category: string;
	thumbnail: string;
	createdAt: string;
	content: string;
	relatedContents: number[];
}

// 구독 상태를 확인하는 mock 함수 (실제로는 API 호출)
const checkSubscription = (contentId: string | null | undefined, userAddress: string | undefined): boolean => {
	// Mock: 현재 사용자가 해당 콘텐츠를 구독했는지 확인
	// 실제 구현에서는 데이터베이스 쿼리로 확인
	return true; // 항상 구독 중인 것으로 가정
};

export default function ContentView() {
	const params = useParams();
	// id 값을 명확한 string 타입으로 처리
	const id: string = Array.isArray(params.id) ? params.id[0] : params.id || '';
	const router = useRouter();
	const { isLoading } = useAuth();
	const { address } = useWalletStore();

	const [content, setContent] = useState<Content | null>(null);
	const [loading, setLoading] = useState(true);
	const [isSubscribed, setIsSubscribed] = useState(false);

	useEffect(() => {
		// 연결 상태 확인
		if (!address) {
			router.push(`/contents/${id}`);
			return;
		}

		// Mock API 호출 시뮬레이션
		const fetchContent = () => {
			setLoading(true);

			setTimeout(() => {
				const foundContent = MOCK_CONTENTS.find((item) => item.id === Number(id));

				if (foundContent) {
					setContent(foundContent);
					// 구독 상태 확인 (실제로는 API에서 확인)
					// @ts-ignore - id가 null일 수 있지만 함수 내부에서 적절히 처리됨
					const subscribed = checkSubscription(id, address);
					setIsSubscribed(subscribed);

					if (!subscribed) {
						// 구독하지 않은 콘텐츠의 경우 콘텐츠 상세 페이지로 리다이렉트
						router.push(`/contents/${id}`);
						return;
					}
				} else {
					// 콘텐츠를 찾을 수 없는 경우 목록 페이지로 리다이렉트
					router.push('/contents');
				}

				setLoading(false);
			}, 500);
		};

		fetchContent();
	}, [id, router, address]);

	// 마크다운 텍스트를 HTML로 변환하는 함수
	const renderMarkdown = (markdown: string) => {
		return {
			__html: markdown
				.replace(/^# (.*)/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
				.replace(/^## (.*)/gm, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
				.replace(/^### (.*)/gm, '<h3 class="text-xl font-bold mt-5 mb-2">$1</h3>')
				.replace(/^\* (.*)/gm, '<li class="ml-6 mb-1">$1</li>')
				.replace(/^[0-9]+\. (.*)/gm, '<ol class="list-decimal"><li class="ml-6 mb-1">$1</li></ol>')
				.replace(/\n\n/g, '<br><br>'),
		};
	};

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-16 flex justify-center">
				<div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	if (!content || !isSubscribed) {
		return (
			<div className="container mx-auto px-4 py-16 text-center">
				<h1 className="text-2xl font-bold text-gray-800 mb-4">콘텐츠에 접근할 수 없습니다</h1>
				<p className="text-gray-600 mb-8">이 콘텐츠를 보려면 구독이 필요합니다.</p>
				<Link
					href={`/contents/${id}`}
					className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
				>
					콘텐츠 상세 페이지로 이동
				</Link>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				{/* 헤더 */}
				<div className="mb-8">
					<Link href={`/contents/${id}`} className="inline-flex items-center text-primary hover:underline mb-4">
						<ArrowLeft className="h-4 w-4 mr-1" />
						콘텐츠 상세 페이지로 돌아가기
					</Link>

					<h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{content.title}</h1>

					<div className="flex flex-wrap items-center text-gray-600 gap-4 mb-6">
						<div className="flex items-center">
							<Calendar className="h-4 w-4 mr-1" />
							<span>{new Date(content.createdAt).toLocaleDateString('ko-KR')}</span>
						</div>
						<div className="flex items-center">
							<Users className="h-4 w-4 mr-1" />
							<span>{content.subscriberCount}명 구독중</span>
						</div>
						<div className="flex items-center">
							<Tag className="h-4 w-4 mr-1" />
							<span>{content.category}</span>
						</div>
					</div>

					<div className="flex items-center mb-8">
						<div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold mr-3">
							{content.creator.substring(0, 1)}
						</div>
						<div>
							<p className="font-medium text-gray-800">{content.creator}</p>
							<p className="text-sm text-gray-500">{content.creatorAddress}</p>
						</div>
					</div>
				</div>

				{/* 콘텐츠 본문 */}
				<div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8">
					<div className="prose prose-lg max-w-none">
						<div dangerouslySetInnerHTML={renderMarkdown(content.content)} />
					</div>
				</div>

				{/* 하단 네비게이션 */}
				<div className="flex justify-between items-center">
					<Link href={`/contents/${id}`} className="inline-flex items-center text-gray-600 hover:text-primary">
						<ArrowLeft className="h-4 w-4 mr-2" />
						콘텐츠 상세로 돌아가기
					</Link>
					<Link href="/mypage" className="inline-flex items-center text-primary hover:underline">
						내 구독 콘텐츠 관리
					</Link>
				</div>
			</div>
		</div>
	);
}
