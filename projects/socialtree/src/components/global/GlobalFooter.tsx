export default function GlobalFooter() {
	return (
		<footer className="bg-gray-100 mt-auto">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="flex justify-between items-center">
					<div className="">
						<h2 className="text-xl font-bold text-primary">SocialTree</h2>
						<p className="text-sm text-gray-600 mt-1">금융 정보 SocialFi 플랫폼</p>
					</div>
					<div className="flex flex-row space-y-4 md:space-y-0 md:space-x-8">
						<div>
							<ul className="space-y-2">
								<li>
									<a href="#" className="text-sm text-gray-600 hover:text-primary">
										이용약관
									</a>
								</li>
								<li>
									<a href="#" className="text-sm text-gray-600 hover:text-primary">
										개인정보처리방침
									</a>
								</li>
							</ul>
						</div>
					</div>
				</div>
				<div className="mt-8 border-t border-gray-200 pt-8">
					<p className="text-sm text-gray-600 text-center">© 2025 SocialTree. All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
}
