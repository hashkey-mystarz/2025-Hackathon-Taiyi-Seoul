import Link from 'next/link';

interface ContentCardProps {
	id: number;
	title: string;
	description: string;
	price: number;
	creator?: string;
	creatorAddress?: string;
	subscriberCount?: number;
	category?: string;
	thumbnail?: string;
	createdAt?: string;
	showHoverEffect?: boolean;
	currencySymbol?: string;
}

export default function ContentCard({
	id,
	title,
	description,
	price,
	creator,
	creatorAddress,
	subscriberCount,
	category,
	thumbnail,
	createdAt,
	showHoverEffect = true,
	currencySymbol = 'HSK',
}: ContentCardProps) {
	// 기본 썸네일 이미지는 카테고리 기반 랜덤 Unsplash 이미지
	const cardImage = thumbnail || `https://source.unsplash.com/random/600x400?${category || 'finance'}`;

	const cardContent = (
		<div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
			{/* 썸네일 영역 */}
			<div
				className="w-full h-48 bg-gray-200 relative overflow-hidden"
				style={{
					backgroundImage: `url('${cardImage}')`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
				}}
			>
				{showHoverEffect && (
					<>
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						<div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
							<p className="font-medium">자세히 보기</p>
						</div>
					</>
				)}
				{category && (
					<div className="absolute top-3 left-3">
						<span className="inline-block px-2 py-1 bg-blue-100 text-primary text-xs font-semibold rounded">
							{category}
						</span>
					</div>
				)}
			</div>

			{/* 콘텐츠 정보 */}
			<div className="p-6 flex-1 flex flex-col">
				{subscriberCount !== undefined && (
					<div className="flex justify-end mb-2">
						<span className="text-gray-500 text-sm">{subscriberCount}명 구독중</span>
					</div>
				)}

				<h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
					{title}
				</h3>

				<p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">{description}</p>

				<div className="flex justify-between items-center mt-auto">
					{creator && (
						<div className="flex items-center">
							<div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
								{creator.substring(0, 1)}
							</div>
							<span className="ml-2 text-sm text-gray-700">{creator}</span>
						</div>
					)}
					<span className="font-bold text-primary">
						{price} {currencySymbol}
					</span>
				</div>
			</div>
		</div>
	);

	// 링크로 감싸서 반환
	return showHoverEffect ? (
		<Link href={`/contents/${id}`} className="group block h-full">
			{cardContent}
		</Link>
	) : (
		cardContent
	);
}
