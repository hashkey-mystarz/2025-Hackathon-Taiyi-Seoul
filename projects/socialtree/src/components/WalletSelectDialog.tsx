'use client';

import { useState } from 'react';
import { WalletType } from '@/hooks/useAuth';

interface WalletSelectDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (walletType: WalletType) => void;
}

export default function WalletSelectDialog({ isOpen, onClose, onSelect }: WalletSelectDialogProps) {
	if (!isOpen) return null;

	// 배경 클릭 시 다이얼로그 닫기
	const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
		// 이벤트가 배경에서 시작된 경우에만 닫기
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<div
			className="fixed top-0 left-0 h-screen w-screen inset-0 bg-[#00000080] flex items-center justify-center z-[100]"
			onClick={handleBackdropClick}
		>
			<div
				className="bg-white rounded-lg max-w-md w-full px-6 py-8 shadow-xl"
				style={{ maxWidth: '480px', margin: '0 auto' }}
			>
				<h3 className="text-2xl font-semibold text-center text-gray-900 mb-6">지갑 선택</h3>

				<div className="flex flex-col gap-4">
					{/* MetaMask 지갑 옵션 */}
					<button
						onClick={() => onSelect('metamask')}
						className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
					>
						<div className="w-10 h-10 mr-4 flex-shrink-0 flex items-center justify-center bg-orange-50 rounded-full">
							<img src="/images/wallet/metamask_icon.svg" alt="MetaMask" width="28" height="28" />
						</div>
						<p className="text-lg font-medium text-gray-900">MetaMask</p>
					</button>

					{/* Phantom 지갑 옵션 (비활성화) */}
					<button
						onClick={() => alert('준비 중인 기능입니다')}
						className="flex items-center p-4 border border-gray-200 rounded-lg opacity-70 cursor-not-allowed"
						disabled
					>
						<div className="w-10 h-10 mr-4 flex-shrink-0 flex items-center justify-center bg-purple-50 rounded-full">
							<img src="/images/wallet/phantom_icon.svg" alt="Phantom" width="28" height="28" />
						</div>
						<p className="text-lg font-medium text-gray-900">Phantom (준비중)</p>
					</button>
				</div>

				<div className="mt-6 flex justify-end">
					<button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
						취소
					</button>
				</div>
			</div>
		</div>
	);
}
