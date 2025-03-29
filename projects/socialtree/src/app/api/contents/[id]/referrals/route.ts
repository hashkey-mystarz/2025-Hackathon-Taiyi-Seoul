import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 구독 정보 타입 정의
interface Subscription {
	id: string;
	user_id: string;
	content_id?: string; // 선택적으로 변경
	referrer_id: string;
	status: string;
	start_date: string;
	amount: number;
}

// 사용자 정보 타입 정의
interface User {
	id: string;
	wallet_address: string;
	referral_code: string;
}

/**
 * 특정 콘텐츠에 대한 직접 추천 사용자 목록 조회 API
 *
 * Query Parameters:
 * - userId: 조회할 추천인 ID (선택적) - 입력 시 해당 사용자가 추천한 구독만 반환
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const supabase = createClient();
		const contentId = params.id;
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get('userId'); // 선택적 추천인 ID

		if (!contentId) {
			return NextResponse.json({ error: '콘텐츠 ID는 필수입니다.' }, { status: 400 });
		}

		// 콘텐츠가 존재하는지 확인
		const { data: content, error: contentError } = await supabase
			.from('contents')
			.select('id, title')
			.eq('id', contentId)
			.single();

		if (contentError || !content) {
			return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 });
		}

		// 기본 쿼리 설정
		let query = supabase
			.from('subscriptions')
			.select(
				`
        id, 
        user_id, 
        referrer_id, 
        status, 
        start_date, 
        amount
      `
			)
			.eq('content_id', contentId)
			.eq('status', 'active');

		// 특정 추천인이 지정된 경우
		if (userId) {
			query = query.eq('referrer_id', userId);
		}

		const { data: subscriptions, error: subscriptionsError } = await query;

		if (subscriptionsError) {
			console.error('구독 내역 조회 오류:', subscriptionsError);
			return NextResponse.json({ error: '구독 내역 조회 중 오류가 발생했습니다.' }, { status: 500 });
		}

		// 구독자 상세 정보 조회
		const subscriberDetails = await Promise.all(
			(subscriptions || []).map(async (subscription: any) => {
				const { data: subscriber } = await supabase
					.from('users')
					.select('id, wallet_address, referral_code')
					.eq('id', subscription.user_id)
					.single();

				// 수수료 내역 조회
				const { data: commissions } = await supabase
					.from('commissions')
					.select('id, amount, created_at')
					.eq('subscription_id', subscription.id)
					.eq('user_id', subscription.referrer_id)
					.order('created_at', { ascending: false });

				const totalCommission = commissions
					? commissions.reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0)
					: 0;

				return {
					subscription: {
						id: subscription.id,
						start_date: subscription.start_date,
						amount: subscription.amount,
					},
					subscriber: subscriber || { id: subscription.user_id, wallet_address: '알 수 없음' },
					commissions: {
						history: commissions || [],
						total: totalCommission,
					},
				};
			})
		);

		// 추천인 정보 (userId가 주어진 경우)
		let referrer = null;
		if (userId) {
			const { data: referrerData } = await supabase
				.from('users')
				.select('id, wallet_address, referral_code')
				.eq('id', userId)
				.single();

			if (referrerData) {
				referrer = referrerData;
			}
		}

		return NextResponse.json({
			content: {
				id: content.id,
				title: content.title,
			},
			referrer: referrer,
			referrals: {
				count: subscriberDetails.length,
				items: subscriberDetails,
			},
		});
	} catch (error) {
		console.error('서버 오류:', error);
		return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
