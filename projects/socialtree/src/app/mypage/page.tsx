'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useHashkeyContext } from '@/components/provider/HashkeyContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, BookOpen, Award, History, ArrowUpRight, LogOut, Clock } from 'lucide-react';
import ContentCard from '@/components/global/ContentCard';

// Mock data - 실제 구현 시 API 호출로 대체
const MOCK_SUBSCRIPTIONS = [
	{
		id: 1,
		title: '주식 시장 분석: 2025년 하반기 전망',
		description: '글로벌 경제 동향과 주요 섹터별 투자 전략 분석',
		creator: '김재무',
		price: 50,
		thumbnail: '/images/stock-analysis.jpg',
		subscribedAt: '2025-06-20',
		nextPaymentDate: '2025-07-20',
		category: '주식',
	},
	{
		id: 3,
		title: '부동산 투자의 비밀: 수익형 부동산 포트폴리오 구축',
		description: '현명한 부동산 투자로 안정적인 현금 흐름 창출하기',
		creator: '박부동',
		price: 40,
		thumbnail: '/images/real-estate.jpg',
		subscribedAt: '2025-06-15',
		nextPaymentDate: '2025-07-15',
		category: '부동산',
	},
];

const MOCK_REFERRALS = [
	{
		id: 1,
		contentId: 1,
		contentTitle: '주식 시장 분석: 2025년 하반기 전망',
		referredUser: '0xabcd...1234',
		level: 1, // 직접 추천
		commission: 10, // HSK
		date: '2025-06-22',
	},
	{
		id: 2,
		contentId: 1,
		contentTitle: '주식 시장 분석: 2025년 하반기 전망',
		referredUser: '0x7890...5678',
		level: 2, // 간접 추천
		commission: 2, // HSK
		date: '2025-06-21',
	},
	{
		id: 3,
		contentId: 3,
		contentTitle: '부동산 투자의 비밀: 수익형 부동산 포트폴리오 구축',
		referredUser: '0xdef0...9876',
		level: 1, // 직접 추천
		commission: 8, // HSK
		date: '2025-06-19',
	},
];

export default function MyPage() {
	const router = useRouter();
	const { address, isConnected, disconnectWallet } = useHashkeyContext();

	const [activeTab, setActiveTab] = useState('overview');
	const [totalCommission, setTotalCommission] = useState(0);
	const [nextMonthPayment, setNextMonthPayment] = useState(0);
	const [directReferrals, setDirectReferrals] = useState(0);
	const [indirectReferrals, setIndirectReferrals] = useState(0);

	useEffect(() => {
		// 로그인 상태 확인
		if (!isConnected) {
			router.push('/');
			return;
		}

		// Mock 데이터 계산
		const totalComm = MOCK_REFERRALS.reduce((sum, item) => sum + item.commission, 0);
		setTotalCommission(totalComm);

		const nextPayment = MOCK_SUBSCRIPTIONS.reduce((sum, item) => sum + item.price, 0);
		setNextMonthPayment(nextPayment);

		const direct = MOCK_REFERRALS.filter((item) => item.level === 1).length;
		setDirectReferrals(direct);

		const indirect = MOCK_REFERRALS.filter((item) => item.level > 1).length;
		setIndirectReferrals(indirect);
	}, [isConnected, router]);

	const handleWithdraw = () => {
		if (totalCommission <= 0) {
			alert('출금 가능한 커미션이 없습니다.');
			return;
		}

		alert(`${totalCommission} HSK가 지갑으로 출금되었습니다.`);
		setTotalCommission(0);
	};

	if (!isConnected) {
		return (
			<div className="container mx-auto px-4 py-16 text-center">
				<h1 className="text-2xl font-bold text-gray-800 mb-4">로그인이 필요합니다</h1>
				<p className="text-gray-600 mb-8">마이페이지에 접근하려면 지갑 연결이 필요합니다.</p>
				<Link href="/" className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
					홈으로 돌아가기
				</Link>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-5xl mx-auto">
				{/* 프로필 헤더 */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
					<div className="flex items-center">
						<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
							<span className="text-xl font-bold">{address?.substring(2, 3).toUpperCase()}</span>
						</div>
						<div>
							<h1 className="text-2xl font-bold text-gray-800">마이페이지</h1>
							<p className="text-gray-500">{address}</p>
						</div>
					</div>

					<button
						onClick={() => {
							disconnectWallet();
							router.push('/');
						}}
						className="flex items-center text-gray-600 hover:text-red-500"
					>
						<LogOut className="h-4 w-4 mr-1" />
						<span>로그아웃</span>
					</button>
				</div>

				{/* 주요 통계 */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
					<div className="bg-white rounded-xl shadow-sm p-6">
						<div className="flex justify-between items-start mb-4">
							<h3 className="text-gray-500 text-sm">보유 커미션</h3>
							<div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
								<Award className="h-4 w-4 text-green-600" />
							</div>
						</div>
						<p className="text-3xl font-bold text-gray-800">
							{totalCommission} <span className="text-sm text-gray-500">HSK</span>
						</p>
						<button
							onClick={handleWithdraw}
							disabled={totalCommission <= 0}
							className="mt-3 text-sm text-primary hover:underline flex items-center disabled:text-gray-400 disabled:no-underline"
						>
							지갑으로 출금하기
							<ArrowUpRight className="h-3 w-3 ml-1" />
						</button>
					</div>

					<div className="bg-white rounded-xl shadow-sm p-6">
						<div className="flex justify-between items-start mb-4">
							<h3 className="text-gray-500 text-sm">다음 달 결제 예정</h3>
							<div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
								<CreditCard className="h-4 w-4 text-blue-600" />
							</div>
						</div>
						<p className="text-3xl font-bold text-gray-800">
							{nextMonthPayment} <span className="text-sm text-gray-500">HSK</span>
						</p>
						<p className="mt-3 text-sm text-gray-500">{MOCK_SUBSCRIPTIONS.length}개 구독 콘텐츠</p>
					</div>

					<div className="bg-white rounded-xl shadow-sm p-6">
						<div className="flex justify-between items-start mb-4">
							<h3 className="text-gray-500 text-sm">나의 추천 현황</h3>
							<div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
								<History className="h-4 w-4 text-purple-600" />
							</div>
						</div>
						<p className="text-3xl font-bold text-gray-800">
							{directReferrals + indirectReferrals} <span className="text-sm text-gray-500">명</span>
						</p>
						<div className="mt-3 grid grid-cols-2 gap-2 text-sm">
							<div>
								<span className="text-gray-500">직접 추천:</span>
								<span className="font-medium text-gray-700 ml-1">{directReferrals}명</span>
							</div>
							<div>
								<span className="text-gray-500">간접 추천:</span>
								<span className="font-medium text-gray-700 ml-1">{indirectReferrals}명</span>
							</div>
						</div>
					</div>
				</div>

				{/* 탭 컨텐츠 */}
				<Tabs defaultValue="subscriptions" className="w-full">
					<TabsList className="grid w-full grid-cols-2 mb-8">
						<TabsTrigger value="subscriptions" className="flex items-center gap-2">
							<BookOpen className="h-4 w-4" />
							<span>구독 콘텐츠</span>
						</TabsTrigger>
						<TabsTrigger value="referrals" className="flex items-center gap-2">
							<Award className="h-4 w-4" />
							<span>추천 보상</span>
						</TabsTrigger>
					</TabsList>

					{/* 구독 콘텐츠 탭 */}
					<TabsContent value="subscriptions">
						{MOCK_SUBSCRIPTIONS.length > 0 ? (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{MOCK_SUBSCRIPTIONS.map((subscription) => (
									<div key={subscription.id} className="relative group">
										{/* 구독중 배지 */}
										<div className="absolute top-4 right-4 z-10">
											<span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
												구독중
											</span>
										</div>

										<ContentCard
											id={subscription.id}
											title={subscription.title}
											description={subscription.description || ''}
											price={subscription.price}
											creator={subscription.creator}
											category={subscription.category}
											showHoverEffect={false}
											currencySymbol="HSK/월"
										/>

										<div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 rounded-b-xl flex flex-col sm:flex-row justify-between gap-3">
											<div className="flex items-center text-sm text-gray-600">
												<Clock className="h-4 w-4 mr-1.5 text-gray-400" />
												<span className="font-medium text-gray-800">
													{new Date(subscription.nextPaymentDate).toLocaleDateString('ko-KR')} 결제 예정
												</span>
											</div>
											<Link
												href={`/mypage/contents/${subscription.id}`}
												className="flex items-center justify-center text-sm text-white bg-primary px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
											>
												콘텐츠 보기
												<ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
											</Link>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-12 bg-white rounded-xl shadow-sm">
								<BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
								<h3 className="text-lg font-medium text-gray-800 mb-2">구독 중인 콘텐츠가 없습니다</h3>
								<p className="text-gray-500 mb-6">다양한 금융 콘텐츠를 구독하고 투자 인사이트를 얻어보세요.</p>
								<Link
									href="/contents"
									className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
								>
									콘텐츠 둘러보기
								</Link>
							</div>
						)}
					</TabsContent>

					{/* 추천 보상 탭 */}
					<TabsContent value="referrals">
						{MOCK_REFERRALS.length > 0 ? (
							<div className="bg-white rounded-xl shadow-sm overflow-hidden">
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b border-gray-200">
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													날짜
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													콘텐츠
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													추천인
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													레벨
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													금액
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-200">
											{MOCK_REFERRALS.map((referral) => (
												<tr key={referral.id} className="hover:bg-gray-50">
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
														{new Date(referral.date).toLocaleDateString('ko-KR')}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
														<Link
															href={`/contents/${referral.contentId}`}
															className="hover:text-primary hover:underline"
														>
															{referral.contentTitle}
														</Link>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{referral.referredUser}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														<span
															className={`px-2 py-1 rounded-full text-xs font-medium ${
																referral.level === 1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
															}`}
														>
															{referral.level === 1 ? '직접 추천' : `${referral.level}차 추천`}
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
														+{referral.commission} HSK
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						) : (
							<div className="text-center py-12 bg-white rounded-xl shadow-sm">
								<Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
								<h3 className="text-lg font-medium text-gray-800 mb-2">추천 보상 내역이 없습니다</h3>
								<p className="text-gray-500 mb-6">친구나 팔로워에게 콘텐츠를 추천하고 보상을 받아보세요.</p>
								<Link
									href="/contents"
									className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
								>
									콘텐츠 둘러보기
								</Link>
							</div>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
