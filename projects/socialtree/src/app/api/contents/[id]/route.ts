import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const supabase = createClient();
		const contentId = params.id;

		if (!contentId) {
			return NextResponse.json({ error: '콘텐츠 ID는 필수입니다.' }, { status: 400 });
		}

		// 콘텐츠 정보 조회
		const { data: content, error: contentError } = await supabase
			.from('contents')
			.select('id, creator_id, title, description, price, created_at')
			.eq('id', contentId)
			.single();

		if (contentError || !content) {
			return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 });
		}

		// 콘텐츠 생성자 정보 조회
		const { data: creator, error: creatorError } = await supabase
			.from('users')
			.select('id, wallet_address')
			.eq('id', content.creator_id)
			.single();

		if (creatorError) {
			console.error('생성자 조회 오류:', creatorError);
		}

		// 구독자 수 조회
		const { count: subscribersCount, error: subscriptionError } = await supabase
			.from('subscriptions')
			.select('id', { count: 'exact', head: true })
			.eq('content_id', contentId)
			.eq('status', 'active');

		if (subscriptionError) {
			console.error('구독자 수 조회 오류:', subscriptionError);
		}

		return NextResponse.json({
			content: content,
			creator: creator || { id: content.creator_id, wallet_address: '알 수 없음' },
			stats: {
				subscribersCount: subscribersCount || 0,
			},
		});
	} catch (error) {
		console.error('서버 오류:', error);
		return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
