'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ContentCard from '@/components/global/ContentCard';

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
	},
];

// 카테고리 목록
const CATEGORIES = ['전체', '주식', '암호화폐', '부동산', '퀀트', 'ETF', '절세'];

export default function Contents() {
	const searchParams = useSearchParams();
	const categoryParam = searchParams.get('category');

	const [selectedCategory, setSelectedCategory] = useState(categoryParam || '전체');
	const [sortBy, setSortBy] = useState('latest');

	// 카테고리 및 정렬 기준에 따라 콘텐츠 필터링
	const filteredContents = MOCK_CONTENTS.filter(
		(content) => selectedCategory === '전체' || content.category === selectedCategory
	).sort((a, b) => {
		if (sortBy === 'latest') {
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		} else if (sortBy === 'popular') {
			return b.subscriberCount - a.subscriberCount;
		} else if (sortBy === 'priceAsc') {
			return a.price - b.price;
		} else if (sortBy === 'priceDesc') {
			return b.price - a.price;
		}
		return 0;
	});

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-8 text-center text-gray-800">금융 콘텐츠 라이브러리</h1>

			{/* 필터링 및 정렬 옵션 */}
			<div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div className="flex flex-wrap gap-2">
					{CATEGORIES.map((category) => (
						<button
							key={category}
							onClick={() => setSelectedCategory(category)}
							className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
								${selectedCategory === category ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
						>
							{category}
						</button>
					))}
				</div>

				<div className="w-full md:w-auto">
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						className="w-full md:w-auto px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
					>
						<option value="latest">최신순</option>
						<option value="popular">인기순</option>
						<option value="priceAsc">가격 낮은순</option>
						<option value="priceDesc">가격 높은순</option>
					</select>
				</div>
			</div>

			{/* 콘텐츠 그리드 */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
				{filteredContents.map((content) => (
					<ContentCard
						key={content.id}
						id={content.id}
						title={content.title}
						description={content.description}
						price={content.price}
						creator={content.creator}
						creatorAddress={content.creatorAddress}
						subscriberCount={content.subscriberCount}
						category={content.category}
						thumbnail={`https://source.unsplash.com/random/600x400?${content.category}`}
						createdAt={content.createdAt}
						showHoverEffect={true}
						currencySymbol="HSK"
					/>
				))}
			</div>

			{filteredContents.length === 0 && (
				<div className="text-center py-16">
					<p className="text-gray-500 text-lg">해당 카테고리에 콘텐츠가 없습니다.</p>
				</div>
			)}
		</div>
	);
}
