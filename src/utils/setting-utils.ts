export function getDefaultHue(): number {
	const fallback = "345";
	const configCarrier = document.getElementById("config-carrier");
	return Number.parseInt(configCarrier?.dataset.hue || fallback, 10);
}

export function getHue(): number {
	const stored = localStorage.getItem("hue");
	return stored ? Number.parseInt(stored, 10) : getDefaultHue();
}

export function setHue(hue: number, save = true): void {
	if (save) {
		localStorage.setItem("hue", String(hue));
	}
	document.documentElement.style.setProperty("--hue", String(hue));
}

export function getRainbowMode(): boolean {
	const stored = localStorage.getItem("rainbow-mode");
	return stored === "true";
}

export function setRainbowMode(enabled: boolean): void {
	localStorage.setItem("rainbow-mode", String(enabled));
}

export function getRainbowSpeed(): number {
	const stored = localStorage.getItem("rainbow-speed");
	return stored ? Number.parseFloat(stored) : 5;
}

export function setRainbowSpeed(speed: number): void {
	localStorage.setItem("rainbow-speed", String(speed));
}

export function getBgBlur(): number {
	const stored = localStorage.getItem("bg-blur");
	return stored ? Number.parseInt(stored, 10) : 4;
}

export function setBgBlur(blur: number): void {
	localStorage.setItem("bg-blur", String(blur));
	const bgBox = document.getElementById("bg-box");
	if (bgBox) {
		const currentFilter = bgBox.style.filter || "";
		const hueRotateMatch = currentFilter.match(/hue-rotate\((.*?)deg\)/);
		const hueRotate = hueRotateMatch ? hueRotateMatch[1] : "0";
		bgBox.style.setProperty(
			"filter",
			`blur(${blur / 16}rem) hue-rotate(${hueRotate}deg)`,
		);
	}
}

export function getHideBg(): boolean {
	const stored = localStorage.getItem("hide-bg");
	return stored === "true";
}

export function setHideBg(hide: boolean): void {
	localStorage.setItem("hide-bg", String(hide));
	const bgBox = document.getElementById("bg-box");
	if (bgBox) {
		bgBox.style.setProperty("opacity", hide ? "0" : "");
	}
}
