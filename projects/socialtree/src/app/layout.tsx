import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ReactQueryProvider } from '@/components/provider/ReactQueryProvider';
import GlobalHeader from '@/components/global/GlobalHeader';
import GlobalFooter from '@/components/global/GlobalFooter';

export const metadata: Metadata = {
	title: 'SocialTree | 금융 정보 SocialFi 플랫폼',
	description: '콘텐츠 제작자와 홍보자가 모두 보상을 받을 수 있는 금융 정보 SocialFi 플랫폼',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ko" className="h-full">
			<body className="flex flex-col min-h-screen bg-gray-50">
				<ReactQueryProvider>
					<GlobalHeader />
					<main className="flex-grow pt-16">{children}</main>
					<GlobalFooter />
				</ReactQueryProvider>
			</body>
		</html>
	);
}
