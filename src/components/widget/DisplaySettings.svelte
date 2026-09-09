<script lang="ts">
import {
	getBgBlur,
	getDefaultHue,
	getHideBg,
	getHue,
	getRainbowMode,
	getRainbowSpeed,
	setBgBlur,
	setHideBg,
	setHue,
	setRainbowMode,
	setRainbowSpeed,
} from "@utils/setting-utils";
import { onMount } from "svelte";

const isBrowser = typeof document !== "undefined";
const defaultHue = isBrowser ? getDefaultHue() : 345;

let hue = isBrowser ? getHue() : defaultHue;
let isRainbowMode = isBrowser ? getRainbowMode() : false;
let rainbowSpeed = isBrowser ? getRainbowSpeed() : 5;
let bgBlur = isBrowser ? getBgBlur() : 4;
let hideBg = isBrowser ? getHideBg() : false;

function resetHue() {
	hue = getDefaultHue();
	if (!isRainbowMode) {
		setHue(hue);
	}
}

function onHueChange() {
	if (isRainbowMode || (!hue && hue !== 0)) {
		return;
	}
	setHue(hue);
}

function onBgBlurChange() {
	setBgBlur(bgBlur);
}

function toggleRainbow() {
	isRainbowMode = !isRainbowMode;
	setRainbowMode(isRainbowMode);

	if (isRainbowMode) {
		document.documentElement.classList.add("is-rainbow-mode");
		document.documentElement.style.setProperty(
			"--rainbow-duration",
			`${120 / rainbowSpeed}s`,
		);
	} else {
		document.documentElement.classList.remove("is-rainbow-mode");
		document.documentElement.style.removeProperty("--rainbow-duration");
		setHue(hue);
	}
}

function toggleHideBg() {
	hideBg = !hideBg;
	setHideBg(hideBg);
}

function onSpeedChange() {
	setRainbowSpeed(rainbowSpeed);
	if (isRainbowMode) {
		document.documentElement.style.setProperty(
			"--rainbow-duration",
			`${120 / rainbowSpeed}s`,
		);
	}
}

$: if (!isRainbowMode && (hue || hue === 0)) {
	setHue(hue);
}

onMount(() => {
	if (isRainbowMode) {
		document.documentElement.classList.add("is-rainbow-mode");
		document.documentElement.style.setProperty(
			"--rainbow-duration",
			`${120 / rainbowSpeed}s`,
		);
	}
	if (hideBg) {
		setHideBg(true);
	}
	if (bgBlur !== 4) {
		setBgBlur(bgBlur);
	}
});
</script>

<div id="display-setting" class="float-panel float-panel-closed absolute transition-all w-80 right-4 px-4 py-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl z-50">

    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-base text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.25rem]"
        >
            主题色彩
            <button aria-label="Reset to Default" class="btn-regular w-6 h-6 rounded-md active:scale-90 flex items-center justify-center transition"
                    class:opacity-0={hue === defaultHue} class:pointer-events-none={hue === defaultHue} on:click={resetHue}>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-[var(--btn-content)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                </svg>
            </button>
        </div>
        <div class="flex gap-1">
            <input aria-label="Hue Value" id="hueValue" type="number" min="0" max="360" bind:value={hue} disabled={isRainbowMode}
                   on:input={onHueChange}
                   class="transition bg-[var(--btn-regular-bg)] w-12 h-7 rounded-md text-center font-bold text-sm text-[var(--btn-content)] outline-none"
            />
        </div>
    </div>
    <div class="w-full h-6 px-1 bg-[oklch(0.70_0.10_0)] rounded-lg select-none mb-4 overflow-hidden">
        <input aria-label="主题色彩" type="range" min="0" max="360" bind:value={hue} disabled={isRainbowMode}
               on:input={onHueChange}
               class="slider cursor-pointer" id="colorSlider" step="1" style="width: 100%">
    </div>

    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
        <div class="flex gap-2 font-bold text-base text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.25rem]"
        >
            禁用背景
        </div>
        <input aria-label="Hide Background" type="checkbox" class="toggle-switch" checked={hideBg} on:change={toggleHideBg} />
    </div>

    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
        <div class="flex gap-2 font-bold text-base text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.25rem]"
        >
            彩虹模式
        </div>
        <input aria-label="Rainbow Mode" type="checkbox" class="toggle-switch" checked={isRainbowMode} on:change={toggleRainbow} />
    </div>

    {#if isRainbowMode}
    <div class="flex flex-row gap-2 mb-2 items-center justify-between transition-all" >
        <div class="flex gap-2 font-bold text-sm text-neutral-100 transition relative ml-3
            before:w-1 before:h-3 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.25rem]"
        >
            变换速率
        </div>
        <div class="flex gap-1">
             <div class="transition bg-[var(--btn-regular-bg)] w-10 h-6 rounded-md flex justify-center
            font-bold text-xs items-center text-[var(--btn-content)]">
                {rainbowSpeed}
            </div>
        </div>
    </div>
    <div class="w-full h-5 bg-[var(--btn-regular-bg)] rounded-lg select-none overflow-hidden mb-3">
        <input aria-label="变换速率" type="range" min="1" max="100" bind:value={rainbowSpeed} on:change={onSpeedChange}
               class="slider cursor-pointer" step="1" style="width: 100%; --value-percent: {(rainbowSpeed - 1) / 99 * 100}%">
    </div>
    {/if}

    <div class="flex flex-row gap-2 mb-2 mt-3 items-center justify-between">
        <div class="flex gap-2 font-bold text-base text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.25rem]"
        >
            背景模糊
        </div>
        <div class="flex gap-1">
            <div class="transition bg-[var(--btn-regular-bg)] w-10 h-6 rounded-md flex justify-center
            font-bold text-xs items-center text-[var(--btn-content)]">
                {bgBlur}
            </div>
        </div>
    </div>
    <div class="w-full h-5 bg-[var(--btn-regular-bg)] rounded-lg select-none overflow-hidden">
        <input aria-label="背景模糊" type="range" min="0" max="20" bind:value={bgBlur}
               on:input={onBgBlurChange}
               class="slider cursor-pointer" step="1" style="width: 100%; --value-percent: {bgBlur / 20 * 100}%">
    </div>
</div>
