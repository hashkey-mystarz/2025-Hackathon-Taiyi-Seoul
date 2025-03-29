import { useState } from 'react';
import axios from 'axios';
import { useWalletStore } from '@/store/walletStore';

export const useRewards = (userId?: string) => {
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [rewards, setRewards] = useState<any>(null);
	const { signMessage } = useWalletStore();

	const fetchRewards = async () => {
		if (!userId) return;

		setIsLoading(true);
		setErrorMessage(null);

		try {
			const response = await axios.get(`/api/rewards/${userId}`);
			setRewards(response.data);
		} catch (error) {
			console.error('보상 정보 조회 실패:', error);
			setErrorMessage('보상 정보를 불러오는 중 오류가 발생했습니다.');
		} finally {
			setIsLoading(false);
		}
	};

	const withdrawRewards = async () => {
		if (!userId) {
			setErrorMessage('사용자 ID가 필요합니다.');
			return null;
		}

		setIsLoading(true);
		setErrorMessage(null);

		try {
			// 서명 메시지 생성
			const timestamp = Date.now();
			const message = `SocialTree 커미션 출금 요청: ${timestamp}`;

			// 서명 요청
			const signature = await signMessage(message);
			if (!signature) {
				throw new Error('서명이 거부되었습니다.');
			}

			// 출금 API 호출
			const response = await axios.post(`/api/rewards/${userId}/withdraw`, {
				signature,
				message,
			});

			// 성공 후 보상 정보 새로고침
			await fetchRewards();

			return response.data;
		} catch (error: any) {
			console.error('보상 출금 실패:', error);
			setErrorMessage(error.response?.data?.error || '보상 출금 중 오류가 발생했습니다.');
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		isLoading,
		errorMessage,
		rewards,
		fetchRewards,
		withdrawRewards,
	};
};
