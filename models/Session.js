const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const questSchema = new Schema({
    question: { type: String, required: true },
    userAns: { type: String, default: "" },
    aiFeedback: { type: String, default: "" },
    score: { type: Number, min: 0, max: 10, default: 0 },
    timeTaken: { type: Number, default: 0 }
})

const sessionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ["Frontend Developer", "Backend Developer", "Fullstack Developer", "Mobile Developer", "Data Analyst", "UI/UX Designer", "Software Engineer", "Technical Support Engineer", "Data Scientist", "CyberSecurity Analyst", "DevOps Engineer", "Product Manager"]
    },
    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        default: "Medium",
    },
    experienceLevel: {
        type: String,
        enum: ['Entry Level (0-2 years)', 'Mid Level (2-5 years)', 'Senior Level (5-8 years)', 'Lead Level (8+ years)'],
        required: true,
    },
    interviewType: {
        type: String,
        enum: ['Technical', 'Behavioral', 'Mixed', 'HR'],
        default: 'Mixed',
    },
    questionCount: {
        type: Number,
        default: 5,
    },
    jobDescription: {
        type: String,
        default: "",
    },
    questions: [questSchema],
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    improvements: [{ type: String }]
}, { timestamps: true }
);

sessionSchema.pre("save", function () {
    if (this.questions.length > 0) {
        this.maxScore = this.questions.length * 10;
        this.totalScore = this.questions.reduce((sum, q) => sum + (q.score || 0), 0);
    }
});

module.exports = mongoose.model("Session", sessionSchema);

