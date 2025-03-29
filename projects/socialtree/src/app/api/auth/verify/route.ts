import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { ethers } from 'ethers';
import * as jose from 'jose';

// JWT 시크릿 키 - 실제로는 환경 변수에서 가져와야 함
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-jwt-must-be-at-least-32-characters';

export async function POST(request: NextRequest) {
	try {
		const { walletAddress, signature, message } = await request.json();

		if (!walletAddress || !signature || !message) {
			return NextResponse.json({ error: '필수 매개변수가, 누락되었습니다.' }, { status: 400 });
		}

		// 서명 확인
		try {
			const recoveredAddress = ethers.utils.verifyMessage(message, signature);

			if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
				return NextResponse.json({ error: '서명이 유효하지 않습니다.' }, { status: 401 });
			}
		} catch (error) {
			console.error('서명 검증 오류:', error);
			return NextResponse.json({ error: '서명 검증 중 오류가 발생했습니다.' }, { status: 400 });
		}

		// Supabase에서 사용자 확인
		const supabase = createClient();
		const { data: user, error: userError } = await supabase
			.from('users')
			.select('id, wallet_address, referral_code')
			.eq('wallet_address', walletAddress)
			.single();

		if (userError && userError.code !== 'PGRST116') {
			console.error('사용자 조회 오류:', userError);
			return NextResponse.json({ error: '사용자 조회 중 오류가 발생했습니다.' }, { status: 500 });
		}

		// 사용자가 없으면 새로 생성
		let userData = user;
		if (!userData) {
			// 새로운 추천 코드 생성 (지갑 주소의 앞 6자리)
			const referralCode = walletAddress.slice(2, 8).toLowerCase();

			const { data: newUser, error: createError } = await supabase
				.from('users')
				.insert({
					wallet_address: walletAddress,
					referral_code: referralCode,
				})
				.select('id, wallet_address, referral_code')
				.single();

			if (createError) {
				console.error('사용자 생성 오류:', createError);
				return NextResponse.json({ error: '사용자 생성 중 오류가 발생했습니다.' }, { status: 500 });
			}

			userData = newUser;
		}

		// JWT 토큰 발급
		const secret = new TextEncoder().encode(JWT_SECRET);
		const token = await new jose.SignJWT({
			sub: userData.id,
			walletAddress: userData.wallet_address,
			referralCode: userData.referral_code,
		})
			.setProtectedHeader({ alg: 'HS256' })
			.setIssuedAt()
			.setExpirationTime('24h')
			.sign(secret);

		return NextResponse.json({
			token,
			user: userData,
		});
	} catch (error) {
		console.error('인증 처리 중 오류:', error);
		return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
