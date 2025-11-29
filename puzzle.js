const puzzle = {
  title: "Valkparkiet",
  hint: "3 woorden",

  words: [
    {
      clue: "Romeinse keizer",
      answer: "NERO",
      solutionIndex: 1,
    },
    {
      clue: "Zwart-wit dier",
      answer: "PANDA",
      solutionIndex: 1,
    },
    {
      clue: "Vader moet er dringend eens op gaan staan (ENG)",
      answer: "PASCALE",
      solutionIndex: 5,
    },
    {
      clue: "Pesticide",
      answer: "DDT",
      solutionIndex: 1,
    },
    {
      clue: "Serie van naakte vrouwen",
      answer: "STRIPREEKS",
      solutionIndex: 4,
      breakAfter: true,
    },
    {
      clue: "Muziekregel",
      answer: "MAAT",
      solutionIndex: 2,
    },
    {
      clue: "Stad in Italië",
      answer: "ROMA",
      solutionIndex: 1,
    },
    {
      clue: "Dier met lange nek",
      answer: "GIRAFFE",
      solutionIndex: 3,
    },
  ],

  // Intersections: connects letters between different words
  // Format: { word1Index, letter1Pos, word2Index, letter2Pos, group }
  intersections: [
    // NERO (0) connects to PANDA (1) at letter 1 = 'E'
    { word1Index: 0, letter1Pos: 1, word2Index: 1, letter2Pos: 1, group: "A" },

    // PANDA (1) connects to PASCALE (2) at letter 1 = 'A'
    { word1Index: 1, letter1Pos: 1, word2Index: 2, letter2Pos: 1, group: "B" },

    // PASCALE (2) connects to DDT (3) at letter 1 = 'A'
    { word1Index: 2, letter1Pos: 1, word2Index: 3, letter2Pos: 1, group: "C" },

    // DDT (3) connects to STRIPREEKS (4) at letter 0 = 'D'
    { word1Index: 3, letter1Pos: 0, word2Index: 4, letter2Pos: 0, group: "D" },

    // STRIPREEKS (4) connects to MAAT (5) at letter 4 = 'S'
    { word1Index: 4, letter1Pos: 4, word2Index: 5, letter2Pos: 0, group: "E" },

    // MAAT (5) connects to ROMA (6) at letter 2 = 'A'
    { word1Index: 5, letter1Pos: 2, word2Index: 6, letter2Pos: 1, group: "F" },

    // ROMA (6) connects to GIRAFFE (7) at letter 1 = 'O'
    { word1Index: 6, letter1Pos: 1, word2Index: 7, letter2Pos: 2, group: "G" },
  ],
};
