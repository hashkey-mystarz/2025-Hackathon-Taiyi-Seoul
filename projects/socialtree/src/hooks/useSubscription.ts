import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '@/constants/contractInfo';

interface SubscriptionStatus {
	isSubscribed: boolean;
	endTime: number;
	loading: boolean;
	error: string | null;
}

export function useSubscription(
	userAddress: string | undefined | null,
	contentId: string | number
): SubscriptionStatus {
	const [status, setStatus] = useState<SubscriptionStatus>({
		isSubscribed: false,
		endTime: 0,
		loading: true,
		error: null,
	});

	useEffect(() => {
		const checkSubscription = async () => {
			// 필요한 데이터가 없으면 검사하지 않음
			if (!userAddress || !contentId) {
				setStatus({
					isSubscribed: false,
					endTime: 0,
					loading: false,
					error: '지갑 주소 또는 콘텐츠 ID가 없습니다.',
				});
				return;
			}

			try {
				// UUID 형식의 contentId를 스마트 컨트랙트용 숫자 ID로 변환
				let numericContentId: number;

				if (typeof contentId === 'string') {
					// 먼저 직접 정수 변환 시도
					numericContentId = parseInt(contentId);

					// NaN이면 해시 함수 사용
					if (isNaN(numericContentId)) {
						numericContentId = getNumericHashFromString(contentId);
					}
				} else {
					numericContentId = contentId;
				}

				// 로그 기록
				console.log('useSubscription - 원본 ID:', contentId);
				console.log('useSubscription - 변환된 숫자 ID:', numericContentId);

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

				// 컨트랙트 연결
				const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
				const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

				// 구독 상태 조회
				const [active, endTime] = await contract.getSubscriptionStatus(userAddress, numericContentId);

				setStatus({
					isSubscribed: active,
					endTime: endTime.toNumber(),
					loading: false,
					error: null,
				});
			} catch (error) {
				console.error('구독 상태 확인 오류:', error);
				setStatus({
					isSubscribed: false,
					endTime: 0,
					loading: false,
					error: error instanceof Error ? error.message : '구독 상태 확인 중 오류가 발생했습니다.',
				});
			}
		};

		checkSubscription();
	}, [userAddress, contentId]);

	return status;
}
