import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '@/constants/contractInfo';
import { ethers } from 'ethers';

// GET 요청 처리 - 특정 콘텐츠 조회
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const contentId = params.id;
		const supabase = createClient();

		// 쿼리 파라미터에서 사용자 지갑 주소 가져오기 (구독 확인용)
		const searchParams = request.nextUrl.searchParams;
		const userAddress = searchParams.get('userAddress');

		// 콘텐츠 기본 정보 조회
		const { data: content, error } = await supabase
			.from('contents')
			.select(
				`
				id,
				title,
				description,
				price,
				created_at,
				thumbnail_url,
				category,
				creator_id,
				full_content,
				creator:users!creator_id (
					id,
					nickname,
					wallet_address
				)
			`
			)
			.eq('id', contentId)
			.single();

		if (error || !content) {
			return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 });
		}

		// 구독 상태 확인 (userAddress가 제공된 경우)
		let isSubscribed = false;
		if (userAddress) {
			try {
				const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
				const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

				// 콘텐츠 ID를 숫자로 변환 (DB의 UUID를 스마트 컨트랙트용 숫자 ID로 매핑할 필요가 있음)
				// 실제 구현에서는 ID 매핑 테이블 사용 권장
				const numericContentId = parseInt(contentId.replace(/\D/g, '').substring(0, 8), 16) % 100000;

				// 구독 상태 확인
				const [active, endTime] = await contract.getSubscriptionStatus(userAddress, numericContentId);
				isSubscribed = active;
			} catch (error) {
				console.error('구독 상태 확인 오류:', error);
				// 오류 발생 시 구독하지 않은 것으로 처리
				isSubscribed = false;
			}
		}

		// 구독하지 않은 사용자에게는 full_content 필드 제외
		if (!isSubscribed) {
			delete content.full_content;
		}

		// 연관 콘텐츠 조회 (동일 카테고리 또는 같은 크리에이터의 다른 콘텐츠)
		const { data: relatedContents } = await supabase
			.from('contents')
			.select(
				`
				id,
				title,
				description,
				price,
				creator_id,
				thumbnail_url,
				category,
				created_at
			`
			)
			.or(`category.eq.${content.category},creator_id.eq.${content.creator_id}`)
			.neq('id', contentId)
			.limit(4);

		// 구독자 수 조회 (실제 구현에서는 별도 테이블이나 스마트 컨트랙트 등에서 가져옴)
		// 이 부분은 구독 정보를 어디에 저장하는지에 따라 달라질 수 있음
		const { count: subscriberCount } = await supabase
			.from('subscriptions')
			.select('*', { count: 'exact', head: true })
			.eq('content_id', contentId)
			.eq('status', 'active');

		return NextResponse.json({
			content,
			relatedContents: relatedContents || [],
			subscriberCount: subscriberCount || 0,
			isSubscribed,
		});
	} catch (error) {
		console.error('콘텐츠 조회 오류:', error);
		return NextResponse.json({ error: '콘텐츠 조회 중 오류가 발생했습니다.' }, { status: 500 });
	}
}
