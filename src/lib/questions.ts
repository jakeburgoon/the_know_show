/** Original trivia written for The Know Show. Add new categories using the same format. */
export type Question = { prompt: string; answer: string; hint: string; aliases?: string[] };
export type Category = { id: string; name: string; explainer: string; questions: Question[] };
const Q = (prompt: string, answer: string, hint: string, ...aliases: string[]): Question => ({prompt, answer, hint, aliases});

export const CATEGORIES: Category[] = [
  {id:'space',name:'Space Case',explainer:'Planets, stars, moons, and things beyond Earth.',questions:[
    Q('Which planet is nicknamed the Red Planet?','Mars','It is the fourth planet from the Sun.'),
    Q('What is the name of our galaxy?','The Milky Way','It shares a name with a candy bar.','Milky Way'),
    Q('Which planet has the most prominent ring system visible in telescopes?','Saturn','It is the sixth planet from the Sun.'),
    Q('What is the term for a rocky object that reaches the ground after passing through Earth’s atmosphere?','Meteorite','A meteor is the streak of light; this is what lands.'),
    Q('What is the closest star to the Sun?','Proxima Centauri','It is part of the Alpha Centauri system.')
  ]},
  {id:'animals',name:'Creature Features',explainer:'The furry, scaly, feathery, and occasionally very strange animal world.',questions:[
    Q('What is the largest animal living on Earth today?','Blue whale','It lives in the ocean.'),
    Q('Which bird is known for its ability to hover and fly backward?','Hummingbird','It beats its wings extremely quickly.'),
    Q('What do you call a group of lions?','Pride','The word also means a feeling of satisfaction.'),
    Q('Which mammal lays eggs and has a ducklike bill?','Platypus','It is native to Australia.'),
    Q('What is the only continent with no native land snakes?','Antarctica','It is the coldest continent.')
  ]},
  {id:'world',name:'Map Quest',explainer:'Countries, continents, cities, and geographical surprises.',questions:[
    Q('Which country is famous for its boot-shaped outline?','Italy','Its capital is Rome.'),
    Q('What is the world’s largest ocean?','Pacific Ocean','Its name means peaceful.','Pacific'),
    Q('What river flows through the city of London?','Thames','Its name is pronounced TEMZ.','River Thames'),
    Q('What is the capital city of Canada?','Ottawa','It is in Ontario.'),
    Q('Which country completely surrounds the small country of Lesotho?','South Africa','Its largest city is Johannesburg.')
  ]},
  {id:'words',name:'Word Wizardry',explainer:'Definitions, meanings, and the weird side of the English language.',questions:[
    Q('What is the opposite of “ancient”?','Modern','Something new or current.','new'),
    Q('What punctuation mark ends a direct question?','Question mark','It curves above a dot.'),
    Q('What is a word called when it sounds like what it describes, such as “buzz”?','Onomatopoeia','The term starts with the letter O.'),
    Q('What do we call words such as “their” and “there” that sound alike but differ in meaning?','Homophones','The second half of the word means sounds.'),
    Q('What is a sentence that uses every letter of the alphabet called?','Pangram','“The quick brown fox jumps over the lazy dog” is one.')
  ]},
  {id:'history',name:'History in a Hurry',explainer:'People, events, and ideas from the not-so-distant past and long ago.',questions:[
    Q('Who was the first president of the United States?','George Washington','He is on the U.S. one-dollar bill.'),
    Q('Which ancient civilization built the famous pyramids at Giza?','Ancient Egyptians','The civilization grew along the Nile.','Egyptians','Egypt'),
    Q('In which year did humans first land on the Moon?','1969','It was the final year of the 1960s.'),
    Q('What wall, opened in 1989, had divided a German city?','Berlin Wall','The city later became Germany’s capital.'),
    Q('What 1215 English charter limited the king’s power?','Magna Carta','Its Latin name means “great charter.”','The Magna Carta')
  ]},
  {id:'science',name:'Lab Notes',explainer:'The everyday science that explains how things work.',questions:[
    Q('At sea level, water boils at what temperature in degrees Celsius?','100','It is also the number of centimeters in a meter.','100 degrees','100°C'),
    Q('What force pulls objects toward Earth?','Gravity','It keeps your feet on the ground.'),
    Q('What gas do plants absorb from the air during photosynthesis?','Carbon dioxide','Humans exhale it.','CO2'),
    Q('What particle has a negative electric charge?','Electron','It is found outside the nucleus of an atom.'),
    Q('What is the name of the process by which a solid turns directly into a gas?','Sublimation','Dry ice demonstrates this process.')
  ]},
  {id:'food',name:'Food for Thought',explainer:'Ingredients, kitchens, and delicious little facts.',questions:[
    Q('What fruit is traditionally used in guacamole?','Avocado','It contains a large pit.'),
    Q('What grain is the main ingredient in most traditional pasta?','Wheat','It is commonly ground into flour.'),
    Q('Which herb gives traditional pesto its distinctive green flavor?','Basil','It is often paired with tomatoes.'),
    Q('What is the Japanese term for a broth-based noodle dish often made with wheat noodles?','Ramen','It is commonly served with an egg.'),
    Q('What does the cooking term “al dente” mean?','Firm to the bite','It describes the ideal texture of many pasta dishes.','firm','firm to bite')
  ]},
  {id:'movies',name:'Screen Time',explainer:'Movies and television for the whole crew.',questions:[
    Q('In Toy Story, what kind of toy is Buzz Lightyear?','Space ranger action figure','He wears a spacesuit.','Action figure','Space ranger'),
    Q('What color is the animated character Shrek?','Green','His best friend is Donkey.'),
    Q('What is the fictional African kingdom in Black Panther called?','Wakanda','Its technology uses vibranium.'),
    Q('In The Wizard of Oz, what color are Dorothy’s famous slippers in the 1939 film?','Ruby red','They sparkle.','red','ruby'),
    Q('Which filmmaker directed E.T. the Extra-Terrestrial and Jurassic Park?','Steven Spielberg','His initials are S.S.','Spielberg')
  ]},
  {id:'music',name:'Sound Check',explainer:'Instruments, music vocabulary, and songs across generations.',questions:[
    Q('How many strings does a standard violin have?','4','It is one fewer than the number of fingers on one hand.','four'),
    Q('What word describes the speed of a piece of music?','Tempo','An Italian word meaning time.'),
    Q('Which musical instrument has black and white keys and usually 88 keys?','Piano','It can be acoustic or digital.'),
    Q('Which composer wrote the famous opening four-note motif of Symphony No. 5 in C minor?','Ludwig van Beethoven','He also wrote “Für Elise.”','Beethoven'),
    Q('What musical term means gradually getting louder?','Crescendo','It starts with C.')
  ]},
  {id:'math',name:'Number Crunch',explainer:'Math puzzles, patterns, and clever number facts.',questions:[
    Q('What is 9 multiplied by 7?','63','It is more than 60 and less than 70.','sixty three'),
    Q('How many degrees are in a right angle?','90','It is one quarter of a full turn.','90 degrees'),
    Q('What is the next prime number after 11?','13','It is also considered an unlucky number by some.'),
    Q('What is the name for the longest side of a right triangle?','Hypotenuse','It is opposite the right angle.'),
    Q('What is the sum of the interior angles of a triangle, in degrees?','180','It equals a straight angle.','180 degrees')
  ]},
  {id:'sports',name:'Game On',explainer:'Sports rules, equipment, and famous traditions.',questions:[
    Q('How many players are on the court for one basketball team during normal play?','5','It matches the points of a star.','five'),
    Q('What sport uses the terms “love,” “deuce,” and “ace”?','Tennis','Players hit a ball over a net with rackets.'),
    Q('In soccer, which position is generally allowed to use hands inside its own penalty area?','Goalkeeper','It defends the goal.','goalie','keeper'),
    Q('How many strikes make an out in baseball, barring special circumstances?','3','It is also the number of bases a triple reaches.','three'),
    Q('What is the distance of a marathon in miles, rounded to two decimal places?','26.22','It is a little more than 26 miles.','26.2','26.21875')
  ]},
  {id:'books',name:'Book Nook',explainer:'Memorable characters, authors, and stories.',questions:[
    Q('Who wrote the children’s book The Cat in the Hat?','Dr. Seuss','His pen name rhymes with “moose.”','Seuss','Theodor Geisel'),
    Q('What school does Harry Potter attend?','Hogwarts','It has four houses.','Hogwarts School'),
    Q('What is the name of the hobbit who carries the One Ring toward Mount Doom?','Frodo Baggins','His first name starts with F.','Frodo'),
    Q('Who wrote the novel Charlotte’s Web?','E. B. White','He also wrote Stuart Little.','EB White'),
    Q('In which Shakespeare play do the characters Rosencrantz and Guildenstern appear?','Hamlet','A Danish prince is the title character.')
  ]},
  {id:'nature',name:'Wild World',explainer:'Weather, ecosystems, and natural phenomena.',questions:[
    Q('What do we call water falling from clouds as drops?','Rain','It can make puddles.'),
    Q('What is the name for a scientist who studies weather?','Meteorologist','Forecasts are part of this job.'),
    Q('What is the name for molten rock beneath Earth’s surface?','Magma','Once it erupts, it is called lava.'),
    Q('What is a long period of unusually low rainfall called?','Drought','It may cause water shortages.'),
    Q('Which atmospheric layer contains most of the ozone layer?','Stratosphere','It is above the troposphere.')
  ]},
  {id:'tech',name:'Tech Trek',explainer:'Computers, inventions, and digital life.',questions:[
    Q('What does the “W” stand for in Wi-Fi?','Nothing officially','Wi-Fi is a brand name, not an acronym.','nothing','no word'),
    Q('What type of device is used to move the cursor on a computer screen?','Mouse','Its name is also a small animal.'),
    Q('What does “URL” stand for?','Uniform Resource Locator','It describes a web address.'),
    Q('What number system uses only the digits 0 and 1?','Binary','Computers use it to represent data.','base two','base 2'),
    Q('What does the “S” in HTTPS stand for?','Secure','It means the connection uses encryption.')
  ]},
  {id:'body',name:'Body Shop',explainer:'A tour through human anatomy and health basics.',questions:[
    Q('What organ pumps blood through your body?','Heart','It beats.'),
    Q('How many bones are in the typical adult human skeleton?','206','A baby has more.','two hundred six'),
    Q('What is the largest organ of the human body?','Skin','It covers your entire body.'),
    Q('Which part of the eye changes size to control how much light enters?','Pupil','It appears as a dark circle.','the pupil'),
    Q('What is the name of the tiny air sacs in the lungs where gas exchange occurs?','Alveoli','Their name begins with A.')
  ]},
  {id:'myths',name:'Myth Behaving',explainer:'Legendary characters and creatures from world mythology.',questions:[
    Q('In Greek mythology, who is the king of the gods?','Zeus','His symbol is a thunderbolt.'),
    Q('What mythical creature is often depicted as a horse with one horn?','Unicorn','Its horn is on its forehead.'),
    Q('Which Norse god is associated with thunder and a hammer?','Thor','His hammer is named Mjölnir.'),
    Q('In Greek myth, what creature has the body of a lion and the head of a human?','Sphinx','It is famous for a riddle.'),
    Q('Which Greek hero killed the Minotaur in the labyrinth?','Theseus','Ariadne helped him find his way.')
  ]},
  {id:'colors',name:'Bright Ideas',explainer:'Colors, light, and the way we see the world.',questions:[
    Q('What color do you get by mixing yellow and blue paint?','Green','It is the color of grass.'),
    Q('What are the three primary colors of light?','Red, green, and blue','Think RGB.','RGB','red green blue'),
    Q('What is the name for light bending as it passes between different materials?','Refraction','It helps make a straw look bent in water.'),
    Q('What pigment is responsible for the green color of most leaves?','Chlorophyll','It helps absorb light for photosynthesis.'),
    Q('Which visible light color has the shortest wavelength?','Violet','It appears at one end of the rainbow.')
  ]},
  {id:'landmarks',name:'Picture This Place',explainer:'Famous places from postcards and travel photos.',questions:[
    Q('In which city would you find the Eiffel Tower?','Paris','It is in France.'),
    Q('Which country is home to the Taj Mahal?','India','It is in the city of Agra.'),
    Q('Which U.S. state is home to the Grand Canyon?','Arizona','Its capital is Phoenix.'),
    Q('Which city is home to the Colosseum?','Rome','It is the capital of Italy.'),
    Q('What prehistoric monument in England is made of a ring of standing stones?','Stonehenge','It stands on Salisbury Plain.')
  ]},
  {id:'three',name:'Three Clues, One Answer',explainer:'Three mini-clues point to the same word or thing.',questions:[
    Q('A fruit, a technology company, and something that can be “the apple of your eye.”','Apple','It grows on a tree.'),
    Q('A celestial body, a five-pointed shape, and a famous performer.','Star','You see it at night.'),
    Q('A kind of tree, the main part of your hand, and a tropical leaf.','Palm','Think palm tree.'),
    Q('A financial institution, a river’s edge, and a way to tilt an airplane.','Bank','You may deposit money there.'),
    Q('A unit of time, a tiny hand on a clock, and a way to record meeting notes.','Minute','The two pronunciations mean different things.')
  ]},
  {id:'rhyme',name:'Rhyme Time',explainer:'Answer with a word that rhymes with the clue.',questions:[
    Q('A word meaning “glad” that rhymes with “snappy.”','Happy','It starts with H.'),
    Q('An animal that rhymes with “boat.”','Goat','It often has horns.'),
    Q('A weather word that rhymes with “train.”','Rain','It falls from clouds.'),
    Q('A word meaning “enormous” that rhymes with “bright.”','Might','Think of the phrase “might and power.”'),
    Q('A word for a short period of rest that rhymes with “map.”','Nap','You might take one after lunch.')
  ]},
  {id:'misleading',name:'Wait, What?',explainer:'Questions where your first guess might mislead you.',questions:[
    Q('How many months have at least 28 days?','12','February is not the only one.','twelve','all 12','all of them'),
    Q('If you pass the person in second place during a race, what place are you in?','Second','You take their position.','2nd','2'),
    Q('Which weighs more: a pound of feathers or a pound of rocks?','They weigh the same','Both weigh one pound.','same','equal','neither'),
    Q('A farmer has 17 sheep. All but 9 run away. How many remain?','9','The wording “all but” matters.','nine'),
    Q('An electric train moves north. Which way does its smoke blow?','It has no smoke','The train is electric.','no smoke','there is no smoke')
  ]},
  {id:'inventions',name:'Who Thought of That?',explainer:'Inventions and the people or places behind them.',questions:[
    Q('What invention uses a needle to show which direction is north?','Compass','It uses Earth’s magnetic field.'),
    Q('Which invention allows people to speak over long distances through a wired or wireless network?','Telephone','Alexander Graham Bell is associated with an early patent.','phone'),
    Q('Who developed the movable-type printing press widely used in 15th-century Europe?','Johannes Gutenberg','His surname starts with G.','Gutenberg'),
    Q('What does the abbreviation GPS stand for?','Global Positioning System','It helps with navigation.'),
    Q('Which scientist discovered penicillin in 1928?','Alexander Fleming','His surname is Fleming.','Fleming')
  ]},
  {id:'usa',name:'Across America',explainer:'People, places, symbols, and geography of the United States.',questions:[
    Q('How many stars are on the current U.S. flag?','50','There is one for every state.','fifty'),
    Q('What is the capital of Ohio?','Columbus','The city shares a name with an explorer.'),
    Q('Which U.S. state is nicknamed the Sunshine State?','Florida','It is home to Miami.'),
    Q('Which mountain range runs along much of the eastern United States?','Appalachian Mountains','It includes the Blue Ridge Mountains.','Appalachians'),
    Q('What is the longest river in the United States when measured as a single named river?','Missouri River','It flows into the Mississippi.','Missouri')
  ]},
  {id:'oceans',name:'Deep Blue',explainer:'Life, science, and geography beneath the waves.',questions:[
    Q('What is the name of the salty water body covering most of Earth?','Ocean','There are five named major ones.','the ocean'),
    Q('What is a large group of fish swimming together called?','School','The word is also a place of learning.'),
    Q('Which marine animal has eight arms lined with suckers?','Octopus','Its name starts with O.'),
    Q('What is the deepest known point in Earth’s oceans called?','Challenger Deep','It lies in the Mariana Trench.'),
    Q('What is the term for the periodic rise and fall of ocean water driven mainly by the Moon’s gravity?','Tides','There are high and low ones.','tide')
  ]},
  {id:'games',name:'Game Night',explainer:'Board games, cards, and all-around playtime.',questions:[
    Q('In chess, which piece moves in an L shape?','Knight','It is shaped like a horse.'),
    Q('How many sides are on a standard six-sided die?','6','It has the same number as the faces of a cube.','six'),
    Q('In Monopoly, what color group includes Boardwalk in the U.S. classic edition?','Dark blue','It is paired with Park Place.','blue'),
    Q('What is the highest single-letter tile value in English-language Scrabble?','10','Q and Z share this value.','ten'),
    Q('In traditional checkers, what happens to a piece when it reaches the farthest row on the opposite side?','It becomes a king','The piece gains the ability to move backward.','kinged','becomes king')
  ]},
  {id:'earth',name:'Planet Earth',explainer:'The ground beneath our feet and how our planet works.',questions:[
    Q('What is the outermost solid layer of Earth called?','Crust','It is thinner than the mantle.'),
    Q('What is the name of the imaginary line at 0 degrees latitude?','Equator','It divides the Northern and Southern Hemispheres.'),
    Q('What kind of rock forms when molten material cools and solidifies?','Igneous rock','Granite and basalt are examples.','igneous'),
    Q('What is the name of the supercontinent that existed long before today’s continents separated?','Pangaea','Its name begins with P.','Pangea'),
    Q('Which scale is commonly used to describe mineral hardness from 1 to 10?','Mohs scale','Diamond scores a 10.','Mohs hardness scale')
  ]},
  {id:'literally',name:'Literally Speaking',explainer:'Common phrases and the literal objects they mention.',questions:[
    Q('Complete the saying: “The early bird catches the ___.”','Worm','It is a small invertebrate.'),
    Q('What animal appears in the expression “the elephant in the ___”?','Elephant','The animal is already in the expression.'),
    Q('Which type of weather appears in the saying “save it for a ___ day”?','Rainy','The expression means saving for a future need.','rainy day','rain'),
    Q('In the phrase “spill the beans,” what food is spilled?','Beans','Legumes are involved.','bean'),
    Q('In the saying “a stitch in time saves nine,” what activity does a stitch belong to?','Sewing','Think thread and needle.','to sew')
  ]},
  {id:'counting',name:'Count On It',explainer:'Numbers hidden in everyday knowledge.',questions:[
    Q('How many days are in a leap year?','366','It is one more than a common year.'),
    Q('How many sides does a hexagon have?','6','The prefix “hex” is the clue.','six'),
    Q('How many planets are in our Solar System?','8','Pluto is classified as a dwarf planet.','eight'),
    Q('How many elements are in the periodic table as recognized by IUPAC in 2026?','118','The most recently named element is oganesson.','one hundred eighteen'),
    Q('How many squares are on a standard chessboard?','64','It is 8 by 8.','sixty four')
  ]},
  {id:'classroom',name:'Back to School',explainer:'General knowledge from all over a school building.',questions:[
    Q('What word describes a shape with exactly three sides?','Triangle','The prefix tri- means three.'),
    Q('What is the name of the main character in a story?','Protagonist','It is not necessarily the narrator.'),
    Q('Which part of speech typically describes a noun?','Adjective','Words like “bright” or “heavy” are examples.'),
    Q('What is the chemical symbol for gold?','Au','It comes from the Latin word aurum.'),
    Q('What is the term for a comparison using “like” or “as”?','Simile','It is a figure of speech.')
  ]},
];

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
export const CATEGORY_LOOKUP = new Map(CATEGORIES.map(c => [c.id,c]));
export function cellKey(categoryId: string, level: number) { return `${categoryId}:${level}`; }
export function cellQuestion(key: string): Question | null {
  const [id,level] = key.split(':'); return CATEGORY_LOOKUP.get(id)?.questions[Number(level)] ?? null;
}
