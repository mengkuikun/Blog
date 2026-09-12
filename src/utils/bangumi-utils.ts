import type { BangumiItem } from "@/types/data";
import { bangumiConfig } from "@/config";
import localBangumiData from "@/data/bangumi.json";

interface RawBgmItem {
	subject_id: number;
	type: number;
	ep_status: number;
	rate: number;
	updated_at: string;
	subject: {
		id: number;
		name: string;
		name_cn: string;
		short_summary?: string;
		date?: string;
		eps?: number;
		score?: number;
		images?: {
			large?: string;
			common?: string;
			medium?: string;
			small?: string;
			grid?: string;
		};
		tags?: { name: string; count: number }[];
	};
}

/**
 * 获取追番列表：
 * 优先从 Bangumi OpenAPI 动态拉取最新的看番与打卡记录；
 * 若网络异常或构建超时，无缝回退至本地 src/data/bangumi.json。
 */
export async function getBangumiList(): Promise<BangumiItem[]> {
	if (!bangumiConfig.enable) {
		return localBangumiData as BangumiItem[];
	}

	const localItems = (localBangumiData || []) as BangumiItem[];

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 6000);

		const res = await fetch(
			`https://api.bgm.tv/v0/users/${bangumiConfig.userId}/collections?subject_type=2&limit=50`,
			{
				headers: {
					"User-Agent": "MengkuBlog/1.0 (https://github.com/mengkuikun/Blog)",
				},
				signal: controller.signal,
			},
		);

		clearTimeout(timeoutId);

		if (!res.ok) {
			console.warn(`[Bangumi] API request returned ${res.status}, using local fallback data.`);
			return localItems;
		}

		const data = (await res.json()) as { data?: RawBgmItem[] };
		if (!data.data || !Array.isArray(data.data)) {
			return localItems;
		}

		const fetchedItems: BangumiItem[] = data.data.map((item) => {
			const sub = item.subject;
			return {
				id: item.subject_id,
				name: sub.name,
				name_cn: sub.name_cn || sub.name,
				cover:
					sub.images?.large ||
					sub.images?.common ||
					sub.images?.medium ||
					sub.images?.small ||
					"",
				type: item.type,
				eps: sub.eps || 0,
				ep_status: item.ep_status || 0,
				score: item.rate > 0 ? item.rate : sub.score || 0,
				summary: sub.short_summary || "",
				date: sub.date || "",
				tags: (sub.tags || []).slice(0, 4).map((t) => t.name),
				url: `https://bgm.tv/subject/${item.subject_id}`,
				updated_at: item.updated_at,
			};
		});

		// 如果允许本地与远程合并（本地自定义番剧）
		if (bangumiConfig.fallbackToLocal && localItems.length > 0) {
			const fetchedIds = new Set(fetchedItems.map((i) => String(i.id)));
			const customLocalItems = localItems.filter((i) => !fetchedIds.has(String(i.id)));
			return [...fetchedItems, ...customLocalItems];
		}

		return fetchedItems;
	} catch (error) {
		console.warn("[Bangumi] Failed to fetch live data from bgm.tv, falling back to local data:", error);
		return localItems;
	}
}
