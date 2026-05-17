import { useState } from 'react';
import { motion } from 'framer-motion';
import { PenLine, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

/** Worker trực tiếp (CORS) hoặc để trống dùng Vite proxy → localhost:8088 */
const AES_BASE = (import.meta.env.VITE_AES_WORKER_URL || '').replace(/\/$/, '');
const SCORE_FORM_URL = AES_BASE
  ? `${AES_BASE}/api/v1/aes/score-form`
  : '/api/v1/aes/score-form';

const CEFR_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function WritingScorePage() {
  const [promptText, setPromptText] = useState(
    'Some people believe that technology has made life more complicated. To what extent do you agree or disagree?',
  );
  const [essay, setEssay] = useState('');
  const [taskType, setTaskType] = useState(2);
  const [cefrLevel, setCefrLevel] = useState('B2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!essay.trim() || !promptText.trim()) {
      setError('Vui lòng nhập đề bài và bài viết.');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('essay_plaintext', essay);
      fd.append('prompt_text', promptText);
      fd.append('task_type', String(taskType));
      fd.append('cefr_level', cefrLevel);
      fd.append('writing_score_history_json', '[]');

      const res = await fetch(SCORE_FORM_URL, {
        method: 'POST',
        body: fd,
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `HTTP ${res.status}`);
      }
      setResult(JSON.parse(text));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Không gọi được dịch vụ chấm điểm.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Badge className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          <PenLine className="w-3.5 h-3.5" />
          CAM_EDU AES
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-[var(--font-serif)] text-[var(--primary)]">
          Chấm bài Writing (AI)
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)] text-sm sm:text-base max-w-2xl">
          Gửi bài tới worker FastAPI (Gemini + RAG rubric + TTR). Dev: chạy worker cổng 8088 và{' '}
          <code className="text-xs bg-[var(--secondary)] px-1 rounded">vite</code> proxy{' '}
          <code className="text-xs bg-[var(--secondary)] px-1 rounded">/api/v1/aes</code>
          , hoặc đặt <code className="text-xs bg-[var(--secondary)] px-1 rounded">VITE_AES_WORKER_URL</code>.
        </p>
      </motion.div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-md)] p-6 sm:p-8 space-y-6"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Task
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
            >
              <option value={1}>Task 1</option>
              <option value={2}>Task 2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              CEFR
            </label>
            <select
              value={cefrLevel}
              onChange={(e) => setCefrLevel(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
            >
              {CEFR_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Đề bài / prompt
          </label>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm resize-y min-h-[88px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Bài viết
          </label>
          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            rows={12}
            placeholder="Dán bài Writing của học viên (tiếng Anh)…"
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm resize-y min-h-[200px] font-mono"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 text-red-800 border border-red-200 px-3 py-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang chấm…
            </>
          ) : (
            'Chấm bài'
          )}
        </Button>
      </form>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-md)] p-6 sm:p-8"
        >
          <h2 className="text-xl font-[var(--font-serif)] text-[var(--primary)] mb-4">Kết quả</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl bg-[var(--accent)]/40 border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">
                Band tổng
              </p>
              <p className="text-3xl font-semibold text-[var(--foreground)]">{result.band_overall}</p>
              {result.scoring_source && (
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Nguồn chấm:{' '}
                  <span className="font-mono font-medium text-[var(--foreground)]">
                    {result.scoring_source}
                  </span>
                  {result.scoring_source === 'heuristic' && (
                    <span className="block mt-1 text-amber-800">
                      Gemini không chạy được — đang dùng heuristic (thường quanh 5.5–6, không phản ánh đúng
                      band thật).
                    </span>
                  )}
                </p>
              )}
            </div>
            {(result.lexical_ttr != null && result.lexical_ttr !== undefined) ||
            (result.lexical_mtld != null && result.lexical_mtld !== undefined) ? (
              <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
                {result.lexical_ttr != null && result.lexical_ttr !== undefined && (
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">TTR</p>
                    <p className="text-2xl font-mono">{Number(result.lexical_ttr).toFixed(4)}</p>
                  </div>
                )}
                {result.lexical_mtld != null && result.lexical_mtld !== undefined && (
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">MTLD</p>
                    <p className="text-2xl font-mono">{Number(result.lexical_mtld).toFixed(4)}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
          {result.scoring_fallback_reason && (
            <div
              role="alert"
              className="mb-6 text-sm text-red-900 bg-red-50 border border-red-100 rounded-lg px-4 py-3"
            >
              <strong className="block text-red-950 mb-1">Vì sao không dùng Gemini</strong>
              {result.scoring_fallback_reason}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3 mb-6 text-sm">
            {result.rubric && (
              <>
                <div className="flex justify-between border-b border-[var(--border)] py-2">
                  <span>Task Achievement</span>
                  <span className="font-medium">{result.rubric.task_achievement}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border)] py-2">
                  <span>Coherence & Cohesion</span>
                  <span className="font-medium">{result.rubric.coherence_and_cohesion}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border)] py-2">
                  <span>Lexical Resource</span>
                  <span className="font-medium">{result.rubric.lexical_resource}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border)] py-2">
                  <span>Grammar Range & Accuracy</span>
                  <span className="font-medium">{result.rubric.grammatical_range_and_accuracy}</span>
                </div>
              </>
            )}
          </div>

          {result.scoring_debug && (
            <details className="mb-6 text-xs font-mono bg-[var(--secondary)]/40 rounded-lg border border-[var(--border)] p-3">
              <summary className="cursor-pointer font-sans font-medium text-[var(--foreground)]">
                scoring_debug (AES_DEBUG_SCORING)
              </summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[var(--muted-foreground)]">
                {JSON.stringify(result.scoring_debug, null, 2)}
              </pre>
            </details>
          )}

          {result.improvement_suggestions?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Gợi ý cải thiện</h3>
              <ul className="space-y-3 text-sm">
                {result.improvement_suggestions.map((s, i) => (
                  <li key={i} className="rounded-lg bg-[var(--secondary)]/50 p-3 border border-[var(--border)]">
                    <p className="text-[var(--muted-foreground)] italic mb-1">&quot;{s.sentence_span}&quot;</p>
                    <p>{s.suggestion}</p>
                    <p className="mt-2 text-emerald-800">{s.cefr_aligned_example}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.descriptors_retrieved?.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-[var(--foreground)] mb-2">
                Descriptor RAG ({result.descriptors_retrieved.length})
              </summary>
              <ul className="space-y-2 max-h-48 overflow-y-auto text-[var(--muted-foreground)]">
                {result.descriptors_retrieved.map((d, i) => (
                  <li key={d.id || i} className="border-l-2 border-emerald-300 pl-2">
                    {d.text?.slice(0, 400)}
                    {d.text?.length > 400 ? '…' : ''}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </motion.div>
      )}
    </div>
  );
}
