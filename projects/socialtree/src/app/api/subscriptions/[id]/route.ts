import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const supabase = createClient();
		const subscriptionId = params.id;

		if (!subscriptionId) {
			return NextResponse.json({ error: '구독 ID는 필수입니다.' }, { status: 400 });
		}

		// 구독 정보 조회
		const { data: subscription, error: subscriptionError } = await supabase
			.from('subscriptions')
			.select(
				'id, user_id, content_id, referrer_id, amount, status, start_date, end_date, created_at, transaction_hash'
			)
			.eq('id', subscriptionId)
			.single();

		if (subscriptionError || !subscription) {
			return NextResponse.json({ error: '구독을 찾을 수 없습니다.' }, { status: 404 });
		}

		// 사용자 정보 조회
		const { data: user, error: userError } = await supabase
			.from('users')
			.select('id, wallet_address')
			.eq('id', subscription.user_id)
			.single();

		if (userError) {
			console.error('사용자 조회 오류:', userError);
		}

		// 콘텐츠 정보 조회
		const { data: content, error: contentError } = await supabase
			.from('contents')
			.select('id, title, creator_id, price')
			.eq('id', subscription.content_id)
			.single();

		if (contentError) {
			console.error('콘텐츠 조회 오류:', contentError);
		}

		// 추천인 정보 조회 (있는 경우)
		let referrer = null;
		if (subscription.referrer_id) {
			const { data: referrerData, error: referrerError } = await supabase
				.from('users')
				.select('id, wallet_address')
				.eq('id', subscription.referrer_id)
				.single();

			if (!referrerError) {
				referrer = referrerData;
			} else {
				console.error('추천인 조회 오류:', referrerError);
			}
		}

		// 수수료 내역 조회
		const { data: commissions, error: commissionsError } = await supabase
			.from('commissions')
			.select('id, user_id, level, amount, status, created_at')
			.eq('subscription_id', subscriptionId)
			.order('level', { ascending: true });

		if (commissionsError) {
			console.error('수수료 내역 조회 오류:', commissionsError);
		}

		return NextResponse.json({
			subscription: subscription,
			user: user || { id: subscription.user_id },
			content: content || { id: subscription.content_id },
			referrer: referrer,
			commissions: commissions || [],
		});
	} catch (error) {
		console.error('서버 오류:', error);
		return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
