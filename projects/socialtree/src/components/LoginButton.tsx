'use client';

import { useState } from 'react';
import { useAuth, WalletType } from '@/hooks/useAuth';
import WalletSelectDialog from '@/components/WalletSelectDialog';

interface LoginButtonProps {
	onSuccess?: (userData: any) => void;
	className?: string;
}

export default function LoginButton({ onSuccess, className = '' }: LoginButtonProps) {
	const { isLoading, isConnected, isAuthenticated, hasConnectedBefore, isCorrectChain, error, logIn, logout } =
		useAuth();

	const [showError, setShowError] = useState(false);
	const [showWalletSelect, setShowWalletSelect] = useState(false);

	// 지갑 연결 처리
	const handleLogin = async (walletType: WalletType) => {
		setShowError(false);
		console.log('로그인 시도: ', walletType); // 디버깅용 로그
		const result = await logIn(walletType);

		if (result && onSuccess) {
			onSuccess(result);
		} else if (!result && error) {
			setShowError(true);
		}
	};

	// 로그아웃 처리
	const handleLogout = () => {
		logout();
	};

	// 지갑 선택 다이얼로그 열기
	const openWalletSelect = () => {
		setShowWalletSelect(true);
	};

	// 지갑 선택 다이얼로그 닫기
	const closeWalletSelect = () => {
		setShowWalletSelect(false);
	};

	// 지갑 선택 처리
	const handleWalletSelect = (walletType: WalletType) => {
		setShowWalletSelect(false);
		// 명시적으로 wallet 타입 전달
		if (walletType === 'metamask') {
			handleLogin('metamask');
		} else if (walletType === 'phantom') {
			alert('Phantom 지갑은 현재 지원하지 않습니다.');
		}
	};

	return (
		<div className="flex flex-col items-center gap-2">
			{error && showError && <div className="text-red-500 text-sm mb-2">{error}</div>}

			{isAuthenticated ? (
				<div className="flex flex-col items-center gap-2">
					{isConnected && !isCorrectChain && (
						<p className="text-xs text-yellow-500 mb-1">해시키 네트워크로 전환 중...</p>
					)}
					<button
						onClick={handleLogout}
						className={`px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors ${className}`}
						disabled={isLoading}
					>
						로그아웃
					</button>
				</div>
			) : isConnected ? (
				<div className="flex flex-col items-center gap-2">
					{!isCorrectChain && <p className="text-xs text-yellow-500 mb-1">해시키 네트워크로 전환 중...</p>}
					<button
						onClick={() => handleLogin('metamask')}
						className={`px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center gap-2 ${className}`}
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
								<span>인증 중...</span>
							</>
						) : (
							'지갑으로 로그인'
						)}
					</button>
				</div>
			) : (
				<div className="flex flex-col items-center">
					<button
						onClick={openWalletSelect}
						className={`px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:bg-primary/50 flex items-center gap-2 ${className}`}
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
								<span>연결 중...</span>
							</>
						) : (
							'지갑 연결하기'
						)}
					</button>
					{hasConnectedBefore && <p className="text-xs text-gray-500 mt-1">이전에 연결한 지갑이 있습니다</p>}
				</div>
			)}

			{/* 지갑 선택 다이얼로그 */}
			<WalletSelectDialog isOpen={showWalletSelect} onClose={closeWalletSelect} onSelect={handleWalletSelect} />
		</div>
	);
}
