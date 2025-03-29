import '@/styles/globals.css';
import GlobalHeader from '@/components/global/GlobalHeader';
import GlobalFooter from '@/components/global/GlobalFooter';

export const metadata = {
	title: 'SocialTree - 콘텐츠 구독 및 추천 플랫폼',
	description: '콘텐츠 제작자와 홍보자가 모두 보상을 받을 수 있는 금융 정보 SocialFi 플랫폼',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ko">
			<body className="min-h-screen bg-background font-sans antialiased">
				<GlobalHeader />
				<main className="pt-16">{children}</main>
				<GlobalFooter />
			</body>
		</html>
	);
}
