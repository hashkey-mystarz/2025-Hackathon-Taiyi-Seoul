import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호할 페이지 목록
const protectedRoutes = ['/mypage', '/contents/*/view'];

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	// 패턴 매칭 - /contents/{id}/view 형식의 URL 확인
	const isProtected = protectedRoutes.some((route) => {
		if (route.includes('*')) {
			const pattern = new RegExp('^' + route.replace('*', '[^/]+') + '$');
			return pattern.test(pathname);
		}
		return pathname === route;
	});

	// 로그인 상태는 클라이언트 측에서 확인하므로 여기서는 단순 로깅만 수행
	if (isProtected) {
		console.log('보호된 페이지 접근:', pathname);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'], // 정적 파일 요청 제외
};
