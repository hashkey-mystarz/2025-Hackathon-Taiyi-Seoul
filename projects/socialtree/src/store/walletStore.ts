import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ethers } from 'ethers';

// 이더리움 브라우저 타입 확장
declare global {
	interface Window {
		ethereum?: any;
	}
}

// 지갑 상태 인터페이스
interface WalletState {
	address: string | null;

	// 액션
	setAddress: (address: string | null) => void;
	disconnect: () => void;
	signMessage: (message: string) => Promise<string | null>;
}

// 지갑 상태 관리 스토어
export const useWalletStore = create<WalletState>()(
	persist(
		(set, get) => ({
			address: null,

			setAddress: (address) => set({ address }),
			disconnect: () => {
				// 저장된 상태를 초기화
				set({
					address: null,
				});

				// 로컬스토리지에서 지갑 정보 완전히 제거
				localStorage.removeItem('wallet-storage');
			},
			signMessage: async (message: string) => {
				try {
					const address = get().address;
					if (!address || !window.ethereum) {
						throw new Error('연결된 지갑이 없습니다.');
					}

					const provider = new ethers.providers.Web3Provider(window.ethereum);
					const signer = provider.getSigner();
					const signature = await signer.signMessage(message);

					return signature;
				} catch (error) {
					console.error('메시지 서명 실패:', error);
					return null;
				}
			},
		}),
		{
			name: 'wallet-storage',
			// 브라우저 새로고침 시에도 유지할 상태 지정
			partialize: (state) => ({
				address: state.address,
			}),
		}
	)
);
