export type ShapeType =
  | "card"
  | "rect"
  | "text"
  | "image"
  | "table"
  | "ellipse"
  | "question"
  | "interview"
  | "feature_idea"
  | "question_answer";

export type CardType =
  | "assumption_card"
  | "interview_card"
  | "solution_card"
  | "value_prop_card"
  | "problem_statement_card"
  | "select_subtype"
  | "jobs_to_be_done_card"
  | "pains_card"
  | "gains_card"
  | "products_services_card"
  | "pain_relievers_card"
  | "gain_creators_card"
  | "industry_market_segment_card"
  | "customer_card"
  | "end_user_card"
  | "both_customer_end_user_card"
  | "payer_card"
  | "influencer_card"
  | "recommender_card"
  | "saboteur_card"
  | "additional_decision_maker_card"
  | "additional_stakeholder_card"
  | "feature_idea_card"
  | "summary_card"
  | "example_segment_card"
  | "example_industry_market_segment_card"
  | "example_customer_card"
  | "example_brainstorm_card";

export type Kind = "image" | "video" | "pdf" | "file";

export interface Shape {
  cardTitle?: string;
  x: number;
  y: number;
  id: string;
  color: string;
  textSize?: number;
  textColor?: string;
  textWeight?: "normal" | "bold";
  textStyle?: "normal" | "italic";
  width: number;
  text?: string;
  height: number;
  type: ShapeType;
  subtype?: CardType;
  kanbanOrder?: number;

  // interview block
  draftRaw?: string;
  analysisRaw?: string;
  images?: string[];

  // image block
  src?: string;
  keepAspect?: boolean;

  // table block
  tableRows?: number;
  tableCols?: number;
  tableData?: string[][];
  tableBg?: string[][];
  tableFont?: ("normal" | "bold" | "italic")[][];
  tableFontColor?: string[][];
  tableFontSize?: number[][];

  // tags
  tags?: string[];

  // attachments
  attachments?: Attachment[];

  // feature idea
  featureIdeaTags?: string[];
  featureIdeaDraftRaw?: string;

  cardTags?: string[];

  // question
  questionTags?: string[];
  segmentsTags?: string[];
  questionTitle?: string;

  metadata?: any;

  summary?: any;

  question_answers?: {
    name: string;
    role: string;
    market_segment?: string;
    participantId: string;
    questionId: string;
    draftRaw: string;
  }[];
}

export type Attachment = {
  id: string;
  kind: Kind;
  name: string;
  mime: string;
  url?: string;
  preview?: string; // small base64 preview for collaborators
  uploading?: boolean;
  progress?: number; // 0..1
  createdAt: number;
  size?: number;
  ext?: string;
};

export type ShapeComponentProps = {
  shape: Shape;
  isSelected: boolean;
  selectedCount: number;
  // renderHandles: (shape: Shape) => React.ReactNode;
  onResizeStart: (
    e: React.MouseEvent<HTMLDivElement>,
    id: string,
    handle: string,
  ) => void;
  interactive?: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onConnectorMouseDown?: (
    e: React.MouseEvent,
    shapeId: string,
    direction: "top" | "right" | "bottom" | "left",
  ) => void;
  kanbanView?: boolean;
};

export type ShapeComponent = React.FC<ShapeComponentProps>;

export interface Position {
  x: number;
  y: number;
}

export interface Marquee {
  x: number;
  y: number;
  w: number;
  h: number;
}
