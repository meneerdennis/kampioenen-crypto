// Initialize ALL variables early to avoid hoisting issues
// Intersection management - must be before any function calls
const intersections = puzzle.intersections || [];
const intersectionMap = new Map(); // Maps cell positions to intersection groups
const groupColors = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FECA57",
  "#FF9FF3",
  "#54A0FF",
  "#5F27CD",
];

// Other early variables
let gridRows = []; // Will store references to grid rows

// Titles
document.getElementById("title").textContent = `Filippine – ${puzzle.title}`;
document.getElementById(
  "solutionHint"
).textContent = `Hint voor het oplossingswoord: ${puzzle.hint}`;

// const clueListEl moved to new section
const solutionWordEl = document.getElementById("solutionWord");
const filipGridEl = document.getElementById("filipGrid");
const toastEl = document.getElementById("toast");

const solutionLength = puzzle.words.length;

// Build intersection mapping FIRST, before grid creation
buildIntersectionMap();
console.log(
  "Intersection map initialized:",
  intersectionMap.size,
  "intersections found"
);

// --------- Oplossingswoord ----------
const solutionCells = [];
puzzle.words.forEach((word) => {
  const cell = document.createElement("div");
  cell.className = "solution-letter";
  solutionWordEl.appendChild(cell);
  solutionCells.push(cell);

  if (word.breakAfter) {
    const spacer = document.createElement("div");
    spacer.className = "solution-spacer";
    solutionWordEl.appendChild(spacer);
  }
});

// --------- VISUELE FILIPPINE ----------
const maxIndex = Math.max(...puzzle.words.map((w) => w.solutionIndex));
const visualRows = [];

puzzle.words.forEach((word, index) => {
  const row = document.createElement("div");
  row.className = "fil-row";

  const num = document.createElement("div");
  num.className = "fil-num";
  num.textContent = index + 1;

  const wrap = document.createElement("div");
  wrap.className = "fil-cells";

  const cells = [];

  const ghostCount = maxIndex - word.solutionIndex;
  for (let i = 0; i < ghostCount; i++) {
    const ghost = document.createElement("div");
    ghost.className = "fil-cell ghost";
    ghost.dataset.letterIndex = -1;
    wrap.appendChild(ghost);
    cells.push(ghost);
  }

  for (let i = 0; i < word.answer.length; i++) {
    const c = document.createElement("div");
    c.className = "fil-cell";
    c.dataset.letterIndex = i;
    c.dataset.wordIndex = index;

    // Add intersection styling
    const intersectionInfo = getIntersectionInfo(index, i);
    if (intersectionInfo) {
      console.log(
        `Word ${index}, Position ${i}: Found intersection group ${
          intersectionInfo.group + 1
        }`
      );
      c.classList.add("intersection-cell");
      c.style.borderColor = intersectionInfo.color;
      c.style.borderWidth = "2px";
      c.style.borderStyle = "solid";
      c.style.background = intersectionInfo.color + "20"; // 20 = 12.5% opacity

      // Add group number indicator
      const groupNumber = document.createElement("div");
      groupNumber.className = "intersection-group-number";
      groupNumber.textContent = intersectionInfo.group + 1; // +1 to make it 1-indexed
      groupNumber.style.color = intersectionInfo.color;
      groupNumber.style.fontSize = "0.7rem";
      groupNumber.style.fontWeight = "bold";
      groupNumber.style.position = "absolute";
      groupNumber.style.top = "-8px";
      groupNumber.style.left = "-8px";
      groupNumber.style.background = "white";
      groupNumber.style.border = "1px solid " + intersectionInfo.color;
      groupNumber.style.borderRadius = "50%";
      groupNumber.style.width = "16px";
      groupNumber.style.height = "16px";
      groupNumber.style.display = "flex";
      groupNumber.style.alignItems = "center";
      groupNumber.style.justifyContent = "center";
      groupNumber.style.zIndex = "10";

      c.style.position = "relative";
      c.appendChild(groupNumber);

      c.title = `Intersection Group ${
        intersectionInfo.group + 1
      } - Connects to: ${intersectionInfo.connected.length} other position(s)`;
    }

    if (i === word.solutionIndex) c.classList.add("solution");
    wrap.appendChild(c);
    cells.push(c);
  }

  row.appendChild(num);
  row.appendChild(wrap);
  filipGridEl.appendChild(row);

  // Store reference to this row for clicking
  gridRows[index] = row;

  // Add click handler to grid row
  row.addEventListener("click", () => {
    selectWord(index);
  });

  visualRows.push({ cells, word });

  // HIER de lege regel als markering tussen woorden in de oplossing
  if (word.breakAfter) {
    const spacerRow = document.createElement("div");
    spacerRow.className = "fil-group-spacer";
    filipGridEl.appendChild(spacerRow);
  }
});

// --------- SIMPLE CLUE LIST ----------
const clueListEl = document.getElementById("clueList");
const activeClueSection = document.getElementById("activeClueSection");
const activeClueNumber = document.getElementById("activeClueNumber");
const activeClueLength = document.getElementById("activeClueLength");
const activeClueText = document.getElementById("activeClueText");
const activeClueInput = document.getElementById("activeClueInput");
const activeClueStatus = document.getElementById("activeClueStatus");

// Store input values for each word
const wordInputs = puzzle.words.map(() => "");
let activeWordIndex = null;

// Build intersection mapping
function buildIntersectionMap() {
  intersectionMap.clear();

  intersections.forEach((intersection, index) => {
    const color = groupColors[index % groupColors.length];

    // Store intersection for both directions
    const key1 = `${intersection.word1Index}-${intersection.letter1Pos}`;
    const key2 = `${intersection.word2Index}-${intersection.letter2Pos}`;

    if (!intersectionMap.has(key1)) {
      intersectionMap.set(key1, { group: index, color, connected: [key2] });
    } else {
      intersectionMap.get(key1).connected.push(key2);
    }

    if (!intersectionMap.has(key2)) {
      intersectionMap.set(key2, { group: index, color, connected: [key1] });
    } else {
      intersectionMap.get(key2).connected.push(key1);
    }
  });
}

// Get intersection info for a specific cell
function getIntersectionInfo(wordIndex, letterPos) {
  const key = `${wordIndex}-${letterPos}`;
  return intersectionMap.get(key) || null;
}

// Propagate letters to connected intersection cells
function propagateLetter(sourceWordIndex, sourceWordValue) {
  const sourceWord = puzzle.words[sourceWordIndex];
  const sourceCells = sourceWordValue.toUpperCase();

  // Check each position in the source word for intersections
  for (let pos = 0; pos < sourceWord.answer.length; pos++) {
    const intersectionInfo = getIntersectionInfo(sourceWordIndex, pos);
    if (!intersectionInfo) continue;

    const sourceLetter = sourceCells[pos] || "";
    if (!sourceLetter.trim()) continue; // Don't propagate empty letters

    // Update all connected positions
    intersectionInfo.connected.forEach((connectedKey) => {
      const [targetWordIndex, targetPos] = connectedKey.split("-").map(Number);

      // Get current value of target word
      let targetWordValue = wordInputs[targetWordIndex];

      // Update the specific position
      if (targetWordValue.length <= targetPos) {
        targetWordValue = targetWordValue.padEnd(targetPos + 1, " ");
      }

      // Replace the character at the target position
      const before = targetWordValue.substring(0, targetPos);
      const after = targetWordValue.substring(targetPos + 1);
      targetWordValue = before + sourceLetter + after;

      // Update the stored value
      wordInputs[targetWordIndex] = targetWordValue;

      // Update the visual display if this is the active word
      if (targetWordIndex === activeWordIndex) {
        updateVisualRow(targetWordIndex, targetWordValue);
      }
    });
  }
}

// Create simple clue list
puzzle.words.forEach((word, index) => {
  const clueItem = document.createElement("div");
  clueItem.className = "clue-list-item";
  clueItem.dataset.wordIndex = index;

  const header = document.createElement("div");
  header.className = "clue-list-item-header";

  const number = document.createElement("div");
  number.className = "clue-list-item-number";
  number.textContent = index + 1;

  const length = document.createElement("div");
  length.className = "clue-list-item-length";
  length.textContent = `${word.answer.length} letters`;

  header.appendChild(number);
  header.appendChild(length);

  const text = document.createElement("div");
  text.className = "clue-list-item-text";
  text.textContent = word.clue;

  clueItem.appendChild(header);
  clueItem.appendChild(text);

  clueItem.addEventListener("click", () => {
    selectWord(index);
  });

  clueListEl.appendChild(clueItem);
});

// ----------- WORD SELECTION -----------
function selectWord(index) {
  // Clear previous selections
  document.querySelectorAll(".clue-list-item").forEach((item) => {
    item.classList.remove("active");
  });
  document.querySelectorAll(".fil-row").forEach((row) => {
    row.classList.remove("active");
  });

  // Set new selection
  const clueItem = document.querySelector(`[data-word-index="${index}"]`);
  const gridRow = gridRows[index];

  if (clueItem) clueItem.classList.add("active");
  if (gridRow) gridRow.classList.add("active");

  // Show active clue section
  const word = puzzle.words[index];
  activeClueNumber.textContent = `Word ${index + 1}`;
  activeClueLength.textContent = `${word.answer.length} letters`;
  activeClueText.textContent = word.clue;
  activeClueInput.maxLength = word.answer.length;
  activeClueInput.value = wordInputs[index];
  activeClueSection.classList.remove("hidden");

  activeWordIndex = index;
  updateActiveClueStatus();
  updateVisualRow(index, wordInputs[index]);
}

// ----------- ACTIVE CLUE MANAGEMENT -----------
function updateActiveClueStatus() {
  if (activeWordIndex === null) return;

  const word = puzzle.words[activeWordIndex];
  const value = activeClueInput.value.trim().toUpperCase();
  const correct = value === word.answer;

  activeClueStatus.classList.remove("correct", "incorrect");

  if (value) {
    if (correct) {
      activeClueStatus.classList.add("correct");
    } else {
      activeClueStatus.classList.add("incorrect");
    }
  }
}

// ----------- INPUT FIELD MANAGEMENT -----------
activeClueInput.addEventListener("input", () => {
  if (activeWordIndex === null) return;

  activeClueInput.value = activeClueInput.value.toUpperCase();
  wordInputs[activeWordIndex] = activeClueInput.value;

  // Handle letter propagation for intersections
  propagateLetter(activeWordIndex, activeClueInput.value);

  updateVisualRow(activeWordIndex, activeClueInput.value);
  updateActiveClueStatus();
  checkSingle(activeWordIndex);
});

activeClueInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    activeClueInput.value = "";
    wordInputs[activeWordIndex] = "";
    updateVisualRow(activeWordIndex, "");
    checkSingle(activeWordIndex);
    updateActiveClueStatus();
  }
});

// ----------- VISUELE UPDATE -----------
function updateVisualRow(index, text) {
  const info = visualRows[index];
  const letters = text.toUpperCase().padEnd(info.word.answer.length, " ");

  info.cells.forEach((cell) => {
    const li = Number(cell.dataset.letterIndex);
    if (li < 0) return; // ghost cell

    const ch = letters[li] === " " ? "" : letters[li];
    cell.textContent = ch;
    cell.classList.toggle("filled", ch !== "");
  });
}

// ----------- VALIDATIE -----------
function checkSingle(i) {
  const word = puzzle.words[i];
  const value = wordInputs[i].trim().toUpperCase();

  const correct = value === word.answer;

  // Update clue list item status
  const clueItem = document.querySelector(`[data-word-index="${i}"]`);
  if (clueItem) {
    clueItem.classList.remove("correct", "incorrect");
    if (value) {
      clueItem.classList.add(correct ? "correct" : "incorrect");
    }
  }

  if (!value) {
    solutionCells[i].textContent = "";
    return;
  }

  if (correct) {
    const letter = word.answer[word.solutionIndex];
    solutionCells[i].textContent = letter;
    solutionCells[i].classList.add("filled");
  } else {
    solutionCells[i].textContent = "";
    solutionCells[i].classList.remove("filled");
  }
}

// Check intersection consistency
function checkIntersections() {
  let conflicts = [];

  intersections.forEach((intersection, index) => {
    const word1Value = wordInputs[intersection.word1Index];
    const word2Value = wordInputs[intersection.word2Index];

    const letter1 = word1Value[intersection.letter1Pos]?.toUpperCase() || "";
    const letter2 = word2Value[intersection.letter2Pos]?.toUpperCase() || "";

    if (letter1 && letter2 && letter1 !== letter2) {
      conflicts.push({
        intersection,
        letter1,
        letter2,
        group: index,
      });
    }
  });

  return conflicts;
}

// ----------- KNOPPEN -----------
document.getElementById("checkBtn").addEventListener("click", () => {
  let correct = 0;

  puzzle.words.forEach((word, i) => {
    checkSingle(i);
    if (wordInputs[i].trim().toUpperCase() === word.answer) {
      correct++;
    }
  });

  toastEl.classList.remove("hidden");

  if (correct === 0) {
    toastEl.textContent = "Nog geen enkel woord is juist.";
    toastEl.className = "toast error";
  } else if (correct < puzzle.words.length) {
    toastEl.textContent = `${correct} van de ${puzzle.words.length} woorden zijn correct.`;
    toastEl.className = "toast";
  } else {
    toastEl.textContent = "Proficiat! Alles is juist!";
    toastEl.className = "toast";
  }
});

document.getElementById("clearBtn").addEventListener("click", () => {
  // Clear all inputs
  for (let i = 0; i < puzzle.words.length; i++) {
    wordInputs[i] = "";
    updateVisualRow(i, "");
    solutionCells[i].textContent = "";
    solutionCells[i].classList.remove("filled");

    // Clear clue list item status
    const clueItem = document.querySelector(`[data-word-index="${i}"]`);
    if (clueItem) {
      clueItem.classList.remove("correct", "incorrect");
    }
  }

  // Clear active clue input
  if (activeWordIndex !== null) {
    activeClueInput.value = "";
    updateActiveClueStatus();
  }

  // Clear selections
  document.querySelectorAll(".clue-list-item").forEach((item) => {
    item.classList.remove("active");
  });
  document.querySelectorAll(".fil-row").forEach((row) => {
    row.classList.remove("active");
  });

  activeWordIndex = null;
  activeClueSection.classList.add("hidden");

  toastEl.classList.add("hidden");
});
