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
const victoryModalEl = document.getElementById("victoryModal");
const victoryVideoEl = document.getElementById("victoryVideo");

const solutionLength = puzzle.words.length;

// Build intersection mapping FIRST, before grid creation
buildIntersectionMap();
console.log(
  "Intersection map initialized:",
  intersectionMap.size,
  "intersections found"
);

// Load saved inputs from localStorage after UI is initialized
setTimeout(loadFromStorage, 100);

// Add global keyboard event listener for typing
document.addEventListener("keydown", (e) => {
  // Only handle keyboard events if there's an active word
  if (activeWordIndex === null) return;

  const wordIndex = activeWordIndex;
  const letterIndex = currentCellPosition;

  // Handle navigation keys
  if (e.key === "ArrowLeft" && letterIndex > 0) {
    e.preventDefault();
    focusGridCell(wordIndex, letterIndex - 1);
  } else if (
    e.key === "ArrowRight" &&
    letterIndex < puzzle.words[wordIndex].answer.length - 1
  ) {
    e.preventDefault();
    focusGridCell(wordIndex, letterIndex + 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    // Navigate to word above (if any)
    const prevWord = wordIndex > 0 ? wordIndex - 1 : null;
    if (prevWord !== null) {
      selectWord(prevWord);
    }
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    // Navigate to word below (if any)
    const nextWord = wordIndex < puzzle.words.length - 1 ? wordIndex + 1 : null;
    if (nextWord !== null) {
      selectWord(nextWord);
    }
  } else if (e.key === "Escape") {
    e.preventDefault();
    handleCellClear(wordIndex, letterIndex);
  } else if (e.key === "Backspace") {
    e.preventDefault();
    handleBackspace(wordIndex, letterIndex);
  } else if (e.key === "Delete") {
    e.preventDefault();
    handleDelete(wordIndex, letterIndex);
  } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
    // Auto-advance to next cell for letters
    e.preventDefault();
    const letter = e.key.toUpperCase();
    handleCellInput(wordIndex, letterIndex, letter);

    // Move to next cell if available
    if (letterIndex < puzzle.words[wordIndex].answer.length - 1) {
      focusGridCell(wordIndex, letterIndex + 1);
    }
  }
});

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

    // Make cells selectable with pointer (no contentEditable)
    c.contentEditable = false;

    // Add intersection styling
    const intersectionInfo = getIntersectionInfo(index, i);
    if (intersectionInfo) {
      // Convert group letter to number for display
      const displayGroupNumber = intersectionInfo.group.charCodeAt(0) - 64;
      console.log(
        `Word ${index}, Position ${i}: Found intersection group ${displayGroupNumber}`
      );
      c.classList.add("intersection-cell");
      c.style.borderColor = intersectionInfo.color;
      c.style.borderWidth = "2px";
      c.style.borderStyle = "solid";
      c.style.background = intersectionInfo.color + "20"; // 20 = 12.5% opacity

      // Add group number indicator
      const groupNumber = document.createElement("div");
      groupNumber.className = "intersection-group-number";
      // Convert group letter to number (A=1, B=2, C=3, etc.)
      const groupNumberValue = intersectionInfo.group.charCodeAt(0) - 64;
      groupNumber.textContent = groupNumberValue;
      groupNumber.style.color = "white";
      groupNumber.style.fontSize = "0.65rem";
      groupNumber.style.fontWeight = "bold";
      groupNumber.style.position = "absolute";
      groupNumber.style.bottom = "-6px";
      groupNumber.style.right = "-6px";
      groupNumber.style.background = intersectionInfo.color;
      groupNumber.style.border = "1px solid " + intersectionInfo.color;
      groupNumber.style.borderRadius = "50%";
      groupNumber.style.width = "16px";
      groupNumber.style.height = "16px";
      groupNumber.style.display = "flex";
      groupNumber.style.alignItems = "center";
      groupNumber.style.justifyContent = "center";
      groupNumber.style.zIndex = "10";
      groupNumber.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";

      c.style.position = "relative";
      c.appendChild(groupNumber);

      c.title = `Intersection Group ${displayGroupNumber} - Connects to: ${intersectionInfo.connected.length} other position(s)`;
    }

    if (i === word.solutionIndex) c.classList.add("solution");

    // Add click handler to select cell for typing
    c.addEventListener("click", () => {
      // If this cell's word is not the active word, make it active
      if (activeWordIndex !== index) {
        selectWord(index);
      }
      // Update the current position
      currentCellPosition = i;

      // Visual feedback for selected cell
      document.querySelectorAll(".fil-cell").forEach((cell) => {
        cell.classList.remove("selected-cell");
      });
      c.classList.add("selected-cell");
    });

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
    console.log(`Adding spacer after word ${index}: ${word.answer}`);
    const spacerRow = document.createElement("div");
    spacerRow.className = "fil-group-spacer";
    console.log(`Created spacer element:`, spacerRow);
    filipGridEl.appendChild(spacerRow);
    console.log(
      `Added spacer to grid. Current grid children:`,
      filipGridEl.children.length
    );
  }
});

// --------- SIMPLE CLUE LIST ----------
const clueListEl = document.getElementById("clueList");
const activeClueSection = document.getElementById("activeClueSection");
const activeClueNumber = document.getElementById("activeClueNumber");
const activeClueLength = document.getElementById("activeClueLength");
const activeClueText = document.getElementById("activeClueText");

// Store input values for each word
let wordInputs = puzzle.words.map(() => "");
let activeWordIndex = null;
let currentCellPosition = 0; // Track current cell position within the active word

// localStorage key for this puzzle
const STORAGE_KEY = `filippine-puzzle-${puzzle.title
  .toLowerCase()
  .replace(/\s+/g, "-")}`;

// Load saved inputs from localStorage
function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === puzzle.words.length) {
        wordInputs = parsed;

        // Update all visual rows with saved data
        for (let i = 0; i < wordInputs.length; i++) {
          updateVisualRow(i, wordInputs[i]);
          checkSingle(i);
        }
      }
    }
  } catch (error) {
    console.warn("Failed to load from localStorage:", error);
  }
}

// Save inputs to localStorage
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wordInputs));
  } catch (error) {
    console.warn("Failed to save to localStorage:", error);
  }
}

// Clear saved inputs from localStorage
function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear localStorage:", error);
  }
}

// Victory Modal Functions
function showVictoryModal() {
  victoryModalEl.classList.remove("hidden");

  // Reset video to beginning and play
  if (victoryVideoEl) {
    victoryVideoEl.currentTime = 0;
    victoryVideoEl.play().catch((error) => {
      console.log("Video autoplay was prevented:", error);
    });
  }

  // Prevent body scroll when modal is open
  document.body.style.overflow = "hidden";
}

function closeVictoryModal() {
  victoryModalEl.classList.add("hidden");

  // Pause and reset video
  if (victoryVideoEl) {
    victoryVideoEl.pause();
    victoryVideoEl.currentTime = 0;
  }

  // Restore body scroll
  document.body.style.overflow = "auto";
}

// Close modal when clicking outside the content
victoryModalEl.addEventListener("click", (e) => {
  if (e.target === victoryModalEl) {
    closeVictoryModal();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !victoryModalEl.classList.contains("hidden")) {
    closeVictoryModal();
  }
});

// Build intersection mapping
function buildIntersectionMap() {
  intersectionMap.clear();

  intersections.forEach((intersection, index) => {
    const color = groupColors[index % groupColors.length];

    // Store intersection for both directions
    const key1 = `${intersection.word1Index}-${intersection.letter1Pos}`;
    const key2 = `${intersection.word2Index}-${intersection.letter2Pos}`;

    if (!intersectionMap.has(key1)) {
      intersectionMap.set(key1, {
        group: intersection.group,
        color,
        connected: [key2],
      });
    } else {
      intersectionMap.get(key1).connected.push(key2);
    }

    if (!intersectionMap.has(key2)) {
      intersectionMap.set(key2, {
        group: intersection.group,
        color,
        connected: [key1],
      });
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

// Handle cell input without contentEditable
function handleCellInput(wordIndex, letterIndex, letter) {
  // Get the current word value
  const currentWordValue = wordInputs[wordIndex];
  let newWordValue = currentWordValue;

  if (letterIndex >= newWordValue.length) {
    newWordValue = newWordValue.padEnd(letterIndex + 1, " ");
  }

  const before = newWordValue.substring(0, letterIndex);
  const after = newWordValue.substring(letterIndex + 1);
  newWordValue = before + letter + after;

  wordInputs[wordIndex] = newWordValue;

  // Handle intersection propagation
  handleCellIntersection(wordIndex, letterIndex, letter);

  // Update the target cell's visual content
  const targetCell = document.querySelector(
    `[data-word-index="${wordIndex}"][data-letter-index="${letterIndex}"]`
  );
  if (targetCell) {
    targetCell.textContent = letter;
  }

  // Update the visual row
  updateVisualRow(wordIndex, newWordValue);

  // Update validation
  checkSingle(wordIndex);

  // Save to localStorage
  saveToStorage();
}

// Handle cell clear
function handleCellClear(wordIndex, letterIndex) {
  handleCellInput(wordIndex, letterIndex, " ");
}

// Handle direct input in grid cells
function handleGridCellInput(cell) {
  const wordIndex = Number(cell.dataset.wordIndex);
  const letterIndex = Number(cell.dataset.letterIndex);

  // Get the letter that was entered (only allow one letter)
  const text = cell.textContent.toUpperCase().replace(/[^A-Z]/g, "");
  if (text.length > 1) {
    cell.textContent = text.charAt(0);
    cell.focus();
    // Place cursor at end
    const range = document.createRange();
    range.selectNodeContents(cell);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // Update the wordInputs array
  const currentWordValue = wordInputs[wordIndex];
  let newWordValue = currentWordValue;

  if (letterIndex >= newWordValue.length) {
    newWordValue = newWordValue.padEnd(letterIndex + 1, " ");
  }

  const before = newWordValue.substring(0, letterIndex);
  const after = newWordValue.substring(letterIndex + 1);
  newWordValue = before + (text || " ") + after;

  wordInputs[wordIndex] = newWordValue;

  // Handle intersection propagation
  handleCellIntersection(wordIndex, letterIndex, text);

  // Update the visual row
  updateVisualRow(wordIndex, newWordValue);

  // Update validation
  checkSingle(wordIndex);

  // Save to localStorage
  saveToStorage();
}

// Handle key events in grid cells
function handleGridCellKeydown(e, wordIndex, letterIndex) {
  // Handle navigation keys
  if (e.key === "ArrowLeft" && letterIndex > 0) {
    e.preventDefault();
    focusGridCell(wordIndex, letterIndex - 1);
  } else if (
    e.key === "ArrowRight" &&
    letterIndex < puzzle.words[wordIndex].answer.length - 1
  ) {
    e.preventDefault();
    focusGridCell(wordIndex, letterIndex + 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    // Save current position before navigating
    if (activeWordIndex === wordIndex) {
      currentCellPosition = letterIndex;
    }
    // Navigate to word above (if any)
    const prevWord = wordIndex > 0 ? wordIndex - 1 : null;
    if (prevWord !== null) {
      selectWord(prevWord);
    }
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    // Save current position before navigating
    if (activeWordIndex === wordIndex) {
      currentCellPosition = letterIndex;
    }
    // Navigate to word below (if any)
    const nextWord = wordIndex < puzzle.words.length - 1 ? wordIndex + 1 : null;
    if (nextWord !== null) {
      selectWord(nextWord);
    }
  } else if (e.key === "Escape") {
    e.preventDefault();
    cell.textContent = "";
    handleGridCellInput(cell);
  } else if (e.key === "Backspace") {
    e.preventDefault();
    handleBackspace(wordIndex, letterIndex);
  } else if (e.key === "Delete") {
    e.preventDefault();
    handleDelete(wordIndex, letterIndex);
  } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
    // Auto-advance to next cell for letters
    e.preventDefault();
    const letter = e.key.toUpperCase();
    const cell = e.target;
    cell.textContent = letter;
    handleGridCellInput(cell);

    // Move to next cell if available
    if (letterIndex < puzzle.words[wordIndex].answer.length - 1) {
      focusGridCell(wordIndex, letterIndex + 1);
    }
  }
}

// Handle delete key functionality
function handleDelete(wordIndex, letterIndex) {
  // Get the current word value
  const currentWordValue = wordInputs[wordIndex];

  // Clear the current cell
  const targetCell = document.querySelector(
    `[data-word-index="${wordIndex}"][data-letter-index="${letterIndex}"]`
  );

  if (targetCell) {
    // Clear the cell content
    targetCell.textContent = "";

    // Remove the letter from wordInputs
    let newWordValue = currentWordValue;
    if (letterIndex < newWordValue.length) {
      const before = newWordValue.substring(0, letterIndex);
      const after = newWordValue.substring(letterIndex + 1);
      newWordValue = before + " " + after;
    }

    // Update the word input
    wordInputs[wordIndex] = newWordValue;

    // Handle intersection propagation - clear the letter from connected cells
    handleCellIntersection(wordIndex, letterIndex, " ");

    // Update the visual row
    updateVisualRow(wordIndex, newWordValue);

    // Update validation
    checkSingle(wordIndex);

    // Save to localStorage
    saveToStorage();
  }
}

// Handle backspace key functionality
function handleBackspace(wordIndex, letterIndex) {
  // Get the current word value
  const currentWordValue = wordInputs[wordIndex];

  // Clear the current cell
  const targetCell = document.querySelector(
    `[data-word-index="${wordIndex}"][data-letter-index="${letterIndex}"]`
  );

  if (targetCell) {
    // Clear the cell content
    targetCell.textContent = "";

    // Remove the letter from wordInputs
    let newWordValue = currentWordValue;
    if (letterIndex < newWordValue.length) {
      const before = newWordValue.substring(0, letterIndex);
      const after = newWordValue.substring(letterIndex + 1);
      newWordValue = before + " " + after;
    }

    // Update the word input
    wordInputs[wordIndex] = newWordValue;

    // Handle intersection propagation - clear the letter from connected cells
    handleCellIntersection(wordIndex, letterIndex, " ");

    // Update the visual row
    updateVisualRow(wordIndex, newWordValue);

    // Update validation
    checkSingle(wordIndex);

    // Save to localStorage
    saveToStorage();
  }

  // Move to previous cell if available
  if (letterIndex > 0) {
    focusGridCell(wordIndex, letterIndex - 1);
  }
}

// Focus a specific grid cell
function focusGridCell(wordIndex, letterIndex) {
  const cell = document.querySelector(
    `[data-word-index="${wordIndex}"][data-letter-index="${letterIndex}"]`
  );
  if (cell) {
    // Update current position if this is for the active word
    if (activeWordIndex === wordIndex) {
      currentCellPosition = letterIndex;
    }

    // Remove previous selected cell styling
    document.querySelectorAll(".fil-cell").forEach((cell) => {
      cell.classList.remove("selected-cell");
    });

    // Add selected cell styling
    cell.classList.add("selected-cell");
  }
}

// Handle intersection propagation from grid cells
function handleCellIntersection(wordIndex, letterIndex, letter) {
  const intersectionInfo = getIntersectionInfo(wordIndex, letterIndex);
  if (!intersectionInfo || !letter.trim()) return;

  // Update all connected positions
  intersectionInfo.connected.forEach((connectedKey) => {
    const [targetWordIndex, targetPos] = connectedKey.split("-").map(Number);

    // Skip if this is the source cell
    if (targetWordIndex === wordIndex && targetPos === letterIndex) return;

    // Get current value of target word
    let targetWordValue = wordInputs[targetWordIndex];

    // Update the specific position
    if (targetWordValue.length <= targetPos) {
      targetWordValue = targetWordValue.padEnd(targetPos + 1, " ");
    }

    // Replace the character at the target position
    const before = targetWordValue.substring(0, targetPos);
    const after = targetWordValue.substring(targetPos + 1);
    targetWordValue = before + letter + after;

    // Update the stored value
    wordInputs[targetWordIndex] = targetWordValue;

    // Update the target cell's visual content
    const targetCell = document.querySelector(
      `[data-word-index="${targetWordIndex}"][data-letter-index="${targetPos}"]`
    );
    if (targetCell) {
      targetCell.textContent = letter;
    }

    // Update the visual row
    updateVisualRow(targetWordIndex, targetWordValue);
  });
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
    });
  }

  // Save to localStorage after propagation
  saveToStorage();
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
  activeClueSection.classList.remove("hidden");

  activeWordIndex = index;
  updateVisualRow(index, wordInputs[index]);

  // If we have a current position that's valid for this word, use it
  // Otherwise find the first empty cell, or default to 0
  let targetCellIndex = currentCellPosition;
  const wordLength = puzzle.words[index].answer.length;

  // Validate that the current position is within bounds
  if (targetCellIndex < 0 || targetCellIndex >= wordLength) {
    targetCellIndex = findFirstEmptyCell(index);
  }

  focusGridCell(index, targetCellIndex);
}

// Find the first empty cell in a word, or return 0 if all are filled
function findFirstEmptyCell(wordIndex) {
  const wordValue = wordInputs[wordIndex];
  for (let i = 0; i < wordValue.length; i++) {
    if (!wordValue[i] || wordValue[i] === " ") {
      return i;
    }
  }
  return 0; // If all filled, start from first cell
}

// ----------- INPUT FIELD MANAGEMENT -----------

// ----------- VISUELE UPDATE -----------
function updateVisualRow(index, text) {
  const info = visualRows[index];
  const letters = text.toUpperCase().padEnd(info.word.answer.length, " ");

  info.cells.forEach((cell) => {
    const li = Number(cell.dataset.letterIndex);
    if (li < 0) return; // ghost cell

    // Preserve child elements (like intersection group numbers) while updating the cell
    const intersectionNumbers = Array.from(
      cell.querySelectorAll(".intersection-group-number")
    );

    const ch = letters[li] === " " ? "" : letters[li];

    // Clear the cell content but preserve child elements
    while (cell.firstChild) {
      cell.removeChild(cell.firstChild);
    }

    // Add the letter if it's not empty
    if (ch) {
      cell.textContent = ch;
    }

    cell.classList.toggle("filled", ch !== "");

    // Restore intersection group numbers if they existed
    intersectionNumbers.forEach((num) => {
      cell.appendChild(num);
    });
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

    // Show victory modal with video when puzzle is completely solved
    setTimeout(() => {
      showVictoryModal();
    }, 1000); // Delay to let the toast message show first
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

  // Clear selections
  document.querySelectorAll(".clue-list-item").forEach((item) => {
    item.classList.remove("active");
  });
  document.querySelectorAll(".fil-row").forEach((row) => {
    row.classList.remove("active");
  });
  document.querySelectorAll(".fil-cell").forEach((cell) => {
    cell.classList.remove("selected-cell");
  });

  activeWordIndex = null;
  currentCellPosition = 0;
  activeClueSection.classList.add("hidden");

  toastEl.classList.add("hidden");

  // Close victory modal if open
  closeVictoryModal();

  // Clear localStorage
  clearStorage();
});
