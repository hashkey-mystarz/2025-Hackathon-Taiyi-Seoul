import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
	const referralCode = params.code;

	if (!referralCode) {
		return NextResponse.json({ error: '추천인 코드가 필요합니다.' }, { status: 400 });
	}

	try {
		const supabase = createClient();

		// 추천인 코드로 사용자 조회
		const { data: user, error } = await supabase
			.from('users')
			.select('id, wallet_address, referral_code')
			.eq('referral_code', referralCode)
			.single();

		if (error) {
			console.error('추천인 조회 오류:', error);
			return NextResponse.json({ error: '추천인을 찾을 수 없습니다.' }, { status: 404 });
		}

		return NextResponse.json({
			id: user.id,
			wallet_address: user.wallet_address,
			referral_code: user.referral_code,
		});
	} catch (error) {
		console.error('서버 오류:', error);
		return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
