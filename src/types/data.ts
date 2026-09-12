export interface Friend {
	name: string;
	avatar: string;
	description: string;
	url: string;
}

export interface FriendsData {
	friends: Friend[];
}

export type BangumiStatus = "wish" | "done" | "doing" | "on_hold" | "dropped";

export interface BangumiItem {
	id: number | string;
	name: string;
	name_cn: string;
	cover: string;
	type: number; // 1: 想看, 2: 看过, 3: 在看, 4: 搁置, 5: 抛弃
	eps: number;
	ep_status: number;
	score: number;
	summary: string;
	date: string;
	tags?: string[];
	url: string;
	updated_at?: string;
}
