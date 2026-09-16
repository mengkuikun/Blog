import fs from "node:fs";
import path from "node:path";

export function getSiteUrlFromConfig({
	configPath = path.join(process.cwd(), "astro.config.mjs"),
	fallback = null,
} = {}) {
	try {
		const configContent = fs.readFileSync(configPath, "utf8");
		const match = configContent.match(/\bsite:\s*["']([^"']+)["']/);
		if (match && match[1]) {
			return match[1].replace(/\/$/, "");
		}

		// 兜底：从 src/config.ts 读取 customDomain
		const configTsPath = path.join(path.dirname(configPath), "src/config.ts");
		if (fs.existsSync(configTsPath)) {
			const tsContent = fs.readFileSync(configTsPath, "utf8");
			const domainMatch = tsContent.match(/\bcustomDomain\s*[:=]\s*["']([^"']+)["']/);
			if (domainMatch && domainMatch[1]) {
				return `https://${domainMatch[1]}`.replace(/\/$/, "");
			}
		}
	} catch {
		// noop: caller decides fallback behavior
	}
	return fallback;
}
