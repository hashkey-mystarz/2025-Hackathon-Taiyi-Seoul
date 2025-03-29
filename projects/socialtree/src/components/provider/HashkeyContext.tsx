'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

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

// 컨텍스트 타입 정의
interface HashkeyContextType {
	provider: ethers.providers.Web3Provider | null;
	signer: ethers.Signer | null;
	isCorrectChain: boolean;
	switchToHashkeyTestnet: () => Promise<boolean>;
	isLoading: boolean;
}

// 기본값 설정
const defaultContext: HashkeyContextType = {
	provider: null,
	signer: null,
	isCorrectChain: false,
	switchToHashkeyTestnet: async () => false,
	isLoading: false,
};

// 컨텍스트 생성
const HashkeyContext = createContext<HashkeyContextType>(defaultContext);

// 컨텍스트 프로바이더 컴포넌트
export function HashkeyProvider({ children }: { children: React.ReactNode }) {
	const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
	const [signer, setSigner] = useState<ethers.Signer | null>(null);
	const [isCorrectChain, setIsCorrectChain] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// 해시키 테스트넷으로 전환
	const switchToHashkeyTestnet = async (): Promise<boolean> => {
		setIsLoading(true);
		try {
			const { ethereum } = window as any;
			if (!ethereum) {
				console.error('MetaMask가 설치되어 있지 않습니다.');
				return false;
			}

			try {
				// 먼저 기존 체인으로 전환 시도
				await ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: HASHKEY_TESTNET.chainId }],
				});
				return true;
			} catch (switchError: any) {
				// 체인이 없으면 추가
				if (switchError.code === 4902) {
					await ethereum.request({
						method: 'wallet_addEthereumChain',
						params: [HASHKEY_TESTNET],
					});
					return true;
				}
				throw switchError;
			}
		} catch (err: any) {
			console.error('네트워크 전환 에러:', err);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	// 초기화 및 네트워크 확인
	useEffect(() => {
		const initProvider = async () => {
			const { ethereum } = window as any;
			if (ethereum) {
				const web3Provider = new ethers.providers.Web3Provider(ethereum, 'any');
				setProvider(web3Provider);
				setSigner(web3Provider.getSigner());

				// 현재 체인 확인
				const checkChain = async () => {
					const chainId = await ethereum.request({ method: 'eth_chainId' });
					setIsCorrectChain(chainId === HASHKEY_TESTNET.chainId);
				};

				await checkChain();

				// 체인 변경 이벤트 리스너
				ethereum.on('chainChanged', (chainId: string) => {
					setIsCorrectChain(chainId === HASHKEY_TESTNET.chainId);
					window.location.reload();
				});

				return () => {
					ethereum.removeListener('chainChanged', () => {});
				};
			}
		};

		initProvider();
	}, []);

	return (
		<HashkeyContext.Provider value={{ provider, signer, isCorrectChain, switchToHashkeyTestnet, isLoading }}>
			{children}
		</HashkeyContext.Provider>
	);
}

// 컨텍스트 사용을 위한 훅
export function useHashkeyContext() {
	return useContext(HashkeyContext);
}
