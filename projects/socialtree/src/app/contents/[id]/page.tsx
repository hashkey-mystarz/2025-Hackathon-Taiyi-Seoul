'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Share2, Copy, CheckCircle2, Calendar, Users, Tag, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/store/walletStore';
import Image from 'next/image';

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
		content: `암호화폐 투자에 관한 상세 내용입니다...`,
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
		content: `부동산 투자에 관한 상세 내용입니다...`,
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
		content: `퀀트 투자에 관한 상세 내용입니다...`,
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
		content: `세금 최적화에 관한 상세 내용입니다...`,
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
		content: `글로벌 ETF에 관한 상세 내용입니다...`,
		relatedContents: [1, 4],
	},
];

export default function ContentDetail() {
	const { id } = useParams();
	const router = useRouter();
	const { address } = useWalletStore();
	const sharePopupRef = useRef<HTMLDivElement>(null);
	const shareButtonRef = useRef<HTMLButtonElement>(null);

	const [content, setContent] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [subscribed, setSubscribed] = useState(false);
	const [showShareOption, setShowShareOption] = useState(false);
	const [referralCopied, setReferralCopied] = useState(false);
	const [relatedContents, setRelatedContents] = useState<any[]>([]);
	const [referrer, setReferrer] = useState<string | null>(null);

	// URL에서 추천인 코드 확인
	useEffect(() => {
		const checkReferrer = () => {
			if (typeof window !== 'undefined') {
				const urlParams = new URLSearchParams(window.location.search);
				const refCode = urlParams.get('ref');
				if (refCode) {
					console.log(`추천인 코드 감지: ${refCode}`);
					// 로컬 스토리지에 저장
					localStorage.setItem(`referrer_${id}`, refCode);
					setReferrer(refCode);
				} else {
					// 이전에 저장된 추천인 코드 확인
					const savedReferrer = localStorage.getItem(`referrer_${id}`);
					if (savedReferrer) {
						setReferrer(savedReferrer);
					}
				}
			}
		};

		checkReferrer();
	}, [id]);

	useEffect(() => {
		// Mock API 호출 시뮬레이션
		const fetchContent = () => {
			setLoading(true);

			setTimeout(() => {
				const foundContent = MOCK_CONTENTS.find((item) => item.id === Number(id));

				if (foundContent) {
					setContent(foundContent);

					// 연관 콘텐츠 찾기
					const related = foundContent.relatedContents
						.map((relId) => MOCK_CONTENTS.find((item) => item.id === relId))
						.filter(Boolean);
					setRelatedContents(related);

					// 구독 상태 랜덤 설정 (실제로는 API에서 확인)
					setSubscribed(Math.random() > 0.5);
				}

				setLoading(false);
			}, 500);
		};

		fetchContent();
	}, [id]);

	useEffect(() => {
		// 팝업 외부 클릭 감지 핸들러
		const handleClickOutside = (event: MouseEvent) => {
			if (
				sharePopupRef.current &&
				!sharePopupRef.current.contains(event.target as Node) &&
				shareButtonRef.current &&
				!shareButtonRef.current.contains(event.target as Node) &&
				showShareOption
			) {
				setShowShareOption(false);
			}
		};

		// 이벤트 리스너 등록
		document.addEventListener('mousedown', handleClickOutside);

		// 클린업 함수
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showShareOption]);

	const handleSubscribe = () => {
		if (!address) {
			alert('지갑 연결이 필요합니다.');
			return;
		}

		// 추천인 정보를 포함한 구독 처리
		const referrerData = referrer ? { referrerCode: referrer } : null;

		// Mock 구독 처리
		setSubscribed(true);

		// 추천인 정보가 있는 경우 표시
		if (referrerData) {
			alert(`${content.price} HSK로 "${content.title}" 콘텐츠를 구독했습니다. 추천인: ${referrer}`);
		} else {
			alert(`${content.price} HSK로 "${content.title}" 콘텐츠를 구독했습니다.`);
		}

		// 실제 구현에서는 여기서 API 호출이나 스마트 컨트랙트 호출
		// 예: subscribeToContent(id, referrerData?.referrerCode);
	};

	const generateReferralLink = () => {
		if (!address || !subscribed) {
			return '';
		}

		// 지갑 주소에서 고유한 추천 코드 생성 (앞 10자리)
		const referralCode = address.substring(2, 12).toLowerCase();
		return `${window.location.origin}/contents/${id}?ref=${referralCode}`;
	};

	const copyReferralLink = () => {
		if (!address) {
			alert('지갑 연결이 필요합니다.');
			return;
		}

		if (!subscribed) {
			alert('콘텐츠를 먼저 구독해야 추천 링크를 공유할 수 있습니다.');
			return;
		}

		const link = generateReferralLink();
		if (link) {
			navigator.clipboard
				.writeText(link)
				.then(() => {
					setReferralCopied(true);
					setTimeout(() => setReferralCopied(false), 3000);
				})
				.catch((err) => {
					console.error('클립보드 복사 실패:', err);
					alert('링크 복사에 실패했습니다. 다시 시도해주세요.');
				});
		}
	};

	// 추천인 배지 표시 컴포넌트
	const ReferrerBadge = () => {
		if (!referrer) return null;

		return (
			<div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
				<div className="flex items-center text-sm text-green-800">
					<CheckCircle2 className="h-4 w-4 mr-2" />
					<p>
						추천인 <span className="font-semibold">({referrer})</span>을 통해 접속하셨습니다.
					</p>
				</div>
			</div>
		);
	};

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-16 flex justify-center">
				<div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	if (!content) {
		return (
			<div className="container mx-auto px-4 py-16 text-center">
				<h1 className="text-2xl font-bold text-gray-800 mb-4">콘텐츠를 찾을 수 없습니다</h1>
				<p className="text-gray-600 mb-8">요청하신 콘텐츠가 존재하지 않거나 삭제되었습니다.</p>
				<Link
					href="/contents"
					className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
				>
					콘텐츠 목록으로 돌아가기
				</Link>
			</div>
		);
	}

	return (
		<div className="bg-gray-50 min-h-screen pb-16">
			{/* 콘텐츠 상세 정보 */}
			<div className="container mx-auto px-4 py-8">
				{/* 뒤로 가기 링크 */}
				<div className="mb-6">
					<Link href="/contents" className="text-gray-500 hover:text-gray-700 flex items-center">
						<span className="mr-1">&larr;</span> 목록으로 돌아가기
					</Link>
				</div>

				{/* 추천인 배지 표시 */}
				<ReferrerBadge />

				{/* 콘텐츠 메인 정보 */}
				<div className="max-w-4xl mx-auto">
					{/* 콘텐츠 헤더 */}
					<div className="mb-8">
						<Link href="/contents" className="inline-flex items-center text-primary hover:underline mb-4">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-4 w-4 mr-1"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
							콘텐츠 목록으로 돌아가기
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

						{/* 이미지 */}
						<div
							className="w-full h-64 md:h-96 bg-gray-200 rounded-xl mb-8 overflow-hidden"
							style={{
								backgroundImage: `url('https://source.unsplash.com/random/1200x600?${content.category}')`,
								backgroundSize: 'cover',
								backgroundPosition: 'center',
							}}
						></div>
					</div>

					{/* 콘텐츠 설명 */}
					<div className="bg-white rounded-xl shadow-md p-6 mb-8">
						<h2 className="text-xl font-bold text-gray-800 mb-4">콘텐츠 개요</h2>
						<p className="text-gray-700 mb-6">{content.description}</p>

						<div className="border-t border-gray-200 pt-6">
							<div className="flex justify-between items-center mb-6">
								<div className="flex items-center">
									<span className="text-2xl font-bold text-primary mr-2">{content.price} HSK</span>
									<span className="text-gray-500">/ 월 구독</span>
								</div>

								<div className="relative">
									<button
										ref={shareButtonRef}
										onClick={() => setShowShareOption(!showShareOption)}
										disabled={!subscribed}
										className={`p-2 rounded-full ${
											subscribed
												? 'text-gray-500 hover:text-primary hover:bg-gray-100'
												: 'text-gray-300 cursor-not-allowed'
										}`}
									>
										<Share2 className="h-5 w-5" />
									</button>

									{showShareOption && (
										<div
											ref={sharePopupRef}
											className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg p-4 z-10"
										>
											<h3 className="text-sm font-medium text-gray-700 mb-2">추천 링크 공유하기</h3>
											<p className="text-xs text-gray-500 mb-3">
												이 링크로 친구가 구독하면 20%의 추천 보상을 받을 수 있습니다!
											</p>
											<div className="flex">
												<input
													type="text"
													readOnly
													value={generateReferralLink() || '먼저 콘텐츠를 구독해야 합니다.'}
													className="flex-1 p-2 text-xs bg-gray-50 border border-gray-300 rounded-l-lg focus:outline-none"
												/>
												<button
													onClick={copyReferralLink}
													disabled={!address || !subscribed}
													className={`p-2 text-white rounded-r-lg ${
														!address || !subscribed ? 'bg-gray-300' : 'bg-primary hover:bg-primary/90'
													}`}
												>
													{referralCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
												</button>
											</div>
											{referralCopied && (
												<p className="text-xs text-green-600 mt-2">링크가 클립보드에 복사되었습니다.</p>
											)}
										</div>
									)}
								</div>
							</div>

							<button
								onClick={handleSubscribe}
								disabled={subscribed}
								className={`w-full py-3 rounded-lg flex justify-center items-center font-medium ${
									subscribed
										? 'bg-green-100 text-green-700 cursor-default'
										: 'bg-primary text-white hover:bg-primary/90'
								}`}
							>
								{subscribed ? '구독 중' : '구독하기'}
							</button>
						</div>
					</div>

					{/* 콘텐츠 미리보기 */}
					<div className="bg-white rounded-xl shadow-md p-6 mb-8">
						<h2 className="text-xl font-bold text-gray-800 mb-4">콘텐츠 미리보기</h2>
						<div className="prose max-w-none">
							{/* 마크다운 콘텐츠 10줄만 보여주기 */}
							<div
								className="relative overflow-hidden max-h-[300px]"
								dangerouslySetInnerHTML={{
									__html: content.content
										.split('\n')
										.slice(0, 10)
										.join('\n')
										.replace(/^# (.*)/gm, '<h1>$1</h1>')
										.replace(/^## (.*)/gm, '<h2>$1</h2>')
										.replace(/^### (.*)/gm, '<h3>$1</h3>')
										.replace(/^\* (.*)/gm, '<li>$1</li>')
										.replace(/^[0-9]+\. (.*)/gm, '<ol><li>$1</li></ol>')
										.replace(/\n/g, '<br>'),
								}}
							/>
							<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
						</div>

						<div className="text-center mt-6">
							<p className="text-gray-500 mb-4">
								{subscribed
									? '구독 중인 콘텐츠입니다. 전체 내용을 확인하세요.'
									: '구독 후 전체 콘텐츠를 확인할 수 있습니다.'}
							</p>
							{subscribed && (
								<Link
									href={`/contents/${id}/view`}
									className="inline-flex items-center text-primary font-medium hover:underline"
								>
									전체 콘텐츠 보기
									<ArrowRight className="h-4 w-4 ml-1" />
								</Link>
							)}
						</div>
					</div>

					{/* 연관 콘텐츠 */}
					{relatedContents.length > 0 && (
						<div className="bg-white rounded-xl shadow-md p-6">
							<h2 className="text-xl font-bold text-gray-800 mb-4">관련 콘텐츠</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{relatedContents.map((related) => (
									<Link
										href={`/contents/${related.id}`}
										key={related.id}
										className="flex p-3 rounded-lg hover:bg-gray-50 transition-colors"
									>
										<div
											className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0 mr-3"
											style={{
												backgroundImage: `url('https://source.unsplash.com/random/100x100?${related.category}')`,
												backgroundSize: 'cover',
											}}
										></div>
										<div>
											<h3 className="font-medium text-gray-800 line-clamp-2">{related.title}</h3>
											<p className="text-sm text-gray-500">
												{related.creator} · {related.price} HSK
											</p>
										</div>
									</Link>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
