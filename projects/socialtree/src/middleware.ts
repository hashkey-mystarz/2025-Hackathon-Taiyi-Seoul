import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호할 페이지 목록
const protectedRoutes = ['/dashboard', '/profile', '/settings'];

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	console.log('미들웨어 동작', pathname); // 디버깅용 로그

	// const token = req.cookies.get('token')?.value;
	// // 보호된 페이지 접근 시, 로그인 여부 확인
	// if (!token && protectedRoutes.includes(pathname)) {
	// 	return NextResponse.redirect(new URL('/login', req.url));
	// }

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'], // 정적 파일 요청 제외
};
