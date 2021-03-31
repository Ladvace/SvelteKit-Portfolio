import * as layout from "..\\..\\..\\src\\routes\\$layout.svelte";

const components = [
	() => import("..\\..\\..\\src\\routes\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\projects.svelte"),
	() => import("..\\..\\..\\src\\routes\\about.svelte"),
	() => import("..\\..\\..\\src\\routes\\blog\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\blog\\[slug].svelte")
];

const d = decodeURIComponent;
const empty = () => ({});

export const routes = [
	// src/routes/index.svelte
[/^\/$/, [components[0]]],

// src/routes/projects.svelte
[/^\/projects\/?$/, [components[1]]],

// src/routes/about.svelte
[/^\/about\/?$/, [components[2]]],

// src/routes/blog/index.svelte
[/^\/blog\/?$/, [components[3]]],

// src/routes/blog/[slug].svelte
[/^\/blog\/([^/]+?)\/?$/, [components[4]], (m) => ({ slug: d(m[1])})]
];

export { layout };