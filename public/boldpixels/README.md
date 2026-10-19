# Bold Pixels Font Setup

## Font Conversion Instructions

The TTF and OTF files need to be converted to web-optimized WOFF2 and WOFF formats for better performance.

### Option 1: Online Conversion (Easiest)

1. Go to https://transfonter.org/
2. Upload `BoldPixels.ttf`
3. Check these options:
   - ✅ WOFF2
   - ✅ WOFF
   - ✅ Add local() to @font-face
4. Download and extract the converted files
5. Copy the .woff2 and .woff files to `/public/boldpixels/`

### Option 2: Command Line (Advanced)

```powershell
# Install fonttools (requires Python)
pip install fonttools brotli

# Convert TTF to WOFF2
cd public/boldpixels
pyftsubset BoldPixels.ttf --output-file=BoldPixels.woff2 --flavor=woff2

# Convert TTF to WOFF
pyftsubset BoldPixels.ttf --output-file=BoldPixels.woff --flavor=woff
```

### Option 3: Use Existing TTF/OTF (Works but slower)

The current setup will fall back to TTF/OTF if WOFF2/WOFF aren't available.

## Usage in Your Code

### Import the font

Add to your main SCSS file or layout:

```scss
@import "./fonts";
```

### Use with classes

```jsx
<h1 className="font-bold-pixels-2xl">Pixel Perfect Title</h1>
<p className="font-bold-pixels">Retro gaming vibes</p>
```

### Use with mixin

```scss
.my-heading {
  @include bold-pixels(2rem);
  color: #ff6b6b;
}
```

### Use inline

```tsx
<div style={{ fontFamily: "'Bold Pixels', monospace" }}>Pixel Text</div>
```

## Best Practices

- **Use for headers and short text only** (pixel fonts are hard to read in paragraphs)
- **Avoid small sizes** (12px and below become unreadable)
- **Recommended sizes**: 16px, 20px, 24px, 32px, 48px
- **Good for**: Logos, game UI, retro designs, badges, labels
- **Bad for**: Body text, long paragraphs, accessibility-critical content

## Performance Notes

- WOFF2 is ~30% smaller than TTF/OTF
- `font-display: swap` prevents invisible text during loading
- Consider preloading the font for critical text:

```html
<link
  rel="preload"
  href="/boldpixels/BoldPixels.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```
