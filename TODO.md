# 博客后续待办计划清单 (TODO)

## 📌 优先级 1：自建轻量级访问量计数器（点亮文章卡片与排序）

### 1. 背景与现状
* **数据收集端**：目前博客已成功接入 **Umami Cloud**（ID: `2ab39a76-520f-4482-9185-13f2f43ff73a`），能完整记录全站与每篇文章的访客行为，并在导航栏的公开看板中可实时查看。
* **数据回显端**：
  * **侧边栏全站访问量**（`Profile.astro`）
  * **文章卡片上的阅读数**（`PostCard.astro` / `PostMeta.astro`，即发布日期右侧的小眼睛区域）
  * **文章详情页阅读数**（`ViewsCounter.astro`）
  * **按访问量排序按钮**（`PostSort.astro` / `post-list-sort.ts`）
  * 上述界面组件目前依赖原作者自建的私有接口 `https://t.2x.nz/batch`。由于原作者服务国内访问不稳定或经常断开，前端在请求失败后执行了容错保护（自动将包含小眼睛的容器设为 `display: none`），导致页面上看不到小眼睛，且排序时每篇文章并列当作 0。

---

### 2. 改造实施目标
部署属于自己的、完全免费且免维护的 **Cloudflare Workers + KV 计数器**，替代原作者的 `t.2x.nz`，让所有文章卡片的真实访问量永久稳定点亮，并让“按访问量排序”按钮基于真实数据重排。

---

### 3. 具体实施步骤（待办 Checklist）

- [ ] **步骤 1：创建 Cloudflare Worker 计数服务**
  - 在 Cloudflare 控制台新建一个 Worker（例如命名为 `blog-counter`）。
  - 创建一个 KV 命名空间（例如 `BLOG_VIEWS`）并绑定到该 Worker。
  - Worker 代码实现两项核心能力：
    1. `GET /hit?path=/posts/xxx/`：访问特定文章时，KV 中对应文章计数值 `+1`。
    2. `POST /batch`：传入文章 slug 数组 `["/posts/a/", "/posts/b/"]`，一次性批量返回各文章当前的整数访问量数组 `[128, 45, ...]`。

- [ ] **步骤 2：在博客代码中替换计数器地址**
  - 在 `src/config.ts` 中新增或统一计数服务地址配置（如 `viewCounterApi: "https://counter.yourdomain.workers.dev"`）。
  - 将以下 4 处硬编码的 `https://t.2x.nz` 替换为你自己的 Worker 接口：
    - `src/scripts/post-list-sort.ts`
    - `src/components/PostMeta.astro`
    - `src/components/ViewsCounter.astro`
    - `src/components/layout/BodyThirdPartyScripts.astro`

- [ ] **步骤 3：验证与联调效果**
  - 打开首页，验证每张文章卡片日期右侧的“👁 小眼睛 XX 次”是否自然恢复显示。
  - 验证左侧头像下方的“全站访问量”是否同步恢复。
  - 点击顶部的“👁 访问量排序”按钮，验证文章列表是否根据真实阅读数从高到低平滑重排。

---

## 📌 优先级 2：文章内容与博客代码分离架构（长远规划备忘）

* **目标**：未来若有跨设备写作、手机浏览器写作、或更换博客前端不迁移文章的需求，可参考原作者的解耦架构。
* **架构要点**：
  - 新建专用 Markdown 数据仓库（如 `blog-data`），存放 `posts/*.md` 和插图。
  - 接入 **Pages CMS** 开箱即用的在线后台。
  - 通过 GitHub Actions 在有新文章发布时自动触发主博客重新拉取并构建部署。

---

*创建时间：2026-09-09*
