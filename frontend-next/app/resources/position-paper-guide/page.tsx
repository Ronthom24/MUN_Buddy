import { GuideArticle, GuideSection } from "@/components/guide-article";

export default function PositionPaperGuidePage() {
  return (
    <GuideArticle
      category="Delegates"
      title="Position Paper Guide"
      intro="Structure, research, and formatting guidance for writing a strong position paper."
    >
      <GuideSection title="What it is">
        <p>
          A position paper is a short written statement of your assigned country&rsquo;s stance on each topic on
          your committee&rsquo;s agenda, submitted before the conference. Chairs use it to gauge how prepared
          delegates are, and often factor it into speaking order or award consideration — check your specific
          committee&rsquo;s requirements and deadline.
        </p>
      </GuideSection>

      <GuideSection title="Typical structure">
        <p>Most position papers follow a structure like this, repeated per agenda topic:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Background</strong> — a brief summary of the issue and why it matters to the committee.</li>
          <li><strong>Country&rsquo;s position</strong> — where your assigned country actually stands, backed by real policy, past votes, or statements — not your personal opinion.</li>
          <li><strong>Past actions</strong> — relevant treaties signed/not signed, prior UN resolutions supported or opposed, domestic policy that bears on the topic.</li>
          <li><strong>Proposed solutions</strong> — 2-3 concrete, specific ideas your delegation would push for in committee, consistent with the position above.</li>
        </ul>
      </GuideSection>

      <GuideSection title="Research tips">
        <p>
          Start with your country&rsquo;s foreign ministry or UN mission website, and the UN&rsquo;s own
          documentation (resolutions, meeting records) for the relevant body. For historical or crisis committees,
          look for primary sources from the actual period rather than general encyclopedia summaries.
        </p>
        <p>
          If your country hasn&rsquo;t taken an explicit position on a topic, look at how it&rsquo;s voted on similar
          issues, and its broader foreign policy alignment (regional blocs, major alliances) to infer a realistic
          stance — chairs generally accept a well-reasoned inference over no position at all.
        </p>
      </GuideSection>

      <GuideSection title="Formatting">
        <p>
          Keep it concise — most conferences cap position papers at one page per topic. Use your real country name
          and committee name in the header, cite sources where you can, and proofread: a paper submitted with the
          wrong country or committee name is a bad first impression before committee even starts.
        </p>
        <p>
          If your conference uses MUN Buddy, you can upload your position paper directly from your delegate
          workspace under Position Paper &amp; Speech — check there for your committee&rsquo;s specific format and
          deadline instead of guessing.
        </p>
      </GuideSection>
    </GuideArticle>
  );
}
