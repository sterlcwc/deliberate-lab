import { Type, type Static } from '@sinclair/typebox';
import { StageKind } from './stage';
import { StageGameSchema, StageTextConfigSchema } from './stage.validation';
import { SurveyQuestionKind } from './survey_stage';

/** Shorthand for strict TypeBox object validation */
const strict = { additionalProperties: false } as const;

// ************************************************************************* //
// writeExperiment, updateStageConfig endpoints                              //
// ************************************************************************* //

/** TextSurveyQuestion input validation. */
export const TextSurveyQuestionData = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    kind: Type.Literal(SurveyQuestionKind.TEXT),
    questionTitle: Type.String(),
  },
  strict,
);

/** CheckSurveyQuestion input validation. */
export const CheckSurveyQuestionData = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    kind: Type.Literal(SurveyQuestionKind.CHECK),
    questionTitle: Type.String(),
  },
  strict,
);

/** MultipleChoiceItem input validation. */
export const MultipleChoiceItemData = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    text: Type.String(),
    points: Type.Number(),
  },
  strict,
);

/** MultipleChoiceSurveyQuestion input validation. */
export const MultipleChoiceSurveyQuestionData = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    kind: Type.Literal(SurveyQuestionKind.MULTIPLE_CHOICE),
    questionTitle: Type.String(),
    options: Type.Array(MultipleChoiceItemData),
  },
  strict,
);

/** ScaleItem input validation. */
export const ScaleItemData = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    value: Type.Number(),
    description: Type.String(),
  },
  strict,
);

/** ScaleSurveyQuestion input validation. */
export const ScaleSurveyQuestionData = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    kind: Type.Literal(SurveyQuestionKind.SCALE),
    questionTitle: Type.String(),
    options: Type.Array(ScaleItemData),
  },
  strict,
);

/** SurveyQuestion input validation. */
export const SurveyQuestionData = Type.Union([
  TextSurveyQuestionData,
  CheckSurveyQuestionData,
  MultipleChoiceSurveyQuestionData,
  ScaleSurveyQuestionData,
]);

/** SurveyStageConfig input validation. */
export const SurveyStageConfigData = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    kind: Type.Literal(StageKind.SURVEY),
    game: StageGameSchema,
    name: Type.String({ minLength: 1 }),
    descriptions: StageTextConfigSchema,
    questions: Type.Array(SurveyQuestionData),
  },
  strict,
);

// ************************************************************************* //
// updateStageParticipantAnswer endpoint                                     //
// ************************************************************************* //

/** TextSurveyAnswer input validation. */
export const TextSurveyAnswerData = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    kind: Type.Literal(SurveyQuestionKind.TEXT),
    answer: Type.String(),
  },
  strict,
);

/** CheckSurveyAnswer input validation. */
export const CheckSurveyAnswerData = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    kind: Type.Literal(SurveyQuestionKind.CHECK),
    answer: Type.Boolean(),
  },
  strict,
);

/** MultipleChoiceSurveyAnswer input validation. */
export const MultipleChoiceSurveyAnswerData = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    kind: Type.Literal(SurveyQuestionKind.MULTIPLE_CHOICE),
    answer: Type.String({ minLength: 1 }),
  },
  strict,
);

/** ScaleSurveyAnswer input validation. */
export const ScaleSurveyAnswerData = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    kind: Type.Literal(SurveyQuestionKind.SCALE),
    answer: Type.String({ minLength: 1 }),
  },
  strict,
);

/** SurveyAnswer input validation. */
export const SurveyAnswerData = Type.Union([
  TextSurveyAnswerData,
  CheckSurveyAnswerData,
  MultipleChoiceSurveyAnswerData,
  ScaleSurveyAnswerData,
]);

/** SurveyStageParticipantAnswer input validation. */
export const SurveyStageParticipantAnswerData = Type.Object(
  {
    kind: Type.Literal(StageKind.SURVEY),
    answerMap: Type.Record(
      Type.String({ minLength: 1 }),
      SurveyAnswerData
    ),
  },
  strict,
);