/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * Creates a URL Card component.
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} properties.href - The URL to display.
 * @param {import('mdast').RootContent[]} children - The children elements of the component.
 * @returns {import('mdast').Parent} The created URL Card component.
 */
export function UrlCardComponent(properties, children) {
	if (Array.isArray(children) && children.length !== 0)
		return h("div", { class: "hidden" }, [
			'Invalid directive. ("url" directive must be leaf type "::url{href="https://example.com"}")',
		]);

	if (!properties.href)
		return h(
			"div",
			{ class: "hidden" },
			'Invalid URL. ("href" attribute must be provided)',
		);

	const url = properties.href;
	const cardUuid = `UC${Math.random().toString(36).slice(-6)}`; // Collisions are not important

	const nImage = h(`div#${cardUuid}-image`, { class: "uc-image" });

	const nTitle = h("div", { class: "uc-titlebar" }, [
		h("div", { class: "uc-titlebar-left" }, [
			h(`div#${cardUuid}-favicon`, { class: "uc-favicon" }),
			h("div", { class: "uc-domain" }, new URL(url).hostname),
		]),
	]);

	const nDescription = h(
		`div#${cardUuid}-description`,
		{ class: "uc-description" },
		"Waiting for metadata...",
	);

	const nTitleText = h(
		`div#${cardUuid}-title`,
		{ class: "uc-title-text" },
		"Loading...",
	);

	const nScript = h(
		`script#${cardUuid}-script`,
		{ type: "text/javascript", defer: true },
		`
      (function() {
        try {
          var u = new URL("${url}");
          var domain = u.hostname;
          var titleEl = document.getElementById('${cardUuid}-title');
          var descEl = document.getElementById('${cardUuid}-description');
          var faviconEl = document.getElementById('${cardUuid}-favicon');
          var imageEl = document.getElementById('${cardUuid}-image');
          var containerEl = document.getElementById('${cardUuid}-container');
          var cardEl = document.getElementById('${cardUuid}-card');

          if (titleEl) titleEl.innerText = domain;
          if (descEl) descEl.innerText = "${url}";
          if (faviconEl) {
            faviconEl.style.backgroundImage = 'url(https://www.google.com/s2/favicons?domain=' + encodeURIComponent(domain) + '&sz=64)';
            faviconEl.style.backgroundColor = 'transparent';
          }
          if (imageEl) imageEl.style.display = 'none';
          if (containerEl) containerEl.classList.add('no-image');
          if (cardEl) cardEl.classList.remove('fetch-waiting');
        } catch (e) {
          var card = document.getElementById('${cardUuid}-card');
          if (card) card.classList.remove('fetch-waiting');
        }
      })();
    `,
	);

	return h(
		`a#${cardUuid}-card`,
		{
			class: "card-url fetch-waiting no-styling",
			href: url,
			target: "_blank",
			url,
		},
		[
			h(`div#${cardUuid}-container`, { class: "uc-container" }, [
				h("div", { class: "uc-content" }, [nTitle, nTitleText, nDescription]),
				nImage,
			]),
			nScript,
		],
	);
}
