import bank from './question-bank.json';
export type Question = {id:string;level:number;prompt:string;answer:string;hint:string;aliases:string[];categoryId:string;editorialStatus?:string};
export type Category = {id:string;name:string;description:string;type:'classic'|'creative';questionsByLevel: Record<string,Question[]>};
export const CATEGORIES = bank.categories as Category[];
export const CATEGORY_LOOKUP = new Map(CATEGORIES.map(c=>[c.id,c]));
export const QUESTION_LOOKUP = new Map(CATEGORIES.flatMap(c=>Object.values(c.questionsByLevel).flat()).map(q=>[q.id,q]));
export function cellKey(categoryId:string,level:number){return `${categoryId}:${level}`;}
export function getQuestion(id:string){return QUESTION_LOOKUP.get(id);}

export type FinalQuestion = { id: string; category: string; prompt: string; answer: string; hint: string; tier: 'family'|'teen'|'adult'; aliases?: string[] };
export const FINALS: FinalQuestion[] = [
  {id:'f1',category:'Around the World',prompt:'This continent is the only one home to wild giraffes. Name it.',answer:'Africa',hint:'Its largest country by area is Algeria.',tier:'family'},
  {id:'f2',category:'Big Ideas',prompt:'This word describes the process that plants use to turn light into chemical energy.',answer:'Photosynthesis',hint:'Its first part means light.',tier:'family'},
  {id:'f3',category:'Movie Magic',prompt:'In the original Toy Story, what is the name of Andy’s cowboy doll?',answer:'Woody',hint:'He has a pull string.',tier:'family'},
  {id:'f4',category:'Numbers Matter',prompt:'This number is the smallest positive prime number.',answer:'2',hint:'It is the only even prime.',tier:'family',aliases:['two']},
  {id:'f5',category:'Natural Wonders',prompt:'This is the largest living species of big cat.',answer:'Tiger',hint:'It has stripes.',tier:'family'},
  {id:'f6',category:'Landmarks',prompt:'This country is home to the Great Barrier Reef.',answer:'Australia',hint:'Its capital is Canberra.',tier:'family'},
  {id:'f7',category:'Language',prompt:'This is the term for a word with the opposite meaning of another word.',answer:'Antonym',hint:'The opposite of a synonym.',tier:'teen'},
  {id:'f8',category:'Space',prompt:'This planet has the shortest year of any planet in the Solar System.',answer:'Mercury',hint:'It is the closest planet to the Sun.',tier:'teen'},
  {id:'f9',category:'U.S. History',prompt:'This 1803 agreement roughly doubled the territory of the United States.',answer:'Louisiana Purchase',hint:'It was negotiated with France.',tier:'teen'},
  {id:'f10',category:'Science',prompt:'This scientist developed the three laws of motion and a theory of universal gravitation.',answer:'Isaac Newton',hint:'An apple is often featured in stories about him.',tier:'teen',aliases:['Newton']},
  {id:'f11',category:'Art',prompt:'This Dutch painter created The Starry Night.',answer:'Vincent van Gogh',hint:'He was known for his bold brushwork.',tier:'teen',aliases:['Van Gogh']},
  {id:'f12',category:'Music',prompt:'This brass instrument typically has a slide instead of valves.',answer:'Trombone',hint:'Its name comes from Italian.',tier:'teen'},
  {id:'f13',category:'World History',prompt:'This city was the capital of the Byzantine Empire and was renamed Istanbul in the modern era.',answer:'Constantinople',hint:'It was named for a Roman emperor.',tier:'adult'},
  {id:'f14',category:'Physics',prompt:'This law says that pressure and volume of a gas are inversely related when temperature stays constant.',answer:'Boyle’s law',hint:'Named after a 17th-century scientist.',tier:'adult',aliases:['Boyles law']},
  {id:'f15',category:'Literature',prompt:'This novelist wrote One Hundred Years of Solitude.',answer:'Gabriel García Márquez',hint:'He won the Nobel Prize in Literature in 1982.',tier:'adult',aliases:['Garcia Marquez','Gabriel Garcia Marquez']},
  {id:'f16',category:'Geography',prompt:'This landlocked Asian country lies between Russia and China.',answer:'Mongolia',hint:'Its capital is Ulaanbaatar.',tier:'adult'},
  {id:'f17',category:'Chemistry',prompt:'This element, atomic number 74, has the chemical symbol W.',answer:'Tungsten',hint:'The symbol comes from the name wolfram.',tier:'adult',aliases:['Wolfram']},
  {id:'f18',category:'Architecture',prompt:'This Catalan architect designed Barcelona’s Sagrada Família basilica.',answer:'Antoni Gaudí',hint:'His surname begins with G.',tier:'adult',aliases:['Gaudi','Antoni Gaudi']},
];
