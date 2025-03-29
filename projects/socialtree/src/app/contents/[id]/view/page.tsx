'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Calendar, Users, Tag } from 'lucide-react';
import { useWalletStore } from '@/store/walletStore';
import { useSubscription } from '@/hooks/useSubscription';
import axios from 'axios';

// 콘텐츠 타입 정의
interface Content {
	id: string;
	title: string;
	description: string;
	price: number;
	creator: {
		id: string;
		wallet_address: string;
		nickname?: string;
	};
	creator_id: string;
	category?: string;
	thumbnail_url?: string;
	created_at: string;
	content?: string;
	full_content?: string;
	subscriber_count?: number;
}

export default function ContentView() {
	const params = useParams();
	// id 값을 명확한 string 타입으로 처리
	const id = Array.isArray(params.id) ? params.id[0] : params.id || '';
	const router = useRouter();
	const { isLoading } = useAuth();
	const { address } = useWalletStore();

	const [content, setContent] = useState<Content | null>(null);
	const [loading, setLoading] = useState(true);

	// 스마트 컨트랙트를 통해 구독 상태 확인
	const { isSubscribed, loading: subscriptionLoading, error: subscriptionError } = useSubscription(address, id);

	useEffect(() => {
		// 연결 상태 확인
		if (!address) {
			router.push(`/contents/${id}`);
			return;
		}

		// API 호출로 콘텐츠 데이터 가져오기
		const fetchContent = async () => {
			setLoading(true);

			try {
				const response = await axios.get(`/api/contents/${id}?userAddress=${address}`);
				if (response.data && response.data.content) {
					// 서버에서 사용자의 구독 상태를 확인하고 full_content가 있을 경우에만 포함
					const contentData = response.data.content;

					// 구독자만 full_content에 접근 가능
					if (isSubscribed && !contentData.full_content) {
						// 구독자인데 full_content가 없는 경우, 콘텐츠 상세 페이지로 리다이렉트
						router.push(`/contents/${id}`);
						return;
					}

					setContent(contentData);
				} else {
					// 콘텐츠를 찾을 수 없는 경우 목록 페이지로 리다이렉트
					router.push('/contents');
				}
			} catch (error) {
				console.error('콘텐츠 로드 오류:', error);
				router.push('/contents');
			} finally {
				setLoading(false);
			}
		};

		fetchContent();
	}, [id, router, address]);

	// 구독 상태에 따라 페이지 접근 제어
	useEffect(() => {
		// 구독 확인이 완료되었고, 구독 중이 아니면 상세 페이지로 리다이렉트
		if (!subscriptionLoading && !isSubscribed && !loading && address) {
			router.push(`/contents/${id}`);
		}
	}, [isSubscribed, subscriptionLoading, loading, id, router, address]);

	// 마크다운 텍스트를 HTML로 변환하는 함수
	const renderMarkdown = (markdown: string) => {
		if (!markdown) return { __html: '' };

		return {
			__html: markdown
				.replace(/^# (.*)/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
				.replace(/^## (.*)/gm, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
				.replace(/^### (.*)/gm, '<h3 class="text-xl font-bold mt-5 mb-2">$1</h3>')
				.replace(/^- (.*)/gm, '<li class="ml-6 mb-1">$1</li>')
				.replace(/^\* (.*)/gm, '<li class="ml-6 mb-1">$1</li>')
				.replace(/^[0-9]+\. (.*)/gm, '<ol class="list-decimal"><li class="ml-6 mb-1">$1</li></ol>')
				.replace(/\n\n/g, '<br><br>')
				.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'), // Bold text
		};
	};

	if (loading || subscriptionLoading) {
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
							<span>{new Date(content.created_at).toLocaleDateString('ko-KR')}</span>
						</div>
						<div className="flex items-center">
							<Users className="h-4 w-4 mr-1" />
							<span>{content.subscriber_count}명 구독중</span>
						</div>
						<div className="flex items-center">
							<Tag className="h-4 w-4 mr-1" />
							<span>{content.category}</span>
						</div>
					</div>

					<div className="flex items-center mb-8">
						<div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold mr-3">
							{content.creator.nickname?.substring(0, 1) || content.creator.id.substring(0, 1)}
						</div>
						<div>
							<p className="font-medium text-gray-800">{content.creator.nickname || content.creator.id}</p>
							<p className="text-sm text-gray-500">{content.creator.wallet_address}</p>
						</div>
					</div>
				</div>

				{/* 콘텐츠 본문 */}
				<div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8">
					<div className="prose prose-lg max-w-none">
						<div dangerouslySetInnerHTML={renderMarkdown(content.full_content || content.description)} />

						{!content.full_content && (
							<div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
								<p className="text-yellow-700">
									이 콘텐츠의 전체 내용은 구독자만 볼 수 있습니다. 이미 구독하셨다면 페이지를 새로고침해주세요.
								</p>
							</div>
						)}
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
