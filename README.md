# Persona Portfolio

A Persona 5, Persona 5 Royal and Persona 3 Reload-styled (switchable) portfolio in plain HTML, CSS and JavaScript. No framework and no build step: open `index.html`, or host the folder on GitHub Pages as-is.

## Editing content

Everything you'd normally change lives in `js/model.js`:

- **projects**: the project cards. Copy a block to add one. `cat` picks the filter (`web`, `game`, `mod`, `tool`; `small` makes a "Smaller builds" group), `links` are the buttons, `highlights` fill the Details window, `color` tints the card (add `ink: "#fff"` if the colour is dark), and `img` (optional) swaps the drawn cover for a screenshot such as `assets/projects/my-app.jpg`. `shots` lists screenshots for the gallery.
- **skills**: three groups of six skills each (one hexagon per group). `v` is your own 0-100 rating, `short` is the chart label, `uses` lists project ids so each skill links to where you used it.
- **about**: chapters of paragraphs; `**bold**` becomes a highlight.
- Public repos that aren't featured appear automatically under "More on GitHub".

## Controls

`↑ ↓` + `Enter` on the menu · `1-4` jump to a section · `Q / E` (or `← →`) switch sections · `/` or `Ctrl + K` quick jump · `Esc` back · `P` play or pause the music · `[` `]` previous or next song · `M` sound effects · `T` switch look (Persona 5 → Persona 5 Royal → Persona 3 Reload, remembered) · `B` pause the background · `?` help

## Credits

Animation uses [GSAP](https://gsap.com) and ScrollTrigger, bundled in `js/vendor/` under GreenSock's standard no-charge license.
