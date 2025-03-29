'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Share2, Copy, CheckCircle2, Calendar, Users, Tag, ArrowRight } from 'lucide-react';
import { useWalletStore } from '@/store/walletStore';
import { useSubscription } from '@/hooks/useSubscription';
import axios from 'axios';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants/contractInfo';

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
	const params = useParams();
	// id 값을 명확한 string 타입으로 처리
	const id = Array.isArray(params.id) ? params.id[0] : params.id || '';
	const router = useRouter();
	const { address } = useWalletStore();
	const sharePopupRef = useRef<HTMLDivElement>(null);
	const shareButtonRef = useRef<HTMLButtonElement>(null);

	const [content, setContent] = useState<Content | null>(null);
	const [loading, setLoading] = useState(true);
	const [showShareOption, setShowShareOption] = useState(false);
	const [referralCopied, setReferralCopied] = useState(false);
	const [relatedContents, setRelatedContents] = useState<RelatedContent[]>([]);
	const [referrer, setReferrer] = useState<string | null>(null);
	const [subscriberCount, setSubscriberCount] = useState(0);

	// 스마트 컨트랙트를 통해 구독 상태 확인
	const {
		isSubscribed: subscribed,
		loading: subscriptionLoading,
		error: subscriptionError,
	} = useSubscription(address, id);

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
				const response = await axios.get(`/api/contents/${id}?userAddress=${address}`);
				const data = response.data;

				if (data && data.content) {
					setContent(data.content);
					setRelatedContents(data.relatedContents || []);
					setSubscriberCount(data.subscriberCount || 0);

					// API에서 반환한 구독 상태를 사용하는 경우 아래 주석 해제
					// if (data.isSubscribed !== undefined) {
					// 	setSubscribed(data.isSubscribed);
					// }
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
	}, [id, address]);

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

	const handleSubscribe = async () => {
		if (!address) {
			alert('지갑 연결이 필요합니다.');
			return;
		}

		try {
			// 메타마스크 연결 확인
			const { ethereum } = window as any;
			if (!ethereum) {
				alert('메타마스크가 설치되어 있지 않습니다.');
				return;
			}

			// 추천인 정보를 포함한 구독 처리
			const referrerData = referrer ? { referrerCode: referrer } : null;

			// 고유한 콘텐츠 ID를 정수로 변환
			// UUID나 문자열 ID는 간단한 해시 함수를 통해 정수로 변환
			let contentIdNumber;
			try {
				// 먼저 직접 정수 변환 시도
				contentIdNumber = parseInt(id);
				// NaN이 나오면 해시 함수 사용
				if (isNaN(contentIdNumber)) {
					contentIdNumber = getNumericHashFromString(id);
				}
				console.log('콘텐츠 ID:', id);
				console.log('변환된 숫자 ID:', contentIdNumber);
			} catch (error) {
				// 오류 발생 시 해시 함수 사용
				contentIdNumber = getNumericHashFromString(id);
				console.log('ID 변환 오류, 해시 사용:', contentIdNumber);
			}

			// 문자열을 숫자로 변환하는 간단한 해시 함수
			function getNumericHashFromString(str: string): number {
				let hash = 0;
				for (let i = 0; i < str.length; i++) {
					const char = str.charCodeAt(i);
					hash = (hash << 5) - hash + char;
					hash = hash & hash; // 32비트 정수로 변환
				}
				// 항상 양수로 만들고 작은 수로 제한 (스마트 컨트랙트 uint256 범위 내에서)
				return Math.abs(hash) % 1000000;
			}

			// 컨트랙트 인스턴스 생성
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

			// 결제 금액 (유효성 검사 추가)
			if (!content || typeof content.price !== 'number') {
				alert('콘텐츠 가격 정보가 유효하지 않습니다.');
				setLoading(false);
				return;
			}

			// 안전하게 숫자로 변환
			const priceValue = content.price.toString();
			console.log('결제 금액(숫자):', content.price);
			console.log('결제 금액(문자열):', priceValue);

			const price = ethers.utils.parseEther(priceValue);
			console.log('변환된 Wei 단위 금액:', price.toString());

			// 컨트랙트 호출 전 확인 메시지
			const willProceed = confirm(`${content.price} HSK로 구독하시겠습니까?`);
			if (!willProceed) return;

			// 로딩 상태 표시
			setLoading(true);

			// 추천인 지갑 주소 확인 (없으면 zero address 사용)
			let referrerAddress = ethers.constants.AddressZero;
			if (referrerData?.referrerCode) {
				try {
					// 추천인 코드로 지갑 주소 조회 (실제로는 API 호출 필요)
					const referrerResponse = await axios.get(`/api/users/referral/${referrerData.referrerCode}`);
					if (referrerResponse.data && referrerResponse.data.wallet_address) {
						referrerAddress = referrerResponse.data.wallet_address;
					}
				} catch (error) {
					console.error('추천인 조회 오류:', error);
					// 추천인 조회 실패 시 zero address 사용
				}
			}

			console.log('구독 요청 정보:', {
				contentId: contentIdNumber,
				price: price.toString(),
				referrer: referrerAddress,
			});

			// 컨트랙트 호출 - 구독 처리
			const tx = await contract.subscribe(contentIdNumber, referrerAddress, {
				value: price,
			});

			// 트랜잭션 처리 대기
			const receipt = await tx.wait();
			console.log('트랜잭션 완료:', receipt);

			// 트랜잭션 해시
			const transactionHash = receipt.transactionHash;

			// API 요청 데이터
			const requestData = {
				wallet_address: address,
				contentId: id,
				referralCode: referrerData?.referrerCode,
				amount: content?.price,
				transactionHash: transactionHash,
			};

			console.log('구독 API 요청 데이터:', requestData);

			// 구독 API 호출
			const response = await axios.post('/api/subscriptions', requestData);
			console.log('구독 성공:', response.data);

			alert(
				`${content?.price} HSK로 "${content?.title}" 콘텐츠를 구독했습니다.${referrer ? ` 추천인: ${referrer}` : ''}`
			);

			// 구독 상태 갱신을 위해 페이지 새로고침
			window.location.reload();
		} catch (error: any) {
			setLoading(false);
			// 오류 처리
			console.error('구독 오류:', error);

			// 메타마스크 오류 처리
			if (error.code === 4001) {
				alert('사용자가 트랜잭션을 취소했습니다.');
				return;
			}

			const errorMessage = error.response?.data?.error || error.message || '알 수 없는 오류가 발생했습니다.';
			const errorDetails = error.response?.data?.details || '';
			alert(`구독 처리 중 오류가 발생했습니다: ${errorMessage}\n${errorDetails}`);
		} finally {
			setLoading(false);
		}
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

					{/* 콘텐츠 개요 & 구독 정보 및 버튼 */}
					<div className="bg-white rounded-xl shadow-md p-6 mb-8">
						<h2 className="text-xl font-bold text-gray-800 mb-4">콘텐츠 개요</h2>
						<div className="text-gray-700 mb-6">{content.description}</div>
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

							{subscriptionLoading ? (
								<p className="text-gray-500 mt-4 text-center">구독 상태 확인 중...</p>
							) : subscriptionError ? (
								<p className="text-red-500 mt-4 text-center">구독 상태 확인 중 오류 발생: {subscriptionError}</p>
							) : (
								subscribed && (
									<div className="mt-6 text-center">
										<p className="text-green-600 mb-3">구독 중인 콘텐츠입니다. 전체 내용을 확인하세요.</p>
										<Link
											href={`/contents/${id}/view`}
											className="inline-flex items-center bg-green-50 text-green-700 px-5 py-2 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
										>
											전체 콘텐츠 보기
											<ArrowRight className="h-4 w-4 ml-1" />
										</Link>
									</div>
								)
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
