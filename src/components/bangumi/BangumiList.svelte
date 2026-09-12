<script lang="ts">
	import type { BangumiItem } from "@/types/data";

	export let bangumiList: BangumiItem[] = [];
	export let userId: string = "";

	let activeTab = "all";
	let searchQuery = "";

	// 统计数量
	$: totalCount = bangumiList.length;
	$: doingCount = bangumiList.filter((i) => i.type === 3).length;
	$: doneCount = bangumiList.filter((i) => i.type === 2).length;
	$: wishCount = bangumiList.filter((i) => i.type === 1).length;

	// 过滤列表
	$: filteredList = bangumiList.filter((item) => {
		// Tab 筛选
		if (activeTab === "doing" && item.type !== 3) return false;
		if (activeTab === "done" && item.type !== 2) return false;
		if (activeTab === "wish" && item.type !== 1) return false;

		// 搜索筛选
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			const matchName = item.name.toLowerCase().includes(q);
			const matchCn = item.name_cn.toLowerCase().includes(q);
			const matchTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
			return matchName || matchCn || matchTags;
		}

		return true;
	});

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchQuery = target.value;
	}

	function setTab(tab: string) {
		activeTab = tab;
	}

	function getProgressPercent(current: number, total: number): number {
		if (!total || total <= 0) return current > 0 ? 100 : 0;
		return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
	}

	let isRefreshing = false;
	let buttonText = "重新同步";

	// 客户端手动拉取 bgm.tv 最新标记
	async function handleManualSync() {
		if (!userId || isRefreshing) return;
		isRefreshing = true;
		buttonText = "同步中...";

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			let res = await fetch(`/api/bangumi?userId=${encodeURIComponent(userId)}&_t=${Date.now()}`, {
				signal: controller.signal,
			});

			if (!res.ok) {
				res = await fetch(
					`https://api.bgm.tv/v0/users/${encodeURIComponent(userId)}/collections?subject_type=2&limit=50&_t=${Date.now()}`,
					{ signal: controller.signal },
				);
			}

			clearTimeout(timeoutId);

			if (res.ok) {
				const json = await res.json();
				if (json && Array.isArray(json.data)) {
					const liveItems: BangumiItem[] = json.data.map((item: any) => {
						const sub = item.subject || {};
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
							tags: (sub.tags || []).slice(0, 3).map((t: any) => t.name),
							url: `https://bgm.tv/subject/${item.subject_id}`,
							updated_at: item.updated_at,
						};
					});

					// 与本地自定义番剧合并
					const liveIds = new Set(liveItems.map((i) => String(i.id)));
					const customLocal = bangumiList.filter((i) => !liveIds.has(String(i.id)));
					bangumiList = [...liveItems, ...customLocal];
					buttonText = "已同步";
				} else {
					buttonText = "已是最新";
				}
			} else {
				buttonText = "同步失败";
			}
		} catch (e) {
			console.warn("[Bangumi] 客户端手动同步失败:", e);
			buttonText = "同步失败";
		} finally {
			setTimeout(() => {
				isRefreshing = false;
				buttonText = "重新同步";
			}, 1500);
		}
	}
</script>

<div class="bangumi-container flex flex-col gap-6">
	<!-- 顶部控制栏：无缝贴合博客主题 -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
		<!-- 分类切换药丸组件 -->
		<div class="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--card-bg)] border border-[var(--line-color)] shadow-sm self-start">
			<button
				class="nav-tab {activeTab === 'all' ? 'active' : ''}"
				on:click={() => setTab('all')}
			>
				全部 <span class="tab-badge">{totalCount}</span>
			</button>
			<button
				class="nav-tab {activeTab === 'doing' ? 'active' : ''}"
				on:click={() => setTab('doing')}
			>
				在看 <span class="tab-badge">{doingCount}</span>
			</button>
			<button
				class="nav-tab {activeTab === 'done' ? 'active' : ''}"
				on:click={() => setTab('done')}
			>
				看过 <span class="tab-badge">{doneCount}</span>
			</button>
			<button
				class="nav-tab {activeTab === 'wish' ? 'active' : ''}"
				on:click={() => setTab('wish')}
			>
				想看 <span class="tab-badge">{wishCount}</span>
			</button>
		</div>

		<!-- 搜索与同步操作区 -->
		<div class="flex items-center gap-2 w-full sm:w-auto">
			<div class="relative w-full sm:w-60">
				<input
					type="text"
					placeholder="搜索番剧名称或标签..."
					value={searchQuery}
					on:input={handleSearchInput}
					class="w-full bg-[var(--card-bg)] text-90 placeholder:text-30 text-xs rounded-xl px-3 py-2 pl-8 border border-[var(--line-color)] focus:outline-none focus:border-[var(--primary)] transition shadow-sm"
				/>
				<svg class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
				</svg>
				{#if searchQuery}
					<button
						class="absolute right-2.5 top-1/2 -translate-y-1/2 text-30 hover:text-90 text-xs"
						on:click={() => (searchQuery = '')}
					>
						✕
					</button>
				{/if}
			</div>

			{#if userId}
				<button
					class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-75 bg-[var(--card-bg)] border border-[var(--line-color)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition shrink-0 shadow-sm disabled:opacity-60"
					on:click={handleManualSync}
					disabled={isRefreshing}
					title="点击从 bgm.tv 立即同步最新进度"
				>
					<svg class="w-3.5 h-3.5 {isRefreshing ? 'animate-spin text-[var(--primary)]' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
					</svg>
					<span>{buttonText}</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- 番剧网格列表 -->
	{#if filteredList.length > 0}
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
			{#each filteredList as item (item.id)}
				{@const progress = getProgressPercent(item.ep_status, item.eps)}
				<a
					href={item.url}
					target="_blank"
					rel="noopener noreferrer"
					class="group relative flex flex-col rounded-2xl overflow-hidden card-interactive bg-[var(--card-bg)] border border-[var(--line-color)] hover:border-[var(--primary)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
				>
					<!-- 海报封面 -->
					<div class="relative w-full aspect-[3/4] overflow-hidden bg-neutral-900/60">
						{#if item.cover}
							<img
								src={item.cover}
								alt={item.name_cn || item.name}
								loading="lazy"
								class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
							/>
						{:else}
							<div class="w-full h-full flex items-center justify-center text-30 text-xs">
								暂无封面
							</div>
						{/if}

						<!-- 状态标签角标 -->
						<div class="absolute top-2 left-2 flex gap-1 z-10">
							{#if item.type === 3}
								<span class="status-pill bg-[var(--primary)] text-black font-bold shadow-sm">在看</span>
							{:else if item.type === 2}
								<span class="status-pill bg-white/20 backdrop-blur-md text-white font-medium shadow-sm">看过</span>
							{:else if item.type === 1}
								<span class="status-pill bg-amber-400 text-black font-bold shadow-sm">想看</span>
							{:else if item.type === 4}
								<span class="status-pill bg-neutral-500 text-white font-medium shadow-sm">搁置</span>
							{:else}
								<span class="status-pill bg-rose-500 text-white font-medium shadow-sm">抛弃</span>
							{/if}
						</div>

						<!-- 评分徽标 -->
						{#if item.score > 0}
							<div class="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[11px] font-bold text-amber-300 flex items-center gap-0.5 shadow-sm">
								<span>★</span>
								<span>{item.score.toFixed(1)}</span>
							</div>
						{/if}

						<!-- 底部进度遮罩条 -->
						<div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 pt-6 flex flex-col gap-1 z-10">
							<div class="flex items-center justify-between text-[11px] text-white/90 font-medium">
								<span>进度</span>
								<span>{item.ep_status} / {item.eps || '?'} 话</span>
							</div>
							<div class="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
								<div
									class="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
									style="width: {progress}%"
								></div>
							</div>
						</div>
					</div>

					<!-- 番剧信息区域 -->
					<div class="p-3 flex flex-col flex-grow justify-between gap-1.5">
						<div>
							<h3
								class="text-xs sm:text-sm font-bold text-90 line-clamp-1 transition group-hover:text-[var(--primary)]"
								title={item.name_cn || item.name}
							>
								{item.name_cn || item.name}
							</h3>
							{#if item.name && item.name !== item.name_cn}
								<p class="text-[11px] text-50 line-clamp-1 mt-0.5" title={item.name}>
									{item.name}
								</p>
							{/if}
						</div>

						<!-- 标签与年份 -->
						<div class="flex items-center justify-between gap-1 mt-1 pt-1.5 border-t border-[var(--line-color)]">
							<div class="flex flex-wrap gap-1">
								{#if item.tags && item.tags.length > 0}
									{#each item.tags.slice(0, 2) as tag}
										<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--card-bg)] border border-[var(--line-color)] text-50">
											{tag}
										</span>
									{/each}
								{/if}
							</div>
							{#if item.date}
								<span class="text-[10px] text-30 font-medium shrink-0">
									{item.date.slice(0, 4)}
								</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<!-- 空状态 -->
		<div class="flex flex-col items-center justify-center py-16 text-center text-50 border border-dashed border-[var(--line-color)] rounded-2xl">
			<svg class="w-12 h-12 mb-3 text-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
			</svg>
			<p class="text-sm font-medium">没有找到符合条件的番剧记录</p>
			{#if searchQuery}
				<p class="text-xs text-30 mt-1">请尝试更换搜索词或重置筛选条件</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.nav-tab {
		padding: 0.35rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-75, rgba(255, 255, 255, 0.75));
		background: transparent;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.nav-tab:hover {
		color: var(--text-90, #ffffff);
		background: rgba(255, 255, 255, 0.06);
	}

	.nav-tab.active {
		background: var(--primary);
		color: #111111;
		font-weight: 700;
	}

	.tab-badge {
		font-size: 0.65rem;
		padding: 0.1rem 0.35rem;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.12);
	}

	.nav-tab.active .tab-badge {
		background: rgba(0, 0, 0, 0.2);
		color: #111111;
		font-weight: 700;
	}

	.status-pill {
		font-size: 10px;
		line-height: 1.2;
		padding: 2px 6px;
		border-radius: 4px;
	}
</style>
