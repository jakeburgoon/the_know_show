import type {Settings} from './game';

/** A suggestion, never an automatic change to the next show's settings. */
export function nextFormatTip(settings:Pick<Settings,'answerStyle'|'mixedAccess'>){
 switch(settings.answerStyle){
  case 'choices': return {title:'Ready for more of a challenge?',text:'Next show, try writing your answers to Easy questions while keeping answer options for Medium and Hard questions.'};
  case 'mixed': return {title:'Ready for more of a challenge?',text:settings.mixedAccess==='medium-hard'?'Next show, try writing your answers to Easy and Medium questions, with options for Hard questions only.':'Next show, try writing all your answers without options. You can still purchase hints when you need them.'};
  case 'individual': return {title:'Try a different answer format',text:'Next show, try having everyone use the same mixture of written answers and answer options, or keep individual preferences if they work for your group.'};
  default: return {title:'Ready for a different experience?',text:'Next show, try answer options for Hard questions, or choose options for every question for a more relaxed game.'};
 }
}
