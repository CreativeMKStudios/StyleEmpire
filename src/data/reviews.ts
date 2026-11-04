export type Review = {
  author: string;
  stars: 1 | 2 | 3 | 4 | 5;
  when: string;
  text: string;
  shortened: boolean;
};

/**
 * Quotes copied from the public Google listing. Spelling is left as written.
 * An ellipsis means Google, or the source that repeated Google, cut the text.
 * These are not all 53 reviews.
 */
export const reviews: Review[] = [
  {
    author: "Isobel Radcliffe",
    stars: 1,
    when: "October 2026",
    shortened: true,
    text: "Ive thought about writting a review for a little while, showed and inspo picture and left with damaged, stringy hair, overall customer service was lovely but my hair was cut uneven and havent been able to go to a hairdresser since this, i …",
  },
  {
    author: "Anna-Lisa Taylor",
    stars: 5,
    when: "8 February 2025",
    shortened: true,
    text: "I love Style Empire. As someone who feels nervous going into groups of people, I can honestly say the welcome is incredible - and nothing is too much trouble. I feel comfortable, no question is silly and it’s so nice to be able to have a chat, coffee (or alcoholic drink as it’s licensed) and get all of your beauty needs sorted under one roof! Every stylist and member of the team in there are genuinely lovely - there’s no undercurrent of unkindness or competition. It’s lovely. I see Holly (Bella Wren) for my own and my daughter’s hair styling. I’ve had consistently great service, advice and…",
  },
  {
    author: "Danni Thomson",
    stars: 5,
    when: "17 September 2024",
    shortened: false,
    text: "What an experience! I have been a loyal customer of a competitor for several years and never thought of going elsewhere, I happened to have one of the worst experiences at this other salon and rang style empire last Friday with a eyelash dilemma! The girls were lovely and calmed me down, reassuring me and fitting me in that afternoon for new lashes! I was made welcome, was given a cup of tea whilst waiting. The customer service I received was amazing! I am now booked in for more treatments! Thank you to all the wonderful women who work there! You’re all amazing",
  },
  {
    author: "A Google reviewer",
    stars: 1,
    when: "8 January 2024",
    shortened: false,
    text: "Honestly I did trust all these good reviews that I saw and I popped in to ask if there were any slots available, don’t get me wrong they were friendly and they got me a slot for same day, but the results was worse than if I would do them by myself. I would never recommend for haircuts. Sorry guys but that’s my experience. I would recommend you to do some extra courses.",
  },
  {
    author: "Knead It Sport",
    stars: 5,
    when: "10 December 2023",
    shortened: false,
    text: "Great atmosphere, very welcoming. I had an appointment with Ali for aesthetics. Ive previously had my lips done at Harley street, i had a better experiance and results visiting here. I would highly recommend this fab place to anybody its 5 *",
  },
  {
    author: "Crash Crowley",
    stars: 5,
    when: "18 September 2023",
    shortened: true,
    text: "We had been looking for a hairdressers for a while since moving to Kettering, had our first appointment and such a lovely guy. Accommodating but also lovely, chatty and overall good vibes. Glad to have found a good hairdresser …",
  },
  {
    author: "A Google reviewer",
    stars: 1,
    when: "20 May 2021",
    shortened: false,
    text: "I am distraught with the haircut my son got. Specifically asked for haircut no to be too short, showing pictures of the precious cut we got a horrible haircut with rough, uneven edges! You can see the harsh line transition where hair supposes to go from shorter length to longer. This look so strange, can't be corrected because of the super short length of the hair. The worst part it is going to look like this on birthday pictures. I don't know how place got so many nice reviews, our experience with the salon is very poor. No need to say I'll never be back there.",
  },
];
