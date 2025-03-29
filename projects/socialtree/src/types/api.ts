export type CommonResType<T = unknown> = {
	status: 'SUCCESS' | string;
	message?: string;
	data: T;
};
