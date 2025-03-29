'use client';

import Link from 'next/link';
import LoginButton from '@/components/LoginButton';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/store/walletStore';

export default function GlobalHeader() {
	const { address } = useWalletStore();

	return (
		<header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* 로고 */}
					<div className="flex-shrink-0">
						<Link href="/" className="flex items-center">
							<span className="text-xl sm:text-2xl font-bold text-primary">SocialTree</span>
						</Link>
					</div>

					{/* 네비게이션 - 모바일에서도 표시 */}
					<nav className="flex items-center space-x-2 sm:space-x-8">
						<Link href="/contents" className="text-gray-700 hover:text-primary px-2 py-2 text-sm font-semibold ">
							콘텐츠
						</Link>

						{address ? (
							<Link href="/mypage" className="text-gray-700 hover:text-primary px-2 py-2 text-sm font-semibold">
								마이페이지
							</Link>
						) : (
							<LoginButton />
						)}
					</nav>
				</div>
			</div>
		</header>
	);
}
