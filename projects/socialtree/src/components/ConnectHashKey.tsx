'use client';

import { useHashkeyContext } from '@/components/provider/HashkeyContext';

interface ConnectHashKeyProps {
	showHint?: boolean;
}

export default function ConnectHashKey({ showHint = false }: ConnectHashKeyProps) {
	const { address, isConnected, isLoading, isCorrectChain, connectWallet, disconnectWallet, switchToHashkeyNetwork } =
		useHashkeyContext();

	return (
		<div className="flex flex-col items-center gap-2">
			{isConnected ? (
				<>
					<div className="flex items-center gap-2">
						<div className={`w-2 h-2 rounded-full ${isCorrectChain ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
						<p className="text-sm text-gray-600">
							{address?.substring(0, 6)}...{address?.substring(address.length - 4)}
						</p>
					</div>

					{!isCorrectChain && (
						<button
							onClick={switchToHashkeyNetwork}
							disabled={isLoading}
							className="px-4 py-1 bg-yellow-500 text-white rounded-lg text-xs hover:bg-yellow-600 transition-colors disabled:bg-yellow-300 flex items-center gap-1"
						>
							{isLoading ? (
								<>
									<span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
									<span>전환 중...</span>
								</>
							) : (
								'해시키 네트워크로 전환'
							)}
						</button>
					)}

					<button
						onClick={disconnectWallet}
						className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
					>
						연결 해제
					</button>
				</>
			) : (
				<div className="flex flex-col items-center gap-2">
					<button
						onClick={connectWallet}
						disabled={isLoading}
						className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:bg-primary/50 flex items-center gap-2"
					>
						{isLoading ? (
							<>
								<span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
								<span>연결 중...</span>
							</>
						) : (
							'지갑 연결'
						)}
					</button>

					{showHint && <p className="text-xs text-gray-500 mt-1">이전에 연결한 지갑이 있습니다</p>}
				</div>
			)}
		</div>
	);
}
