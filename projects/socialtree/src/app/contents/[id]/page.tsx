'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Share2, Copy, CheckCircle2, Calendar, Users, Tag, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/store/walletStore';
import axios from 'axios';

interface Content {
	id: string;
	title: string;
	description: string;
	price: number;
	creator_id: string;
	creator: {
		id: string;
		wallet_address: string;
		nickname?: string;
	};
	thumbnail_url?: string;
	category?: string;
	created_at: string;
}

interface RelatedContent {
	id: string;
	title: string;
	description?: string;
	price: number;
	creator_id: string;
	thumbnail_url?: string;
	category?: string;
	created_at: string;
}

export default function ContentDetail() {
	const { id } = useParams();
	const router = useRouter();
	const { address } = useWalletStore();
	const sharePopupRef = useRef<HTMLDivElement>(null);
	const shareButtonRef = useRef<HTMLButtonElement>(null);

	const [content, setContent] = useState<Content | null>(null);
	const [loading, setLoading] = useState(true);
	const [subscribed, setSubscribed] = useState(false);
	const [showShareOption, setShowShareOption] = useState(false);
	const [referralCopied, setReferralCopied] = useState(false);
	const [relatedContents, setRelatedContents] = useState<RelatedContent[]>([]);
	const [referrer, setReferrer] = useState<string | null>(null);
	const [subscriberCount, setSubscriberCount] = useState(0);

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

	// API를 통해 콘텐츠 데이터 가져오기
	useEffect(() => {
		const fetchContent = async () => {
			try {
				setLoading(true);
				const response = await axios.get(`/api/contents/${id}`);
				const data = response.data;

				if (data && data.content) {
					setContent(data.content);
					setRelatedContents(data.relatedContents || []);
					setSubscriberCount(data.subscriberCount || 0);

					// 구독 상태를 확인하는 API 호출 (임시로 랜덤 설정)
					// 실제로는 subscription API를 통해 확인해야 함
					setSubscribed(Math.random() > 0.5);
				}
			} catch (error) {
				console.error('콘텐츠 로드 오류:', error);
			} finally {
				setLoading(false);
			}
		};

		if (id) {
			fetchContent();
		}
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
			alert(`${content?.price} HSK로 "${content?.title}" 콘텐츠를 구독했습니다. 추천인: ${referrer}`);
		} else {
			alert(`${content?.price} HSK로 "${content?.title}" 콘텐츠를 구독했습니다.`);
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
								<span>{new Date(content.created_at).toLocaleDateString('ko-KR')}</span>
							</div>
							<div className="flex items-center">
								<Users className="h-4 w-4 mr-1" />
								<span>{subscriberCount}명 구독중</span>
							</div>
							<div className="flex items-center">
								<Tag className="h-4 w-4 mr-1" />
								<span>{content.category}</span>
							</div>
						</div>

						<div className="flex items-center mb-8">
							<div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold mr-3">
								{content.creator.nickname ? content.creator.nickname.substring(0, 1).toUpperCase() : ''}
							</div>
							<div>
								<p className="font-medium text-gray-800">
									{content.creator.nickname || content.creator.wallet_address.substring(0, 10) + '...'}
								</p>
								<p className="text-sm text-gray-500">
									{content.creator.wallet_address.substring(0, 6) +
										'...' +
										content.creator.wallet_address.substring(content.creator.wallet_address.length - 4)}
								</p>
							</div>
						</div>

						{/* 이미지 */}
						<div
							className="w-full h-64 md:h-96 bg-gray-200 rounded-xl mb-8 overflow-hidden"
							style={{
								backgroundImage: `url('${
									content.thumbnail_url ||
									`https://source.unsplash.com/random/1200x600?${content.category || 'finance'}`
								}')`,
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
										className={`flex items-center gap-1 px-3 py-2 rounded-lg ${
											subscribed
												? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
												: 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
										}`}
									>
										<Share2 className="h-4 w-4" />
										<span className="text-sm font-medium">
											{subscribed ? '추천하고 커미션 받기' : '구독 후 추천 가능'}
										</span>
									</button>

									{showShareOption && (
										<div
											ref={sharePopupRef}
											className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg p-4 z-10 border border-green-100"
										>
											<div className="bg-green-50 -m-4 mb-3 p-4 rounded-t-lg border-b border-green-100">
												<div className="flex items-center justify-between">
													<h3 className="text-sm font-medium text-gray-700">추천하고 수익 얻기</h3>
													<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-medium">
														커미션 {Math.round(content.price * 0.2)} HSK
													</span>
												</div>
												<p className="text-xs text-gray-600 mt-1">
													친구가 이 링크로 구독하면 콘텐츠 가격의 20%를 보상으로 받습니다
												</p>
											</div>
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
									__html: content.description
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
												backgroundImage: `url('${
													related.thumbnail_url ||
													`https://source.unsplash.com/random/100x100?${related.category || 'finance'}`
												}')`,
												backgroundSize: 'cover',
												backgroundPosition: 'center',
											}}
										></div>
										<div>
											<h3 className="font-medium text-gray-800 line-clamp-2">{related.title}</h3>
											<p className="text-sm text-gray-500">크리에이터 · {related.price} HSK</p>
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
