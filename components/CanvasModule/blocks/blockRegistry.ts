import { ShapeComponent } from "../types";

import { Rect } from "./core/Rect";
import { Text } from "./core/Text";
import { Image } from "./core/Image";
import { Card } from "./custom/Card";
import { Table } from "./core/Table";
import { Ellipse } from "./core/Ellipse";
import { Question } from "./custom/Question";
import { Interview } from "./custom/Interview";
import { FeatureIdea } from "./custom/FeatureIdea";
import { QuestionAnswer } from "./custom/QuestionAnswer";
import { ExampleBrainstormCard } from "./custom/ExampleBrainstormCard";

// Registry maps type to corresponding component
export const shapeRegistry: Record<string, ShapeComponent> = {
  card: Card,
  rect: Rect,
  text: Text,
  image: Image,
  table: Table,
  ellipse: Ellipse,
  question: Question,
  interview: Interview,
  feature_idea: FeatureIdea,
  question_answer: QuestionAnswer,
  example_brainstorm_card: ExampleBrainstormCard,
};
