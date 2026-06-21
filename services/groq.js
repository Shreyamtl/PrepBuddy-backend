const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Helper function for consistent API calls
async function getGroqResponse(messages, model = "llama-3.1-8b-instant") {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model,
      temperature: 0.7,
      max_tokens: 500,
    });

    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq API Error:", error);
    throw error;
  }
}

async function generateQuest(role, difficulty,experienceLevel= "Entry Level (0-2 years)", questionCount = 5, jobDescription = "", interviewType = "Mixed") {
  try {
    const jdContext = jobDescription
      ? `\nJob Description:\n${jobDescription.substring(0, 500)}`
      : "";

    const typeInstructions = {
      Technical: "Focus on coding, system design, technical concepts, and problem-solving.",
      Behavioral: "Focus on past experiences, soft skills, teamwork, and situation-based questions using STAR format.",
      Mixed: "Mix of technical concepts and behavioral/situational questions.",
      HR: "Focus on culture fit, career goals, salary expectations, strengths/weaknesses, and work style.",
    };

    const prompt = `
You are a professional interviewer. Generate exactly  ${questionCount} ${difficulty} level ${interviewType} interview questions
for a ${role} position at ${experienceLevel} experience level.
Interview Focus: ${typeInstructions[interviewType]}
${jdContext}
Rules:
- Questions must be appropriate for ${experienceLevel} experience
- Follow the ${interviewType} interview style strictly
- Each question should test real practical knowledge
- ${jobDescription ? "Make questions relevant to the job description provided" : "Generate role-specific questions"}
- Every question must strictly match the selected difficulty.
- Return ONLY a JSON array of ${questionCount} strings, no extra text
- Example format: ["Question 1?", "Question 2?", ...]

Return only the JSON array.
`;

    const text = await getGroqResponse([
      { role: "system", content: "You are a technical interviewer. Return only valid JSON." },
      { role: "user", content: prompt }
    ]);

    const clean = text.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(clean);

    if (!Array.isArray(questions) || questions.length !== questionCount) {
      throw new Error("Groq returned unexpected format");
    }
    return questions;
  } catch (err) {
    console.error("generateQuest error:", err.message);
    // Fallback questions
    return [
      `What is your experience with ${role} development?`,
      `Describe a challenging ${role} project you worked on.`,
      `What are the best practices for ${role} development?`,
      `How do you stay updated with ${role} technologies?`,
      `Explain a complex ${difficulty} level concept in ${role}.`
    ];
  }
}

async function evaluateAns(question, userAnswer, role) {
  if (!userAnswer || userAnswer.trim().length < 5) {
    return { score: 0, aifeedback: "No answer provided." };
  }

  try {
    const prompt = `
You are an expert ${role} interviewer evaluating a candidate's answer.

Question: "${question}"
Candidate's Answer: "${userAnswer}"

Evaluate the answer and return ONLY a JSON object with:
- "score": integer from 0-10 (0=no answer, 5=partial, 10=excellent)
- "aifeedback": 2-3 sentences explaining what was good, what was missing, and what the ideal answer includes

Return only the JSON object, no extra text.
Example: {"score": 7, "aifeedback": "Good understanding of X. Missed Y. Ideally you should also mention Z."}
`;

    const text = await getGroqResponse([
      { role: "system", content: "You are an expert interviewer. Return only valid JSON." },
      { role: "user", content: prompt }
    ]);

    const clean = text.replace(/```json|```/g, "").trim();
    const evaluation = JSON.parse(clean);

    return {
      score: Math.min(10, Math.max(0, Number(evaluation.score) || 0)),
      aifeedback: evaluation.aifeedback || evaluation.feedback || "Could not evaluate answer.",
    };
  } catch (err) {
    console.error("evaluateAns error:", err.message);
    return {
      score: 5,
      aifeedback: "Answer received but evaluation failed. Please review your answer."
    };
  }
}

async function summarizeSession(questions) {
  try {
    const answeredQuestions = questions.filter(q => q.userAns && q.userAns.trim().length > 0);

    if (answeredQuestions.length === 0) {
      return { improvements: ["Complete the interview to get personalized feedback"] };
    }

    const simplifiedData = answeredQuestions.map(q => ({
      question: q.question?.substring(0, 200),
      candidateAnswer: q.userAns?.substring(0, 200),  
      score: q.score,
      feedback: q.aifeedback
    }));

    const prompt = `You are an interview coach reviewing a candidate's performance.
    Here are the candidate's answers and scores:
    ${JSON.stringify(simplifiedData, null, 2)}
Based on the candidate's ANSWERS and SCORES, identify 3 specific areas where the CANDIDATE needs to improve.

Rules:
- Focus on what the CANDIDATE said or missed in their answers
- Give actionable advice for the candidate to improve their knowledge
- Do NOT suggest improving the questions
- Do NOT say "improve depth of questions"
- Examples of good improvements: "Study React lifecycle methods in depth", "Practice explaining async/await with examples", "Learn more about database indexing"

Return ONLY a JSON object:
{"improvements": ["improvement 1", "improvement 2", "improvement 3"]}
No extra text.
`;

    const text = await getGroqResponse([
      { role: "system", content: "You are an expert interviewer. Return only valid JSON." },
      { role: "user", content: prompt }
    ]);

    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3) : []
    };
  } catch (err) {
    console.error("summarizeSession error:", err.message);
    return {
      improvements: [
        "Review questions you scored low on",
        "Practice structuring your answers better",
        "Use more examples in your responses"
      ]
    };
  }
}

module.exports = { generateQuest, evaluateAns, summarizeSession };