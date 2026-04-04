# Goal
Replace flat emoji-based graphics with rich, AI-generated illustrations and add engaging CSS micro-animations to instantly elevate the visual quality of the app.

## Proposed Changes

### 1. Asset Generation
We will use the `generate_image` tool to create high-quality, storybook-style illustrations:
- **4 Story Covers**: Beautiful cover images for the Fairy, Myth, Animals, and Space cards.
- **6 Panel Scenes**: Sequential background art for the "Zara and the Rainbow Dragon" (Fairy) story (e.g., a magical forest, a crying dragon in a cave, painting the sky).

### 2. Update `index.html`
- **[MODIFY] index.html**
  - Adjust the `.story-card` CSS to use the generated images as lush background covers instead of flat colors.
  - Keep the CSS floating particles and mascot but ground the story selection in rich visuals.

### 3. Update `story-viewer.html`
- **[MODIFY] story-viewer.html**
  - Update the `STORIES.fairy.panels` data structure to include `img` URLs referencing our new scenes.
  - Modify the `.emoji-scene` UI to act as an image container that fills the panel card.
  - Introduce an interactive CSS overlay (e.g., glowing fireflies/magic dust) that overlays the scene while the voice plays, making the illustration feel "alive".

## Open Questions
- To keep the changes quick and impactful, I'll focus on replacing the artwork for the **Fairy** story first to show you the result. Does that sound good? 
- Would you prefer the art style to be "Children's Watercolor Storybook" or "Vibrant 3D Pixar Style"?

## Verification Plan
- Open `index.html` to verify the cards look rich and premium.
- Open `story-viewer.html?genre=fairy` to ensure the new background images load sequentially and the CSS animations (fireflies) appear correctly during the narration.
