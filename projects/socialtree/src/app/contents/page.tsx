'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ContentCard from '@/components/global/ContentCard';
import axios from 'axios';

// 콘텐츠 타입 정의
interface Content {
	id: string;
	title: string;
	description: string;
	price: number;
	creator_id: string;
	creator?: {
		wallet_address: string;
		nickname?: string;
	};
	created_at: string;
	category?: string;
	thumbnail_url?: string;
	subscriber_count?: number;
}

// 카테고리 목록
const CATEGORIES = ['전체', '주식', '암호화폐', '부동산', '퀀트', 'ETF', '절세'];

export default function Contents() {
	const searchParams = useSearchParams();
	const categoryParam = searchParams.get('category');

	const [selectedCategory, setSelectedCategory] = useState(categoryParam || '전체');
	const [sortBy, setSortBy] = useState('latest');
	const [contents, setContents] = useState<Content[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// 콘텐츠 API 호출
	useEffect(() => {
		const fetchContents = async () => {
			try {
				setLoading(true);
				// 카테고리 필터링을 서버에서 처리
				const url =
					selectedCategory !== '전체'
						? `/api/contents?category=${encodeURIComponent(selectedCategory)}`
						: '/api/contents';

				const response = await axios.get(url);
				if (response.data && Array.isArray(response.data)) {
					setContents(response.data);
				}
				setError(null);
			} catch (err) {
				console.error('콘텐츠 로드 중 오류 발생:', err);
				setError('콘텐츠를 불러오는 중 오류가 발생했습니다.');
			} finally {
				setLoading(false);
			}
		};

		fetchContents();
	}, [selectedCategory]);

	// 콘텐츠 카테고리 파싱 함수 (DB에 category가 없는 경우 사용)
	const getCategoryFromTitle = (title: string): string => {
		if (title.includes('주식')) return '주식';
		if (title.includes('암호화폐') || title.includes('블록체인')) return '암호화폐';
		if (title.includes('부동산')) return '부동산';
		if (title.includes('퀀트') || title.includes('알고리즘')) return '퀀트';
		if (title.includes('ETF')) return 'ETF';
		if (title.includes('세금') || title.includes('절세')) return '절세';
		return '전체';
	};

	// 콘텐츠 정렬 기준에 따라 필터링
	const filteredContents = contents
		.map((content) => ({
			...content,
			// DB에 카테고리가 없으면 제목에서 추출
			category: content.category || getCategoryFromTitle(content.title),
			subscriber_count: Math.floor(Math.random() * 1500) + 100, // 목 데이터
		}))
		.sort((a, b) => {
			if (sortBy === 'latest') {
				return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
			} else if (sortBy === 'popular') {
				return (b.subscriber_count || 0) - (a.subscriber_count || 0);
			} else if (sortBy === 'priceAsc') {
				return a.price - b.price;
			} else if (sortBy === 'priceDesc') {
				return b.price - a.price;
			}
			return 0;
		});

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-8 text-center text-gray-800">SocialTree 독점 콘텐츠</h1>

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

			{/* 로딩 상태 표시 */}
			{loading && (
				<div className="flex justify-center my-12">
					<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
				</div>
			)}

			{/* 에러 메시지 */}
			{error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-8">{error}</div>}

			{/* 콘텐츠 그리드 */}
			{!loading && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{filteredContents.map((content) => (
						<ContentCard
							key={content.id}
							id={content.id}
							title={content.title}
							description={content.description}
							price={content.price}
							creator={content.creator?.nickname || `Creator-${content.creator_id.substring(0, 5)}`}
							creatorAddress={content.creator?.wallet_address || '0x1234...5678'}
							subscriberCount={content.subscriber_count || 0}
							category={content.category || '기타'}
							thumbnail={
								content.thumbnail_url || `https://source.unsplash.com/random/600x400?${content.category || 'finance'}`
							}
							createdAt={content.created_at}
							showHoverEffect={true}
							currencySymbol="HSK"
						/>
					))}
				</div>
			)}

			{!loading && filteredContents.length === 0 && (
				<div className="text-center py-16">
					<p className="text-gray-500 text-lg">해당 카테고리에 콘텐츠가 없습니다.</p>
				</div>
			)}
		</div>
	);
}
