# 😊 Mr. Panda's Psychologically Safe Portfolio 🐼

**[Live site](https://www.mr-pandas-psychologically-safe-portfolio.com/)** | **[Article](https://tympanus.net/codrops/2025/12/30/the-increasing-importance-of-psychological-safety-and-self-awareness-for-creative-work/?_thumbnail_id=107253)** | **[Tutorial](https://www.youtube.com/watch?v=zyWD2E8AHCg&feature=youtu.be)**

This repo contains code of Mr. Panda's Portfolio for a Codrops article!! It's a concept portfolio website created with [Blender](https://www.blender.org/), [Three.js](https://threejs.org/), and [Krita](https://krita.org/en/). Let's fight back against toxicity in the creative industry.

![Page screenshot](public/media/og-image.webp?raw=true "Page What")

# Credits!!! 💖

- [Intro Screen Font](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- [Notebook Paper Material](https://superhivemarket.com/products/crafty-asset-pack)
- [On a stick idea](https://x.com/mesqme)
- [Dragon Reference Image](https://studycli.org/chinese-culture/chinese-dragons/)
- [Tracing Kpop Demon Hunters Image](https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1000w,f_auto,q_auto:best/rockcms/2025-07/250709-Kpop-Demon-Hunters-vl-256p-ea5850.jpg)
- [Egyption Artifact Reference Image One](https://www.teacherspayteachers.com/Product/Egyptian-Artifacts-Clipart-Set-1-4283355)
- [Egyption Artifact Reference Image Two](https://media.istockphoto.com/id/1188022995/vector/egyptian-artifacts-vector-illustration-a-set-of-sacred-symbols-and-decorations-of-ancient.jpg?s=612x612&w=0&k=20&c=K0eAV0wofNJhBxAXtAZOQHHHUiiUMGUcucgx5tvIzyc=)

# Extra info

- Won [FWA of the day!](https://thefwa.com/cases/mr-pandas-psychologically-safe-portfolio).
- Won [SOTD on Awwwards!](https://www.awwwards.com/sites/mr-pandas-paper-portfolio).

# Areas of improvement / things to do

- Repetitive code could be cleaned up lol
- Generate hitboxes for hovered items that way it won't leave the area and flicker back constantly.
- Add some cool burning paper shader effects.
- Add a night mode.
- Use texture atlases/spritesheets for animations.
- More easter eggs.
- Try making one that go forwards and diagonal or rotates camera upside down.
- Try making different scenes and cute paper animations like a campfire.
- Better loading screen.
- Text box so the panda says some stuff.
- Adjust curve for mobile devices.

## Clone setup

This deployment retains the original MIT-licensed source and supplied models, textures, fonts, and credits. Mouse dragging is repaired, and Draco decoding is served locally.

```sh
npm ci
npm run dev
npm run build
```

Scroll or drag vertically to navigate the original looping 3D portfolio. Production files are built into `dist/`.

The scrolling protagonist now uses the supplied `thu_mo_vit_xanh_2d.glb`, retaining its colors and geometry. Its presentation wrapper aligns the head height to the original puppet; the original scroll path and idle motion remain in use.

The first scenery area is reimagined as Shanghai Disneyland with local SVG paper-cut illustrations of Enchanted Storybook Castle, TRON, Zootopia, Mickey garden topiaries and balloons. The illustrations are authored interpretations, not official park artwork. Landmark reference: https://www.shanghaidisneyresort.com/en/experience

The former Egyptian/work-experience section is now Hanoi: Turtle Tower, The Huc Bridge, and floating pho, green rice cake, banh mi and egg-coffee cutouts. Each food illustration floats and tilts with its own phase. The original camel and pyramid are removed from this section. References: https://vietnam.travel/things-to-do/explore-old-quarter-your-way/ and https://vietnam.travel/things-to-do/unlocking-hanoi%E2%80%99s-heritage-journey-beyond-sightseeing/

The sailing section now features a multi-deck cruise vessel moving with the protagonist, layered Lan Ha Bay limestone-karst cutouts, and jade paper water. Original tropical island, pirate decoration, dolphin and sailing boat have been removed from this section. Reference: https://beta-v2.vietnam.travel/things-to-do/lan-ha-bay-gliding-through-emerald-waters

The former haunted/featured-work section is now Bac Ninh: a Quan Ho duet in traditional clothing, a village waterside pavilion, and floating banh da, My Chu noodles and lychee cutouts. The ghost, haunted house, grave, zombie hand and old work/contact panels are removed from this section. Cultural reference: https://vietnamtourism.gov.vn/en/post/21327

The final female paper-puppet character uses the supplied transparent blue-dress portrait (`public/media/blue-dress-portrait.png`) in place of the sword character. The original image is preserved, with a correctly proportioned plane, sRGB color, transparent alpha, and the existing scroll reveal and idle sway.

Castle fireworks launch automatically while the protagonist is near the Shanghai castle (scroll progress 0.105–0.215). Three tower launchers produce colored bursts and trails; existing sparks fade after leaving, and returning starts another show. The fixed 320-slot pool uses one instanced draw, with a slower reduced-motion mode. Focused trigger/lifecycle tests: `node --test src/Experience/utils/castleFireworksSystem.test.js`.

The female portrait now waits horizontally to the right (3 oclock), hinged at the feet. It rotates in the page plane to stand when the protagonist approaches at progress 0.81; a small retreat margin prevents threshold flicker. Retreating or reaching the loop end folds it back. The vertical support stays fixed below the foot pivot.
