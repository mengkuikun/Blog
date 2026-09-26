<script lang="ts">
import MarkdownIt from "markdown-it";
import Prism from "prismjs";
import katex from "katex";

import "prismjs/components/prism-bash";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-python";
import "prismjs/components/prism-css";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-sql";

// 视图模式：全真文章视图 或 双栏实时编辑
type ViewMode = "article" | "split";

let markdownText = "";
let fileName = "";
let viewMode: ViewMode = "article";
let isDragging = false;
let copyNotification = "";
let notificationTimer: any = null;
let fileInputRef: HTMLInputElement | null = null;

// 解析出的 Frontmatter 元数据
interface ParsedMeta {
	title: string;
	description: string;
	published: string;
	updated: string;
	tags: string[];
	category: string;
	author: string;
	ai_level?: 1 | 2 | 3;
	image?: string;
}

let parsedMeta: ParsedMeta = {
	title: "未命名文章",
	description: "",
	published: "",
	updated: "",
	tags: [],
	category: "",
	author: "",
};

interface TocItem {
	level: number;
	text: string;
	id: string;
	children: TocItem[];
}

let contentMarkdown = "";
let renderedHtml = "";
let wordCount = 0;
let readingTimeMinutes = 1;
let displayPublishedDate = "";
let displayUpdatedDate = "";
let outlineTree: TocItem[] = [];

// AI 参与度展示映射（对齐 AIInvolvementCard）
const aiLevelMap: Record<1 | 2 | 3, { label: string; desc: string }> = {
	1: {
		label: "人工编写，AI润色",
		desc: "正文由作者完成，AI 主要用于措辞优化和语言打磨。",
	},
	2: {
		label: "人工主导，AI编写",
		desc: "作者主导结构和核心观点，正文部分内容由 AI 协助生成。",
	},
	3: {
		label: "AI主导，AI编写",
		desc: "文章内容由 AI 主导并生成，人工主要负责发布与必要校验。",
	},
};

// 官方示例文档内容（包含 Fuwari 所有特色语法）
const sampleMarkdown = `---
title: Fuwari 博客特色 Markdown 语法与预览指南
published: 2026-02-21T17:32:00
updated: 2026-02-22T08:00:00
description: 本指南演示了 Fuwari 博客支持的所有特色排版，包括 Admonitions 提示框、KaTeX 公式、剧透模糊、代码高亮等。
tags: [Astro, Fuwari, Markdown, 博客指南]
category: 公告
author: MengK
ai_level: 1
image: https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80
---

> 没错，就是你现在看到的右下角那个并不起眼的小铃铛。

欢迎使用博客 **Markdown 即时预览工具**！本工具 100% 在你的浏览器本地解析渲染，无需提交 Git，也无需启动本地开发服务，即可所见即所得地预览博客正式发布后的样式。

# 为什么要搞这个？

很多时候，我们写完一篇文章后，可能会发现有错别字，或者某些观点需要补充，甚至是因为某些原因需要删改内容。

为了解决这个“找不同”的难题，我们引入了这个功能。它会记录你上次访问时的文章版本，并在你下次访问时，自动对比服务器上的最新版本，告诉你：**这篇文章变了，具体变在哪。**

# 食用方法

下面是具体的使用步骤与排版测试演示。

## 1. 发现更新

Fuwari 支持多种精美彩色提示块，采用 \`:::类型 标题\` 或 GitHub 语法的 \`> [!NOTE]\`：

:::tip 小贴士
这是 \`:::tip\` 提示框，适合放置操作建议或小窍门。
:::

:::note 提示信息
这是 \`:::note\` 提示框，用于标注一般性补充说明。
:::

:::important 重要事项
这是 \`:::important\` 提示框，用于强调必须注意的关键细节。
:::

:::warning 警告提示
这是 \`:::warning\` 警告框，用于提醒可能导致异常的操作。
:::

:::caution 严正注意
这是 \`:::caution\` 危险/注意框，用于提示高风险动作或破坏性影响。
:::

:::ai 深度学习总结
这是 \`:::ai\` 提示框，具备科技感闪电图标与专属底栏标注，常用于 AI 摘要！
:::

同时完全支持 GitHub 标准语法：

> [!NOTE]
> 这是 GitHub 风格的 Note 引用提示块，同样无缝兼容。

## 2. 查看列表

使用两组竖线 \`||隐藏文本||\` 可以创建剧透遮罩，读者点击后才会清晰显现：

神秘彩蛋内容：||恭喜你发现了 Fuwari 博客的剧透遮罩语法！点击一下即刻揭晓。|| 记得尝试点击它！

## 3. 查看 DIFF

支持行内公式与块级独立公式，完美渲染专业数学符号：

- **行内公式**：质能方程是 $E = mc^2$，欧拉恒等式为 $e^{i\\pi} + 1 = 0$。
- **独立公式块**：

$$
\\int_{-\\infty}^{+\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}^{-1} = \\frac{1}{ad - bc}
\\begin{pmatrix}
d & -b \\\\
-c & a
\\end{pmatrix}
$$

代码高亮与行号（Prism.js）：

\`\`\`typescript
interface PostConfig {
    title: string;
    published: Date;
    tags: string[];
    ai_level?: 1 | 2 | 3;
}

export function formatPostTitle(post: PostConfig): string {
    return \`【\${post.tags[0] || '默认'}】\${post.title}\`;
}
\`\`\`

# 常见问题

| 功能特性 | 运行环境 | 说明 |
| :--- | :--- | :--- |
| 即时预览 | 纯浏览器端 | 零服务器上传，保护文章隐私 |
| Admonition | Fuwari Stylus | 1:1 还原彩色提示框与 Mask 图标 |
| 数学公式 | KaTeX | 毫秒级原生渲染 LaTeX 表达式 |
| 标签与头图 | Astro 原生 | 复刻真实博文 Metadata 头部 |

- [x] 完成 Markdown 文章初稿编写
- [x] 拖拽入本工具预览视觉排版
- [ ] 确认无误后通过 Git 提交发布
`;

// 初始化 Markdown-it 引擎
const md = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: true,
	breaks: true,
	highlight: (str: string, lang: string) => {
		if (lang && Prism.languages[lang]) {
			try {
				return `<pre class="language-${lang}"><code class="language-${lang}">${Prism.highlight(str, Prism.languages[lang], lang)}</code></pre>`;
			} catch (_) {}
		}
		const escaped = md.utils.escapeHtml(str);
		return `<pre class="language-text"><code>${escaped}</code></pre>`;
	},
});

// 解析 Frontmatter 提取元信息与正文
function parseFrontmatter(raw: string) {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) {
		return {
			meta: {
				title: "文章预览",
				description: "",
				published: "",
				updated: "",
				tags: [],
				category: "",
				author: "",
			},
			body: raw,
		};
	}

	const yamlLines = match[1].split("\n");
	const meta: ParsedMeta = {
		title: "文章预览",
		description: "",
		published: "",
		updated: "",
		tags: [],
		category: "",
		author: "",
	};

	let currentKey = "";
	let isList = false;

	for (const line of yamlLines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;

		if (trimmed.startsWith("- ") && isList && currentKey) {
			const val = trimmed.slice(2).trim().replace(/^['"]|['"]$/g, "");
			if (currentKey === "tags") {
				meta.tags.push(val);
			}
			continue;
		}

		const colonIdx = trimmed.indexOf(":");
		if (colonIdx > 0) {
			const key = trimmed.slice(0, colonIdx).trim();
			let value = trimmed.slice(colonIdx + 1).trim();

			if (!value) {
				currentKey = key;
				isList = true;
				if (key === "tags") meta.tags = [];
				continue;
			}

			isList = false;
			currentKey = "";
			value = value.replace(/^['"]|['"]$/g, "");

			if (key === "title") meta.title = value;
			else if (key === "description") meta.description = value;
			else if (key === "published") meta.published = value;
			else if (key === "updated") meta.updated = value;
			else if (key === "category") meta.category = value;
			else if (key === "author") meta.author = value;
			else if (key === "image") meta.image = value;
			else if (key === "ai_level") {
				const num = Number.parseInt(value, 10);
				if (num === 1 || num === 2 || num === 3) {
					meta.ai_level = num;
				}
			} else if (key === "tags") {
				if (value.startsWith("[") && value.endsWith("]")) {
					meta.tags = value
						.slice(1, -1)
						.split(",")
						.map((t) => t.trim().replace(/^['"]|['"]$/g, ""))
						.filter(Boolean);
				} else {
					meta.tags = [value];
				}
			}
		}
	}

	return { meta, body: match[2] };
}

// 纯浏览器端高性能字数与阅读时长统计（100% 对齐 CJK 规范）
function calculateReadingStats(text: string) {
	const clean = text.replace(/```[\s\S]*?```/g, "").replace(/<[^>]*>/g, "");
	// 匹配汉字与日韩文字
	const cjkCount = (clean.match(/[\u4e00-\u9fa5\u3040-\u309f\uac00-\ud7a3]/g) || []).length;
	// 匹配英文与数字单词
	const nonCjk = clean.replace(/[\u4e00-\u9fa5\u3040-\u309f\uac00-\ud7a3]/g, " ");
	const wordsCount = (nonCjk.match(/[a-zA-Z0-9_\u00C0-\u024F-]+/g) || []).length;
	const total = cjkCount + wordsCount;
	const minutes = Math.max(1, Math.ceil(total / 250));
	return { total, minutes };
}

// 日期解析（100% 对齐 date-utils.ts 的 parsePostDateToDate）
function parseDateString(value: unknown): Date | null {
	if (!value) return null;
	if (value instanceof Date) return value;
	if (typeof value !== "string") return new Date(String(value));

	const s = value.trim();
	const dateOnly = /^(\d{4})[-/](\d{2})[-/](\d{2})$/.exec(s);
	if (dateOnly) {
		const y = Number(dateOnly[1]);
		const m = Number(dateOnly[2]);
		const d = Number(dateOnly[3]);
		return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
	}

	const localNoZone =
		/^(\d{4})[-/](\d{2})[-/](\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s);
	if (localNoZone) {
		const y = Number(localNoZone[1]);
		const m = Number(localNoZone[2]);
		const d = Number(localNoZone[3]);
		const hh = Number(localNoZone[4]);
		const mm = Number(localNoZone[5]);
		const ss = Number(localNoZone[6] ?? "0");
		return new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
	}

	const parsed = new Date(s);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// 格式化日期为博客标准显示（100% 对齐 date-utils.ts 的 formatPostDateForDisplay）
function formatPostDate(dateStr?: string): string {
	if (!dateStr) return "";
	const date = parseDateString(dateStr);
	if (!date) return dateStr;

	const isDateOnly =
		date.getUTCHours() === 0 &&
		date.getUTCMinutes() === 0 &&
		date.getUTCSeconds() === 0 &&
		date.getUTCMilliseconds() === 0;

	const timeZone = "Asia/Shanghai";

	const dateParts = new Intl.DateTimeFormat("zh-CN", {
		timeZone,
		year: "numeric",
		month: "numeric",
		day: "numeric",
	}).formatToParts(date);
	const y = dateParts.find((p) => p.type === "year")?.value ?? "";
	const m = dateParts.find((p) => p.type === "month")?.value ?? "";
	const d = dateParts.find((p) => p.type === "day")?.value ?? "";

	const currentYear = new Date().getFullYear().toString();
	const datePart = y === currentYear ? `${m}月${d}日` : `${y}年${m}月${d}日`;
	if (isDateOnly) return datePart;

	const timeParts = new Intl.DateTimeFormat("zh-CN", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).formatToParts(date);
	const hh = timeParts.find((p) => p.type === "hour")?.value ?? "00";
	const mm = timeParts.find((p) => p.type === "minute")?.value ?? "00";
	const ss = timeParts.find((p) => p.type === "second")?.value ?? "00";

	const timePart = ss !== "00" ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
	return `${datePart} ${timePart}`;
}

// 转换 Admonitions 提示块
function processAdmonitions(text: string): string {
	const admTitleMap: Record<string, string> = {
		ai: "AI 摘要",
		note: "提示",
		tip: "小贴士",
		important: "重要",
		warning: "警告",
		caution: "注意",
	};

	// 1. 处理 :::type [title]\n...\n::: 语法
	let processed = text.replace(
		/:::([a-zA-Z]+)(?:[ \t]+([^\n\r]+))?\r?\n([\s\S]*?)\r?\n:::/g,
		(_, rawType, rawTitle, body) => {
			const type = rawType.toLowerCase();
			const defaultTitle = admTitleMap[type] || type.toUpperCase();
			const title = rawTitle?.trim() || defaultTitle;
			const isAi = type === "ai";

			const renderedBody = md.render(body.trim());
			const footerHtml = isAi && rawTitle?.trim() ? `<div class="bdm-footer">${rawTitle.trim()}</div>` : "";

			return `<blockquote class="admonition bdm-${type}"><span class="bdm-title">${title}</span>${renderedBody}${footerHtml}</blockquote>`;
		},
	);

	// 2. 处理 GitHub 风格：> [!NOTE] 引用块
	processed = processed.replace(
		/>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\r?\n((?:>[^\n]*\r?\n?)*)/gi,
		(_, rawType, bodyLines) => {
			const type = rawType.toLowerCase();
			const title = admTitleMap[type] || type.toUpperCase();
			const cleanBody = bodyLines
				.split("\n")
				.map((line: string) => line.replace(/^>[ \t]?/, ""))
				.join("\n");
			const renderedBody = md.render(cleanBody.trim());
			return `<blockquote class="admonition bdm-${type}"><span class="bdm-title">${title}</span>${renderedBody}</blockquote>`;
		},
	);

	return processed;
}

// 处理剧透遮罩 ||text||
function processSpoiler(text: string): string {
	return text.replace(/\|\|([\s\S]*?)\|\|/g, '<span class="spoiler" title="点击显示">$1</span>');
}

// 构建目录大纲树
function buildOutlineTree(flatList: { level: number; text: string; id: string }[]): TocItem[] {
	if (flatList.length === 0) return [];
	const minLevel = Math.min(...flatList.map((item) => item.level));
	const tree: TocItem[] = [];
	let currentParent: TocItem | null = null;

	for (const item of flatList) {
		const node: TocItem = { ...item, children: [] };
		if (item.level === minLevel) {
			tree.push(node);
			currentParent = node;
		} else if (currentParent && item.level > minLevel) {
			currentParent.children.push(node);
		} else {
			tree.push(node);
			currentParent = node;
		}
	}
	return tree;
}

// 核心渲染主流程
function renderMarkdownDocument(raw: string) {
	if (!raw.trim()) {
		parsedMeta = {
			title: "",
			description: "",
			published: "",
			updated: "",
			tags: [],
			category: "",
			author: "",
		};
		contentMarkdown = "";
		renderedHtml = "";
		wordCount = 0;
		readingTimeMinutes = 1;
		displayPublishedDate = "";
		displayUpdatedDate = "";
		outlineTree = [];
		return;
	}

	const { meta, body } = parseFrontmatter(raw);
	parsedMeta = meta;
	contentMarkdown = body;

	// 统计字数与阅读时长
	const stats = calculateReadingStats(body);
	wordCount = stats.total;
	readingTimeMinutes = stats.minutes;

	// 格式化日期为东八区中文显示
	displayPublishedDate = formatPostDate(meta.published);
	displayUpdatedDate = formatPostDate(meta.updated);

	// 保护 KaTeX 数学公式，防止被 Markdown 误解析
	const mathBlocks: string[] = [];
	const mathInlines: string[] = [];

	let preprocessed = body.replace(/\$\$\r?\n([\s\S]+?)\r?\n\$\$/g, (_, eq) => {
		try {
			const html = katex.renderToString(eq, { displayMode: true, throwOnError: false });
			const placeholder = `@@MATH_BLOCK_${mathBlocks.length}@@`;
			mathBlocks.push(html);
			return placeholder;
		} catch (e) {
			return `$$\n${eq}\n$$`;
		}
	});

	preprocessed = preprocessed.replace(/\$([^\$\n\r]+?)\$/g, (_, eq) => {
		try {
			const html = katex.renderToString(eq, { displayMode: false, throwOnError: false });
			const placeholder = `@@MATH_INLINE_${mathInlines.length}@@`;
			mathInlines.push(html);
			return placeholder;
		} catch (e) {
			return `$${eq}$`;
		}
	});

	// 处理 Admonitions
	preprocessed = processAdmonitions(preprocessed);

	// 处理剧透遮罩
	preprocessed = processSpoiler(preprocessed);

	// 运行 Markdown-it 渲染核心
	let finalHtml = md.render(preprocessed);

	// 还原 KaTeX 数学公式
	mathBlocks.forEach((html, i) => {
		finalHtml = finalHtml.replace(`@@MATH_BLOCK_${i}@@`, html);
		finalHtml = finalHtml.replace(`<p>@@MATH_BLOCK_${i}@@</p>`, html);
	});
	mathInlines.forEach((html, i) => {
		finalHtml = finalHtml.replace(`@@MATH_INLINE_${i}@@`, html);
	});

	// 提取标题并生成目录大纲
	const flatHeadings: { level: number; text: string; id: string }[] = [];
	let headingCounter = 0;
	finalHtml = finalHtml.replace(/<h([1-3])>([\s\S]*?)<\/h\1>/gi, (_, levelStr, innerText) => {
		const level = Number.parseInt(levelStr, 10);
		const plainText = innerText.replace(/<[^>]*>/g, "").trim();
		const id = `heading-${++headingCounter}-${encodeURIComponent(plainText.toLowerCase().slice(0, 20))}`;
		flatHeadings.push({ level, text: plainText, id });
		return `<h${level} id="${id}">${innerText}</h${level}>`;
	});

	outlineTree = buildOutlineTree(flatHeadings);
	renderedHtml = finalHtml;
}

// 响应式监听 markdownText 改变自动渲染
$: {
	renderMarkdownDocument(markdownText);
}

// 文件读取
function processFile(file: File) {
	fileName = file.name;
	const reader = new FileReader();
	reader.onload = (e) => {
		const text = e.target?.result;
		if (typeof text === "string") {
			markdownText = text;
			showToast(`已成功载入文章: ${file.name}`);
		}
	};
	reader.readAsText(file, "utf-8");
}

// 触发隐藏的文件选择器
function triggerFileInput() {
	if (fileInputRef) {
		fileInputRef.click();
	}
}

// 拖拽事件处理
function handleDragOver(e: DragEvent) {
	e.preventDefault();
	isDragging = true;
}

function handleDragLeave(e: DragEvent) {
	e.preventDefault();
	isDragging = false;
}

function handleDrop(e: DragEvent) {
	e.preventDefault();
	isDragging = false;
	const files = e.dataTransfer?.files;
	if (files && files.length > 0) {
		const file = files[0];
		processFile(file);
	}
}

function handleFileInput(e: Event) {
	const input = e.target as HTMLInputElement;
	if (input?.files && input.files.length > 0) {
		processFile(input.files[0]);
		input.value = "";
	}
}

// 加载官方示例（仅当用户主动点击时才触发）
function handleLoadSample() {
	fileName = "fuwari-syntax-demo.md";
	markdownText = sampleMarkdown;
	showToast("已载入官方全语法示例文档");
}

// 清空重置
function handleClear() {
	markdownText = "";
	fileName = "";
	showToast("已清空内容");
}

// 复制功能提示
function showToast(msg: string) {
	copyNotification = msg;
	if (notificationTimer) clearTimeout(notificationTimer);
	notificationTimer = setTimeout(() => {
		copyNotification = "";
	}, 2800);
}

// 复制 Markdown 源码
async function copyMarkdownSource() {
	if (!markdownText) return;
	try {
		await navigator.clipboard.writeText(markdownText);
		showToast("Markdown 源码已复制到剪贴板！");
	} catch (err) {
		showToast("复制失败，请手动选择复制");
	}
}

// 复制渲染后的 HTML
async function copyRenderedHtml() {
	if (!renderedHtml) return;
	try {
		await navigator.clipboard.writeText(renderedHtml);
		showToast("渲染后的 HTML 已复制到剪贴板！");
	} catch (err) {
		showToast("复制失败，请手动选择复制");
	}
}

// 滚动跳转到指定标题锚点
function scrollToHeading(id: string) {
	const el = document.getElementById(id);
	if (el) {
		el.scrollIntoView({ behavior: "smooth", block: "start" });
	}
}

// 本地相对路径图片容错处理
function handleCoverError(event: Event) {
	const img = event.currentTarget as HTMLImageElement;
	if (img) {
		img.style.display = "none";
	}
}
</script>

<div class="w-full space-y-6">
	<!-- 顶部全局控制工具条 -->
	<div class="card-base p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
		<!-- 左侧：文件信息与统计状态 -->
		<div class="flex flex-wrap items-center gap-2.5 text-sm">
			<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-white/10 text-white/80 font-mono text-xs">
				<svg class="w-4 h-4 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
					<polyline points="14 2 14 8 20 8"/>
				</svg>
				<span class="max-w-[160px] truncate font-medium">{fileName || "未命名文档"}</span>
			</div>

			{#if markdownText}
				<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-white/10 text-white/60 text-xs">
					<span>字数: <strong class="text-white/90 font-mono">{wordCount}</strong></span>
					<span class="mx-1 opacity-30">|</span>
					<span>预估阅读: <strong class="text-white/90 font-mono">{readingTimeMinutes}</strong> 分钟</span>
				</div>
			{/if}
		</div>

		<!-- 中间：视图模式切换选项卡 -->
		<div class="flex items-center bg-black/20 p-1 rounded-xl border border-white/10">
			<button
				type="button"
				class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all {viewMode === 'article' ? 'bg-[var(--primary)] text-black font-semibold shadow' : 'text-white/60 hover:text-white/90'}"
				on:click={() => (viewMode = "article")}
			>
				<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
					<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
				</svg>
				全真博文排版
			</button>

			<button
				type="button"
				class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all {viewMode === 'split' ? 'bg-[var(--primary)] text-black font-semibold shadow' : 'text-white/60 hover:text-white/90'}"
				on:click={() => (viewMode = "split")}
			>
				<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
					<line x1="12" y1="3" x2="12" y2="21"/>
				</svg>
				双栏实时编辑
			</button>
		</div>

		<!-- 右侧：快捷操作组 -->
		<div class="flex items-center gap-2">
			{#if markdownText}
				<button
					type="button"
					class="px-3 py-1.5 rounded-xl border border-white/10 hover:border-[var(--primary)] hover:text-[var(--primary)] text-xs text-white/70 transition-all flex items-center gap-1"
					title="复制 Markdown 源码"
					on:click={copyMarkdownSource}
				>
					<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
					</svg>
					复制源码
				</button>
			{/if}

			<button
				type="button"
				class="px-3 py-1.5 rounded-xl border border-white/10 hover:border-[var(--primary)] hover:text-[var(--primary)] text-xs text-white/70 transition-all flex items-center gap-1"
				title="载入官方语法示例"
				on:click={handleLoadSample}
			>
				<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
				</svg>
				示例
			</button>

			{#if markdownText}
				<button
					type="button"
					class="px-3 py-1.5 rounded-xl border border-white/10 hover:border-red-400/50 hover:text-red-400 text-xs text-white/50 transition-all"
					title="清空当前文章"
					on:click={handleClear}
				>
					清空
				</button>
			{/if}
		</div>
	</div>

	<!-- 操作反馈通知 Toast -->
	{#if copyNotification}
		<div class="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-neutral-900 border border-[var(--primary)] px-4 py-2.5 text-xs text-white shadow-2xl animate-fade-in">
			<svg class="w-4 h-4 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
				<polyline points="22 4 12 14.01 9 11.01"></polyline>
			</svg>
			<span>{copyNotification}</span>
		</div>
	{/if}

	<!-- 默认空状态：保持干净整洁的大型拖拽上传触发区 -->
	{#if !markdownText}
		<div
			class="flex min-h-[380px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed {isDragging ? 'border-[var(--primary)] bg-[var(--primary)]/10 scale-[1.01]' : 'border-white/15 bg-black/20 hover:border-[var(--primary)]/80 hover:bg-[var(--primary)]/5'} p-8 text-center transition-all duration-200"
			on:dragover={handleDragOver}
			on:dragleave={handleDragLeave}
			on:drop={handleDrop}
			on:click={triggerFileInput}
			role="region"
			aria-label="Markdown文件拖拽区域"
		>
			<input
				bind:this={fileInputRef}
				type="file"
				accept=".md,.markdown,.txt"
				class="hidden"
				on:change={handleFileInput}
			/>
			<div class="flex flex-col items-center pointer-events-none">
				<div class="h-16 w-16 mb-4 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
					<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
						<polyline points="17 8 12 3 7 8"></polyline>
						<line x1="12" y1="3" x2="12" y2="15"></line>
					</svg>
				</div>
				<h3 class="text-xl font-bold text-white/90 mb-1.5">把 Markdown 文章拖拽到这里</h3>
				<p class="text-sm text-white/50 mb-7 max-w-md">
					支持 <code class="text-white/80 font-mono">.md</code>、<code class="text-white/80 font-mono">.markdown</code> 或 <code class="text-white/80 font-mono">.txt</code>，100% 在你的浏览器本地完成解析，免提交 Git 即可 1:1 查看博客同款排版。
				</p>
			</div>

			<!-- 按钮区：阻止冒泡，避免二次触发外层拖拽区的 click -->
			<div class="flex flex-wrap items-center gap-3 relative z-10" on:click|stopPropagation>
				<button
					type="button"
					class="btn-regular px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:scale-[1.02] active:scale-95 transition-all"
					on:click={triggerFileInput}
				>
					选择本地文件
				</button>
				<button
					type="button"
					class="px-5 py-2.5 rounded-xl border border-white/15 hover:border-[var(--primary)] text-sm text-white/70 hover:text-white transition-all bg-white/5 hover:scale-[1.02] active:scale-95"
					on:click={handleLoadSample}
				>
					体验官方全语法示例
				</button>
			</div>
		</div>
	{:else}
		<!-- 拖拽更新提示条（方便用户随时拖入新文件覆盖） -->
		<div
			class="rounded-xl border border-dashed border-white/10 bg-white/5 p-2.5 text-center text-xs text-white/50 transition-colors {isDragging ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : ''}"
			on:dragover={handleDragOver}
			on:dragleave={handleDragLeave}
			on:drop={handleDrop}
			role="region"
			aria-label="拖拽替换文章"
		>
			💡 提示：随时将新的 <span class="font-mono text-white/80">.md</span> 文件拖拽至此可即刻替换预览内容。
		</div>

		<!-- 模式一：全真博文排版视图（1:1 源码级对齐 [...slug].astro + TOC） -->
		{#if viewMode === "article"}
			<div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_17.5rem] gap-4 items-start w-full">
				<!-- 左侧：真实博文主体卡片 -->
				<div class="flex w-full rounded-[var(--radius-large)] overflow-hidden relative mb-4">
					<div id="post-container" class="card-base z-10 px-6 md:px-9 pt-6 pb-4 relative w-full">
						<!-- word count and reading time（对齐 [...slug].astro:96-109） -->
						<div class="flex flex-row text-white/30 gap-5 mb-3">
							<div class="flex flex-row items-center">
								<div class="h-6 w-6 rounded-md bg-white/10 text-white/50 flex items-center justify-center mr-2">
									<!-- material-symbols:notes-rounded 图标 -->
									<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
										<path d="M4 19q-.425 0-.712-.288T3 18t.288-.712T4 17h10q.425 0 .713.288T15 18t-.288.713T14 19zm0-4q-.425 0-.712-.288T3 14t.288-.712T4 13h16q.425 0 .713.288T21 14t-.288.713T20 15zm0-4q-.425 0-.712-.288T3 10t.288-.712T4 9h16q.425 0 .713.288T21 10t-.288.713T20 11zm0-4q-.425 0-.712-.288T3 6t.288-.712T4 5h16q.425 0 .713.288T21 6t-.288.713T20 7z"/>
									</svg>
								</div>
								<div class="text-sm">{wordCount} 字</div>
							</div>
							<div class="flex flex-row items-center">
								<div class="h-6 w-6 rounded-md bg-white/10 text-white/50 flex items-center justify-center mr-2">
									<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<circle cx="12" cy="12" r="10"></circle>
										<polyline points="12 6 12 12 16 14"></polyline>
									</svg>
								</div>
								<div class="text-sm">{readingTimeMinutes} 分钟</div>
							</div>
						</div>

						<!-- title（对齐 [...slug].astro:112-124） -->
						<div class="relative">
							<div
								id="post-title"
								class="w-full flex items-center font-bold mb-3
								text-3xl md:text-[2.25rem]/[2.75rem]
								text-white/90
								md:before:w-1 before:h-5 before:rounded-md before:bg-[var(--primary)]
								before:absolute before:top-[0.75rem] before:left-[-1.125rem]"
							>
								<span>{parsedMeta.title}</span>
							</div>
						</div>

						<!-- description/excerpt（对齐 [...slug].astro:127-133：纯文本排版，无灰色背景框） -->
						{#if parsedMeta.description}
							<div class="mb-4">
								<div id="post-description" class="text-white/75 text-sm leading-relaxed">
									{parsedMeta.description}
								</div>
							</div>
						{/if}

						<!-- AI involvement（对齐 AIInvolvementCard） -->
						{#if parsedMeta.ai_level && aiLevelMap[parsedMeta.ai_level]}
							<div class="mb-4 p-4 rounded-xl bg-[var(--license-block-bg)] border border-[var(--line-divider)]">
								<div class="flex items-start gap-3">
									<div class="h-9 w-9 rounded-lg bg-[var(--primary)] flex items-center justify-center shrink-0">
										<svg class="w-5 h-5 text-black/70" viewBox="0 0 24 24" fill="currentColor">
											<path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/>
										</svg>
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex flex-wrap items-center gap-2 mb-1">
											<span class="text-white/85 text-sm font-semibold">AI参与度</span>
											<span class="px-2 py-0.5 rounded-md text-xs font-bold bg-[var(--btn-regular-bg)] text-[var(--btn-content)]">
												Lv.{parsedMeta.ai_level}/3
											</span>
											<span class="text-xs text-white/60">{aiLevelMap[parsedMeta.ai_level].label}</span>
										</div>
										<p class="text-sm text-white/70 leading-relaxed">
											{aiLevelMap[parsedMeta.ai_level].desc}
										</p>
									</div>
								</div>
							</div>
						{/if}

						<!-- metadata（对齐 PostMeta.astro + date-utils.ts：.meta-icon 紫色方块 + 中文日期格式） -->
						<div>
							<div class="flex flex-wrap text-neutral-400 items-center gap-4 gap-x-4 gap-y-2 mb-5">
								{#if parsedMeta.published}
									<div class="flex items-center">
										<div class="meta-icon">
											<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<circle cx="12" cy="12" r="10"></circle>
												<polyline points="12 6 12 12 16 14"></polyline>
											</svg>
										</div>
										<span class="text-50 text-sm font-medium">{displayPublishedDate}</span>
									</div>
								{/if}

								{#if displayUpdatedDate && displayUpdatedDate !== displayPublishedDate}
									<div class="flex items-center">
										<div class="meta-icon">
											<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
												<line x1="16" y1="2" x2="16" y2="6"></line>
												<line x1="8" y1="2" x2="8" y2="6"></line>
												<line x1="3" y1="10" x2="21" y2="10"></line>
											</svg>
										</div>
										<span class="text-50 text-sm font-medium">{displayUpdatedDate}</span>
									</div>
								{/if}
							</div>

							<!-- 只有没有图片时，才显示虚线（对齐 [...slug].astro:151） -->
							{#if !parsedMeta.image}
								<div class="border-[var(--line-divider)] border-dashed border-b-[1px] mb-5"></div>
							{/if}
						</div>

						<!-- 封面图（对齐 ImageWrapper.astro） -->
						{#if parsedMeta.image}
							<div id="post-cover" class="mb-8 rounded-xl banner-container overflow-hidden relative image-wrapper">
								<img
									src={parsedMeta.image}
									alt={parsedMeta.title}
									class="w-full h-full object-cover image-content"
									on:error={handleCoverError}
								/>
							</div>
						{/if}

						<!-- Markdown 正文（严格对齐 Markdown.astro 容器类） -->
						<div class="prose prose-invert prose-base !max-w-none custom-md break-words markdown-content">
							{@html renderedHtml}
						</div>

						<!-- 底部版权声明卡片（对齐 License.astro） -->
						<div class="mt-8 mb-4 p-4 rounded-xl bg-[var(--license-block-bg)] border border-[var(--line-divider)] flex items-center justify-between text-xs text-white/50">
							<div>
								<p class="font-medium text-white/70 mb-0.5">版权声明：知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议</p>
								<p>作者：{parsedMeta.author || "MengK"} | 本预览由本地 Fuwari 渲染引擎即时生成</p>
							</div>
							<div class="px-2.5 py-1 rounded bg-white/10 text-white/70 font-mono text-[10px]">
								Preview Only
							</div>
						</div>
					</div>
				</div>

				<!-- 右侧：真实博文同款 TOC 目录组件（对齐 TOC.astro + TOCList.astro） -->
				{#if outlineTree.length > 0}
					<div class="hidden xl:block w-full">
						<div class="sticky top-20 w-full">
							<div class="group block relative z-0 bg-[var(--float-panel-bg-opaque)] rounded-xl p-2.5 shadow-sm border border-white/5">
								<ol class="space-y-1">
									{#each outlineTree as item, index}
										<li>
											<button
												type="button"
												class="px-2 flex gap-2 relative transition w-full min-h-9 rounded-xl hover:bg-[var(--toc-btn-hover)] active:bg-[var(--toc-btn-active)] py-2 text-left items-start"
												on:click={() => scrollToHeading(item.id)}
											>
												<div class="transition w-5 h-5 shrink-0 rounded-lg text-xs flex items-center justify-center font-bold bg-[var(--toc-badge-bg)] text-[var(--btn-content)]">
													{index + 1}
												</div>
												<div class="transition text-sm min-w-0 flex-1 break-words text-50 hover:text-white/90">
													{item.text}
												</div>
											</button>

											{#if item.children && item.children.length > 0}
												<ul class="pl-4 space-y-1 mt-0.5">
													{#each item.children as sub}
														<li>
															<button
																type="button"
																class="px-2 flex gap-2 relative transition w-full min-h-8 rounded-xl hover:bg-[var(--toc-btn-hover)] active:bg-[var(--toc-btn-active)] py-1.5 text-left items-center"
																on:click={() => scrollToHeading(sub.id)}
															>
																<div class="w-5 h-5 shrink-0 flex items-center justify-center">
																	<div class="transition w-2 h-2 rounded-[0.1875rem] bg-[var(--toc-badge-bg)]"></div>
																</div>
																<div class="transition text-xs min-w-0 flex-1 break-words text-50 hover:text-white/90">
																	{sub.text}
																</div>
															</button>
														</li>
													{/each}
												</ul>
											{/if}
										</li>
									{/each}
								</ol>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<!-- 模式二：双栏实时编辑视图 -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
				<!-- 左侧：Markdown 源码编辑器 -->
				<div class="card-base p-4 md:p-5 flex flex-col h-[750px] relative">
					<div class="flex items-center justify-between pb-3 border-b border-white/10 mb-3 text-xs text-white/60">
						<span class="font-semibold text-white/80 flex items-center gap-1.5">
							<svg class="w-4 h-4 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="16 18 22 12 16 6"></polyline>
								<polyline points="8 6 2 12 8 18"></polyline>
							</svg>
							Markdown 源码编辑
						</span>
						<span class="text-[11px] opacity-60">支持直接粘贴或快捷微调</span>
					</div>

					<textarea
						bind:value={markdownText}
						placeholder="在此输入或粘贴 Markdown 内容..."
						class="flex-1 w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm font-mono text-white/90 placeholder-white/20 resize-none outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all leading-relaxed overflow-y-auto"
					></textarea>
				</div>

				<!-- 右侧：实时渲染结果窗口 -->
				<div class="card-base p-5 md:p-7 flex flex-col h-[750px] relative overflow-hidden">
					<div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4 text-xs text-white/60 shrink-0">
						<span class="font-semibold text-white/80 flex items-center gap-1.5">
							<svg class="w-4 h-4 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
								<circle cx="12" cy="12" r="3"></circle>
							</svg>
							实时排版效果
						</span>
						<div class="flex items-center gap-2">
							<button
								type="button"
								class="text-xs text-[var(--primary)] hover:underline"
								on:click={copyRenderedHtml}
							>
								复制 HTML
							</button>
						</div>
					</div>

					<!-- 右栏滚动内容 -->
					<div class="flex-1 overflow-y-auto pr-1">
						<!-- 简要文章头 -->
						<div class="mb-4 pb-3 border-b border-white/5">
							<h2 class="text-xl font-bold text-white/95 mb-1">{parsedMeta.title}</h2>
							{#if parsedMeta.description}
								<p class="text-xs text-white/60">{parsedMeta.description}</p>
							{/if}
						</div>

						<div class="prose prose-invert prose-base !max-w-none custom-md break-words markdown-content">
							{@html renderedHtml}
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	/* 保证剧透文本在预览中能正常点击激活 */
	:global(.spoiler) {
		filter: blur(0.4rem);
		transition: filter 0.3s;
		cursor: pointer;
		user-select: none;
	}
	:global(.spoiler:hover) {
		opacity: 0.8;
	}
	:global(.spoiler.visible) {
		filter: none;
		user-select: auto;
		cursor: auto;
		opacity: 1;
	}

	/* 优化代码高亮块容器与边距 */
	:global(.custom-md pre[class*="language-"]) {
		background: rgba(0, 0, 0, 0.45) !important;
		border: 1px solid rgba(255, 255, 255, 0.08) !important;
		border-radius: 0.75rem !important;
		padding: 1rem 1.25rem !important;
	}

	/* 优化公式块居中展示 */
	:global(.katex-display) {
		overflow-x: auto;
		overflow-y: hidden;
		padding: 0.5rem 0;
	}
</style>
