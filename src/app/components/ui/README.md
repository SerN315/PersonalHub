# The component kit

Every button and form field in the app comes from here. It follows [shadcn/ui](https://ui.shadcn.com) (a `variant` and a `size` per component, a variants table kept in one place with `class-variance-authority`, colours read from tokens, native attributes passed straight through), written for this app's own tokens: `bg-accent`, `text-ink`, `rounded-ctl` and so on are Tailwind names for the CSS variables in `globals.css`, so they follow the person's mode, accent and rounding.

```tsx
import { Button, IconButton, Input, Field, Select, Textarea, Checkbox } from "@/app/components/ui";

<Button>Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<IconButton aria-label="Close"><Icon /></IconButton>   {/* the name is required: an icon alone says nothing */}
<Field label="Email" hint="We never share it" error={problem} />
```

## Changing things

| To change | Edit |
| --- | --- |
| how every button looks | the `variants` table in `Button.tsx` |
| how every field looks | the `variants` table in `Input.tsx` |
| a colour, the rounding | the tokens in `globals.css` (and the `@theme inline` block that gives them Tailwind names) |
| add a new look | add a variant to the table, then use `variant="..."` |
| a ready-made specialisation | `extend(Button, { variant: "ghost", size: "icon" }, "IconButton")` (see `extend.tsx`) |

`extend` is how this kit does inheritance: a specialised component is the base with some settings fixed, so changing the base changes every component built on it.

## Skins

Some buttons are parts of an object (a radio's keys, the desk's brass buttons) and keep their look from their own stylesheet. They are still the kit's `Button`, with `variant="bare"` (no styling of its own) or a named skin (`mini`, `chip`, `desk`). To restyle one, move its look into a variant.

## Rules

- A raw `<button>`, `<input>`, `<select>` or `<textarea>` is a lint error outside this folder (`eslint.config.mjs`). The Planner (`components/todo`) is the one exception, because it is finished.
- `Button` is `type="button"` unless you say `type="submit"`, so it never submits a form by accident.
- Tailwind classes passed in `className` win over the variant's (`cn` settles clashes). Classes from the app's stylesheets are untouched.
