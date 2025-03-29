'use client';

import { useState } from 'react';
import { useAuth, WalletType } from '@/hooks/useAuth';
import WalletSelectDialog from '@/components/WalletSelectDialog';

export default function LoginButton() {
	const { connectWallet, isLoading } = useAuth();
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
		connectWallet(walletType);
	};

	return (
		<>
			<button
				onClick={openWalletSelect}
				className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:bg-primary/50 flex items-center gap-2"
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

			{/* 지갑 선택 다이얼로그 */}
			<WalletSelectDialog isOpen={showWalletSelect} onClose={closeWalletSelect} onSelect={handleWalletSelect} />
		</>
	);
}
