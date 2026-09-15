# Selam — an Eritrean Orthodox 3D journey

## Improved prompt — ready to reuse

Create a beautiful, immersive 3D website demo inspired by Eritrean Orthodox Tewahedo church architecture and sacred art. The visitor should begin outside in a peaceful courtyard, approach the church, pass through its carved wooden doorway, and explore a richly detailed interior. Make the experience feel calm, reverent, and welcoming.

Use Enda Mariam in Asmara as the main visual reference for the exterior: twin square towers, alternating bands of masonry, projecting rooflines, crosses, and religious artwork above the entrance. Treat the building as a clearly labeled creative interpretation. Do not present an invented interior or floor plan as an accurate reconstruction of the cathedral.

Build the architecture as a real navigable 3D scene. Include a paved forecourt, planting, entrance steps, detailed doors, layered masonry, columns, timber arches, patterned textiles, framed icons, hanging brass lamps, and candles. Use believable scale, carefully composed views, warm shadows, and physically based materials. Prioritize the church and its details in the first screen.

Design a continuous outside-to-inside camera journey with five stops:

1. **Courtyard:** reveal the complete facade, towers, and approach in warm afternoon light.
2. **Doorway:** approach the carved entrance and glimpse the interior as the doors open.
3. **Interior:** move along the aisle and reveal the columns, wooden ceiling, artwork, and lamps.
4. **Sacred art:** move closer to the icons and offer an accessible artwork viewer with clear descriptions.
5. **Stillness:** pause before the sanctuary curtain for a quiet final view.

Offer a guided tour with pause, direct navigation between stops, drag-to-look controls, zoom, and keyboard navigation. Camera movement must stay inside traversable areas, with a reduced-motion option that changes viewpoints immediately. The sanctuary curtain stays closed and the tour does not reveal or invent sacred contents behind it.

Make the interior artwork a visual highlight: rich gold, crimson, indigo, and green; expressive figures; intricate borders; and fine material detail. Distinguish original illustrations from historical objects. Use reviewed, licensed Eritrean iconography for a future authoritative version. Avoid fabricated inscriptions or unverified translations.

Add a golden-hour / candlelight toggle, optional ambient sound enabled only by the visitor, a small floor-plan locator, and a way to hide the interface. Keep the interface restrained: elegant serif headings, readable sans-serif controls, deep green surfaces, warm ivory text, and muted gold accents.

Support desktop and touchscreens. Adapt rendering quality to device limits, show an informative loading state, and provide research and artwork access if WebGL is unavailable. Respect reduced-motion settings. Ensure dialogs, controls, and navigation work with a keyboard.

Deliver the working website, a short research summary with source links, credits for every artwork asset, and a prioritized list of future improvements. Clearly state what is referenced, what is invented, and what would need church-community review.

## What the research changes

### Architecture specific to Eritrea

Enda Mariam is a useful starting point because its recognizable facade offers a concrete alternative to an undefined church shape. Exterior photographs show twin towers, strong horizontal masonry bands, crosses, and painted religious panels. These forms guide the demo; the demo's three entrance bays and internal arrangement are design choices, not measured features of the cathedral.

Sources: [Enda Mariam visual-reference collection](https://commons.wikimedia.org/wiki/Category:Enda_Mariam_Cathedral,_Asmara); [UNESCO: Asmara, a Modernist African City](https://whc.unesco.org/en/list/1550/).

### Art and objects have a religious context

The Eritrean Orthodox Diocese explains the liturgical significance of church equipment and incense, and describes icons within church worship. Accordingly, the experience treats sacred art as something to learn about and contemplate. The ambient audio is synthesized bells and breeze, explicitly identified as sound design. It is not an authentic liturgy or chant recording.

Sources: [Church utensils and equipment](https://english.eritreantewahdo.org/?sermons=church-utensils-and-equipment-newaye-qdisat); [Icons and devotion in the liturgy](https://english.eritreantewahdo.org/?sermons=beg-and-plea).

### Accuracy has a practical boundary

Public exterior references do not establish the church's exact measurements, interior, decoration, or access arrangements. This prototype therefore identifies itself as an interpretation. A faithful digital reconstruction would need photographs or scans, architectural measurements, permission for the chosen material, and review by members of the church community. Keeping the sanctuary curtain closed is a respectful design decision for this demo.

## Feature brainstorm and priorities

| Priority | Feature | Why it helps | Status or dependency |
| --- | --- | --- | --- |
| First demo | Five connected camera stops | Gives visitors a clear outside-to-inside story | Implemented |
| First demo | Look around and zoom | Makes the architecture explorable | Implemented |
| First demo | Guided tour with pause | Lets visitors enjoy the journey without learning controls | Implemented |
| First demo | Icon close-ups and short descriptions | Gives the interior artwork the attention it deserves | Implemented; original AI-generated concept art |
| First demo | Golden hour and candlelight | Reveals different material and lighting qualities | Implemented as an artistic lighting switch |
| First demo | Optional ambient bells and breeze | Adds atmosphere without forced audio | Implemented as synthesized sound, not liturgical audio |
| First demo | Floor-plan locator, keyboard controls, reduced motion | Makes navigation clearer and more comfortable | Implemented |
| Next | Reviewed English and Tigrinya narration | Makes the experience more useful to the community and diaspora | Requires fluent reviewers and recorded narration |
| Next | Real icon collection | Grounds the art in the specific parish and artists | Requires approved photographs, credits, and reuse rights |
| Next | Architecture hotspots | Explains the facade, craftsmanship, materials, and history | Research and community review for each claim |
| Next | Exterior and interior scan or measured model | Turns the concept into a faithful record of one church | Photography/scanning access and modeling work |
| Later | Celebration mode | Shows textiles and decoration for a chosen feast | Research, artist references, and contextual explanations |
| Later | Optional real chant audio | Connects sound to the tradition | An authorized recording, credits, translation, and playback controls |
| Later | VR walkthrough | Enables a stronger sense of scale | Headset testing, comfort controls, and performance work |
| Later | Community oral histories | Shares stories from parishioners, artists, and craftspeople | Consent and editorial work |

**Recommended next investment:** replace the concept model and generated artwork with approved references from one specific church before expanding into more features.

## Asset and implementation notes

- Architecture: original procedural 3D geometry, inspired by exterior visual references; not a photogrammetric scan.
- Artwork: one newly generated triptych containing Mary and the Christ Child, Christ, and Archangel Michael. Original AI-generated conceptual illustrations, not photographs or parish-approved icons.
- Materials: procedural stone, paving, timber, and textile textures.
- Audio: generated locally in the browser with Web Audio. No external recording is represented as authentic chant.
- 3D engine: [Three.js](https://threejs.org/), version 0.180.0, MIT license. Library and license are included with the site.
- Fonts: DM Sans and Playfair Display, served by Google Fonts with local browser fallbacks.
- No accounts, donations, analytics, visitor tracking, or submitted personal data.

## Acceptance checklist

- The first screen shows the actual church experience.
- All five stops are reachable, with visible active-stop feedback.
- Travel from the courtyard to the interior uses the entrance.
- The sanctuary stays beyond the visitor route.
- All three artwork illustrations can be opened and inspected.
- Lighting and sound controls work and communicate their state.
- The tour pauses, resumes, and ends without trapping the visitor.
- Small screens retain readable, reachable controls.
- Keyboard controls and reduced-motion mode work.
- Missing WebGL shows a useful fallback rather than an endless loader.
