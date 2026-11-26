export const FEEDBACK_REASONS = [
 ['inaccurate','Incorrect question or answer'],['answer','My answer should have been accepted'],
 ['too-hard','Too difficult for this level'],['too-easy','Too easy for this level'],
 ['unclear','Unclear question wording'],['hint','Unhelpful hint'],['choices','Poor multiple-choice options'],
 ['category','Doesn’t fit the category'],['image','Image was unclear or did not load'],['other','Other'],
] as const;
export const FEEDBACK_STATUSES = ['new','under-review','resolved','no-change'] as const;
export type FeedbackStatus = typeof FEEDBACK_STATUSES[number];
import type {QuestionImage} from './questions';
export type QuestionContext = {id:string;category:string;difficulty:string;prompt:string;answer:string;submittedAnswer:string|null;correct:boolean|null;answerFormat:string|null;hintUsed:boolean|null;hintText:string[];choices:string[];points:number|null;image?:QuestionImage};
export type FeedbackOffer = {kind:'question'|'show';ticket:string;question?:QuestionContext;key:string};
export type FeedbackRow = {id:string;created_at:string;app_version:string;show_id:string;kind:'question'|'show';question_id:string|null;question:QuestionContext|null;reasons:string[];comment:string;rating:number|null;experience:string;category_ideas:string;status:FeedbackStatus};
export const FEEDBACK_VERSION='1.13.17';
