import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { api } from '@/api';
// type
import { CommonResType } from '@/types/api';

// // ip 확인
// type GetIpResType = string;
// export const useGetIpApi = () => {
// 	const url = 'https://jsonip.com';
// 	return useQuery<any, Error, GetIpResType>({
// 		queryKey: [url],
// 		queryFn: async () => {
// 			const res = await fetch(url, { mode: 'cors' });
// 			return res.json();
// 		},
// 		select: (res) => res.ip,
// 	});
// };

// // 접속시 ip 전송
// type PostCheckIpDataType = {
// 	ip: string;
// };
// export const usePostCheckIpApi = () => {
// 	const url = '/api/dever/checkIp';
// 	return useMutation<AxiosResponse<CommonResType>, AxiosError, PostCheckIpDataType>({
// 		mutationFn: (data: PostCheckIpDataType) => api.post(url, data),
// 	});
// };

// 로그인
type PostLoginDataType = {
	account_value: string;
	account_password: string;
	access_ip?: string;
	redirect_uri?: string;
};
type PostLoginResType = CommonResType<{
	auth_code: string;
	id_token: string; // 테섭용
}>;
export const useLoginApi = () => {
	const url = '/v1/admin/login';
	const queryClient = useQueryClient();
	return useMutation<AxiosResponse<PostLoginResType>, AxiosError, PostLoginDataType>({
		mutationFn: (data: PostLoginDataType) => api.post(url, data),
		onSuccess: (res) => {
			if (res.data.status === 'SUCCESS') {
				queryClient.clear();
				window.location.href = '/';
			} else {
				alert(res.data.message);
			}
		},
		onError: (err) => {
			console.error(err);
			alert('로그인 중 오류가 발생했습니다.');
		},
	});
};

// 로그아웃
export const useLogoutApi = () => {
	const url = '/v1/admin/logout';
	const queryClient = useQueryClient();
	return useMutation<AxiosResponse<CommonResType>, AxiosError>({
		mutationFn: () => api.post(url),
		onSettled: () => {
			queryClient.clear();
			window.location.href = '/login';
		},
	});
};
