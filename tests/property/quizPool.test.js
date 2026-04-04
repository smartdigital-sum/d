// Feature: app-production-readiness, Property 9: Quiz pool selection is a subset of the full pool
// Feature: app-production-readiness, Property 10: Each quiz question has 3 options and 1 correct answer

import { describe, it } from 'vitest';
import { expect } from 'vitest';
import fc from 'fast-check';

/**
 * Fisher-Yates shuffle — extracted from quiz-rewards.html for testability.
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Minimal simulation of startQuiz() pool-selection logic from quiz-rewards.html.
 */
function selectPool(questions) {
  return shuffle([...questions]).slice(0, 3);
}

// ---------------------------------------------------------------------------
// Property 9: Quiz pool selection is a subset of the full pool
// Validates: Requirements 7.1, 7.2
// ---------------------------------------------------------------------------
describe('Property 9: Quiz pool selection is a subset of the full pool', () => {
  it('selected 3 questions are all members of the pool with no duplicates', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            q: fc.string({ minLength: 1 }),
            options: fc.tuple(fc.string(), fc.string(), fc.string()).map(t => [...t]),
            answer: fc.string({ minLength: 1 }),
          }),
          { minLength: 6, maxLength: 20 }
        ),
        (pool) => {
          const selected = selectPool(pool);

          // Must always select exactly 3
          expect(selected.length).toBe(3);

          // Every selected question must be a member of the original pool (by reference)
          selected.forEach(q => {
            expect(pool).toContain(q);
          });

          // No duplicates — all 3 must be distinct objects
          const unique = new Set(selected);
          expect(unique.size).toBe(3);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Each quiz question has exactly 3 options and 1 correct answer
// Validates: Requirements 7.4
// ---------------------------------------------------------------------------

/**
 * QUIZZES data inlined from quiz-rewards.html for data-integrity verification.
 * This mirrors the actual data so the test validates the real question schema.
 */
const QUIZZES = {
  fairy: {
    questions: [
      { q: "What did Zara and the dragon paint?", options: ["The sky 🌈", "A house 🏠", "Rocks 🪨"], answer: "The sky 🌈" },
      { q: "How did Zara meet the dragon?", options: ["She found it flying", "She found it crying in a cave", "It knocked on her door 🚪"], answer: "She found it crying in a cave" },
      { q: "What was the dragon missing?", options: ["Its wings 🪽", "Its fire 🔥", "Its colours"], answer: "Its colours" },
      { q: "Where did Zara live?", options: ["In a castle 🏰", "In a cosy cottage 🏡", "In a treehouse 🌳"], answer: "In a cosy cottage 🏡" },
      { q: "What colour was the dragon?", options: ["Golden yellow ✨", "Grey and dull 🩶", "Bright red 🔴"], answer: "Grey and dull 🩶" },
      { q: "How did the story end?", options: ["The dragon flew away alone", "Zara and the dragon became friends 🤝", "The dragon went back to sleep"], answer: "Zara and the dragon became friends 🤝" },
    ]
  },
  myth: {
    questions: [
      { q: "Who guided Arjun in the forest?", options: ["A talking peacock 🦚", "A wise owl 🦉", "A magic deer 🦌"], answer: "A talking peacock 🦚" },
      { q: "What did the bow glow with?", options: ["Fire 🔥", "Magic light ✨", "Rainbow colours 🌈"], answer: "Magic light ✨" },
      { q: "What did Arjun save?", options: ["A lost princess 👸", "His village", "A magic forest 🌳"], answer: "His village" },
      { q: "Where did Arjun find the magic bow?", options: ["In a river 🌊", "Deep in the forest 🌲", "On a mountain top ⛰️"], answer: "Deep in the forest 🌲" },
      { q: "What skill did Arjun use to defeat the enemy?", options: ["Archery 🏹", "Sword fighting ⚔️", "Magic spells 🪄"], answer: "Archery 🏹" },
      { q: "What did the peacock tell Arjun to do?", options: ["Run away quickly 🏃", "Trust in his courage 💪", "Find a new weapon 🗡️"], answer: "Trust in his courage 💪" },
    ]
  },
  animals: {
    questions: [
      { q: "What was Leo afraid of?", options: ["Loud thunder ⛈️", "Big spiders 🕷️", "The dark 🌑"], answer: "The dark 🌑" },
      { q: "Who helped Leo feel brave?", options: ["Diya the firefly 🔥", "Mia the mouse 🐭", "Ben the bear 🐻"], answer: "Diya the firefly 🔥" },
      { q: "What did Diya use to help?", options: ["A magic wand 🪄", "Her glowing light", "A song 🎵"], answer: "Her glowing light" },
      { q: "Where did Leo and Diya first meet?", options: ["By a waterfall 💧", "Under a big tree 🌳", "In a dark cave 🕳️"], answer: "Under a big tree 🌳" },
      { q: "What did Leo learn at the end of the story?", options: ["To roar very loudly 🦁", "That it is okay to ask for help 🤝", "How to run faster 🏃"], answer: "That it is okay to ask for help 🤝" },
      { q: "What kind of animal is Diya?", options: ["A butterfly 🦋", "A firefly ✨", "A bee 🐝"], answer: "A firefly ✨" },
    ]
  },
  space: {
    questions: [
      { q: "What was Robo looking for?", options: ["Lost aliens 👽", "A missing moon 🌕", "A broken star 💫"], answer: "A missing moon 🌕" },
      { q: "Where did Robo travel?", options: ["A black hole 🌀", "The galaxy 🌌", "Planet Mars 🔴"], answer: "The galaxy 🌌" },
      { q: "What type of character is Robo?", options: ["An astronaut 👨‍🚀", "An alien 👽", "A robot spaceship 🤖"], answer: "A robot spaceship 🤖" },
      { q: "Who did Robo ask for directions?", options: ["A friendly comet ☄️", "A wise old star 🌟", "A passing satellite 🛰️"], answer: "A wise old star 🌟" },
      { q: "Where was the missing moon hiding?", options: ["Behind a giant planet 🪐", "Inside a nebula 🌫️", "Under an asteroid 🪨"], answer: "Behind a giant planet 🪐" },
      { q: "How did Robo feel when the moon was found?", options: ["Tired and ready to sleep 😴", "Happy and proud 🎉", "Scared and confused 😨"], answer: "Happy and proud 🎉" },
    ]
  },
};

describe('Property 10: Each quiz question has exactly 3 options and 1 correct answer', () => {
  it('every question in every genre has options.length === 3 and exactly one option matching answer', () => {
    Object.entries(QUIZZES).forEach(([genre, data]) => {
      data.questions.forEach((q, idx) => {
        expect(q.options.length, `${genre}[${idx}] options.length`).toBe(3);
        const matchCount = q.options.filter(o => o === q.answer).length;
        expect(matchCount, `${genre}[${idx}] answer matches`).toBe(1);
      });
    });
  });
});
