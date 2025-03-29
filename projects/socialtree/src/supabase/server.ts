import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Supabase URL 또는 서비스 롤 키가 설정되지 않았습니다.');
	}

	return createSupabaseClient(supabaseUrl, supabaseKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
