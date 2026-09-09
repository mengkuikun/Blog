// 文章列表客户端排序（仅当前页面内排序）

interface PostData {
	id: string;
	title: string;
	published: string;
	pinned?: boolean;
}

type SortType = "date" | "views" | "alpha";
type SortOrder = "asc" | "desc";

class PostListManager {
	private posts: PostData[] = [];
	private currentSort: SortType = "date";
	private currentOrder: SortOrder = "desc";
	private articles: HTMLElement[] = [];
	private viewsData: Map<string, number> = new Map();
	private viewsLoaded = false;
	private isAnimating = false;

	constructor() {
		this.init();
	}

	private init() {
		if (typeof window === "undefined") return;

		this.posts = (window as any).__PAGE_POSTS_DATA__ || [];
		this.cacheArticles();
		this.bindEvents();
		this.loadViewsData();
	}

	private cacheArticles() {
		const container = document.getElementById("post-list-container");
		if (!container) return;

		this.articles = Array.from(container.querySelectorAll("article"));
	}

	private async loadViewsData() {
		// 批量获取所有文章的访问量（包含全站访问量）
		try {
			const pathnames = ["/", ...this.posts.map((post) => `/posts/${post.id}/`)];
			
			const res = await fetch("https://t.2x.nz/batch", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(pathnames),
			});

			if (res.ok) {
				const text = await res.text();
				
				if (!text || text.trim() === '') {
					throw new Error('Empty response');
				}
				
				const views: number[] = JSON.parse(text);
				
				// 第一个是全站访问量，存储到全局变量
				const siteViews = views[0] || 0;
				(window as any).__SITE_VIEWS__ = siteViews;
				
				// 触发自定义事件通知其他组件
				window.dispatchEvent(new CustomEvent('site-views-loaded', { detail: { views: siteViews } }));
				
				const viewsElement = document.getElementById("site-views");
				const wrapper = document.getElementById("site-views-wrapper");
				if (viewsElement && wrapper) {
					viewsElement.textContent = siteViews.toString();
					wrapper.style.display = "grid";
				}
				
				// 后续是文章访问量
				this.posts.forEach((post, index) => {
					const viewCount = views[index + 1] || 0;
					this.viewsData.set(post.id, viewCount);
					
					// 同时更新 PostMeta 组件的显示
					const postWrapper = document.getElementById(`page-views-wrapper-${post.id}`);
					const postViewsElement = document.getElementById(`page-views-${post.id}`);
					if (postWrapper && postViewsElement) {
						postViewsElement.textContent = `${viewCount} 次`;
						postWrapper.style.display = 'flex';
					}
				});
			} else {
				// 请求失败，所有文章默认为 0
				this.posts.forEach((post) => {
					this.viewsData.set(post.id, 0);
				});
			}
		} catch (e) {
			// 请求失败，所有文章默认为 0
			this.posts.forEach((post) => {
				this.viewsData.set(post.id, 0);
			});
		}

		this.viewsLoaded = true;
		// 标记访问量已加载，防止 PostMeta 重复请求
		(window as any).__VIEWS_FETCHED__ = true;
		(window as any).__SITE_VIEWS_LOADED__ = true;
	}

	private bindEvents() {
		document.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;

			const sortBtn = target.closest("[data-sort-type]");
			if (sortBtn) {
				e.preventDefault();
				const type = sortBtn.getAttribute("data-sort-type") as SortType;
				this.setSort(type);
				return;
			}

			const orderBtn = target.closest("[data-sort-order]");
			if (orderBtn) {
				e.preventDefault();
				this.toggleOrder();
				return;
			}
		});
	}

	private setSort(type: SortType) {
		if (this.isAnimating) return;
		if (this.currentSort !== type) {
			this.currentSort = type;
			
			// 如果切换到访问量排序但数据还未加载完成，等待加载
			if (type === "views" && !this.viewsLoaded) {
				const checkInterval = setInterval(() => {
					if (this.viewsLoaded) {
						clearInterval(checkInterval);
						this.render();
					}
				}, 100);
			} else {
				this.render();
			}
		}
	}

	private toggleOrder() {
		if (this.isAnimating) return;
		this.currentOrder = this.currentOrder === "asc" ? "desc" : "asc";
		this.render();
	}

	private getSortedIndices(): number[] {
		const indices = this.posts.map((_, i) => i);

		indices.sort((i, j) => {
			const a = this.posts[i];
			const b = this.posts[j];

			// 置顶优先
			if (a.pinned !== b.pinned) {
				return a.pinned ? -1 : 1;
			}

			if (this.currentSort === "date") {
				const dateA = new Date(a.published).getTime();
				const dateB = new Date(b.published).getTime();
				return this.currentOrder === "desc" ? dateB - dateA : dateA - dateB;
			} else if (this.currentSort === "views") {
				const viewsA = this.viewsData.get(a.id) || 0;
				const viewsB = this.viewsData.get(b.id) || 0;
				if (viewsA !== viewsB) {
					return this.currentOrder === "desc" ? viewsB - viewsA : viewsA - viewsB;
				}
				const dateA = new Date(a.published).getTime();
				const dateB = new Date(b.published).getTime();
				return dateB - dateA;
			} else if (this.currentSort === "alpha") {
				return this.currentOrder === "desc"
					? b.title.localeCompare(a.title, "zh")
					: a.title.localeCompare(b.title, "zh");
			}

			return 0;
		});

		return indices;
	}

	private async render() {
		const container = document.getElementById("post-list-container");
		if (!container || this.articles.length === 0) return;

		// 立即更新控制按钮的高亮和方向，提供零延迟点击反馈
		this.updateSortControls();

		// 文章少于等于 1 篇时直接重排，无需过渡
		if (this.articles.length <= 1) {
			const sortedIndices = this.getSortedIndices();
			sortedIndices.forEach((index) => {
				if (this.articles[index]) {
					container.appendChild(this.articles[index]);
				}
			});
			return;
		}

		this.isAnimating = true;
		container.style.pointerEvents = "none";

		// 阶段 1：现有文章平滑淡出微沉（消失效果）
		this.articles.forEach((article) => {
			article.style.transition = "opacity 160ms cubic-bezier(0.4, 0, 0.2, 1), transform 160ms cubic-bezier(0.4, 0, 0.2, 1)";
			article.style.opacity = "0";
			article.style.transform = "translateY(8px)";
		});

		// 等待淡出动效完成
		await new Promise((resolve) => setTimeout(resolve, 160));

		// 阶段 2：在全透明状态下重新按新排序插入 DOM
		const sortedIndices = this.getSortedIndices();
		sortedIndices.forEach((index) => {
			if (this.articles[index]) {
				container.appendChild(this.articles[index]);
			}
		});

		// 阶段 3：按新顺序重置各卡片入场初态，并触发波浪式交错浮现（再出现效果）
		sortedIndices.forEach((index) => {
			const article = this.articles[index];
			if (article) {
				article.style.transition = "none";
				article.style.opacity = "0";
				article.style.transform = "translateY(16px)";
			}
		});

		// 强制应用初始状态
		void container.offsetHeight;

		// 逐个阶梯淡入浮现（波浪节奏）
		const staggerDelay = 35; // 卡片间交错 35ms
		sortedIndices.forEach((index, i) => {
			const article = this.articles[index];
			if (!article) return;
			setTimeout(() => {
				article.style.transition = "opacity 280ms cubic-bezier(0.16, 1, 0.3, 1), transform 280ms cubic-bezier(0.16, 1, 0.3, 1)";
				article.style.opacity = "1";
				article.style.transform = "translateY(0)";
			}, i * staggerDelay);
		});

		// 动画全部结束之后清理行内样式，恢复原生 hover 交互
		const totalDuration = (sortedIndices.length - 1) * staggerDelay + 300;
		setTimeout(() => {
			this.articles.forEach((article) => {
				article.style.transition = "";
				article.style.opacity = "";
				article.style.transform = "";
			});
			container.style.pointerEvents = "";
			this.isAnimating = false;
		}, totalDuration);
	}

	private updateSortControls() {
		const sortBtns = document.querySelectorAll("[data-sort-type]");
		sortBtns.forEach((btn) => {
			const type = btn.getAttribute("data-sort-type");
			btn.classList.toggle("active", this.currentSort === type);
		});

		const orderBtn = document.querySelector("[data-sort-order]");
		if (orderBtn) {
			const icon = orderBtn.querySelector(".iconify-icon, svg");
			const text = orderBtn.querySelector("span");
			if (icon) {
				icon.classList.toggle("rotate-180", this.currentOrder === "asc");
			}
			if (text) {
				text.textContent = this.currentOrder === "desc" ? "倒序" : "正序";
			}
		}
	}
}

// 初始化
if (typeof window !== "undefined") {
	document.addEventListener("DOMContentLoaded", () => {
		new PostListManager();
	});
	document.addEventListener("astro:page-load", () => {
		new PostListManager();
	});
}
