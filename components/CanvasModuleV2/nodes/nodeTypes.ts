import type { NodeTypes } from '@xyflow/react';
import { QuestionNode } from './QuestionNode';
import { QuestionAnswerNode } from './QuestionAnswerNode';
import { RectNode } from './RectNode';
import { TextNode } from './TextNode';
import { EllipseNode } from './EllipseNode';
import { ImageNode } from './ImageNode';
import { FeatureIdeaNode } from './FeatureIdeaNode';
import { CardNode } from './CardNode';
import { InterviewNode } from './InterviewNode';
import { TableNode } from './TableNode';

// Defined outside any component to maintain stable references (avoids RF re-mounting all nodes on render)
export const nodeTypes: NodeTypes = {
  question: QuestionNode,
  question_answer: QuestionAnswerNode,
  rect: RectNode,
  text: TextNode,
  ellipse: EllipseNode,
  image: ImageNode,
  feature_idea: FeatureIdeaNode,
  card: CardNode,
  interview: InterviewNode,
  table: TableNode,
};
