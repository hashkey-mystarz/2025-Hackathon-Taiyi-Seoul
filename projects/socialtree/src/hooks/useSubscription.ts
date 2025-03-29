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
				// 이 부분은 실제 구현에서 ID 매핑 테이블 또는 다른 방식으로 처리할 수 있음
				let numericContentId: number;

				if (typeof contentId === 'string') {
					// UUID에서 숫자만 추출하여 변환 (임시 방법, 프로덕션에서는 더 나은 방법 사용 권장)
					numericContentId = parseInt(contentId.replace(/\D/g, '').substring(0, 8), 16) % 100000;
				} else {
					numericContentId = contentId;
				}

				// 숫자 변환 실패 시 에러
				if (isNaN(numericContentId)) {
					throw new Error('유효하지 않은 콘텐츠 ID입니다.');
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
