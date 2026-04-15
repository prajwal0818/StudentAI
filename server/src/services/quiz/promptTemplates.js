const QUIZ_GENERATION_TEMPLATE = `You are an expert educator creating quiz questions from study materials.

Generate {questionCount} quiz questions with the following distribution:
- Difficulty level: {difficulty}
- {mcqCount} Multiple Choice Questions (MCQ) with exactly 4 options each
- {shortAnswerCount} Short Answer questions
- {trueFalseCount} True/False questions

Context from study materials:
{context}

CRITICAL REQUIREMENTS:
1. All questions MUST be directly answerable from the provided context
2. Do NOT introduce external knowledge
3. Each question must cite the specific context chunk it's based on
4. Difficulty guidelines:
   - Easy: Direct recall from context (definitions, facts)
   - Medium: Understanding and comprehension (explain, describe)
   - Hard: Analysis and application (compare, analyze, evaluate)
5. For MCQs:
   - All 4 options must be plausible
   - Only ONE correct answer
   - Incorrect options should be reasonable but clearly wrong
6. For Short Answer:
   - Provide the main correct answer
   - Include 2-3 acceptable alternative phrasings in acceptableAnswers array
7. For True/False:
   - correctAnswer must be exactly "true" or "false" (lowercase)

OUTPUT FORMAT - Return ONLY a valid JSON array with NO markdown formatting, NO code blocks:
[
  {{
    "type": "mcq",
    "difficulty": "easy",
    "question": "What is the definition of X?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "acceptableAnswers": [],
    "explanation": "The context states that X is defined as... (cite specific section)",
    "contextChunk": "Relevant excerpt from context that supports this question..."
  }},
  {{
    "type": "short_answer",
    "difficulty": "medium",
    "question": "Explain the process of Y.",
    "options": [],
    "correctAnswer": "Y is a process where...",
    "acceptableAnswers": ["Y involves...", "The Y process is...", "Y can be described as..."],
    "explanation": "The context describes Y as... (cite specific section)",
    "contextChunk": "Relevant excerpt from context..."
  }},
  {{
    "type": "true_false",
    "difficulty": "easy",
    "question": "Z always occurs before W.",
    "options": [],
    "correctAnswer": "false",
    "acceptableAnswers": [],
    "explanation": "The context indicates that W can occur independently of Z.",
    "contextChunk": "Relevant excerpt from context..."
  }}
]

Generate {questionCount} questions now. Return ONLY the JSON array with no additional text.`;

const SHORT_ANSWER_EVAL_TEMPLATE = `You are evaluating a student's short answer response.

Question: {question}

Correct Answer: {correctAnswer}

Student's Answer: {userAnswer}

Context (for reference): {contextChunk}

Evaluate if the student's answer is semantically equivalent to the correct answer:
- Focus on meaning, not exact wording
- Allow for reasonable paraphrasing
- Accept answers that convey the core concept correctly
- Be lenient with minor grammatical differences
- Be strict about factual accuracy

Return ONLY a JSON object with NO markdown formatting:
{{
  "isCorrect": true or false,
  "confidence": 0.0 to 1.0,
  "feedback": "Brief explanation of why the answer is correct/incorrect (2-3 sentences)"
}}

Evaluate now. Return ONLY the JSON object.`;

module.exports = {
  QUIZ_GENERATION_TEMPLATE,
  SHORT_ANSWER_EVAL_TEMPLATE
};
