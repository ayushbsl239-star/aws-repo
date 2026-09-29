import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Award,
  Layers,
  Clock,
  Mic,
  FileText,
  Upload,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { ErrorAlert } from '../components/ErrorAlert';

const SUGGESTED_ROLES = [
  'Software Engineer',
  'Data Analyst',
  'Business Analyst',
  'Product Manager',
  'Cloud Engineer',
  'Cybersecurity Analyst',
  'Data Scientist',
  'DevOps Engineer',
  'Custom Role',
];

const EXPERIENCE_LEVELS = [
  { id: 'Fresher', label: 'Fresher', desc: 'Recent graduate / career transition' },
  { id: '0–2 years', label: '0–2 years', desc: 'Junior / Associate level' },
  { id: '2–5 years', label: '2–5 years', desc: 'Mid-level / Established practitioner' },
  { id: '5–10 years', label: '5–10 years', desc: 'Senior / Technical lead' },
  { id: '10+ years', label: '10+ years', desc: 'Staff / Principal / Director' },
];

const INTERVIEW_TYPES = [
  { id: 'technical', label: 'Technical', desc: 'Coding principles, architecture, system tradeoffs' },
  { id: 'behavioral', label: 'Behavioural', desc: 'STAR-format leadership, teamwork, conflict resolution' },
  { id: 'mixed', label: 'Mixed', desc: 'Balanced combination of technical depth and leadership' },
  { id: 'job_specific', label: 'Job-specific', desc: 'Tuned precisely to supplied Job Description' },
];

const LENGTH_OPTIONS = [
  { count: 5, label: 'Quick — 5 questions', desc: 'Fast diagnostic check (approx. 10 mins)' },
  { count: 8, label: 'Standard — 8 questions', desc: 'Comprehensive competency sweep (approx. 20 mins)' },
  { count: 12, label: 'Deep — 12 questions', desc: 'Intensive senior scenario interrogation (approx. 35 mins)' },
];

const INPUT_MODES = [
  { id: 'text', label: 'Text Only', desc: 'Type answers directly with code/markdown formatting' },
  { id: 'voice', label: 'Voice Only', desc: 'Push-to-talk speech with Amazon Transcribe' },
  { id: 'text_voice', label: 'Text + Voice', desc: 'Flexible speech with editable transcript and typing' },
];

export const NewInterviewWizardPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const totalSteps = 8;

  // Wizard Form State
  const [role, setRole] = useState('Data Analyst');
  const [customRole, setCustomRole] = useState('');
  const [experience, setExperience] = useState('Fresher');
  const [interviewType, setInterviewType] = useState('mixed');
  const [questionLimit, setQuestionLimit] = useState(5);
  const [inputMode, setInputMode] = useState('text');
  
  // Document state
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRole = role === 'Custom Role' ? customRole : role;

  const handleNext = () => {
    setError(null);
    if (step === 1 && role === 'Custom Role' && !customRole.trim()) {
      setError('Please specify your custom target role.');
      return;
    }
    if (step < totalSteps) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep((s) => s - 1);
  };

  const handleStartInterview = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create interview configuration
      const interview = await api.createInterview({
        role: activeRole,
        experience,
        interview_type: interviewType,
        question_limit: questionLimit,
        input_mode: inputMode,
        job_description_text: jobDescriptionText.trim() || undefined,
        resume_text: resumeText.trim() || undefined,
      });

      // 2. Start session & retrieve first Bedrock question
      await api.startInterview(interview.interview_id);

      // 3. Navigate to active interview screen
      navigate(`/interview/${interview.interview_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize adaptive interview. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (type: 'jd' | 'resume', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Document exceeds 5MB limit. Please upload a smaller file.');
      return;
    }

    if (type === 'jd') {
      setJdFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setJobDescriptionText((event.target?.result as string) || '');
      reader.readAsText(file);
    } else {
      setResumeFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setResumeText((event.target?.result as string) || '');
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Wizard Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
          <span>STEP {step} OF {totalSteps}</span>
          <span>{Math.round((step / totalSteps) * 100)}% COMPLETE</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Main Wizard Card */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-zinc-800 shadow-2xl relative">
        {/* STEP 1: TARGET ROLE */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-400" />
                Select Your Target Role
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Bedrock will tune competency models and technical vocabulary to this discipline.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {SUGGESTED_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-3.5 rounded-xl border text-left text-xs font-medium transition-all ${
                    role === r
                      ? 'border-brand-500 bg-brand-500/10 text-brand-200 shadow-md shadow-brand-500/10'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{r}</span>
                    {role === r && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
                  </div>
                </button>
              ))}
            </div>

            {role === 'Custom Role' && (
              <div className="pt-2 animate-fade-in">
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Specify Custom Job Title
                </label>
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g. Solutions Architect, Machine Learning Engineer..."
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-brand-500 text-sm text-zinc-100 outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 2: EXPERIENCE */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                Select Experience Seniority
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Calibrates baseline question complexity, expected depth of trade-offs, and autonomy.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {EXPERIENCE_LEVELS.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => setExperience(exp.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    experience === exp.id
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-100'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{exp.label}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{exp.desc}</div>
                    </div>
                    {experience === exp.id && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: INTERVIEW TYPE */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Choose Interview Type
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Dictates whether the rubric prioritizes technical correctness or behavioural STAR outcomes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {INTERVIEW_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setInterviewType(t.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    interviewType === t.id
                      ? 'border-purple-500 bg-purple-500/10 text-purple-100'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{t.label}</span>
                    {interviewType === t.id && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                  </div>
                  <p className="text-xs text-zinc-400 leading-snug">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: INTERVIEW LENGTH */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Select Question Budget
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                The adaptive engine will orchestrate progression to maximize competency coverage within this budget.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {LENGTH_OPTIONS.map((opt) => (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setQuestionLimit(opt.count)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    questionLimit === opt.count
                      ? 'border-amber-500 bg-amber-500/10 text-amber-100'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{opt.desc}</div>
                    </div>
                    {questionLimit === opt.count && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: INPUT MODE */}
        {step === 5 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Mic className="w-5 h-5 text-rose-400" />
                Select Answer Interaction Mode
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Push-to-talk speech utilizes Amazon Transcribe; questions can be read aloud via Amazon Polly.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {INPUT_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setInputMode(m.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    inputMode === m.id
                      ? 'border-rose-500 bg-rose-500/10 text-rose-100'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{m.label}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{m.desc}</div>
                    </div>
                    {inputMode === m.id && <CheckCircle2 className="w-5 h-5 text-rose-400" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: JOB DESCRIPTION (OPTIONAL) */}
        {step === 6 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Supply Job Description (Optional)
                </h2>
                <span className="text-xs text-zinc-500 font-mono">Optional</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Paste the JD or upload a file. Bedrock extracts required tools and competencies for tailored questions.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <textarea
                rows={6}
                value={jobDescriptionText}
                onChange={(e) => setJobDescriptionText(e.target.value)}
                placeholder="Paste the job posting description here (requirements, qualifications, responsibilities)..."
                className="w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-brand-500 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none leading-relaxed"
              />

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-zinc-400" />
                  <span>{jdFile ? jdFile.name : 'Upload JD (.txt, .pdf)'}</span>
                  <input
                    type="file"
                    accept=".txt,.pdf,.docx"
                    onChange={(e) => handleFileUpload('jd', e)}
                    className="hidden"
                  />
                </label>
                {jdFile && (
                  <button
                    type="button"
                    onClick={() => { setJdFile(null); setJobDescriptionText(''); }}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Clear file
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: RESUME (OPTIONAL) */}
        {step === 7 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Supply Candidate Resume (Optional)
                </h2>
                <span className="text-xs text-zinc-500 font-mono">Optional</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Allows the interviewer to ask targeted scenario questions regarding your stated projects and technologies.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <textarea
                rows={6}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here (projects, technologies, experience highlights)..."
                className="w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-brand-500 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none leading-relaxed"
              />

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-zinc-400" />
                  <span>{resumeFile ? resumeFile.name : 'Upload Resume (.txt, .pdf)'}</span>
                  <input
                    type="file"
                    accept=".txt,.pdf,.docx"
                    onChange={(e) => handleFileUpload('resume', e)}
                    className="hidden"
                  />
                </label>
                {resumeFile && (
                  <button
                    type="button"
                    onClick={() => { setResumeFile(null); setResumeText(''); }}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Clear file
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: REVIEW & LAUNCH */}
        {step === 8 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-400" />
                Review Interview Setup
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Confirm your configuration before Amazon Bedrock generates your opening question.
              </p>
            </div>

            <div className="bg-zinc-900/80 rounded-xl p-5 border border-zinc-800 text-xs divide-y divide-zinc-800/80 space-y-3">
              <div className="flex justify-between items-center pb-2">
                <span className="text-zinc-400 font-mono">Target Role</span>
                <span className="font-semibold text-zinc-100">{activeRole}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-400 font-mono">Experience Level</span>
                <span className="font-semibold text-zinc-100">{experience}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-400 font-mono">Interview Type</span>
                <span className="font-semibold text-zinc-100 capitalize">{interviewType}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-400 font-mono">Question Budget</span>
                <span className="font-semibold text-zinc-100">{questionLimit} Questions</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-400 font-mono">Input Mode</span>
                <span className="font-semibold text-zinc-100 capitalize">{inputMode.replace('_', ' + ')}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-400 font-mono">Job Description</span>
                <span className={jobDescriptionText ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
                  {jobDescriptionText ? 'Provided (Competency Mapped)' : 'Not supplied'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-zinc-400 font-mono">Candidate Resume</span>
                <span className={resumeText ? 'text-indigo-400 font-medium' : 'text-zinc-500'}>
                  {resumeText ? 'Provided (Project Context Attached)' : 'Not supplied'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-8 mt-6 border-t border-zinc-900">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : <div />}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartInterview}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-xl shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Opening Question...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Start Interview
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
