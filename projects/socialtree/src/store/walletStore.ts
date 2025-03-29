import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
