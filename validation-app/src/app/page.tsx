import Header from '@/components/Header';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-950 text-neutral-100 pt-16">
        {/* Hero */}
        <section className="py-20 px-4 text-center border-b border-neutral-900">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-neutral-100 mb-4">
            NVC-HH Dataset Validation
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto font-light mb-4">
            This interface helps validate annotations based on <strong className="text-neutral-200">Nonviolent Communication (NVC)</strong>.
          </p>
          <p className="text-neutral-500 max-w-2xl mx-auto">
            You are <strong className="text-amber-500">not expected to be an NVC expert</strong>. Your role is to check whether annotations are <em>reasonable, consistent, and grounded in the text</em>—not whether they are philosophically perfect.
          </p>
        </section>

        {/* What is NVC */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-b border-neutral-900">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-6">1. What is Nonviolent Communication?</h2>
          <p className="text-neutral-300 leading-relaxed mb-6">
            <strong>Nonviolent Communication (NVC)</strong> is a framework developed to reduce conflict and increase understanding by separating:
          </p>
          <ul className="space-y-2 text-neutral-400 mb-6 pl-4">
            <li>• What happened</li>
            <li>• How someone feels about it</li>
            <li>• Why it matters to them</li>
            <li>• What would help next</li>
          </ul>
          <div className="p-4 bg-neutral-900/50 rounded border border-neutral-800">
            <p className="text-sm text-neutral-400 mb-2"><strong className="text-neutral-300">NVC assumes:</strong></p>
            <ul className="space-y-1 text-sm text-neutral-500">
              <li>• All people share <strong className="text-neutral-400">universal human needs</strong></li>
              <li>• Conflict usually happens at the level of <strong className="text-neutral-400">strategies</strong>, not needs</li>
              <li>• Language that sounds like a "feeling" is often actually a <strong className="text-neutral-400">judgment</strong></li>
            </ul>
          </div>
          <p className="text-neutral-500 mt-4 text-sm italic">
            The goal of NVC is <strong className="text-neutral-300">clarity and empathy</strong>, not politeness or positivity.
          </p>
        </section>

        {/* OFNR Overview */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-b border-neutral-900">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-6">2. The OFNR Framework (Core Concept)</h2>
          <p className="text-neutral-300 leading-relaxed mb-8">
            Every annotation follows <strong>OFNR</strong>: <span className="text-amber-500">O</span>bservation, <span className="text-amber-500">F</span>eeling, <span className="text-amber-500">N</span>eed, <span className="text-amber-500">R</span>equest
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-3 px-4 text-neutral-400 font-medium">Component</th>
                  <th className="text-left py-3 px-4 text-neutral-400 font-medium">Answers</th>
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                <tr className="border-b border-neutral-900"><td className="py-3 px-4">Observation</td><td className="py-3 px-4 text-neutral-500">What actually happened?</td></tr>
                <tr className="border-b border-neutral-900"><td className="py-3 px-4">Feeling</td><td className="py-3 px-4 text-neutral-500">What emotion is being experienced?</td></tr>
                <tr className="border-b border-neutral-900"><td className="py-3 px-4">Need</td><td className="py-3 px-4 text-neutral-500">What important human value is involved?</td></tr>
                <tr><td className="py-3 px-4">Request</td><td className="py-3 px-4 text-neutral-500">What action would help now?</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Detailed OFNR Components */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-b border-neutral-900">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-8">3. OFNR Components — Detailed Definitions</h2>

          {/* Observation */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 flex items-center justify-center bg-amber-900/30 border border-amber-800/50 rounded text-lg font-medium text-amber-500">O</span>
              <h3 className="text-xl font-medium text-neutral-200">Observation</h3>
            </div>
            <p className="text-neutral-300 mb-4">A <strong>neutral, factual description</strong> of events, like a camera recording.</p>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded">
                <p className="text-xs text-emerald-500 uppercase tracking-wide mb-2">✓ Good Observations</p>
                <ul className="text-sm text-neutral-400 space-y-1">
                  <li>"The meeting started at 9:15."</li>
                  <li>"The assistant answered with a refusal."</li>
                  <li>"The user asked the same question twice."</li>
                </ul>
              </div>
              <div className="p-4 bg-red-950/20 border border-red-900/30 rounded">
                <p className="text-xs text-red-500 uppercase tracking-wide mb-2">✗ Bad Observations</p>
                <ul className="text-sm text-neutral-400 space-y-1">
                  <li>"You were disrespectful."</li>
                  <li>"The assistant was unhelpful."</li>
                  <li>"They ignored me."</li>
                </ul>
              </div>
            </div>
            <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded text-sm">
              <strong className="text-neutral-300">Validation rule:</strong>
              <span className="text-neutral-500"> Could a video camera record this without knowing anyone's feelings? If yes → non-judgmental. If no → judgmental.</span>
            </div>
          </div>

          {/* Feeling */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 flex items-center justify-center bg-amber-900/30 border border-amber-800/50 rounded text-lg font-medium text-amber-500">F</span>
              <h3 className="text-xl font-medium text-neutral-200">Feeling</h3>
            </div>
            <p className="text-neutral-300 mb-4">A <strong>genuine internal emotional state</strong>. NOT a thought, judgment, or description of someone else's behavior.</p>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded">
                <p className="text-xs text-emerald-500 uppercase tracking-wide mb-2">✓ Valid Feelings</p>
                <p className="text-sm text-neutral-400">frustrated, anxious, relieved, angry, confused</p>
              </div>
              <div className="p-4 bg-red-950/20 border border-red-900/30 rounded">
                <p className="text-xs text-red-500 uppercase tracking-wide mb-2">✗ Pseudo-feelings (Invalid)</p>
                <p className="text-sm text-neutral-400">ignored, attacked, betrayed, manipulated, disrespected</p>
              </div>
            </div>
            <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded text-sm">
              <strong className="text-neutral-300">Validation rule:</strong>
              <span className="text-neutral-500"> Can this emotion exist without anyone else doing anything? If yes → real feeling. If no → likely a judgment.</span>
            </div>
          </div>

          {/* Need */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 flex items-center justify-center bg-amber-900/30 border border-amber-800/50 rounded text-lg font-medium text-amber-500">N</span>
              <h3 className="text-xl font-medium text-neutral-200">Need</h3>
            </div>
            <p className="text-neutral-300 mb-4">A <strong>universal human need</strong> — something all humans care about, regardless of culture. Needs explain <em>why the feeling matters</em>.</p>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded">
                <p className="text-xs text-emerald-500 uppercase tracking-wide mb-2">✓ Valid Needs</p>
                <p className="text-sm text-neutral-400">safety, respect, autonomy, connection, clarity, fairness</p>
              </div>
              <div className="p-4 bg-red-950/20 border border-red-900/30 rounded">
                <p className="text-xs text-red-500 uppercase tracking-wide mb-2">✗ Invalid (These are strategies)</p>
                <p className="text-sm text-neutral-400">money, a promotion, a new laptop, an apology</p>
              </div>
            </div>
            <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded text-sm mb-4">
              <strong className="text-neutral-300">Validation rule:</strong>
              <span className="text-neutral-500"> Would humans still care about this even if circumstances were different? If yes → need. If it depends on a specific thing → strategy.</span>
            </div>
            <div className="p-4 bg-neutral-900/30 border border-neutral-800 rounded">
              <p className="text-sm text-neutral-400"><strong className="text-neutral-300">Explicit Need:</strong> Directly stated in text. <em>"I need clarity about what's expected."</em></p>
              <p className="text-sm text-neutral-400 mt-2"><strong className="text-neutral-300">Implicit Need:</strong> Inferred, not stated. <em>"I don't know what you want anymore."</em> → implicit: clarity, understanding</p>
            </div>
          </div>

          {/* Request */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 flex items-center justify-center bg-amber-900/30 border border-amber-800/50 rounded text-lg font-medium text-amber-500">R</span>
              <h3 className="text-xl font-medium text-neutral-200">Request</h3>
            </div>
            <p className="text-neutral-300 mb-4">A <strong>specific, doable, positive action</strong> that could meet the need. Requests are not demands.</p>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded">
                <p className="text-xs text-emerald-500 uppercase tracking-wide mb-2">✓ Good Requests</p>
                <ul className="text-sm text-neutral-400 space-y-1">
                  <li>"Would you be willing to explain the deadline?"</li>
                  <li>"Could you tell me when you'll arrive?"</li>
                </ul>
              </div>
              <div className="p-4 bg-red-950/20 border border-red-900/30 rounded">
                <p className="text-xs text-red-500 uppercase tracking-wide mb-2">✗ Bad Requests</p>
                <ul className="text-sm text-neutral-400 space-y-1">
                  <li>"Stop being irresponsible."</li>
                  <li>"You should know better."</li>
                </ul>
              </div>
            </div>
            <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded text-sm">
              <strong className="text-neutral-300">Validation rule:</strong>
              <span className="text-neutral-500"> Could someone realistically say yes or no to this? If vague, blaming, or controlling → reject.</span>
            </div>
          </div>

          {/* Implicit Intent */}
          <div>
            <h3 className="text-lg font-medium text-neutral-200 mb-3">Implicit Intent</h3>
            <p className="text-neutral-300 mb-4">The <strong>underlying goal</strong> behind the message. Intent is not moral—it explains motivation.</p>
            <p className="text-sm text-neutral-500 mb-2">Examples: seeking reassurance, resolving confusion, asserting boundaries, asking for help, testing limits</p>
            <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded text-sm">
              <strong className="text-neutral-300">Ask:</strong>
              <span className="text-neutral-500"> What is this person trying to accomplish emotionally or practically? Accept if reasonable. Replace if clearly misaligned.</span>
            </div>
          </div>
        </section>

        {/* Safety Classification */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-b border-neutral-900">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-6">4. Safety Classification</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-5 bg-emerald-950/20 border border-emerald-900/30 rounded">
              <p className="text-emerald-500 font-medium mb-2">✓ Allowed</p>
              <ul className="text-sm text-neutral-500 space-y-1">
                <li>• Normal conversation</li>
                <li>• Emotional expression</li>
                <li>• Requests for help</li>
              </ul>
            </div>
            <div className="p-5 bg-amber-950/20 border border-amber-900/30 rounded">
              <p className="text-amber-500 font-medium mb-2">⚠ Ambiguous</p>
              <ul className="text-sm text-neutral-500 space-y-1">
                <li>• Could be unsafe depending on context</li>
                <li>• Needs caution or clarification</li>
              </ul>
            </div>
            <div className="p-5 bg-red-950/20 border border-red-900/30 rounded">
              <p className="text-red-500 font-medium mb-2">✗ Disallowed</p>
              <ul className="text-sm text-neutral-500 space-y-1">
                <li>• Violence</li>
                <li>• Self-harm instructions</li>
                <li>• Hate or harassment</li>
                <li>• Illegal activities</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-neutral-600 mt-4 italic">You do not need to quote policy — just give a short explanation.</p>
        </section>

        {/* How to Validate */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-b border-neutral-900">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-6">5. How to Validate (Step-by-Step)</h2>
          <div className="space-y-3">
            {[
              { n: 1, text: 'Read the full context, not just one sentence' },
              { n: 2, text: 'Check each field independently' },
              { n: 3, text: 'Accept ✓ if reasonable' },
              { n: 4, text: 'Reject ✗ if clearly incorrect' },
              { n: 5, text: 'Add missing items if obvious' },
              { n: 6, text: 'Choose safety classification' },
              { n: 7, text: 'Submit — edits are final', highlight: true },
            ].map((step) => (
              <div key={step.n} className={`flex items-center gap-4 py-2 ${step.highlight ? 'text-amber-500' : 'text-neutral-400'}`}>
                <span className="w-8 h-8 flex items-center justify-center bg-neutral-900 border border-neutral-800 rounded text-sm">{step.n}</span>
                <span className={step.highlight ? 'font-medium' : ''}>{step.text}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-neutral-600 mt-6">You are not judging style or writing quality. You are judging <strong className="text-neutral-400">semantic correctness</strong>.</p>
        </section>

        {/* Reminder */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-b border-neutral-900">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-6">6. Important Reminder for Validators</h2>
          <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded">
            <ul className="space-y-3 text-neutral-400">
              <li>• You are <strong className="text-neutral-200">not expected to agree</strong> with the speaker</li>
              <li>• You are <strong className="text-neutral-200">not fixing the conversation</strong></li>
              <li>• You are validating whether the annotations <strong className="text-neutral-200">make sense</strong></li>
            </ul>
            <p className="mt-6 text-lg text-amber-500 font-medium">Reasonable &gt; perfect.</p>
          </div>
        </section>

        {/* Start Buttons */}
        <section className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-center text-sm font-medium text-neutral-500 uppercase tracking-widest mb-8">Start Validating</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
            <Link
              href="/general"
              className="px-8 py-6 bg-neutral-900 text-neutral-100 font-medium rounded border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 transition-all text-center"
            >
              General Validation
              <span className="block text-xs font-normal text-neutral-500 mt-2">
                harmless, helpful datasets
              </span>
            </Link>
            <Link
              href="/lawyers"
              className="px-8 py-6 bg-neutral-900 text-neutral-100 font-medium rounded border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 transition-all text-center"
            >
              Legal Review
              <span className="block text-xs font-normal text-neutral-500 mt-2">
                red-team attempts
              </span>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
