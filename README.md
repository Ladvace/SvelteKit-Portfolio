# ⚡️SvelteKit-Portfolio⚡️

## A personal portfolio website made using `@sveltejs/kit`.

<p align="left">
    <img width="500" height="auto" src="https://i.imgur.com/IafmSKu.png" alt="homepagescreenshot" />
</p>

To view a demo example, **[click here](https://gianmarco.netlify.app/)**

## Features

- Modern and Minimal UI Design
- Home, Projects, About and blog sections
- Blog made using `DEV.TO` API. (Medium WIP)
- Fully Responsive
- Performances and SEO optimizations
- Ready to be deployed on [Netlify](https://www.netlify.com/)

## Guide

- In order to add a new route (page) you need to add it in `src\lib\NavRoutes.js` and create a new file in the `routes` folder with the same name as the route `eg: about`.

In `src\lib\NavRoutes.js` you need to add in the `routes` an object with the following info for every route you want to add.

    {
    	href: '/globe', // route path
    	label: 'Globe', // name showed in the navbar
    	customColor: '#89a6fb' // OPTIONAL: a color that will be set when you switch route (for that specific route)
    }

# Dependencies

- svelte-icons
- @sveltejs/adapter-netlify

# Steps ▶️

```
# Clone this repository
$ git clone https://github.com/Ladvace/SvelteKit-Portfolio
```

```
# Go into the repository
$ cd SvelteKit-Portfolio
```

```
# Install dependencies
$ npm install
```

```
# Start the project in development
$ npm run dev
```

# Deploy on Netlify 🚀

Deploying your website on Netlify it's optional but I reccomand it in order to deploy it faster and easly.

You just need to fork this repo and linking it to your Netlify account.

## Authors ❤️

- Gianmarco - https://github.com/Ladvace
