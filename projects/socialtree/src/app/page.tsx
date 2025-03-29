import GlobalHeader from '@/components/global/GlobalHeader';

export default function Home() {
	return (
		<main className="min-h-screen bg-gray-50">
			<GlobalHeader />
			<div className="pt-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<h1 className="text-4xl font-bold text-gray-900 mb-8">SocialTree에 오신 것을 환영합니다</h1>
					<p className="text-lg text-gray-600">금융 정보를 제공하는 SocialFi 플랫폼</p>
				</div>
			</div>
		</main>
	);
}
