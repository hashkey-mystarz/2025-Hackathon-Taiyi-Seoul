import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const supabase = createClient();
		const { userId, contentId, referralCode, transactionHash, amount } = await request.json();

		if (!userId || !contentId || !amount) {
			return NextResponse.json({ error: '사용자 ID, 콘텐츠 ID, 금액은 필수입니다.' }, { status: 400 });
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

		// 콘텐츠가 존재하는지 확인
		const { data: content, error: contentError } = await supabase
			.from('contents')
			.select('id, creator_id, price')
			.eq('id', contentId)
			.single();

		if (contentError || !content) {
			return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 });
		}

		// 추천인 정보 찾기 (있는 경우)
		let referrerId = null;
		if (referralCode) {
			const { data: referrer, error: referrerError } = await supabase
				.from('users')
				.select('id')
				.eq('referral_code', referralCode)
				.single();

			if (!referrerError && referrer) {
				referrerId = referrer.id;
			}
		}

		// 이미 구독 중인지 확인
		const { data: existingSubscription, error: subscriptionError } = await supabase
			.from('subscriptions')
			.select('id')
			.eq('user_id', userId)
			.eq('content_id', contentId)
			.eq('status', 'active')
			.maybeSingle();

		if (existingSubscription) {
			return NextResponse.json({ error: '이미 해당 콘텐츠를 구독 중입니다.' }, { status: 400 });
		}

		// 현재 시간과 구독 종료 시간(30일 후) 설정
		const now = new Date();
		const endDate = new Date(now);
		endDate.setDate(endDate.getDate() + 30);

		// 구독 생성
		const { data: subscription, error: createError } = await supabase
			.from('subscriptions')
			.insert({
				user_id: userId,
				content_id: contentId,
				referrer_id: referrerId,
				transaction_hash: transactionHash,
				amount: amount,
				status: 'active',
				start_date: now.toISOString(),
				end_date: endDate.toISOString(),
			})
			.select('id, user_id, content_id, referrer_id, amount, status, start_date, end_date')
			.single();

		if (createError) {
			console.error('구독 생성 오류:', createError);
			return NextResponse.json({ error: '구독 생성 중 오류가 발생했습니다.' }, { status: 500 });
		}

		// 수수료 처리 (추천인이 있는 경우)
		if (referrerId) {
			// 첫 번째 레벨 수수료 (20%)
			const commissionAmount = parseFloat(amount) * 0.2;

			await supabase.from('commissions').insert({
				subscription_id: subscription.id,
				user_id: referrerId,
				from_user_id: userId,
				content_id: contentId,
				level: 1,
				amount: commissionAmount,
				status: 'pending',
			});

			// 추가 레벨의 수수료 처리는 여기에 구현할 수 있음
			// (예: 2단계, 3단계 추천인에게 수수료 지급)
		}

		return NextResponse.json(
			{
				message: '구독이 성공적으로 생성되었습니다.',
				subscription: subscription,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('서버 오류:', error);
		return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
