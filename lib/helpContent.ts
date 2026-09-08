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
  "node.trigger": `
    <p><strong>Jobs to be Done</strong></p>
    <p>This describes the original need of the stakeholder. You may describe who your stakeholder is in the text area, or you may wait till Session #1 and select it from a list of possibilities.</p>
    <p>A good litmus test for a well written Job to be Done is: if you remove technology, problem, need, solution, benefit, etc. from the sentence, and the sentence would still make sense to the stakeholder 50 or 100 years ago and across geographies, then you have a good Job to be Done statement.</p>
    <p><strong>Poorly written:</strong> Small business owners need an easier to use, less expensive and mobile friendly version of TurboTax. It includes needs, solutions and technologies.</p>
    <p><strong>Better:</strong> Small business owners need to do their taxes.</p>
  `,
  "node.action": `
    <p>Lorem ipsum dolor sit amet, <strong>consectetur adipiscing</strong> elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    <ul>
      <li>Ut enim ad minim veniam.</li>
      <li>Quis nostrud exercitation ullamco.</li>
    </ul>
    <p><a href="https://example.com" target="_blank" rel="noreferrer">Read more</a></p>
  `,
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
