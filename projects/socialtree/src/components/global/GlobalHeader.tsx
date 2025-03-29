import Link from 'next/link';
import ConnectHashKey from '../ConnectHashKey';
import { useState } from 'react';

export default function GlobalHeader() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	return (
		<header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* 로고 */}
					<div className="flex-shrink-0">
						<Link href="/" className="flex items-center">
							<span className="text-2xl font-bold text-blue-600">SocialTree</span>
						</Link>
					</div>

					{/* 네비게이션 */}
					<nav className="hidden md:flex space-x-8">
						<Link
							href="/explore"
							className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
						>
							탐색
						</Link>
						<Link
							href="/reports"
							className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
						>
							리포트
						</Link>
						<Link
							href="/dashboard"
							className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
						>
							대시보드
						</Link>
					</nav>

					{/* 우측 영역 */}
					<div className="flex items-center space-x-4">
						{/* 지갑 연결 버튼 */}
						<div className="hidden md:block">
							<ConnectHashKey />
						</div>

						{/* 모바일 메뉴 버튼 */}
						<div className="md:hidden">
							<button
								type="button"
								onClick={toggleMobileMenu}
								className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
								aria-controls="mobile-menu"
								aria-expanded={isMobileMenuOpen}
							>
								<span className="sr-only">메뉴 열기</span>
								{!isMobileMenuOpen ? (
									<svg
										className="block h-6 w-6"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
									</svg>
								) : (
									<svg
										className="block h-6 w-6"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								)}
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* 모바일 메뉴 */}
			<div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`} id="mobile-menu">
				<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
					<Link
						href="/explore"
						className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
						onClick={() => setIsMobileMenuOpen(false)}
					>
						탐색
					</Link>
					<Link
						href="/reports"
						className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
						onClick={() => setIsMobileMenuOpen(false)}
					>
						리포트
					</Link>
					<Link
						href="/dashboard"
						className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
						onClick={() => setIsMobileMenuOpen(false)}
					>
						대시보드
					</Link>
					<div className="px-3 py-2">
						<ConnectHashKey />
					</div>
				</div>
			</div>
		</header>
	);
}
