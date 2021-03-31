import * as layout from "..\\..\\..\\src\\routes\\$layout.svelte";

const components = [
	() => import("..\\..\\..\\src\\routes\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\projects.svelte"),
	() => import("..\\..\\..\\src\\routes\\about.svelte")
];

const d = decodeURIComponent;
const empty = () => ({});

export const routes = [
	// src/routes/index.svelte
[/^\/$/, [components[0]]],

// src/routes/projects.svelte
[/^\/projects\/?$/, [components[1]]],

// src/routes/about.svelte
[/^\/about\/?$/, [components[2]]]
];

export { layout };