import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { address: string } }) {
	try {
		const supabase = createClient();
		const walletAddress = params.address;

		if (!walletAddress) {
			return NextResponse.json({ error: '지갑 주소는 필수입니다.' }, { status: 400 });
		}

		// 사용자 정보 조회
		const { data: user, error: userError } = await supabase
			.from('users')
			.select('id, wallet_address, referral_code, referrer_id')
			.eq('wallet_address', walletAddress)
			.single();

		if (userError) {
			if (userError.code === 'PGRST116') {
				// 사용자를 찾을 수 없는 경우
				return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
			}
			return NextResponse.json({ error: '사용자 정보 조회 중 오류가 발생했습니다.' }, { status: 500 });
		}

		// 추천인 정보 조회 (있는 경우)
		let referrer = null;
		if (user.referrer_id) {
			const { data: referrerData, error: referrerError } = await supabase
				.from('users')
				.select('id, wallet_address, referral_code')
				.eq('id', user.referrer_id)
				.single();

			if (!referrerError) {
				referrer = referrerData;
			}
		}

		return NextResponse.json({
			user: {
				id: user.id,
				wallet_address: user.wallet_address,
				referral_code: user.referral_code,
			},
			referrer: referrer
				? {
						id: referrer.id,
						wallet_address: referrer.wallet_address,
						referral_code: referrer.referral_code,
				  }
				: null,
		});
	} catch (error) {
		console.error('서버 오류:', error);
		return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
