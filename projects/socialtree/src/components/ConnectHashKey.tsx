'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function ConnectHashKey() {
	const [account, setAccount] = useState<string>('');
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	// 지갑 연결 상태 체크
	useEffect(() => {
		checkIfWalletIsConnected();
	}, []);

	// 지갑 연결 상태 확인
	const checkIfWalletIsConnected = async () => {
		try {
			const { ethereum } = window as any;

			if (!ethereum) {
				console.log('MetaMask가 설치되어 있지 않습니다!');
				return;
			}

			const accounts = await ethereum.request({ method: 'eth_accounts' });

			if (accounts.length !== 0) {
				const account = accounts[0];
				setAccount(account);
				setIsConnected(true);
			}
		} catch (error) {
			console.log(error);
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

			const accounts = await ethereum.request({
				method: 'eth_requestAccounts',
			});

			setAccount(accounts[0]);
			setIsConnected(true);
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	// 지갑 연결 해제
	const disconnectWallet = () => {
		setAccount('');
		setIsConnected(false);
	};

	return (
		<div>
			{isConnected ? (
				<div className="flex flex-col items-center gap-2">
					<p className="text-sm text-gray-600">
						{account.substring(0, 6)}...{account.substring(account.length - 4)}
					</p>
					<button
						onClick={disconnectWallet}
						className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
					>
						연결 해제
					</button>
				</div>
			) : (
				<button
					onClick={connectWallet}
					disabled={isLoading}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:bg-blue-300"
				>
					{isLoading ? '연결 중...' : '지갑 연결'}
				</button>
			)}
		</div>
	);
}
