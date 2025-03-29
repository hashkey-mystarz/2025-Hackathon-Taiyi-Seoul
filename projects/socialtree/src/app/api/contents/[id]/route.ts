import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET 요청 처리 - 특정 콘텐츠 조회
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const { id } = params;

		if (!id) {
			return NextResponse.json({ error: '콘텐츠 ID는 필수입니다.' }, { status: 400 });
		}

		const supabase = createClient();

		// 콘텐츠 조회
		const { data: content, error } = await supabase
			.from('contents')
			.select(
				`
				*,
				creator:users(id, wallet_address, nickname)
			`
			)
			.eq('id', id)
			.single();

		if (error) {
			console.error('콘텐츠 조회 오류:', error);
			return NextResponse.json({ error: '콘텐츠 조회 중 오류가 발생했습니다.' }, { status: 500 });
		}

		if (!content) {
			return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 });
		}

		// 연관 콘텐츠 조회 (같은 카테고리 또는 같은 생성자의 다른 콘텐츠)
		let { data: relatedContents, error: relatedError } = await supabase
			.from('contents')
			.select(
				`
				id, 
				title, 
				description, 
				price,
				thumbnail_url,
				category,
				creator_id,
				created_at
			`
			)
			.or(`category.eq.${content.category},creator_id.eq.${content.creator_id}`)
			.neq('id', id)
			.limit(3);

		if (relatedError) {
			console.error('연관 콘텐츠 조회 오류:', relatedError);
			relatedContents = [];
		}

		// 구독 정보(임시 더미 데이터)
		const subscriberCount = Math.floor(Math.random() * 1000) + 100;

		return NextResponse.json({
			content,
			relatedContents: relatedContents || [],
			subscriberCount,
		});
	} catch (error) {
		console.error('서버 오류:', error);
		return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
