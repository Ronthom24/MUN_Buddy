import { GuideArticle, GuideSection } from "@/components/guide-article";

export default function RulesOfProcedurePage() {
  return (
    <GuideArticle
      category="Reference"
      title="Rules of Procedure"
      intro="A plain-language walkthrough of standard parliamentary procedure used across MUN committees."
    >
      <p className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
        Rules of procedure vary between conferences — some run a UN-style General Assembly procedure, others use
        a US-style (e.g. NMUN or THIMUN-derived) rulebook. Always check your specific conference&rsquo;s rules
        document; this page covers the concepts that are common to nearly all of them.
      </p>

      <GuideSection title="Debate: formal vs. informal">
        <p>
          <strong>Formal debate</strong> (often called a moderated caucus) runs through the speakers&rsquo; list or a
          set topic: the chair recognizes one speaker at a time, who addresses the whole committee for a fixed
          amount of time.
        </p>
        <p>
          <strong>Informal debate</strong> (an unmoderated caucus) suspends the speakers&rsquo; list so delegates can
          move around the room and negotiate directly in small groups. This is where blocs form, working papers get
          drafted, and most real negotiation happens.
        </p>
      </GuideSection>

      <GuideSection title="Motions">
        <p>Common motions a delegate can raise, usually by raising a placard when the floor is open:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Motion to open a moderated caucus</strong> — proposes a specific sub-topic, total time, and per-speaker time.</li>
          <li><strong>Motion to open an unmoderated caucus</strong> — proposes a total time for open negotiation.</li>
          <li><strong>Motion to introduce a working paper / draft resolution</strong> — brings a document to the floor once it has enough sponsors/signatories.</li>
          <li><strong>Motion to move into voting procedure</strong> — closes debate and moves the committee to vote.</li>
          <li><strong>Motion to table / adjourn</strong> — pauses or ends the session.</li>
        </ul>
        <p>Motions are typically voted on by the committee unless the chair rules on procedural ones directly.</p>
      </GuideSection>

      <GuideSection title="Points">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Point of order</strong> — flags that procedure is being broken.</li>
          <li><strong>Point of personal privilege</strong> — a personal need, like not being able to hear a speaker.</li>
          <li><strong>Point of parliamentary inquiry</strong> — a question about the rules themselves, addressed to the chair.</li>
        </ul>
        <p>Points can typically interrupt debate (personal privilege especially) but should be used sparingly — overuse slows the room down.</p>
      </GuideSection>

      <GuideSection title="Working papers and draft resolutions">
        <p>
          A <strong>working paper</strong> is an informal draft — no fixed format, no signatory requirement in most
          rule sets. A <strong>draft resolution</strong> is the formal version: it needs a minimum number of sponsors
          (who wrote/support it) and signatories (who just want it introduced, not necessarily support it) before
          the chair will accept a motion to introduce it. Once introduced, delegates can propose amendments before
          the committee moves to a final vote.
        </p>
      </GuideSection>

      <GuideSection title="Voting">
        <p>
          Procedural votes (like whether to open a caucus) usually require a simple majority and everyone must vote
          (no abstentions). Substantive votes (on a draft resolution or amendment) usually allow delegates to
          abstain, and the threshold for passing is set by your conference&rsquo;s rules — often a simple majority,
          sometimes higher for certain bodies like the Security Council.
        </p>
      </GuideSection>
    </GuideArticle>
  );
}
