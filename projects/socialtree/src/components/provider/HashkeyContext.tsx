'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type HashkeyContextType = {
	address: string | null;
	isConnected: boolean;
	isLoading: boolean;
	isCorrectChain: boolean;
	isConnectionChecked: boolean;
	hasConnectedBefore: boolean;
	connectWallet: () => Promise<void>;
	disconnectWallet: () => void;
	switchToHashkeyNetwork: () => Promise<void>;
};

// 해시키 테스트넷 정보
const HASHKEY_CHAIN_ID = '0x85'; // 133 in hex
const HASHKEY_NETWORK = {
	chainId: HASHKEY_CHAIN_ID,
	chainName: 'HashKey Chain Testnet',
	nativeCurrency: {
		name: 'HSK',
		symbol: 'HSK',
		decimals: 18,
	},
	rpcUrls: ['https://hashkeychain-testnet.alt.technology'],
	blockExplorerUrls: ['https://hashkeychain-testnet-explorer.alt.technology'],
};

// 로컬 스토리지 키
const WALLET_CONNECTED_KEY = 'wallet_connected_before';

const HashkeyContext = createContext<HashkeyContextType>({
	address: null,
	isConnected: false,
	isLoading: false,
	isCorrectChain: false,
	isConnectionChecked: false,
	hasConnectedBefore: false,
	connectWallet: async () => {},
	disconnectWallet: () => {},
	switchToHashkeyNetwork: async () => {},
});

export const useHashkeyContext = () => useContext(HashkeyContext);

export function HashkeyProvider({ children }: { children: ReactNode }) {
	const [address, setAddress] = useState<string | null>(null);
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isCorrectChain, setIsCorrectChain] = useState<boolean>(false);
	const [isConnectionChecked, setIsConnectionChecked] = useState<boolean>(false);
	const [hasConnectedBefore, setHasConnectedBefore] = useState<boolean>(false);

	// 메타마스크 이벤트 리스너 등록
	useEffect(() => {
		const { ethereum } = window as any;
		if (ethereum) {
			// 계정 변경 이벤트
			ethereum.on('accountsChanged', (accounts: string[]) => {
				if (accounts.length === 0) {
					// 계정 연결 해제
					disconnectWallet();
				} else {
					// 계정 변경
					setAddress(accounts[0]);
					checkChainId().then((isCorrect) => {
						if (!isCorrect && accounts.length > 0) {
							// 계정은 있지만 해시키 네트워크가 아니면 자동 전환
							switchToHashkeyNetwork();
						}
					});
				}
			});

			// 체인 변경 이벤트
			ethereum.on('chainChanged', (chainId: string) => {
				checkChainId();
			});
		}

		// 컴포넌트 언마운트 시 리스너 제거
		return () => {
			if (ethereum) {
				ethereum.removeListener('accountsChanged', () => {});
				ethereum.removeListener('chainChanged', () => {});
			}
		};
	}, []);

	// 초기 지갑 연결 상태 체크
	useEffect(() => {
		checkInitialWalletState();
	}, []);

	// 초기 지갑 상태 확인 (이전에 연결했는지만 확인)
	const checkInitialWalletState = async () => {
		try {
			// 로컬 스토리지에서 이전 연결 여부 확인
			const hasConnected = localStorage.getItem(WALLET_CONNECTED_KEY) === 'true';
			setHasConnectedBefore(hasConnected);

			const { ethereum } = window as any;

			// 메타마스크가 설치되어 있지 않은 경우
			if (!ethereum) {
				console.log('MetaMask가 설치되어 있지 않습니다!');
				setIsConnectionChecked(true);
				return;
			}

			// 이미 연결된 계정이 있는지만 확인 (자동 연결 시도하지 않음)
			const accounts = await ethereum.request({ method: 'eth_accounts' });

			if (accounts.length !== 0) {
				const account = accounts[0];
				setAddress(account);
				setIsConnected(true);
				await checkChainId();
			}
		} catch (error) {
			console.log('지갑 상태 확인 중 오류:', error);
		} finally {
			setIsConnectionChecked(true);
		}
	};

	// 체인 ID 확인
	const checkChainId = async () => {
		try {
			const { ethereum } = window as any;
			if (!ethereum) return false;

			const chainId = await ethereum.request({ method: 'eth_chainId' });
			const isHashkeyChain = chainId === HASHKEY_CHAIN_ID;
			setIsCorrectChain(isHashkeyChain);
			return isHashkeyChain;
		} catch (error) {
			console.log('체인 ID 확인 중 오류:', error);
			return false;
		}
	};

	// 해시키 네트워크로 전환
	const switchToHashkeyNetwork = async (): Promise<void> => {
		try {
			const { ethereum } = window as any;
			if (!ethereum) {
				alert('MetaMask를 설치해주세요!');
				return;
			}

			try {
				// 네트워크 전환 중임을 표시
				setIsLoading(true);

				// 기존 네트워크로 전환 시도
				await ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: HASHKEY_CHAIN_ID }],
				});
				setIsCorrectChain(true);
				console.log('해시키 테스트넷으로 전환 성공');
			} catch (switchError: any) {
				// 네트워크가 없는 경우 새로운 네트워크 추가
				if (switchError.code === 4902) {
					try {
						await ethereum.request({
							method: 'wallet_addEthereumChain',
							params: [HASHKEY_NETWORK],
						});
						setIsCorrectChain(true);
						console.log('해시키 테스트넷 추가 및 전환 성공');
					} catch (addError) {
						console.error('네트워크 추가 실패:', addError);
						alert('해시키 테스트넷 추가에 실패했습니다. 직접 네트워크를 추가해주세요.');
					}
				} else {
					console.error('네트워크 전환 실패:', switchError);
					alert('네트워크 전환에 실패했습니다. 메타마스크에서 네트워크 전환 요청을 승인해주세요.');
				}
			} finally {
				setIsLoading(false);
			}
		} catch (error) {
			console.log('네트워크 전환 중 오류:', error);
			setIsLoading(false);
		}
	};

	// 지갑 연결
	const connectWallet = async () => {
		try {
			setIsLoading(true);
			const { ethereum } = window as any;

			if (!ethereum) {
				alert('MetaMask를 설치해주세요!');
				return;
			}

			// 계정 요청
			const accounts = await ethereum.request({
				method: 'eth_requestAccounts',
			});

			if (accounts.length > 0) {
				setAddress(accounts[0]);
				setIsConnected(true);

				// 연결 완료되면 로컬 스토리지에 상태 저장
				localStorage.setItem(WALLET_CONNECTED_KEY, 'true');
				setHasConnectedBefore(true);

				// 연결 후 체인 ID 확인
				const isHashkeyChain = await checkChainId();

				// 해시키 네트워크가 아니면 자동 전환
				if (!isHashkeyChain) {
					console.log('해시키 테스트넷으로 자동 전환 시도...');
					await switchToHashkeyNetwork();
				}
			}
		} catch (error) {
			console.log('지갑 연결 중 오류:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// 지갑 연결 해제
	const disconnectWallet = () => {
		setAddress(null);
		setIsConnected(false);
		setIsCorrectChain(false);
		// 연결 해제해도 연결한 적이 있다는 기록은 유지
	};

	return (
		<HashkeyContext.Provider
			value={{
				address,
				isConnected,
				isLoading,
				isCorrectChain,
				isConnectionChecked,
				hasConnectedBefore,
				connectWallet,
				disconnectWallet,
				switchToHashkeyNetwork,
			}}
		>
			{children}
		</HashkeyContext.Provider>
	);
}
