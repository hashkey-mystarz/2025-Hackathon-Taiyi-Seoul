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
	isConnected: boolean;
	isAuthenticated: boolean;
	authToken: string | null;
	chainId: string | null;

	// 액션
	setAddress: (address: string | null) => void;
	setConnected: (connected: boolean) => void;
	setAuthenticated: (authenticated: boolean) => void;
	setAuthToken: (token: string | null) => void;
	setChainId: (chainId: string | null) => void;
	disconnect: () => void;
}

// 해시키 테스트넷 체인 ID
export const HASHKEY_TESTNET_CHAIN_ID = '0x85'; // 133 in hex

// 지갑 연결 상태 확인
const checkWalletConnection = async (state: WalletState) => {
	// 저장된 주소가 있을 경우
	if (state.address && state.isConnected) {
		const { ethereum } = window as any;
		if (!ethereum) return;

		try {
			// 메타마스크 계정 확인
			const accounts = await ethereum.request({ method: 'eth_accounts' });

			// 계정이 있고 저장된 주소와 일치하는지 확인
			if (accounts.length > 0 && accounts[0].toLowerCase() === state.address.toLowerCase()) {
				// 체인 ID 확인
				const chainId = await ethereum.request({ method: 'eth_chainId' });

				// 상태 업데이트 (기존 상태 유지)
				state.setChainId(chainId);

				// 인증 토큰이 있는 경우 인증 상태도 복원
				if (state.authToken) {
					state.setAuthenticated(true);
				}

				console.log('메타마스크 연결 상태 복원 완료');
				return true;
			} else {
				// 메타마스크에 계정이 없거나 다른 계정이면 연결 해제
				console.log('메타마스크 계정이 변경되었거나 없음');
				return false;
			}
		} catch (error) {
			console.error('지갑 연결 복원 중 오류:', error);
		}
	}
	return false;
};

// 지갑 상태 관리 스토어
export const useWalletStore = create<WalletState>()(
	persist(
		(set, get) => ({
			address: null,
			isConnected: false,
			isAuthenticated: false,
			authToken: null,
			chainId: null,

			setAddress: (address) => set({ address }),
			setConnected: (connected) => set({ isConnected: connected }),
			setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
			setAuthToken: (token) => set({ authToken: token }),
			setChainId: (chainId) => set({ chainId }),
			disconnect: () =>
				set({
					address: null,
					isConnected: false,
					isAuthenticated: false,
					authToken: null,
					chainId: null,
				}),
		}),
		{
			name: 'wallet-storage',
			// 스토리지 복원 후 호출되는 함수
			onRehydrateStorage: () => (state) => {
				// state가 없는 경우 무시
				if (!state) return;

				// 브라우저 환경에서만 실행
				if (typeof window !== 'undefined') {
					// 메타마스크가 초기화되었는지 확인
					if (window.ethereum) {
						// 연결 상태 확인 및 복원
						checkWalletConnection(state);
					} else {
						// 메타마스크가 로드되지 않은 경우 이벤트 리스너 등록
						window.addEventListener('DOMContentLoaded', () => {
							if (window.ethereum) {
								checkWalletConnection(state);
							}
						});
					}
				}
			},
			// 브라우저 새로고침 시에도 유지할 상태 지정
			partialize: (state) => ({
				address: state.address,
				isConnected: state.isConnected,
				isAuthenticated: state.isAuthenticated,
				authToken: state.authToken,
				chainId: state.chainId,
			}),
			// 스토리지 지속성 설정
			storage: {
				getItem: (name) => {
					const str = localStorage.getItem(name);
					if (!str) return null;
					return JSON.parse(str);
				},
				setItem: (name, value) => {
					localStorage.setItem(name, JSON.stringify(value));
				},
				removeItem: (name) => localStorage.removeItem(name),
			},
		}
	)
);
