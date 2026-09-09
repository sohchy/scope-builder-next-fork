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
    <br/>
    <p><strong>Poorly written Example:</strong> Football coaches need an easier way to track and a mobile friendly way of teaching tackling. (Reason: It includes needs, solutions and technologies.)</p>
    <p><strong>Better Example:</strong> Football coaches want their players to tackle safely.</p>
    <br/>
    <p><strong>Important #1: </strong>A Job to Done should be written from a <u>stakeholder's perspective</u>. It <u>shouldn't be written as a generic event</u> where multiple stakeholders are involved. Remember, the intended Stakeholder is wanting/needing to get a job done.</p>
    <p><strong>Important #2: </strong>Sometimes a certain event may happen which then may cause the stakeholder to want/need to get a job done. This original event is NOT the Job to be Done. It's just <u>context</u>.</p>
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
    <br/>
    <p><strong>Important #1: </strong>Similar to the Job to be Done, an Action / Activity is something that stakeholder actively does as part of a series of steps to get the job done. It's <u>not an event</u>. If there's a related event that happens around this step, it maybe written as [Context].</p>
    <p><strong>Example:</strong></p>
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
  "market.stakeholders": `
    <p>Whenever you're thinking of wanting to address a pain or a gain, always connect it to a Stakeholder.</p>
    <p>When thinking about a Stakeholder, be specific and identify individual roles and consider if the different roles have different pains / gains or the same.</p> 
    <p><strong>Example: </strong> (where different people in charge of coaching football may use the app)</p>  
    <p><u>Stakeholder Type: End User</u></p>
    <p><u>Roles:</u></p>
    <ul>
      <li>College Head Coach</li>
      <li>College Assistant Coach</li>
      <li>College Athletic Director</li>
      <li>HighSchool Coach</li>
    </ul>
    <br/>
    <p>If you discover through customer discovery that these different Roles don't have unique pains/gains as you initially assumed, you may aggregate your Roles list to be this instead.</p>
    <p><u>Roles:</u></p>
    <ul>
      <li>College/HighSchool Coaches/Athletic Execs</li>
    </ul> 
    <br/>
    <p><strong>Important #1: </strong>A single Role may wear multiple hats and therefore maybe listed under multiple Stakeholder Types.</p> 
    <p><strong>Example: </strong>You may find at a College level, Assistant Coaches are the</p>
    <ul>
      <li>ones who make financial decisions about buying tools (Buyer/Decision Maker)
      <li>primary users of the product (End User)
      <li>person who is tasked with analyzing the different tools out there and picking one (Influencer)
      <li>person other Stakeholders call when wanting to know which tool to get (Recommender).
    </ul>
    `,
  "market.segments": `
    <p>This helps you categorize different groups and sub-groups of people who have similar Jobs to be Done, Pains / Gains, etc. If two market segments have a lot of overlap, then the same solution/product can work for both. Otherwise they may each need unique features that the other segment doesn't.</p>
    <br/>
    <p>Understanding what Job to be Done, Pain / Gain, etc. separates two segments is important. Just because the two segments have different attributes like geographic location, age, gender, income, etc. doesn't make them distinct segments.</p>
    <br/>
    <p><strong>Example :</strong></p>
    <p>College Coaches and High School Coaches are distinct market segments because of the following differences:</p>
    <ul>
      <li>College Coaches have higher budgets and are expected to utilize more tools & resources to increase their chances of success</li>
      <li>College Coaches are limited in their interaction and training of their student athletes during summer break</li>
      <li>College Coaches have a greater number of staff assisting them and therefore decision making is fragmented and slower</li>
    </ul>
    <br/>
    <p>On the other hand, let's say the needs of the end-user athletes are pretty much the same irrespective of their level, then High School and College athletes both could be grouped into a single market segment called <u>Student Athletes</u>.</p>
  `
} as const;

export type HelpKey = keyof typeof HELP_CONTENT;
