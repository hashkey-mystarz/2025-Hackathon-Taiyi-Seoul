import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ReactQueryProvider } from '@/components/provider/ReactQueryProvider';
import GlobalHeader from '@/components/global/GlobalHeader';
import GlobalFooter from '@/components/global/GlobalFooter';

export const metadata: Metadata = {
	title: 'socialtree',
	description: '',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<ReactQueryProvider>
					<GlobalHeader />
					{children}
					<GlobalFooter />
				</ReactQueryProvider>
			</body>
		</html>
	);
}
