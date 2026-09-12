<script lang="ts">
	import type { BangumiItem } from "@/types/data";
	import { parseRawBgmItems } from "@/utils/bangumi-utils";
	import { onMount } from "svelte";

	export let fallbackList: BangumiItem[] = [];
	export let userId: string = "";

	let bangumiList: BangumiItem[] = [];
	let isLoading = true;
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
	let syncSuccess = false;
	let syncError = false;

	$: syncText = (isLoading || isRefreshing)
		? "同步中..."
		: syncSuccess
			? "已是最新"
			: syncError
				? "已载入备份"
				: "重新同步";

	onMount(() => {
		fetchLiveData(false);
	});

	async function fetchLiveData(isManual = false) {
		if (!userId) {
			bangumiList = fallbackList;
			isLoading = false;
			return;
		}

		if (isManual) {
			isRefreshing = true;
		}

		syncSuccess = false;
		syncError = false;

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 8000);

			let res: Response | null = null;
			try {
				const proxyRes = await fetch(`/api/bangumi?userId=${encodeURIComponent(userId)}&_t=${Date.now()}`, {
					signal: controller.signal,
				});
				if (proxyRes.ok) {
					res = proxyRes;
				}
			} catch (_) {
				// pass
			}

			if (!res || !res.ok) {
				res = await fetch(
					`https://api.bgm.tv/v0/users/${encodeURIComponent(userId)}/collections?subject_type=2&limit=50&_t=${Date.now()}`,
					{
						headers: {
							"User-Agent": "MengkuBlog/1.0 (https://github.com/mengkuikun/Blog)",
						},
						signal: controller.signal,
					},
				);
			}

			clearTimeout(timeoutId);

			if (res && res.ok) {
				const json = await res.json();
				if (json && Array.isArray(json.data)) {
					const liveItems = parseRawBgmItems(json.data);
					bangumiList = liveItems;
					syncSuccess = true;
					setTimeout(() => {
						syncSuccess = false;
					}, 2500);
				} else if (bangumiList.length === 0) {
					bangumiList = fallbackList;
				}
			} else if (bangumiList.length === 0) {
				bangumiList = fallbackList;
				syncError = true;
				setTimeout(() => {
					syncError = false;
				}, 2500);
			}
		} catch (err) {
			console.warn("[Bangumi] 客户端实时拉取失败，回退到离线数据:", err);
			if (bangumiList.length === 0) {
				bangumiList = fallbackList;
			}
			syncError = true;
			setTimeout(() => {
				syncError = false;
			}, 2500);
		} finally {
			isLoading = false;
			isRefreshing = false;
		}
	}

	function handleManualSync() {
		if (isLoading || isRefreshing) return;
		fetchLiveData(true);
	}

	/**
	 * 同步动态插入的封面图片与外层 .card-base 的彩虹旋转动画相位，
	 * 消除因异步加载导致的 CSS 动画启动时差，完美保留原图色彩。
	 */
	function syncRainbow(node: HTMLElement) {
		if (typeof window === "undefined") return;

		const sync = () => {
			if (!document.documentElement.classList.contains("is-rainbow-mode")) return;
			const card = node.closest(".card-base");
			if (!card || typeof (card as any).getAnimations !== "function") return;

			const parentAnims = (card as any).getAnimations() as any[];
			const parentAnim = parentAnims.find((a) => a.animationName === "rainbow-rotate");
			if (!parentAnim || parentAnim.currentTime === null) return;

			const nodeAnims = (node as any).getAnimations ? ((node as any).getAnimations() as any[]) : [];
			for (const anim of nodeAnims) {
				if (anim.animationName === "rainbow-rotate-reverse") {
					anim.currentTime = parentAnim.currentTime;
				}
			}
		};

		node.addEventListener("animationstart", sync);
		requestAnimationFrame(sync);

		return {
			destroy() {
				node.removeEventListener("animationstart", sync);
			},
		};
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

		<!-- 搜索框与同步控制区 -->
		<div class="flex items-center gap-2.5">
			<!-- 搜索框（对齐博客顶栏搜索：半透明背景、平滑弹性扩展、焦点高亮、带一键清空） -->
			<div class="group relative flex items-center rounded-xl bg-white/5 hover:bg-white/10 focus-within:bg-white/10 border border-white/5 focus-within:border-[var(--primary)]/30 transition-all duration-300 h-9">
				<svg class="absolute left-3 w-4 h-4 text-white/30 group-focus-within:text-[var(--primary)] transition-colors pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					type="text"
					value={searchQuery}
					on:input={handleSearchInput}
					placeholder="搜索番剧名称或标签..."
					class="w-36 sm:w-44 focus:w-48 sm:focus:w-60 transition-all duration-300 pl-9 pr-8 py-1.5 text-xs bg-transparent outline-none text-90 placeholder:text-white/30"
				/>
				{#if searchQuery}
					<button
						type="button"
						on:click={() => { searchQuery = ''; }}
						class="absolute right-2.5 p-0.5 rounded-full text-white/40 hover:text-white/90 hover:bg-white/10 transition"
						title="清空搜索"
					>
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>

			<!-- 客户端手动重新同步按钮（增强动效、高亮状态与提示） -->
			{#if userId}
				<button
					class="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-medium transition-all shrink-0 active:scale-95 disabled:opacity-80
						{isLoading || isRefreshing
							? 'text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/30 pointer-events-none'
							: syncSuccess
								? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30'
								: syncError
									? 'text-amber-400 bg-amber-400/10 border border-amber-400/30'
									: 'text-75 bg-white/5 hover:bg-white/10 hover:text-[var(--primary)] hover:border-[var(--primary)]/30 border border-white/5'}"
					on:click={handleManualSync}
					disabled={isLoading || isRefreshing}
					title="点击从 bgm.tv 立即同步最新打卡记录"
				>
					{#if syncSuccess}
						<svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					{:else}
						<svg class="w-3.5 h-3.5 {isLoading || isRefreshing ? 'animate-spin text-[var(--primary)]' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
						</svg>
					{/if}
					<span>{syncText}</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- 番剧网格列表：采用横向分栏卡片设计（桌面端 2 列以保证呼吸感，避免 3 列过于拥挤） -->
	{#if isLoading}
		<!-- 8 张高质感骨架屏 (与真实卡片 1:1 结构一致，呼吸光泽，零布局偏移) -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each Array(8) as _}
				<div class="relative flex rounded-2xl overflow-hidden bg-[var(--card-bg)] border border-[var(--line-color)] h-full animate-pulse">
					<!-- 左侧：海报骨架 -->
					<div class="w-32 sm:w-36 shrink-0 aspect-[2/3] bg-white/[0.06]"></div>

					<!-- 右侧：详情骨架 -->
					<div class="flex flex-1 min-w-0 flex-col justify-between p-3.5 gap-3">
						<div class="flex flex-col gap-2">
							<div class="flex items-start justify-between gap-2">
								<div class="h-5 bg-white/[0.08] rounded-md w-3/5"></div>
								<div class="h-4 w-4 bg-white/[0.05] rounded"></div>
							</div>
							<div class="h-3.5 bg-white/[0.04] rounded-md w-2/5"></div>
						</div>

						<div class="flex items-center gap-3">
							<div class="h-3.5 bg-white/[0.06] rounded-md w-10"></div>
							<div class="h-3.5 bg-white/[0.04] rounded-md w-12"></div>
							<div class="h-3.5 bg-white/[0.04] rounded-md w-20"></div>
						</div>

						<div class="flex flex-col gap-1.5">
							<div class="h-3 bg-white/[0.04] rounded-md w-full"></div>
							<div class="h-3 bg-white/[0.04] rounded-md w-4/5"></div>
						</div>

						<div class="mt-auto h-10 bg-white/[0.03] border border-white/[0.06] rounded-xl w-full"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if filteredList.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each filteredList as item, index (item.id)}
				{@const progress = getProgressPercent(item.ep_status, item.eps)}
				<a
					href={item.url}
					target="_blank"
					rel="noopener noreferrer"
					class="group relative flex rounded-2xl overflow-hidden card-interactive bg-[var(--card-bg)] border border-[var(--line-color)] hover:border-[var(--primary)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full"
				>
					<!-- 左侧：海报封面 -->
					<div class="relative w-32 sm:w-36 shrink-0 aspect-[2/3] overflow-hidden bg-neutral-900/60">
						{#if item.cover}
							<img
								use:syncRainbow
								src={item.cover}
								alt={item.name_cn || item.name}
								loading={index < 4 ? "eager" : "lazy"}
								decoding="async"
								referrerpolicy="no-referrer"
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

						<!-- 底部进度遮罩条 -->
						<div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-5 flex flex-col gap-1 z-10">
							<div class="flex items-center justify-between text-[10px] text-white/90 font-medium">
								<span>进度</span>
								<span>{item.ep_status} / {item.eps || '?'} 话</span>
							</div>
							<div class="w-full h-1 bg-white/20 rounded-full overflow-hidden">
								<div
									class="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
									style="width: {progress}%"
								></div>
							</div>
						</div>
					</div>

					<!-- 右侧：番剧详情与评价区域（对齐原作者层次与间距） -->
					<div class="flex flex-1 min-w-0 flex-col justify-between">
						<!-- 顶部标题行与原名 -->
						<div class="flex flex-col gap-0.5 p-3.5 pb-1">
							<div class="flex items-start justify-between gap-1.5">
								<h3
									class="min-w-0 truncate text-sm sm:text-base font-bold text-90 leading-6 transition group-hover:text-[var(--primary)]"
									title={item.name_cn || item.name}
								>
									{item.name_cn || item.name}
								</h3>
								<svg class="size-4 shrink-0 mt-1 text-40 group-hover:text-[var(--primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
								</svg>
							</div>
							{#if item.name && item.name !== item.name_cn}
								<p class="truncate text-xs text-50 leading-4" title={item.name}>
									{item.name}
								</p>
							{/if}
						</div>

						<!-- 主体信息区域：元数据、简介与短评 -->
						<div class="flex flex-1 flex-col gap-2 p-3.5 pt-1">
							<!-- 元数据行：星级评分、总集数、上映日期（对齐原作者点号格式） -->
							<div class="flex items-center gap-3 text-xs text-50 flex-wrap">
								{#if item.score > 0}
									<span class="flex items-center gap-1 font-bold text-amber-400">
										<span>★</span>
										<span>{item.score.toFixed(1)}</span>
									</span>
								{/if}
								{#if item.eps}
									<span>{item.eps} 集</span>
								{/if}
								{#if item.date}
									<span class="flex items-center gap-1 text-40">
										<svg class="size-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
										<span>{item.date.replaceAll('-', '.')}</span>
									</span>
								{/if}
							</div>

							<!-- 剧情简介 -->
							{#if item.summary}
								<p class="line-clamp-2 text-xs leading-relaxed text-50" title={item.summary}>
									{item.summary}
								</p>
							{/if}

							<!-- 贴底个人短评/吐槽 -->
							{#if item.comment && item.comment.trim()}
								<div class="mt-auto rounded-xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-2.5 flex items-start gap-2 shadow-none">
									<svg class="size-3.5 mt-0.5 text-[var(--primary)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
										<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
									</svg>
									<p class="line-clamp-2 min-w-0 text-xs leading-5 text-75" title={item.comment}>
										{item.comment.trim()}
									</p>
								</div>
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
