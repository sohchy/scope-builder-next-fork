'use client';

import React from 'react';
import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react';

import { useRealtimeShapes } from '@/components/CanvasModule/hooks/realtime/useRealtimeShapes';
import type { Shape as IShape } from '@/components/CanvasModule/types';

import { ProblemStatementCard } from '@/components/CanvasModule/blocks/custom/ProblemStatement';
import { JobsToBeDone } from '@/components/CanvasModule/blocks/custom/JobsToBeDone';
import { Pains } from '@/components/CanvasModule/blocks/custom/Pains';
import { Gains } from '@/components/CanvasModule/blocks/custom/Gains';
import { ProductsService } from '@/components/CanvasModule/blocks/custom/ProductsService';
import { PainRelievers } from '@/components/CanvasModule/blocks/custom/PainRelievers';
import { GainCreators } from '@/components/CanvasModule/blocks/custom/GainCreators';
import { Summary } from '@/components/CanvasModule/blocks/custom/Summary';
import { IndustryMarketSegment } from '@/components/CanvasModule/blocks/custom/IndustryMarketSegmentCard';
import { Customer } from '@/components/CanvasModule/blocks/custom/CustomerCard';
import { EndUser } from '@/components/CanvasModule/blocks/custom/EndUserCard';
import { ExampleBrainstormCard } from '@/components/CanvasModule/blocks/custom/ExampleBrainstormCard';
import { ExampleCustomerCard } from '@/components/CanvasModule/blocks/custom/ExampleCustomerCard';
import { ExampleIndustryMarketSegment } from '@/components/CanvasModule/blocks/custom/ExampleIndustryMarketSegmentCard';
import { BothCustomerEndUser } from '@/components/CanvasModule/blocks/custom/BothCustomerEndUser';
import { Payer } from '@/components/CanvasModule/blocks/custom/Payer';
import { Influencer } from '@/components/CanvasModule/blocks/custom/Influencer';
import { Recommender } from '@/components/CanvasModule/blocks/custom/Recommender';
import { Saboteur } from '@/components/CanvasModule/blocks/custom/Saboteur';
import { AdditionalDecisionMaker } from '@/components/CanvasModule/blocks/custom/AdditionalDecisionMaker';
import { AdditionalStakeholder } from '@/components/CanvasModule/blocks/custom/AdditionalStakeholder';
import { ValuePropCard } from '@/components/CanvasModule/blocks/custom/ValuePropCard';

export function CardNode({ data, selected }: NodeProps) {
  const shape = data as unknown as IShape;
  const { updateShape } = useRealtimeShapes();

  const onCommitStyle = (id: string, patch: Partial<IShape>) =>
    updateShape(id, (s) => ({ ...s, ...patch }));

  const bodyProps = {
    shape,
    isSelected: selected ?? false,
    selectedCount: selected ? 1 : 0,
    onMouseDown: () => {},
    onResizeStart: () => {},
    onConnectorMouseDown: () => {},
    showConnectors: false,
    resizable: false,
    selectable: true,
    interactive: true,
    onCommitStyle,
  };

  const { subtype } = shape;

  const getTitle = () => {
    switch (subtype) {
      case 'industry_market_segment_card': return 'Industry/Market Segment';
      case 'value_prop_card': return 'Value Proposition';
      case 'customer_card': return 'Customer';
      case 'end_user_card': return 'End-User';
      case 'solution_card': return 'Solution';
      case 'interview_card': return 'Interview';
      case 'assumption_card': return 'Assumption';
      case 'problem_statement_card': return 'Problem Statement';
      case 'jobs_to_be_done_card': return 'Jobs To Be Done';
      case 'pains_card': return 'Pains';
      case 'gains_card': return 'Gains';
      case 'products_services_card': return 'Products & Services';
      case 'pain_relievers_card': return 'Pain Relievers';
      case 'gain_creators_card': return 'Gain Creators';
      case 'summary_card': return 'Summary';
      case 'select_subtype': return 'Select Card Type';
      case 'example_customer_card': return 'Example Customer Card';
      case 'example_industry_market_segment_card': return 'Example Industry/Market Segment Card';
      case 'example_brainstorm_card': return 'Example Brainstorm Card';
      case 'both_customer_end_user_card': return 'Both Customer & End-User';
      case 'payer_card': return 'Payer';
      case 'influencer_card': return 'Influencer';
      case 'recommender_card': return 'Recommender';
      case 'saboteur_card': return 'Saboteur';
      case 'additional_decision_maker_card': return 'Additional Decision Maker';
      case 'additional_stakeholder_card': return 'Additional Stakeholder';
      default: return 'Unknown';
    }
  };

  const getColor = () => {
    switch (subtype) {
      case 'example_industry_market_segment_card':
      case 'industry_market_segment_card': return '#C2F7FD';
      case 'example_customer_card':
      case 'customer_card': return '#C0E7FF';
      case 'end_user_card': return '#CECFFF';
      case 'jobs_to_be_done_card': return '#FDE1B5';
      case 'pains_card': return '#FFBCBC';
      case 'gains_card': return '#FFCBAF';
      case 'products_services_card': return '#DDF5B5';
      case 'pain_relievers_card': return '#CCF6EA';
      case 'gain_creators_card': return '#D5F9D7';
      case 'example_brainstorm_card': return '#DDE1F2';
      case 'summary_card': return '#6A35FF';
      case 'both_customer_end_user_card': return '#FDE1B5';
      case 'payer_card': return '#FFD3BB';
      case 'influencer_card': return '#FFCCCC';
      case 'recommender_card': return '#DDF5B5';
      case 'saboteur_card': return '#D5F9D7';
      case 'additional_decision_maker_card': return '#CCF6EA';
      case 'additional_stakeholder_card': return '#E6CFFF';
      case 'problem_statement_card': return '#6A35FFBF';
      case 'value_prop_card': return '#007547BF';
      default: return '#FFFFFF';
    }
  };

  const headerTextColor =
    subtype === 'summary_card' ||
    subtype === 'problem_statement_card' ||
    subtype === 'value_prop_card'
      ? 'white'
      : 'black';

  const getBody = () => {
    const p = bodyProps as any;
    switch (subtype) {
      case 'industry_market_segment_card': return <IndustryMarketSegment {...p} />;
      case 'customer_card': return <Customer {...p} />;
      case 'end_user_card': return <EndUser {...p} />;
      case 'jobs_to_be_done_card': return <JobsToBeDone {...p} />;
      case 'pains_card': return <Pains {...p} />;
      case 'gains_card': return <Gains {...p} />;
      case 'products_services_card': return <ProductsService {...p} />;
      case 'pain_relievers_card': return <PainRelievers {...p} />;
      case 'gain_creators_card': return <GainCreators {...p} />;
      case 'summary_card': return <Summary {...p} />;
      case 'example_customer_card': return <ExampleCustomerCard {...p} />;
      case 'example_industry_market_segment_card': return <ExampleIndustryMarketSegment {...p} />;
      case 'example_brainstorm_card': return <ExampleBrainstormCard {...p} />;
      case 'both_customer_end_user_card': return <BothCustomerEndUser {...p} />;
      case 'payer_card': return <Payer {...p} />;
      case 'influencer_card': return <Influencer {...p} />;
      case 'recommender_card': return <Recommender {...p} />;
      case 'saboteur_card': return <Saboteur {...p} />;
      case 'additional_decision_maker_card': return <AdditionalDecisionMaker {...p} />;
      case 'additional_stakeholder_card': return <AdditionalStakeholder {...p} />;
      case 'problem_statement_card': return <ProblemStatementCard {...p} />;
      case 'value_prop_card': return <ValuePropCard {...p} />;
      case 'select_subtype': return <span className="p-3 text-sm text-gray-500">Please select a card type from the menu.</span>;
      default: return null;
    }
  };

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={200} minHeight={150} />

      <Handle type="source" position={Position.Top}    id="top"    className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Right}  id="right"  className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Left}   id="left"   className="opacity-0 hover:opacity-100" />

      <div className="w-full h-full bg-white border border-[#B4B9C9] rounded-xl flex flex-col overflow-hidden shadow-[0px_4px_33.3px_0px_rgba(30,39,143,0.2)]">
        {/* Header */}
        <div
          className="px-3 py-2 font-semibold text-[14px] flex items-start justify-between break-words whitespace-normal"
          style={{ backgroundColor: getColor(), color: headerTextColor }}
        >
          <span className={`font-manrope font-semibold font-weight-600 text-[13px] ${headerTextColor === 'white' ? 'text-white' : 'text-black'}`}>
            {getTitle()}
          </span>
        </div>

        {/* Body */}
        {getBody()}
      </div>
    </>
  );
}
