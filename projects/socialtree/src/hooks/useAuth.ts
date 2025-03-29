import { useState, useCallback, useEffect } from 'react';
import { useWalletStore, HASHKEY_TESTNET_CHAIN_ID } from '@/store/walletStore';
import { ethers } from 'ethers';

// 지갑 타입 정의
export type WalletType = 'metamask' | 'phantom';

// 해시키 테스트넷 설정
const HASHKEY_TESTNET = {
	chainId: HASHKEY_TESTNET_CHAIN_ID,
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
	const {
		address,
		isConnected,
		isAuthenticated,
		authToken,
		chainId,
		setAddress,
		setConnected,
		setAuthenticated,
		setAuthToken,
		setChainId,
		disconnect,
	} = useWalletStore();

	const [isLoading, setIsLoading] = useState(true); // 초기값을 true로 설정
	const [error, setError] = useState<string | null>(null);
	const [isCorrectChain, setIsCorrectChain] = useState(chainId === HASHKEY_TESTNET_CHAIN_ID);

	// 초기화 및 이벤트 리스너 설정
	useEffect(() => {
		// 이미 연결되어 있다면 체인 상태만 확인
		if (isConnected && address) {
			setIsCorrectChain(chainId === HASHKEY_TESTNET_CHAIN_ID);
			setIsLoading(false);
			return;
		}

		const { ethereum } = window as any;
		if (!ethereum) {
			setIsLoading(false);
			return;
		}

		// 지갑 연결 상태를 실시간으로 확인
		const checkConnection = async () => {
			try {
				const accounts = await ethereum.request({ method: 'eth_accounts' });
				const currentChainId = await ethereum.request({ method: 'eth_chainId' });

				// 체인 ID 업데이트
				setChainId(currentChainId);
				setIsCorrectChain(currentChainId === HASHKEY_TESTNET_CHAIN_ID);

				// 계정이 있고 주소가 다르면 주소 업데이트
				if (accounts.length > 0) {
					if (!isConnected || accounts[0] !== address) {
						setAddress(accounts[0]);
						setConnected(true);
					}
				} else if (isConnected) {
					// MetaMask에 계정이 없는데 연결되어 있다고 상태가 되어 있으면 연결 해제
					disconnect();
				}
			} catch (err) {
				console.error('연결 상태 확인 중 오류:', err);
			} finally {
				// 연결 상태 체크가 완료되면 로딩 상태 해제
				setIsLoading(false);
			}
		};

		// 초기화 시 한 번 실행
		checkConnection();

		// 계정 변경 감지
		const handleAccountsChanged = async (accounts: string[]) => {
			if (accounts.length === 0) {
				// 연결 해제됨
				disconnect();
			} else if (accounts[0] !== address) {
				// 계정이 변경됨
				setAddress(accounts[0]);
				setConnected(true);
				setAuthenticated(false); // 계정이 바뀌었으므로 재인증 필요
			}
		};

		// 체인 변경 감지
		const handleChainChanged = (newChainId: string) => {
			setChainId(newChainId);
			setIsCorrectChain(newChainId === HASHKEY_TESTNET_CHAIN_ID);

			// 체인 변경 시 페이지를 새로고침하지 않고 상태만 업데이트
			if (newChainId !== HASHKEY_TESTNET_CHAIN_ID) {
				setError('HashKey 테스트넷에 연결해주세요.');
			} else {
				setError(null);
			}
		};

		ethereum.on('accountsChanged', handleAccountsChanged);
		ethereum.on('chainChanged', handleChainChanged);

		// 컴포넌트 언마운트 시 이벤트 리스너 제거
		return () => {
			ethereum.removeListener('accountsChanged', handleAccountsChanged);
			ethereum.removeListener('chainChanged', handleChainChanged);
		};
	}, [address, isConnected, setAddress, setConnected, setAuthenticated, disconnect, setChainId, chainId]);

	// 해시키 테스트넷으로 전환
	const switchToHashkeyTestnet = async () => {
		try {
			const { ethereum } = window as any;
			if (!ethereum) throw new Error('MetaMask가 설치되어 있지 않습니다.');

			try {
				// 먼저 기존 체인으로 전환 시도
				await ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: HASHKEY_TESTNET.chainId }],
				});
				setChainId(HASHKEY_TESTNET.chainId);
				setIsCorrectChain(true);
				setError(null);
				return true;
			} catch (switchError: any) {
				// 체인이 없으면 추가
				if (switchError.code === 4902) {
					await ethereum.request({
						method: 'wallet_addEthereumChain',
						params: [HASHKEY_TESTNET],
					});
					setChainId(HASHKEY_TESTNET.chainId);
					setIsCorrectChain(true);
					setError(null);
					return true;
				}
				throw switchError;
			}
		} catch (err: any) {
			console.error('네트워크 전환 에러:', err);
			setError(`해시키 테스트넷으로 전환 실패: ${err.message}`);
			return false;
		}
	};

	// 메타마스크 연결
	const connectMetamask = async (): Promise<string | null> => {
		try {
			const { ethereum } = window as any;
			if (!ethereum) {
				throw new Error('MetaMask가 설치되어 있지 않습니다. 설치 후 다시 시도해주세요.');
			}

			// 계정 요청 전에 먼저 네트워크 확인 및 전환
			const chainId = await ethereum.request({ method: 'eth_chainId' });
			if (chainId !== HASHKEY_TESTNET.chainId) {
				const switched = await switchToHashkeyTestnet();
				if (!switched) {
					throw new Error('HashKey 테스트넷 연결 실패');
				}
			}

			// 계정 요청
			const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
			if (accounts.length === 0) {
				throw new Error('지갑 연결에 실패했습니다.');
			}

			const walletAddress = accounts[0];

			// 연결 상태 저장
			setAddress(walletAddress);
			setConnected(true);
			setChainId(HASHKEY_TESTNET.chainId);
			setIsCorrectChain(true);

			return walletAddress;
		} catch (err: any) {
			throw err;
		}
	};

	// 팬텀 지갑 연결 (현재 미지원, 필요 시 구현)
	const connectPhantom = async (): Promise<string | null> => {
		throw new Error('Phantom 지갑은 현재 지원하지 않습니다.');
	};

	// 지갑 연결
	const connectWallet = useCallback(
		async (type: WalletType = 'metamask') => {
			setIsLoading(true);
			setError(null);

			try {
				let walletAddress: string | null = null;

				if (type === 'metamask') {
					walletAddress = await connectMetamask();
				} else if (type === 'phantom') {
					walletAddress = await connectPhantom();
				}

				return walletAddress;
			} catch (err: any) {
				setError(err.message || '지갑 연결 중 오류가 발생했습니다.');
				console.error('지갑 연결 오류:', err);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[setAddress, setConnected, setChainId]
	);

	// 메시지 서명 요청
	const signMessage = async (message: string): Promise<string> => {
		const { ethereum } = window as any;

		if (!ethereum) {
			throw new Error('MetaMask가 설치되어 있지 않습니다.');
		}

		const provider = new ethers.providers.Web3Provider(ethereum);
		const signer = provider.getSigner();
		return await signer.signMessage(message);
	};

	// 인증 메시지 생성
	const generateAuthMessage = (address: string): string => {
		return `SocialTree 애플리케이션에 로그인합니다.
      
지갑 주소: ${address}
타임스탬프: ${new Date().toISOString()}`;
	};

	// 서명 및 인증
	const signAndAuthenticate = useCallback(async () => {
		if (!isConnected || !address) {
			setError('먼저 지갑을 연결해야 합니다.');
			return null;
		}

		setIsLoading(true);
		setError(null);

		try {
			// 1. 인증 메시지 생성
			const message = generateAuthMessage(address);

			// 2. 메시지 서명 요청
			const signature = await signMessage(message);

			// 3. 서버에 인증 요청 - 서버 API가 없으므로 임시로 인증 성공으로 처리
			// 실제로는 여기서 서버로 요청하여 서명 검증 후 인증 토큰을 받아야 함
			const token = `auth_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

			// 4. 인증 상태 업데이트
			setAuthenticated(true);
			setAuthToken(token);

			// 5. 사용자 정보 반환 (임시 데이터)
			const userData = {
				address,
				token,
			};

			return userData;
		} catch (err: any) {
			setError(err.message || '인증 중 오류가 발생했습니다.');
			console.error('인증 오류:', err);
			return null;
		} finally {
			setIsLoading(false);
		}
	}, [address, isConnected, setAuthenticated, setAuthToken]);

	// 로그인 (지갑 연결 + 인증)
	const logIn = useCallback(
		async (type: WalletType = 'metamask') => {
			try {
				const walletAddress = await connectWallet(type);
				if (!walletAddress) return null;

				return await signAndAuthenticate();
			} catch (err: any) {
				setError(err.message || '로그인 중 오류가 발생했습니다.');
				console.error('로그인 오류:', err);
				return null;
			}
		},
		[connectWallet, signAndAuthenticate]
	);

	// 로그아웃
	const logout = useCallback(() => {
		// 지갑 연결 해제
		disconnect();
	}, [disconnect]);

	return {
		address,
		isConnected,
		isAuthenticated,
		authToken,
		isLoading,
		error,
		isCorrectChain,
		connectWallet,
		signAndAuthenticate,
		logIn,
		logout,
		switchToHashkeyTestnet,
	};
}
