import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const { id } = params;
		const { nickname } = await request.json();

		if (!id) {
			return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
		}

		if (!nickname || typeof nickname !== 'string') {
			return NextResponse.json({ error: '유효한 닉네임이 필요합니다.' }, { status: 400 });
		}

		// 닉네임 길이 검증
		if (nickname.length < 2 || nickname.length > 20) {
			return NextResponse.json({ error: '닉네임은 2-20자 사이여야 합니다.' }, { status: 400 });
		}

		const supabase = createClient();

		// 닉네임 중복 확인
		const { data: existingUser, error: checkError } = await supabase
			.from('users')
			.select('id')
			.eq('nickname', nickname)
			.neq('id', id)
			.maybeSingle();

		if (checkError) {
			console.error('닉네임 중복 확인 오류:', checkError);
			return NextResponse.json({ error: '닉네임 중복 확인 중 오류가 발생했습니다.' }, { status: 500 });
		}

		if (existingUser) {
			return NextResponse.json({ error: '이미 사용 중인 닉네임입니다.' }, { status: 409 });
		}

		// 닉네임 업데이트
		const { data, error } = await supabase
			.from('users')
			.update({
				nickname,
				updated_at: new Date().toISOString(),
			})
			.eq('id', id)
			.select('id, wallet_address, nickname, referral_code')
			.single();

		if (error) {
			console.error('닉네임 업데이트 오류:', error);
			return NextResponse.json({ error: '닉네임 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
		}

		// 업데이트된 사용자 정보 반환
		return NextResponse.json({
			message: '닉네임이 성공적으로 업데이트되었습니다.',
			user: data,
		});
	} catch (error) {
		console.error('닉네임 업데이트 처리 중 오류:', error);
		return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
