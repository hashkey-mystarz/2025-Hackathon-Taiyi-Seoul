import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const supabase = createClient();
		const { wallet_address } = await request.json();

		if (!wallet_address) {
			return NextResponse.json({ error: '지갑 주소는 필수입니다.' }, { status: 400 });
		}

		// 지갑 주소 검증
		if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
			return NextResponse.json({ error: '유효하지 않은 지갑 주소입니다.' }, { status: 400 });
		}

		// 사용자가 이미 존재하는지 확인
		const { data: existingUser } = await supabase
			.from('users')
			.select('id, wallet_address, referral_code')
			.eq('wallet_address', wallet_address)
			.single();

		if (existingUser) {
			return NextResponse.json(
				{
					message: '이미 등록된 사용자입니다.',
					user: existingUser,
				},
				{ status: 200 }
			);
		}

		// 새로운 추천 코드 생성 (지갑 주소의 앞 6자리)
		const referralCode = wallet_address.slice(2, 8).toLowerCase();

		// 새 사용자 추가
		const { data: newUser, error } = await supabase
			.from('users')
			.insert({
				wallet_address: wallet_address,
				referral_code: referralCode,
			})
			.select('id, wallet_address, referral_code')
			.single();

		if (error) {
			console.error('사용자 생성 오류:', error);
			return NextResponse.json({ error: '사용자 생성 중 오류가 발생했습니다.' }, { status: 500 });
		}

		return NextResponse.json(
			{
				message: '사용자가 성공적으로 생성되었습니다.',
				user: newUser,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('서버 오류:', error);
		return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
