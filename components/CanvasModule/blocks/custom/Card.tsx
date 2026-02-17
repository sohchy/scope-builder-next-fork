"use client";

import {
  ChevronDown,
  Ellipsis,
  EllipsisIcon,
  MicIcon,
  MoreVertical,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import {
  Select,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { useQuestions } from "../../questions/QuestionsProvider";
import { CardFrame } from "../CardFrame";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@radix-ui/react-dropdown-menu";
import { ProblemStatementCard } from "./ProblemStatement";
import { Interview } from "./InterviewCard";
import { JobsToBeDone } from "./JobsToBeDone";
import { Pains } from "./Pains";
import { Gains } from "./Gains";
import { ProductsService } from "./ProductsService";
import { PainRelievers } from "./PainRelievers";
import { GainCreators } from "./GainCreators";
import { Summary } from "./Summary";
import { usePathname } from "next/navigation";
import { IndustryMarketSegment } from "./IndustryMarketSegmentCard";
import { Customer } from "./CustomerCard";
import { EndUser } from "./EndUserCard";
import { ExampleBrainstormCard } from "./ExampleBrainstormCard";
import { ExampleCustomerCard } from "./ExampleCustomerCard";
import { ExampleIndustryMarketSegment } from "./ExampleIndustryMarketSegmentCard";
import { BothCustomerEndUser } from "./BothCustomerEndUser";
import { Payer } from "./Payer";
import { Influencer } from "./Influencer";
import { Recommender } from "./Recommender";
import { Saboteur } from "./Saboteur";
import { AdditionalDecisionMaker } from "./AdditionalDecisionMaker";
import { AdditionalStakeholder } from "./AdditionalStakeholder";
import { ValuePropCard } from "./ValuePropCard";

type CardProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
};

export const Card: React.FC<CardProps> = (props) => {
  const pathname = usePathname();
  const { shape, onCommitStyle } = props;
  const { subtype } = shape;

  const body = <div>{`Card Subtype: ${subtype}`}</div>;

  const getTitle = () => {
    switch (subtype) {
      case "industry_market_segment_card":
        return "Industry/Market Segment";
      case "value_prop_card":
        return "Value Proposition";
      case "customer_card":
        return "Customer";
      case "end_user_card":
        return "End-User";
      case "solution_card":
        return "Solution";
      case "interview_card":
        return "Interview";
      case "assumption_card":
        return "Assumption";
      case "problem_statement_card":
        return "Problem Statement";
      case "jobs_to_be_done_card":
        return "Jobs To Be Done";
      case "pains_card":
        return "Pains";
      case "gains_card":
        return "Gains";
      case "products_services_card":
        return "Products & Services";
      case "pain_relievers_card":
        return "Pain Relievers";
      case "gain_creators_card":
        return "Gain Creators";
      case "summary_card":
        return "Summary";
      case "select_subtype":
        return "Select Card Type";
      case "example_customer_card":
        return "Example Customer Card";
      case "example_industry_market_segment_card":
        return "Example Industry/Market Segment Card";
      case "example_brainstorm_card":
        return "Example Brainstorm Card";
      case "both_customer_end_user_card":
        return "Both Customer & End-User";
      case "payer_card":
        return "Payer";
      case "influencer_card":
        return "Influencer";
      case "recommender_card":
        return "Recommender";
      case "saboteur_card":
        return "Saboteur";
      case "additional_decision_maker_card":
        return "Additional Decision Maker";
      case "additional_stakeholder_card":
        return "Additional Stakeholder";
      default:
        return "Unknown";
    }
  };

  const getBody = () => {
    switch (subtype) {
      case "industry_market_segment_card":
        return <IndustryMarketSegment {...props} />;
      case "customer_card":
        return <Customer {...props} />;
      case "end_user_card":
        return <EndUser {...props} />;
      case "jobs_to_be_done_card":
        return <JobsToBeDone {...props} />;
      case "pains_card":
        return <Pains {...props} />;
      case "gains_card":
        return <Gains {...props} />;
      case "products_services_card":
        return <ProductsService {...props} />;
      case "pain_relievers_card":
        return <PainRelievers {...props} />;
      case "gain_creators_card":
        return <GainCreators {...props} />;
      case "summary_card":
        return <Summary {...props} />;
      case "example_customer_card":
        return <ExampleCustomerCard {...props} />;
      case "example_industry_market_segment_card":
        return <ExampleIndustryMarketSegment {...props} />;
      case "example_brainstorm_card":
        return <ExampleBrainstormCard {...props} />;
      case "both_customer_end_user_card":
        return <BothCustomerEndUser {...props} />;
      case "payer_card":
        return <Payer {...props} />;
      case "influencer_card":
        return <Influencer {...props} />;
      case "recommender_card":
        return <Recommender {...props} />;
      case "saboteur_card":
        return <Saboteur {...props} />;
      case "additional_decision_maker_card":
        return <AdditionalDecisionMaker {...props} />;
      case "additional_stakeholder_card":
        return <AdditionalStakeholder {...props} />;
      case "problem_statement_card":
        return <ProblemStatementCard {...props} />;
      case "value_prop_card":
        return <ValuePropCard {...props} />;

      case "select_subtype":
        return <span>Please select a card type from the menu.</span>;
    }
  };

  const useAttachments = () => {
    switch (subtype) {
      case "industry_market_segment_card":
      case "customer_card":
      case "end_user_card":
      case "solution_card":
      case "both_customer_end_user_card":
      case "payer_card":
      case "influencer_card":
      case "recommender_card":
      case "saboteur_card":
      case "additional_decision_maker_card":
      case "additional_stakeholder_card":
      case "value_prop_card":
        return false;
      case "interview_card":
        return false;
      case "assumption_card":
        return false;
      case "problem_statement_card":
        return false;
      case "jobs_to_be_done_card":
        return false;
      case "pains_card":
        return false;
      case "gains_card":
        return false;
      case "products_services_card":
        return false;
      case "pain_relievers_card":
        return false;
      case "gain_creators_card":
        return false;
      case "summary_card":
        return false;
      case "select_subtype":
        return false;
      case "example_brainstorm_card":
      case "example_customer_card":
      case "example_industry_market_segment_card":
        return false;
      default:
        return true;
    }
  };

  const getColor = () => {
    switch (subtype) {
      case "example_industry_market_segment_card":
      case "industry_market_segment_card":
        return "#C2F7FD";
      case "example_customer_card":
      case "customer_card":
        return "#C0E7FF";
      case "end_user_card":
        return "#CECFFF";
      case "jobs_to_be_done_card":
        return "#FDE1B5";
      case "pains_card":
        return "#FFBCBC";
      case "gains_card":
        return "#FFCBAF";
      case "products_services_card":
        return "#DDF5B5";
      case "pain_relievers_card":
        return "#CCF6EA";
      case "gain_creators_card":
        return "#D5F9D7";
      case "example_brainstorm_card":
        return "#DDE1F2";
      case "summary_card":
        return "#6A35FF";
      case "both_customer_end_user_card":
        return "#FDE1B5";
      case "payer_card":
        return "#FFD3BB";
      case "influencer_card":
        return "#FFCCCC";
      case "recommender_card":
        return "#DDF5B5";
      case "saboteur_card":
        return "#D5F9D7";
      case "additional_decision_maker_card":
        return "#CCF6EA";
      case "additional_stakeholder_card":
        return "#E6CFFF";
      default:
        return "#FFFFFF";
    }
  };

  const getMenuOptions = () => {
    if (pathname.includes("/value-proposition"))
      return (
        <>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "jobs_to_be_done_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "jobs_to_be_done_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Jobs To Be Done
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, { subtype: "pains_card" });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "pains_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Pains
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, { subtype: "gains_card" });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "gains_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Gains
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[1px] bg-gray-200" />
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "products_services_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "products_services_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Products & Services
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "pain_relievers_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "pain_relievers_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Pain Relievers
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "gain_creators_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "gain_creators_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Gain Creators
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[1px] bg-gray-200" />
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                width: 550,
                subtype: "summary_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 `}
          >
            Ad-Lib
          </DropdownMenuItem>
        </>
      );

    if (pathname.includes("/segments")) {
      return (
        <>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "industry_market_segment_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "industry_market_segment_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Industry/Market Segment
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "customer_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "customer_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Customer
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "end_user_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "end_user_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            End-User
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "both_customer_end_user_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "both_customer_end_user_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Both Customer & End-User
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "payer_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "payer_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Payer
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "influencer_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "influencer_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Influencer
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "recommender_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "recommender_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Recommender
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "saboteur_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "saboteur_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Saboteur
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "additional_decision_maker_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "additional_decision_maker_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Additional Decision Maker
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "additional_stakeholder_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "additional_stakeholder_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Additional Stakeholder
          </DropdownMenuItem>
        </>
      );
    }

    if (pathname.includes("/examples/laptop")) {
      return (
        <>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "industry_market_segment_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "industry_market_segment_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Industry/Market Segment
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "customer_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "customer_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Customer
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "end_user_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "end_user_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            End-User
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "jobs_to_be_done_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "jobs_to_be_done_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Jobs To Be Done
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, { subtype: "pains_card" });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "pains_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Pains
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, { subtype: "gains_card" });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "gains_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Gains
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[1px] bg-gray-200" />
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "products_services_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "products_services_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Products & Services
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "pain_relievers_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "pain_relievers_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Pain Relievers
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                subtype: "gain_creators_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
              subtype === "gain_creators_card" ? "bg-[#D5F9D7]" : ""
            }`}
          >
            Gain Creators
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[1px] bg-gray-200" />
          <DropdownMenuItem
            onClick={() => {
              onCommitStyle?.(shape.id, {
                width: 550,
                subtype: "summary_card",
              });
            }}
            className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 `}
          >
            Ad-Lib
          </DropdownMenuItem>
        </>
      );
    }
  };

  return (
    <CardFrame
      {...props}
      headerBg={getColor()}
      headerTextColor={subtype === "summary_card" ? "white" : "black"}
      useAttachments={useAttachments()}
      header={
        <div className="w-full flex flex-row items-center justify-between">
          <span className="font-manrope font-semibold font-weight-600  text-[13px] text-[#111827]">
            {getTitle()}
          </span>
          {/* <DropdownMenu defaultOpen={subtype === "select_subtype"}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open</span>
                <Ellipsis className="h-10 w-10" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="absolute -top-11 left-5 p-1.5 w-[216px]"
            >
              {getMenuOptions()}
            </DropdownMenuContent>
          </DropdownMenu> */}
        </div>
      }
      body={getBody()}
    />
  );
};
