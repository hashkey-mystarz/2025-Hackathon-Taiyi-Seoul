import { useState, useCallback, useEffect } from 'react';
import { useWalletStore } from '@/store/walletStore';
import axios from 'axios';

// 사용자 정보 인터페이스
export interface User {
	id: string;
	wallet_address: string;
	referral_code?: string;
	referrer_id?: string;
	nickname?: string;
	// ... 기타 사용자 속성
}

// 지갑 타입 정의
export type WalletType = 'metamask';

// 해시키 테스트넷 설정
const HASHKEY_TESTNET = {
	chainId: '0x85', // 133 in hex
	chainName: 'HashKey Chain Testnet',
	rpcUrls: ['https://hashkeychain-testnet.alt.technology'],
	nativeCurrency: {
		name: 'HSK',
		symbol: 'HSK',
		decimals: 18,
	},
	blockExplorerUrls: ['https://hashkeychain-testnet-explorer.alt.technology'],
};

export function useAuth() {
	const { address, setAddress, disconnect } = useWalletStore();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);

	// 사용자 정보 조회
	const fetchUserInfo = useCallback(async (walletAddress: string) => {
		try {
			// API를 통해 사용자 정보 조회
			const response = await axios.get(`/api/users/wallet/${walletAddress}`);
			if (response.data && response.data.user) {
				setUser(response.data.user);
				return response.data.user;
			}
			return null;
		} catch (error) {
			console.error('사용자 정보 조회 실패:', error);
			return null;
		}
	}, []);

	// 지갑 주소가 변경될 때마다 사용자 정보 갱신
	useEffect(() => {
		if (address) {
			fetchUserInfo(address);
		} else {
			setUser(null);
		}
	}, [address, fetchUserInfo]);

	// 지갑 연결 상태 및 이벤트 리스너
	useEffect(() => {
		if (typeof window === 'undefined' || !address) return;

		// 메타마스크 이벤트 리스너
		const { ethereum } = window;
		if (ethereum) {
			// 계정 변경 감지
			const handleAccountsChanged = (accounts: string[]) => {
				if (accounts.length === 0) {
					disconnect();
				} else if (accounts[0] !== address) {
					// 주소가 변경되면 로그아웃 처리
					console.log('지갑 주소가 변경되어 로그아웃됩니다.');
					disconnect();

					// 선택적: 새로고침을 통해 애플리케이션 상태 초기화
					window.location.href = '/';
				}
			};

			ethereum.on('accountsChanged', handleAccountsChanged);

			return () => {
				ethereum.removeListener('accountsChanged', handleAccountsChanged);
			};
		}
	}, [address, disconnect]);

	// 지갑 연결
	const connectWallet = useCallback(
		async (_type: WalletType = 'metamask') => {
			setIsLoading(true);
			setError(null);

			try {
				const { ethereum } = window as any;
				if (!ethereum) {
					throw new Error('MetaMask가 설치되어 있지 않습니다.');
				}

				// 체인 확인 및 전환
				try {
					const chainId = await ethereum.request({ method: 'eth_chainId' });
					if (chainId !== HASHKEY_TESTNET.chainId) {
						// 테스트넷으로 전환
						await ethereum
							.request({
								method: 'wallet_switchEthereumChain',
								params: [{ chainId: HASHKEY_TESTNET.chainId }],
							})
							.catch(async (switchError: any) => {
								// 체인이 없으면 추가
								if (switchError.code === 4902) {
									await ethereum.request({
										method: 'wallet_addEthereumChain',
										params: [HASHKEY_TESTNET],
									});
								} else {
									throw switchError;
								}
							});
					}
				} catch (chainError: any) {
					console.error('네트워크 전환 오류:', chainError);
					setError('HashKey 테스트넷 연결 실패');
					setIsLoading(false);
					return null;
				}

				// 계정 요청
				const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
				if (accounts.length === 0) {
					throw new Error('지갑 연결 실패');
				}

				// 연결 상태 저장
				const walletAddress = accounts[0];
				setAddress(walletAddress);

				// 사용자 정보 조회
				const userInfo = await fetchUserInfo(walletAddress);

				// 사용자 정보가 없으면 회원가입 API 호출
				if (!userInfo) {
					try {
						const signupResponse = await axios.post('/api/users/signup', {
							wallet_address: walletAddress,
						});

						if (signupResponse.data && signupResponse.data.user) {
							setUser(signupResponse.data.user);
						}
					} catch (signupError) {
						console.error('회원가입 처리 오류:', signupError);
					}
				}

				return { address: walletAddress };
			} catch (err: any) {
				const errorMsg = err.message || '지갑 연결 중 오류가 발생했습니다.';
				setError(errorMsg);
				console.error('지갑 연결 오류:', err);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[setAddress, fetchUserInfo]
	);

	// 로그아웃
	const logout = useCallback(() => {
		disconnect();
		setUser(null);
	}, [disconnect]);

	return {
		isLoading,
		error,
		connectWallet,
		logout,
		user,
	};
}
