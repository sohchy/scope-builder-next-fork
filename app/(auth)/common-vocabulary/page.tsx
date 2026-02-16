const vocabularyData = {
  title: "I-Corps Common Vocabulary",
  terms: [
    {
      id: 1,
      term: "Customer Discovery",
      definition:
        "The process of conversing with people (strangers) to test hypotheses from the <strong>Business Model Canvas (BMC)</strong> and learn about the envisioned market.",
    },
    {
      id: 2,
      term: "Business Model Canvas (BMC)",
      definition:
        "The Business Model Canvas includes 9 elements used to organize our business hypothesis. Nebraska I-Corps focuses primarily on the Customer Segments and Value Proposition which result in the Product-Market fit. Ideally you should have clear and quantified answers to each of the 9 boxes before entering the execution phase.",
    },
    {
      id: 3,
      term: "Get out of the building",
      definition:
        "A lean start-up rallying cry to engage with strangers outside the comfort zone. Customer Discovery is the core of I-Corps methodology, learned through doing and iterating.",
    },
    {
      id: 4,
      term: "Hypothesis-Design-Test-Insight Loop",
      definition:
        "I-Corps methodology requires participants to take guesses and then use the scientific method to conduct repeatable, testable, and evidence-based experiments that will validate or invalidate their hypotheses.",
    },
    {
      id: 5,
      term: "Market Segment",
      definition:
        "A large industrial segment based on the industry and type of product being offered. These segments reflect how the existing industry subdivides its efforts. NAICS codes* are a classic way to subdivide a market..<br><br>Examples: Transportation -&gt; Ground Transportation -&gt; Trucks -&gt; Light Duty Trucks -&gt; Light Duty Passenger (non-commercial) Trucks Healthcare -&gt;<br><br>Healthcare Suppliers -&gt; Medical Devices -&gt; Implantable Medical Devices -&gt; Cardiovascular Implanted Medical Devices<br><br>*https://www.naics.com/search/",
    },
    {
      id: 6,
      term: "Value Proposition",
      definition:
        "Answers the question &quot;What pain are you solving, what gain are you creating, and for who?&quot; Value Propositions should be stated as a benefit to a specific stakeholder, NOT FEATURES. Watch out for the words that end in -er (faster, stronger, safer...).",
    },
    {
      id: 7,
      term: "Stakeholder",
      definition:
        "Anyone who might have an interest (direct or indirect, positive or negative) in your product/service/innovation and the benefits it provides. A way to describe the Customer Segment box on the BMC considering roles beyond End User customers.",
    },
    {
      id: 8,
      term: "Beachhead Market",
      definition:
        "The Beachhead Market is the first and best market to generate traction for a given innovation. It should be a stepping stone for additional success in your overall Target Market. The ideal beachhead is rarely the biggest or most lucrative market, instead beachheads should be those markets with highest margins, biggest need, fastest time to market, offer immediate access, etc.",
    },
    {
      id: 9,
      term: "Customer Job",
      definition:
        "The task(s) conducted by your primary stakeholder(s) as they utilize your product or service. In I-Corps context, jobs are not titles or positions, but rather tasks/activities a customer conducts to complete a desired outcome.",
    },
    {
      id: 10,
      term: "Customer Role",
      definition:
        "Defining customer roles encourages teams to look beyond their end user when interviewing. Roles are designed to help innovators expand understanding of their ecosystem map. Innovators should be able to identify at least one end user, buyer, payer, recommender, influencer, saboteur, etc. for their eco-system.<br/> Things to note: 1) every ecosystem has people playing these roles, who are they in your eco-system? and 2) adoption/buying decisions are made by collections of people with different motivations and degrees of influence.",
    },
    {
      id: 11,
      term: "Different Stakeholder Roles",
      definition:
        "<ul><li><b>End User - </b>The person who will actually use the product or service. </li><li><b>Buyer/Decision Maker - </b>The person with the clout to decide which solution gets adopted</li><li><b>Payer - </b>The person who has the budget for the solution</li><li><b>Influencer  - </b>The person who weighs in on the solution selection, adoption, and/or purchase</li><li><b>Recommender - </b>A person tasked with making solution recommendations</li><li><b>Saboteur - </b>A person who loses out if the solution is adopted</li></ul>",
    },  
    {
      id: 12,
      term: "Pain Reliever",
      definition:
        "Pains represent issues a customer is aware of and actively seeking solutions for. An innovator should be able to link from one side of the VP canvas to the other. 1) Articulate their customer&#39;s Job to Be Done, 2) Quantify the Pain they experience while doing that job(s). 3) Quantify how much of that pain is relieved by their innovative Pain Reliever. 4) What feature/tech provides the Pain Reliever. Customers are most motivated to solve their pain points. Any gains provided by the innovation are further incentive.",
    },{
      id: 13,
      term: "Gain Creator",
      definition:
        "A gain creator addresses an issue or opportunity that isn&#39;t &quot;top of mind&quot; for the customer, yet can add significant value.",
    },{
      id: 14,
      term: "Product-Market Fit",
      definition:
        "A specific, quantified, and compelling Who (Customer Segment) and Why (Value Proposition).",
    },{
      id: 15,
      term: "Pivot",
      definition:
        "Any change to the elements of the business model based on data coming from the customer/stakeholder interviews.",
    },{
      id: 16,
      term: "Ecosystem Map",
      definition:
        "A visual depiction of the various stakeholders involved in the use, adoption, implementation, or purchase of a new product or service and how they relate to each other. The flow between stakeholders could be information, money, materials or other relationships. The purpose of the map is to expand our knowledge of the stakeholders, who is influencing them, and understand their motivations, as well as to identify gaps in our knowledge.",
    },
    
  ],
};

export default function CommonVocabularyPage() {
  return (
    <div className="min-h-screen bg-[#eff0f4] p-8">
      <div className="flex justify-between items-start mb-8">
        <h1 className="text-4xl font-bold text-gray-900 text-center flex-1">
          {vocabularyData.title}
        </h1>
      </div>
      <div className="max-w-full mx-auto bg-white rounded-lg shadow-lg">
        <div className="space-y-6">
          {vocabularyData.terms.map((term) => (
            <div
              key={term.id}
              className={`${
                term.id % 2 === 1 ? "bg-[#F4F0FF]" : "bg-white"
              } p-12 mb-0`}
            >
              <div className="flex items-start gap-8">
                <div className="flex w-100 items-center gap-4 flex-shrink-0">
                  <img
                    src="/Group 19965.png"
                    alt="Term icon"
                    className="w-16 h-16 object-contain mt-1"
                  />
                  <div>
                    <div className="text-[#6A35FF] text-md font-bold mb-1">
                      Term #{term.id}
                    </div>
                    <h3 className="text-xl text-gray-900">{term.term}</h3>
                  </div>
                </div>

                <div className="flex-1">
                  <p
                    className="text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: term.definition }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
