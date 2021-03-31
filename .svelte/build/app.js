import { ssr } from '@sveltejs/kit/ssr';
import root from './generated/root.svelte';
import { set_paths } from './runtime/paths.js';
import * as setup from "./setup.js";

const template = ({ head, body }) => "<!DOCTYPE html>\r\n<html lang=\"en\">\r\n\t<head>\r\n\t\t<meta charset=\"utf-8\" />\r\n\t\t<link rel=\"icon\" href=\"/favicon.ico\" />\r\n\t\t<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" />\r\n\t\t<link\r\n\t\t\thref=\"https://fonts.googleapis.com/css2?family=B612:ital,wght@0,400;0,700;1,400;1,700&display=swap\"\r\n\t\t\trel=\"stylesheet\"\r\n\t\t/>\r\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\r\n\t\t" + head + "\r\n\t</head>\r\n\t<body>\r\n\t\t<div id=\"svelte\">" + body + "</div>\r\n\t</body>\r\n</html>\r\n";

set_paths({"base":"","assets":"/."});

// allow paths to be overridden in svelte-kit start
export function init({ paths }) {
	set_paths(paths);
}

const d = decodeURIComponent;
const empty = () => ({});

const components = [
	() => import("..\\..\\src\\routes\\index.svelte"),
	() => import("..\\..\\src\\routes\\projects.svelte"),
	() => import("..\\..\\src\\routes\\about.svelte")
];



const client_component_lookup = {".svelte/build/runtime/internal/start.js":"start-58b01723.js","src/routes/index.svelte":"pages\\index.svelte-efb5a03a.js","src/routes/projects.svelte":"pages\\projects.svelte-1ff6320e.js","src/routes/about.svelte":"pages\\about.svelte-abea13c9.js"};

const manifest = {
	assets: [{"file":"favicon.ico","size":1150,"type":"image/vnd.microsoft.icon"},{"file":"robots.txt","size":70,"type":"text/plain"}],
	layout: () => import("..\\..\\src\\routes\\$layout.svelte"),
	error: () => import("./components\\error.svelte"),
	routes: [
		{
						type: 'page',
						pattern: /^\/$/,
						params: empty,
						parts: [{ id: "src/routes/index.svelte", load: components[0] }],
						css: ["assets/start-834c2e7d.css", "assets/pages\\index.svelte-dd340878.css"],
						js: ["start-58b01723.js", "chunks/index-fa90cfb2.js", "pages\\index.svelte-efb5a03a.js"]
					},
		{
						type: 'page',
						pattern: /^\/projects\/?$/,
						params: empty,
						parts: [{ id: "src/routes/projects.svelte", load: components[1] }],
						css: ["assets/start-834c2e7d.css", "assets/pages\\projects.svelte-569ed795.css"],
						js: ["start-58b01723.js", "chunks/index-fa90cfb2.js", "pages\\projects.svelte-1ff6320e.js"]
					},
		{
						type: 'page',
						pattern: /^\/about\/?$/,
						params: empty,
						parts: [{ id: "src/routes/about.svelte", load: components[2] }],
						css: ["assets/start-834c2e7d.css", "assets/pages\\projects.svelte-569ed795.css"],
						js: ["start-58b01723.js", "chunks/index-fa90cfb2.js", "pages\\about.svelte-abea13c9.js"]
					}
	]
};

export function render(request, {
	paths = {"base":"","assets":"/."},
	local = false,
	only_render_prerenderable_pages = false,
	get_static_file
} = {}) {
	return ssr(request, {
		paths,
		local,
		template,
		manifest,
		target: "#svelte",
		entry: "/./_app/start-58b01723.js",
		root,
		setup,
		dev: false,
		amp: false,
		only_render_prerenderable_pages,
		app_dir: "_app",
		host: null,
		host_header: null,
		get_component_path: id => "/./_app/" + client_component_lookup[id],
		get_stack: error => error.stack,
		get_static_file,
		get_amp_css: dep => amp_css_lookup[dep]
	});
}