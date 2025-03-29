'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ContentCard from '@/components/global/ContentCard';

export default function Home() {
	// 목업 데이터 - 실제로는 API 또는 supabase에서 가져올 것
	const mockContents = [
		{
			id: 1,
			title: '비트코인 투자 전략 가이드',
			description: '비트코인 시장 분석 및 투자 전략을 알려드립니다.',
			price: 50,
			author: '김준호',
			category: '암호화폐',
		},
		{
			id: 2,
			title: '월 200만원 배당금 수익 전략',
			description: '안정적인 배당 투자로 수익 창출하는 방법',
			price: 30,
			author: '이민지',
			category: '주식',
		},
		{
			id: 3,
			title: '부동산 투자의 모든 것',
			description: '부동산 시장 분석 및 투자 전략을 공유합니다.',
			price: 80,
			author: '박상현',
			category: '부동산',
		},
	];

	// 배너 슬라이드 데이터
	const banners = [
		{
			id: 1,
			title: '금융 콘텐츠 구독과 공유로\n수익을 창출하세요',
			description: 'SocialTree에서는 유익한 금융 콘텐츠를 구독하고, 추천을 통해 커미션을 받을 수 있습니다.',
			buttonText: '시작하기',
			bgColor: 'from-primary to-primary/90',
			imageUrl: '/images/banners/share_icon.png',
		},
		{
			id: 2,
			title: '추천하고 보상받으세요\n재귀 커미션 시스템',
			description: '친구를 초대할 때마다 20%의 커미션을 받고, 그들이 초대한 사람들로부터도 지속적인 수익이 발생합니다.',
			buttonText: '친구 초대하기',
			bgColor: 'from-primary/90 to-indigo-600',
			imageUrl: '/images/banners/commission_icon.png',
		},
		{
			id: 3,
			title: '검증된 금융 전문가의\n프리미엄 콘텐츠',
			description: '전문가들의 고급 투자 인사이트로 여러분의 자산을 효과적으로 관리하세요.',
			buttonText: '콘텐츠 둘러보기',
			bgColor: 'from-indigo-600 to-indigo-700',
			imageUrl: '/images/banners/premium_icon.png',
		},
	];

	// 현재 활성화된 배너 인덱스
	const [activeBanner, setActiveBanner] = useState(0);

	// 자동 슬라이드 기능
	useEffect(() => {
		const interval = setInterval(() => {
			setActiveBanner((prev) => (prev + 1) % banners.length);
		}, 5000);
		return () => clearInterval(interval);
	}, [banners.length]);

	return (
		<>
			{/* 히어로 배너 (풀스크린 슬라이드) */}
			<div className="relative w-full h-[600px] shadow-lg">
				{/* 배너 슬라이드 */}
				<div className="relative w-full h-full">
					{banners.map((banner, index) => (
						<div
							key={banner.id}
							className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${
								index === activeBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'
							}`}
						>
							{/* 배경 그라데이션 */}
							<div className={`absolute inset-0 bg-gradient-to-r ${banner.bgColor} opacity-90 z-10`}></div>

							{/* 텍스트 콘텐츠 */}
							<div className="relative z-20 flex h-full items-center">
								<div className="max-w-7xl mx-auto w-full px-4 flex flex-col md:flex-row items-center gap-3 md:gap-6 sm:px-6 lg:px-8">
									<div className="w-full md:w-3/5 px-6 py-8 md:px-0 md:py-10 flex flex-col justify-center order-2 md:order-1 pb-16 md:pb-10">
										<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 whitespace-pre-line">
											{banner.title}
										</h1>
										<p className="text-white/90 text-base md:text-lg mb-6 md:mb-8 max-w-lg">{banner.description}</p>
										<button className="w-fit bg-white text-primary px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-white/90 transition duration-200">
											{banner.buttonText}
										</button>
									</div>
									<div className="w-full md:w-2/5 flex justify-center items-center py-2 md:py-4 order-1 md:order-2">
										<img
											src={banner.imageUrl}
											alt="배너 이미지"
											className="max-w-[160px] md:max-w-[240px] lg:max-w-[280px] object-contain h-auto filter drop-shadow-lg"
										/>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* 화살표 네비게이션 - 위치 조정 */}
				<div className="absolute bottom-8 right-8 md:right-12 z-30 flex space-x-3">
					<button
						className="bg-white/20 hover:bg-white/30 rounded-full p-2 backdrop-blur-sm transition-all"
						onClick={() => setActiveBanner((prev) => (prev - 1 + banners.length) % banners.length)}
						aria-label="이전 배너"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={2}
							stroke="white"
							className="w-5 h-5"
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
						</svg>
					</button>

					<button
						className="bg-white/20 hover:bg-white/30 rounded-full p-2 backdrop-blur-sm transition-all"
						onClick={() => setActiveBanner((prev) => (prev + 1) % banners.length)}
						aria-label="다음 배너"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={2}
							stroke="white"
							className="w-5 h-5"
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
						</svg>
					</button>
				</div>

				{/* 슬라이드 인디케이터 */}
				<div className="absolute bottom-8 left-8 md:left-12 z-30 flex space-x-2">
					{banners.map((_, index) => (
						<button
							key={index}
							onClick={() => setActiveBanner(index)}
							className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
								index === activeBanner ? 'bg-white w-8' : 'bg-white/50'
							}`}
							aria-label={`배너 ${index + 1}로 이동`}
						></button>
					))}
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{/* 콘텐츠 섹션 */}
				<div className="mb-12">
					<h2 className="text-2xl font-bold text-gray-900 mb-6">인기 콘텐츠</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{mockContents.map((content) => (
							<ContentCard
								key={content.id}
								id={content.id}
								title={content.title}
								description={content.description}
								price={content.price}
								creator={content.author}
								category={content.category}
								showHoverEffect={true}
								currencySymbol="HSK"
							/>
						))}
					</div>
				</div>

				{/* 소개 섹션 */}
				<div className="bg-white rounded-lg shadow-md p-8 mb-10">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">SocialTree란?</h2>
					<p className="text-gray-600 mb-4">
						SocialTree는 콘텐츠 제작자와 홍보자가 모두 보상을 받을 수 있는 금융 정보 SocialFi 플랫폼입니다. 유료 구독
						모델로 제공되며, 초대 보상 구조는 재귀형 커미션(20%) 방식으로 동작합니다.
					</p>
					<p className="text-gray-600">
						친구나 지인을 초대하여 콘텐츠를 추천하고, 그들이 구독할 때마다 커미션을 받아보세요!
					</p>
				</div>
			</div>
		</>
	);
}
