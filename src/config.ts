import type {
	GitHubEditConfig,
	ImageFallbackConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
	UmamiConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

const customDomain = "blog.mengku.shop";

export const siteConfig: SiteConfig = {
	customDomain,
	title: "夢酷 の Blog",
	subtitle: "MengKu",
	description:
		"分享网络技术、服务器部署、内网穿透、静态网站搭建、CDN优化、容器化部署等技术教程与实践经验的个人技术博客，专注于云原生、无服务器架构和前后端开发，作者为夢酷",

	keywords: [
		"夢酷",
		"MengKu",
		"博客",
		"Blog",
		"技术博客",
	],
	lang: "zh_CN", // 'en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'es', 'th'
	themeColor: {
		hue: 345, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: false,
		src: "/xinghui.avif", // Relative to the /src directory. Relative to the /public directory if it starts with '/'

		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: true, // Display the credit text of the banner image
			text: "Pixiv @chokei", // Credit text to be displayed

			url: "https://www.pixiv.net/artworks/122782209", // (Optional) URL link to the original artwork or artist's page
		},
	},
	background: {
		enable: false, // Enable background image
		src: "", // Background image URL (supports HTTPS)
		position: "center", // Background position: 'top', 'center', 'bottom'
		size: "cover", // Background size: 'cover', 'contain', 'auto'
		repeat: "no-repeat", // Background repeat: 'no-repeat', 'repeat', 'repeat-x', 'repeat-y'
		attachment: "fixed", // Background attachment: 'fixed', 'scroll', 'local'
		opacity: 1, // Background opacity (0-1)
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
		{
			src: "/avatar.jpg", // Path of the favicon, relative to the /public directory
			//   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
		},
	],
	officialSites: [
		{ url: "https://mengku.shop", alias: "Main" },
		{ url: `https://${customDomain}`, alias: "Blog" },
	],
	server: [
		{ url: "", text: "Blog" },
		{ url: "https://cloud.umami.is", text: "Umami" },
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		{
			name: "友链",
			url: "/friends/",
			external: false,
			icon: "material-symbols:group-outline-rounded",
		},
		{
			name: "工具",
			url: "/tools/",
			external: false,
			icon: "material-symbols:build-outline-rounded",
		},
		{
			name: "统计",
			url: "https://cloud.umami.is/share/mmqrQ14OYNe9p9gm",
			external: true,
			icon: "material-symbols:table-chart",
		},
		{
			name: "状态",
			url: "https://uf.mengku.shop",
			external: true,
			icon: "material-symbols:monitoring",
		},
		{
			name: "论坛",
			url: "/forum/",
			external: false,
			icon: "material-symbols:forum-outline-rounded",
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "/avatar.jpg", // Relative to the /public directory if it starts with '/'
	name: "夢酷",
	bio: "Protect What You Love.",
	links: [
		{
			name: "QQ",
			icon: "simple-icons:qq",
			url: "",
		},
		{
			name: "Telegram",
			icon: "simple-icons:telegram",
			url: "",
		},
		{
			name: "Bilibli",
			icon: "simple-icons:bilibili",
			url: "https://space.bilibili.com/14489273",
		},
		{
			name: "GitHub",
			icon: "simple-icons:github",
			url: "https://github.com/mengkuikun",
		},
		{
			name: "Folo",
			icon: "simple-icons:folo",
			url: "",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const imageFallbackConfig: ImageFallbackConfig = {
	enable: false,
	originalDomain: "https://eopfapi.acofork.com/pic?img=ua",
	fallbackDomain: "https://eopfapi.acofork.com/pic?img=ua",
};

export const umamiConfig: UmamiConfig = {
	enable: true,
	baseUrl: "https://cloud.umami.is",
	shareId: "mmqrQ14OYNe9p9gm",
	timezone: "Asia/Shanghai",
};

export const gitHubEditConfig: GitHubEditConfig = {
	enable: true,
	baseUrl: "https://github.com/mengkuikun/fuwari/blob/main/src/content/posts",
};

// todoConfig removed from here
