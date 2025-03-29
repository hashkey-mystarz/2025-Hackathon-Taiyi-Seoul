export default function Home() {
	// 목업 데이터 - 실제로는 API 또는 supabase에서 가져올 것
	const mockContents = [
		{
			id: 1,
			title: '비트코인 투자 전략 가이드',
			description: '비트코인 시장 분석 및 투자 전략을 알려드립니다.',
			price: 0.05,
			author: '김준호',
		},
		{
			id: 2,
			title: '월 200만원 배당금 수익 전략',
			description: '안정적인 배당 투자로 수익 창출하는 방법',
			price: 0.03,
			author: '이민지',
		},
		{
			id: 3,
			title: '부동산 투자의 모든 것',
			description: '부동산 시장 분석 및 투자 전략을 공유합니다.',
			price: 0.08,
			author: '박상현',
		},
	];

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			{/* 프로모션 배너 */}
			<div className="bg-blue-600 rounded-xl shadow-lg overflow-hidden mb-10">
				<div className="px-6 py-12 md:p-12 text-center md:text-left">
					<h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
						금융 콘텐츠 구독과 공유로 <br className="hidden md:inline" />
						수익을 창출하세요
					</h1>
					<p className="text-blue-100 mb-6">
						SocialTree에서는 유익한 금융 콘텐츠를 구독하고, 추천을 통해 커미션을 받을 수 있습니다.
					</p>
					<button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-50 transition duration-200">
						시작하기
					</button>
				</div>
			</div>

			{/* 콘텐츠 섹션 */}
			<div className="mb-12">
				<h2 className="text-2xl font-bold text-gray-900 mb-6">인기 콘텐츠</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{mockContents.map((content) => (
						<div key={content.id} className="bg-white rounded-lg shadow-md overflow-hidden">
							<div className="p-6">
								<h3 className="text-lg font-bold text-gray-900 mb-2">{content.title}</h3>
								<p className="text-gray-600 text-sm mb-4">{content.description}</p>
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-500">작성자: {content.author}</span>
									<span className="text-blue-600 font-bold">{content.price} ETH/월</span>
								</div>
							</div>
							<div className="border-t border-gray-200 px-6 py-4">
								<button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200">
									구독하기
								</button>
							</div>
						</div>
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
	);
}
