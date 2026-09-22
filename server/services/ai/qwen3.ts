import crypto from "crypto";
import axios from "axios";
import { getDb, schema } from "../../db";

export interface AIResponse<T> {
  success: boolean;
  data: T | null;
  model: string;
  confidence: number;
  inputHash: string;
  error?: string;
}

export interface ResumeAnalysis {
  candidateName?: string;
  skills: string[];
  education: Array<{ degree: string; institution: string; year?: number; cgpa?: number }>;
  projects: Array<{ title: string; description: string; technologies: string[] }>;
  experience: Array<{ company: string; role: string; duration?: string; description?: string }>;
  certifications: string[];
  technologies: string[];
}

export interface ProjectAnalysis {
  technicalSkills: string[];
  engineeringConcepts: string[];
  role: string;
  complexity: "Beginner" | "Intermediate" | "Advanced";
  demonstratedCapabilities: string[];
  missingInformation: string[];
  evidenceQualityScore: number;
  rationale: string;
}

export interface EvidenceAnalysis {
  extractedSkills: string[];
  evidenceQuality: "Weak" | "Moderate" | "Strong";
  demonstratedCapabilities: string[];
  verificationRecommendation: "APPROVE" | "NEEDS_REVIEW" | "REJECT";
  confidence: number;
  rationale: string;
}

export interface CareerRecommendations {
  recommendedRoles: string[];
  primaryRoleFitScore: number;
  skillGaps: string[];
  improvementActions: Array<{ title: string; skill: string; time: string; reason: string }>;
  learningPriorities: string[];
  readinessSummary: string;
}

export interface JobMatch {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  evidenceStrength: "Low" | "Medium" | "High";
  explanation: string;
}

function computeHash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}

export class Qwen3Provider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private isConfigured: boolean;

  constructor() {
    this.apiKey = process.env.QWEN_API_KEY || "";
    this.baseUrl = (process.env.QWEN_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1").replace(/\/+$/, "");
    this.model = process.env.QWEN_MODEL || "qwen-plus";
    this.isConfigured = Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public getStatus() {
    return {
      configured: this.isConfigured,
      model: this.model,
      baseUrl: this.baseUrl,
    };
  }

  private async callChatCompletion(systemPrompt: string, userContent: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error(
        "Qwen3 AI service is not configured. Please set QWEN_API_KEY and optional QWEN_BASE_URL in your environment variables."
      );
    }

    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 30000,
      }
    );

    const text = response.data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("Empty response returned by Qwen3 API");
    }
    return text;
  }

  private async recordAnalysis(
    studentId: number,
    analysisType: string,
    inputHash: string,
    outputJson: Record<string, any>,
    confidence: number,
    documentId?: number,
    evidenceId?: number
  ) {
    try {
      const db = await getDb();
      await db.insert(schema.aiAnalysis).values({
        studentId,
        documentId: documentId ?? null,
        evidenceId: evidenceId ?? null,
        model: this.model,
        modelVersion: "1.0",
        promptVersion: "1.0",
        analysisType,
        inputHash,
        outputJson,
        confidence: confidence.toFixed(2),
      });
    } catch (e) {
      console.warn("[Qwen3] Failed to log AI analysis record:", e);
    }
  }

  // 1. Resume Analysis
  async analyzeResume(text: string, studentId: number, documentId?: number): Promise<AIResponse<ResumeAnalysis>> {
    const inputHash = computeHash(text);

    if (!this.isConfigured) {
      return {
        success: false,
        data: null,
        model: this.model,
        confidence: 0,
        inputHash,
        error: "Qwen3 API key is not configured. Document saved; manual skill entry is available.",
      };
    }

    try {
      const systemPrompt = `You are an expert AI career intelligence parser for Career OS.
Extract structured information from the provided resume text.
Return ONLY valid JSON matching this schema:
{
  "candidateName": string,
  "skills": string[],
  "education": [{"degree": string, "institution": string, "year": number, "cgpa": number}],
  "projects": [{"title": string, "description": string, "technologies": string[]}],
  "experience": [{"company": string, "role": string, "duration": string, "description": string}],
  "certifications": string[],
  "technologies": string[]
}`;

      const raw = await this.callChatCompletion(systemPrompt, text);
      const parsed: ResumeAnalysis = JSON.parse(raw);

      await this.recordAnalysis(studentId, "RESUME_EXTRACTION", inputHash, parsed, 0.92, documentId);

      return {
        success: true,
        data: parsed,
        model: this.model,
        confidence: 0.92,
        inputHash,
      };
    } catch (err: any) {
      console.error("[Qwen3] Resume analysis error:", err.message);
      return {
        success: false,
        data: null,
        model: this.model,
        confidence: 0,
        inputHash,
        error: err.message || "Failed to analyze resume with Qwen3",
      };
    }
  }

  // 2. Skill Extraction
  async extractSkills(content: string, context: string = ""): Promise<AIResponse<{ skills: string[]; confidence: number }>> {
    const inputHash = computeHash(content + context);

    if (!this.isConfigured) {
      return {
        success: false,
        data: null,
        model: this.model,
        confidence: 0,
        inputHash,
        error: "Qwen3 API key not configured.",
      };
    }

    try {
      const systemPrompt = `You are a skill extraction engine for Career OS.
Extract demonstrably evident technical and domain skills from the text.
Map them to normalized industry names (e.g. Python, React, PostgreSQL, System Design).
Return ONLY JSON:
{
  "skills": string[],
  "confidence": number
}`;

      const raw = await this.callChatCompletion(systemPrompt, `Context: ${context}\n\nContent:\n${content}`);
      const parsed = JSON.parse(raw);

      return {
        success: true,
        data: parsed,
        model: this.model,
        confidence: parsed.confidence ?? 0.85,
        inputHash,
      };
    } catch (err: any) {
      return {
        success: false,
        data: null,
        model: this.model,
        confidence: 0,
        inputHash,
        error: err.message,
      };
    }
  }

  // 3. Project Analysis
  async analyzeProject(
    project: { title: string; description: string; technologies: string[] },
    studentId: number
  ): Promise<AIResponse<ProjectAnalysis>> {
    const inputHash = computeHash(JSON.stringify(project));

    if (!this.isConfigured) {
      return {
        success: false,
        data: null,
        model: this.model,
        confidence: 0,
        inputHash,
        error: "Qwen3 API key not configured.",
      };
    }

    try {
      const systemPrompt = `You are an engineering project reviewer for Career OS.
Analyze the project claims and determine technical depth, complexity, and capabilities.
Return ONLY JSON:
{
  "technicalSkills": string[],
  "engineeringConcepts": string[],
  "role": string,
  "complexity": "Beginner" | "Intermediate" | "Advanced",
  "demonstratedCapabilities": string[],
  "missingInformation": string[],
  "evidenceQualityScore": number (1-100),
  "rationale": string
}`;

      const raw = await this.callChatCompletion(systemPrompt, JSON.stringify(project));
      const parsed: ProjectAnalysis = JSON.parse(raw);

      await this.recordAnalysis(studentId, "PROJECT_ANALYSIS", inputHash, parsed, 0.9);

      return {
        success: true,
        data: parsed,
        model: this.model,
        confidence: 0.9,
        inputHash,
      };
    } catch (err: any) {
      return {
        success: false,
        data: null,
        model: this.model,
        confidence: 0,
        inputHash,
        error: err.message,
      };
    }
  }

  // 4. Evidence Analysis
  async analyzeEvidence(
    evidence: { title: string; description: string; type: string; source: string },
    studentId: number,
    evidenceId?: number
  ): Promise<AIResponse<EvidenceAnalysis>> {
    const inputHash = computeHash(JSON.stringify(evidence));

    if (!this.isConfigured) {
      return {
        success: false,
        data: null,
        model: this.model,
        confidence: 0,
        inputHash,
        error: "Qwen3 API key not configured.",
      };
    }

    try {
      const systemPrompt = `You are an evidence verification assistant for Career OS.
Examine this student claim. Do not hallucinate skills not supported by the evidence.
Return ONLY JSON:
{
  "extractedSkills": string[],
  "evidenceQuality": "Weak" | "Moderate" | "Strong",
  "demonstratedCapabilities": string[],
  "verificationRecommendation": "APPROVE" | "NEEDS_REVIEW" | "REJECT",
  "confidence": number (0-1),
  "rationale": string
}`;

      const raw = await this.callChatCompletion(systemPrompt, JSON.stringify(evidence));
      const parsed: EvidenceAnalysis = JSON.parse(raw);

      await this.recordAnalysis(studentId, "SKILL_MAPPING", inputHash, parsed, parsed.confidence, undefined, evidenceId);

      return {
        success: true,
        data: parsed,
        model: this.model,
        confidence: parsed.confidence,
        inputHash,
      };
    } catch (err: any) {
      return {
        success: false,
        data: null,
        model: this.model,
        confidence: 0,
        inputHash,
        error: err.message,
      };
    }
  }

  // 5. Career Recommendations
  async generateCareerRecommendations(
    studentProfile: any,
    skills: string[],
    projects: any[],
    targetRole: string
  ): Promise<AIResponse<CareerRecommendations>> {
    const payload = { studentProfile, skills, projects, targetRole };
    const inputHash = computeHash(JSON.stringify(payload));

    if (!this.isConfigured) {
      return {
        success: false,
        data: null,
        model: this.model,
        confidence: 0,
        inputHash,
        error: "Qwen3 API key not configured.",
      };
    }

    try {
      const systemPrompt = `You are the Career OS Career Guidance Intelligence engine.
Given the student's profile, skills, projects and target role, analyze their readiness and prioritize actionable roadmap steps.
Return ONLY JSON:
{
  "recommendedRoles": string[],
  "primaryRoleFitScore": number (0-100),
  "skillGaps": string[],
  "improvementActions": [
    {"title": string, "skill": string, "time": string, "reason": string}
  ],
  "learningPriorities": string[],
  "readinessSummary": string
}`;

      const raw = await this.callChatCompletion(systemPrompt, JSON.stringify(payload));
      const parsed: CareerRecommendations = JSON.parse(raw);

      await this.recordAnalysis(studentProfile.id, "CAREER_RECOMMENDATION", inputHash, parsed, 0.88);

      return {
        success: true,
        data: parsed,
        model: this.model,
        confidence: 0.88,
        inputHash,
      };
    } catch (err: any) {
      return {
        success: false,
        data: null,
        model: this.model,
        confidence: 0,
        inputHash,
        error: err.message,
      };
    }
  }

  // 6. Job Matching
  async matchCandidateToJob(candidate: any, job: any): Promise<AIResponse<JobMatch>> {
    const payload = { candidate, job };
    const inputHash = computeHash(JSON.stringify(payload));

    if (!this.isConfigured) {
      return {
        success: false,
        data: null,
        model: this.model,
        confidence: 0,
        inputHash,
        error: "Qwen3 API key not configured.",
      };
    }

    try {
      const systemPrompt = `You are the Career OS Match Engine.
Compare candidate demonstrated capabilities against job requirements.
Return ONLY JSON:
{
  "matchScore": number (0-100),
  "matchedSkills": string[],
  "missingSkills": string[],
  "evidenceStrength": "Low" | "Medium" | "High",
  "explanation": string
}`;

      const raw = await this.callChatCompletion(systemPrompt, JSON.stringify(payload));
      const parsed: JobMatch = JSON.parse(raw);

      return {
        success: true,
        data: parsed,
        model: this.model,
        confidence: 0.9,
        inputHash,
      };
    } catch (err: any) {
      return {
        success: false,
        data: null,
        model: this.model,
        confidence: 0,
        inputHash,
        error: err.message,
      };
    }
  }

  // 7. Readiness Explanation
  async generateReadinessExplanation(assessment: any): Promise<string> {
    if (!this.isConfigured) {
      return "Readiness score is calculated from your verified evidence, academic records, project submissions, and target role alignment.";
    }

    try {
      const systemPrompt = `You are the Career OS Career Readiness Explainer.
Given this assessment breakdown, provide a concise, transparent 2-sentence explanation of why the student received this score and what would improve it most.`;

      const response = await this.callChatCompletion(systemPrompt, JSON.stringify(assessment));
      return response.trim();
    } catch {
      return "Readiness score is calculated from your verified evidence, academic records, project submissions, and target role alignment.";
    }
  }
}

export const qwen3 = new Qwen3Provider();
