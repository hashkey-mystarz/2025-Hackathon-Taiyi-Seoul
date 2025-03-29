import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const supabase = createClient();
		const { userId, title, description, price } = await request.json();

		if (!userId || !title || price === undefined) {
			return NextResponse.json({ error: '사용자 ID, 제목, 가격은 필수입니다.' }, { status: 400 });
		}

		// 가격이 숫자인지 확인
		if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
			return NextResponse.json({ error: '가격은 0보다 큰 숫자여야 합니다.' }, { status: 400 });
		}

		// 사용자가 존재하는지 확인
		const { data: user, error: userError } = await supabase
			.from('users')
			.select('id, wallet_address')
			.eq('id', userId)
			.single();

		if (userError || !user) {
			return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
		}

		// 콘텐츠 생성
		const { data: content, error: createError } = await supabase
			.from('contents')
			.insert({
				creator_id: userId,
				title: title,
				description: description || '',
				price: parseFloat(price),
			})
			.select('id, creator_id, title, description, price, created_at')
			.single();

		if (createError) {
			console.error('콘텐츠 생성 오류:', createError);
			return NextResponse.json({ error: '콘텐츠 생성 중 오류가 발생했습니다.' }, { status: 500 });
		}

		return NextResponse.json(
			{
				message: '콘텐츠가 성공적으로 생성되었습니다.',
				content: content,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('서버 오류:', error);
		return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}

export async function GET(request: NextRequest) {
	try {
		const supabase = createClient();
		const { searchParams } = new URL(request.url);

		const creatorId = searchParams.get('creatorId');

		let query = supabase
			.from('contents')
			.select('id, creator_id, title, description, price, created_at')
			.order('created_at', { ascending: false });

		if (creatorId) {
			query = query.eq('creator_id', creatorId);
		}

		const { data: contents, error } = await query;

		if (error) {
			console.error('콘텐츠 조회 오류:', error);
			return NextResponse.json({ error: '콘텐츠 조회 중 오류가 발생했습니다.' }, { status: 500 });
		}

		return NextResponse.json({
			contents: contents,
			count: contents.length,
		});
	} catch (error) {
		console.error('서버 오류:', error);
		return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
