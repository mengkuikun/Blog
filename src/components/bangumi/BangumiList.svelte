<script lang="ts">
	import type { BangumiItem } from "@/types/data";

	export let bangumiList: BangumiItem[] = [];

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
</script>

<div class="bangumi-container flex flex-col gap-6">
	<!-- 顶部统计与控制栏 -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-black/10 dark:border-white/10 backdrop-blur-sm">
		<!-- 分类 Tabs -->
		<div class="flex flex-wrap items-center gap-2">
			<button
				class="tab-btn {activeTab === 'all' ? 'active' : ''}"
				on:click={() => setTab('all')}
			>
				全部 <span class="badge">{totalCount}</span>
			</button>
			<button
				class="tab-btn {activeTab === 'doing' ? 'active' : ''}"
				on:click={() => setTab('doing')}
			>
				在看 <span class="badge bg-emerald-500/20 text-emerald-400">{doingCount}</span>
			</button>
			<button
				class="tab-btn {activeTab === 'done' ? 'active' : ''}"
				on:click={() => setTab('done')}
			>
				看过 <span class="badge bg-blue-500/20 text-blue-400">{doneCount}</span>
			</button>
			<button
				class="tab-btn {activeTab === 'wish' ? 'active' : ''}"
				on:click={() => setTab('wish')}
			>
				想看 <span class="badge bg-amber-500/20 text-amber-400">{wishCount}</span>
			</button>
		</div>

		<!-- 搜索输入框 -->
		<div class="relative w-full md:w-64">
			<input
				type="text"
				placeholder="搜索番剧名称 / 标签..."
				value={searchQuery}
				on:input={handleSearchInput}
				class="w-full bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 text-sm rounded-lg px-3 py-1.5 pl-8 border border-black/10 dark:border-white/10 focus:outline-none focus:border-[var(--primary)] transition"
			/>
			<svg class="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
			</svg>
			{#if searchQuery}
				<button
					class="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
					on:click={() => (searchQuery = '')}
				>
					×
				</button>
			{/if}
		</div>
	</div>

	<!-- 番剧卡片网格 -->
	{#if filteredList.length > 0}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
			{#each filteredList as item (item.id)}
				{@const progress = getProgressPercent(item.ep_status, item.eps)}
				<a
					href={item.url}
					target="_blank"
					rel="noopener noreferrer"
					class="anime-card group relative flex flex-col rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 transition-all duration-300 hover:border-[var(--primary)] hover:shadow-lg hover:-translate-y-1"
				>
					<!-- 海报封面 -->
					<div class="relative w-full aspect-[3/4] overflow-hidden bg-neutral-800">
						{#if item.cover}
							<img
								src={item.cover}
								alt={item.name_cn || item.name}
								loading="lazy"
								class="w-full h-full object-cover transition duration-500 group-hover:scale-105"
							/>
						{:else}
							<div class="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
								暂无封面
							</div>
						{/if}

						<!-- 状态标签角标 -->
						<div class="absolute top-2 left-2 flex gap-1 z-10">
							{#if item.type === 3}
								<span class="status-pill bg-emerald-500 text-white shadow-sm">在看</span>
							{:else if item.type === 2}
								<span class="status-pill bg-blue-500 text-white shadow-sm">看过</span>
							{:else if item.type === 1}
								<span class="status-pill bg-amber-500 text-white shadow-sm">想看</span>
							{:else if item.type === 4}
								<span class="status-pill bg-neutral-500 text-white shadow-sm">搁置</span>
							{:else}
								<span class="status-pill bg-rose-500 text-white shadow-sm">抛弃</span>
							{/if}
						</div>

						<!-- 评分角标 -->
						{#if item.score > 0}
							<div class="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[11px] font-semibold text-amber-300 flex items-center gap-0.5">
								<span>★</span>
								<span>{item.score.toFixed(1)}</span>
							</div>
						{/if}

						<!-- 进度遮罩条 -->
						<div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6 flex flex-col gap-1 z-10">
							<div class="flex items-center justify-between text-[11px] text-white/90">
								<span>进度</span>
								<span class="font-medium">{item.ep_status} / {item.eps || '?'} 话</span>
							</div>
							<div class="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
								<div
									class="h-full bg-[var(--primary)] transition-all duration-300 rounded-full"
									style="width: {progress}%"
								></div>
							</div>
						</div>
					</div>

					<!-- 番剧信息区域 -->
					<div class="p-3 flex flex-col flex-grow justify-between gap-1.5">
						<div>
							<h3
								class="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-100 line-clamp-1 transition group-hover:text-[var(--primary)]"
								title={item.name_cn || item.name}
							>
								{item.name_cn || item.name}
							</h3>
							{#if item.name && item.name !== item.name_cn}
								<p class="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1" title={item.name}>
									{item.name}
								</p>
							{/if}
						</div>

						<!-- 标签 -->
						{#if item.tags && item.tags.length > 0}
							<div class="flex flex-wrap gap-1 mt-0.5">
								{#each item.tags.slice(0, 2) as tag}
									<span class="text-[10px] px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
										{tag}
									</span>
								{/each}
								{#if item.date}
									<span class="text-[10px] text-neutral-400 self-center ml-auto">
										{item.date.slice(0, 4)}
									</span>
								{/if}
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<!-- 空状态 -->
		<div class="flex flex-col items-center justify-center py-16 text-center text-neutral-400 border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
			<svg class="w-12 h-12 mb-3 text-neutral-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
			</svg>
			<p class="text-sm font-medium">没有找到符合条件的番剧记录</p>
			{#if searchQuery}
				<p class="text-xs text-neutral-500 mt-1">请尝试更换搜索词或重置筛选条件</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.tab-btn {
		padding: 0.35rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.7);
		background: transparent;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	:global(.light) .tab-btn {
		color: rgba(0, 0, 0, 0.7);
	}

	.tab-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	:global(.light) .tab-btn:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #000;
	}

	.tab-btn.active {
		background: var(--primary);
		color: #111;
		font-weight: 600;
	}

	.badge {
		font-size: 0.6875rem;
		padding: 0.1rem 0.35rem;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.2);
	}

	.tab-btn.active .badge {
		background: rgba(0, 0, 0, 0.2);
		color: #111;
	}

	.status-pill {
		font-size: 10px;
		font-weight: 600;
		padding: 2px 6px;
		border-radius: 4px;
		line-height: 1.2;
	}
</style>
