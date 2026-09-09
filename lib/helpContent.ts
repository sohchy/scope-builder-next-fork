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
    <p><strong>Jobs to be Done Explanation</strong></p>
    <p>This describes the original need of the stakeholder. You may describe who your stakeholder is in the text area, or you may wait till Session #1 and select it from a list of possibilities.</p>
    <p>A good litmus test for a well written original need / Job to be Done is: if you remove technology, problem, need, solution, benefit, emotions, etc. from the sentence, and the sentence would still make sense to the stakeholder 50 or 100 years ago and across geographies, then you have a good Job to be Done statement.</p>
    <p><strong>Poorly written:</strong> Football coaches need an easier way to track and a mobile friendly way of teaching tackling. It includes needs, solutions and technologies.</p>
    <p><strong>Better:</strong> Football coaches want their players to tackle safely.</p>
    <p><strong>Important #1: </strong>A Job to Done should be written from a <strong>stakeholder's perspective</strong. It <strong>shouldn't be written as a generic event</strong> where multiple stakeholders are involved. Remember, the intended Stakeholder is wanting/needing to get a job done.</p>
    <p><strong>Important #2: </strong>Sometimes a certain event may happen which then may cause the stakeholder to want/need to get a job done. This original event is NOT the Job to be Done. It's just <strong>context/</strong>.</p>
  `,
  "node.action": `
    <p><strong>Action / Activity Explanation</strong></p>
    <p>This describes what the stakeholder does today to get the Job to be Done. We are still not describing any problems or needs or gains yet. We are simply putting down what it is they do today. You may include the solutions / technologies they use, or keep it agnostic.</p>
    <p><strong>Examples:</strong></p>
    <ul>
      <li>Coach demonstrates how to tackle safely.</li>
      <li>Coach creates a one page visual to remember easily.</li>
      <li>Coach assigns practice tackle reps.</li>
    </ul>
    <p><strong>Important #1: </strong>Similar to the Job to be Done, an Action / Activity is something that stakeholder actively does as part of a series of steps to get the job done. It's <strong>not an event</strong>. If there's a related event that happens around this step, it maybe written as [Context].</p>
    <p><strong>For Example:</strong></p>
    <p><strong>[Context]: </strong> Athletes are not able to meet with their Coaches during summer break. So Coaches must share any recommendations before semester ends.</p>
    <p><strong>Action: </strong> Coach creates a one page visual for practice drills.</p>
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
