'use client';

import { useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { useAuth, WalletType } from '@/hooks/useAuth';
import WalletSelectDialog from '@/components/WalletSelectDialog';

interface LoginButtonProps {
	onSuccess?: (userData: any) => void;
	className?: string;
}

export default function LoginButton({ onSuccess, className = '' }: LoginButtonProps) {
	const { address, isConnected, isAuthenticated } = useWalletStore();
	const { logIn, logout } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showError, setShowError] = useState(false);
	const [showWalletSelect, setShowWalletSelect] = useState(false);

	// 지갑 선택 다이얼로그 열기
	const openWalletSelect = () => {
		setShowWalletSelect(true);
	};

	// 지갑 선택 다이얼로그 닫기
	const closeWalletSelect = () => {
		setShowWalletSelect(false);
	};

	// 지갑 선택 처리
	const handleWalletSelect = async (walletType: WalletType) => {
		setShowWalletSelect(false);
		setIsLoading(true);
		setError(null);
		setShowError(false);

		try {
			// 지갑 연결 및 인증
			const result = await logIn(walletType);

			if (result && onSuccess) {
				onSuccess(result);
			}
		} catch (err: any) {
			setError(err.message || '로그인 중 오류가 발생했습니다.');
			setShowError(true);
		} finally {
			setIsLoading(false);
		}
	};

	// 인증 처리
	const handleAuth = async () => {
		setIsLoading(true);
		try {
			await logIn('metamask');
		} catch (err: any) {
			setError(err.message || '인증 중 오류가 발생했습니다.');
			setShowError(true);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center gap-2">
			{error && showError && <div className="text-red-500 text-sm mb-2">{error}</div>}

			{isAuthenticated ? (
				<div className="flex flex-col items-center gap-2">
					<button
						onClick={logout}
						className={`px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors ${className}`}
						disabled={isLoading}
					>
						로그아웃
					</button>
				</div>
			) : isConnected ? (
				<div className="flex flex-col items-center gap-2">
					<button
						onClick={handleAuth}
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
				</div>
			)}

			{/* 지갑 선택 다이얼로그 */}
			<WalletSelectDialog isOpen={showWalletSelect} onClose={closeWalletSelect} onSelect={handleWalletSelect} />
		</div>
	);
}
