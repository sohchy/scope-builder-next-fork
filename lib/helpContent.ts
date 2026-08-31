/**
 * Help copy, keyed so whatever displays it names its content instead of
 * carrying it. Anything gets a help popover by adding a key here and passing it
 * to `<HelpPopover>` — the copy never lives in the component.
 *
 * Each value is an HTML fragment: paragraphs, lists and links are all styled by
 * the popover that renders it. Author these as trusted copy only — they are
 * injected as markup, never sanitised.
 *
 * Keys are explicit rather than derived from the heading they sit next to,
 * because the same heading appears in more than one place ("Market Questions"
 * sits in both the problem and the solution tab) and each needs its own copy.
 */
export const HELP_CONTENT = {
  "problem.painGain": `
    <p>Lorem ipsum dolor sit amet, <strong>consectetur adipiscing</strong> elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    <ul>
      <li>Ut enim ad minim veniam.</li>
      <li>Quis nostrud exercitation ullamco.</li>
    </ul>
    <p><a href="https://example.com" target="_blank" rel="noreferrer">Read more</a></p>
  `,
  "solution.description": `
    <p>Lorem ipsum dolor sit amet, <strong>consectetur adipiscing</strong> elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    <ul>
      <li>Ut enim ad minim veniam.</li>
      <li>Quis nostrud exercitation ullamco.</li>
    </ul>
    <p><a href="https://example.com" target="_blank" rel="noreferrer">Read more</a></p>
  `,
} as const;

export type HelpKey = keyof typeof HELP_CONTENT;
