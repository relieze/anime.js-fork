# Anime.js

<p align="center">
  <picture align="center">
    <source media="(prefers-color-scheme: dark)" srcset="./assets/images/animejs-v4-logo-animation-dark.gif">
    <img align="center" alt="Anime.js V4 logo animation" src="./assets/images/animejs-v4-logo-animation.gif" width="560">
  </picture>
</p>

<p align="center">
  <strong>
  <em>Anime.js</em> is a fast, multipurpose and lightweight JavaScript animation library with a simple, yet powerful API.<br>
  It works with CSS properties, SVG, DOM attributes and JavaScript Objects.
  </strong>
</p>

<p align="center">
  <img alt="NPM Downloads" src="https://img.shields.io/npm/dm/animejs?style=flat-square&logo=npm">
  <img alt="jsDelivr hits (npm)" src="https://img.shields.io/jsdelivr/npm/hm/animejs?style=flat-square&logo=jsdeliver">
  <img alt="GitHub Sponsors" src="https://img.shields.io/github/sponsors/juliangarnier?style=flat-square&logo=github">
</p>

## Sponsors

Anime.js is 100% free and is only made possible with the help of our sponsors.
Help the project become sustainable by sponsoring us on <a target="_blank" href="https://github.com/sponsors/juliangarnier">GitHub Sponsors</a>.

### Platinum sponsors

<p>
<a target="_blank" href="https://huly.io/?ref=animejs">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/sponsors/huly-logomark.png">
    <img align="center" src="./assets/sponsors/huly-logomark-dark.png" width="250">
  </picture>
</a>
<a target="_blank" href="https://ice.io/?ref=animejs">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/sponsors/ice-open-network-logomark.png">
    <img align="center" src="./assets/sponsors/ice-open-network-logomark-dark.png" width="250">
  </picture>
</a>
</p>

## Usage

Anime.js V4 works by importing ES modules like so:

<table>
<tr>
  <td>

```javascript
import {
  animate,
  stagger,
} from 'animejs';

animate('.square', {
  x: 320,
  rotate: { from: -180 },
  duration: 1250,
  delay: stagger(65, { from: 'center' }),
  ease: 'inOutQuint',
  loop: true,
  alternate: true
});
```

  </td>
  <td>
    <img align="center" alt="Anime.js code example" src="./assets/images/usage-example-result.gif">
  </td>
</tr>
</table>

## Featured Example: Actualize AI Design Landing Page

This repository includes a comprehensive real-world example demonstrating anime.js v4 capabilities in a production-ready application. The **Actualize Landing Page** showcases:

### 🎨 **What It Demonstrates**
- **Professional UI Animations**: Elegant entrance effects, typewriter animations, and smooth transitions
- **Dynamic Design Mockups**: 7 different design types (logo, mobile, website, poster, business card, book, social media)
- **Modern Design Patterns**: Dark theme with gradient backgrounds, glass morphism effects, and subtle motion
- **Performance Optimization**: Streamlined from 800+ lines to 300 lines of animation code
- **Mobile Responsiveness**: Fully optimized for all screen sizes and touch devices
- **Error Handling**: Production-ready error management with visual debugging tools

### 🚀 **Quick Start**
```bash
npm run open-examples
# Navigate to "actualize-landing" in your browser
```

### 📖 **Deep Dive**
The actualize-landing example includes comprehensive documentation:
- **[Complete Feature Overview](examples/actualize-landing/README.md)** - Full project documentation and technical details

This example serves as both a demonstration of anime.js capabilities and a template for building sophisticated animated web applications.

## V4 Documentation

The full documentation is available [here](https://animejs.com/documentation).

## V3 Migration guide

You can find the v3 to v4 migration guide [here](https://github.com/juliangarnier/anime/wiki/Migrating-from-v3-to-v4).

## NPM development scripts

First, run `npm i` to install all the necessary packages.
Then, execute the following scripts with `npm run <script>`.

| script | action |
| ------ | ------ |
| `dev` | Watch any changes in `src/` and compiles the esm version to `lib/anime.esm.js` |
| `dev-types` | Same as `dev`, but also run TypeScript and generate the `types/index.d.ts` file |
| `build` | Generate types definition and compiles ESM / UMD / IIFE versions to `lib/` |
| `test-browser` | Start a local server and start all browser related tests |
| `test-node` | Start all Node related tests |
| `open-examples` | Start a local server to browse the examples locally |

© [Julian Garnier](http://juliangarnier.com) | [MIT License](LICENSE.md)