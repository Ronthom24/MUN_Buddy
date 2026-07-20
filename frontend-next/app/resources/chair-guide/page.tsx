import { GuideArticle, GuideSection } from "@/components/guide-article";

export default function ChairGuidePage() {
  return (
    <GuideArticle
      category="Chairs"
      title="Chair Guide"
      intro="Running sessions, moderating debate, and using the schedule and attendance tools as a chair."
    >
      <GuideSection title="Your role">
        <p>
          A chair (or committee director) runs the substantive side of a committee: enforcing procedure fairly,
          keeping debate on topic and moving, and staying neutral on the actual issues being debated. A vice chair
          typically shares these duties or handles a sub-set of them — the split is up to your organizing team.
        </p>
      </GuideSection>

      <GuideSection title="Before your first session">
        <p>
          Read the background guide for your committee, and know your agenda topics well enough to answer
          delegates&rsquo; procedural and substantive questions. Decide your speaking time defaults (how long each
          speaker gets on the speakers&rsquo; list, how long a moderated caucus runs by default) so you&rsquo;re not
          improvising rules on the spot.
        </p>
        <p>
          If your conference uses MUN Buddy&rsquo;s committee workspace, check your assigned portfolios and agenda
          items ahead of time — the committee detail page is where chairs and directors can add agenda items, edit
          background notes, and see who&rsquo;s assigned to which country or role.
        </p>
      </GuideSection>

      <GuideSection title="Running a session">
        <p>
          Open with a roll call, then move into your first agenda item via a motion (usually to set the speakers&rsquo;
          list or open a moderated caucus). From there, your main job is recognizing speakers and motions, ruling on
          points of order, and keeping the room moving — a session that stalls on procedure loses the delegates&rsquo;
          attention fast.
        </p>
        <p>
          Stay strictly neutral on substance. Delegates should never be able to tell which country&rsquo;s position
          you personally agree with from how you run the room.
        </p>
      </GuideSection>

      <GuideSection title="Attendance and logistics">
        <p>
          If your conference tracks attendance through MUN Buddy, check-in happens per scheduled session — either
          the chair/staff checks delegates in manually from the roster, or delegates scan in with their personal QR
          code. Attendance percentages are calculated against the delegates actually assigned to your committee, so
          they stay accurate even if assignments change mid-conference.
        </p>
      </GuideSection>

      <GuideSection title="Handling disruptions">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>A dominant delegate monopolizing the floor: use your speaking-time limits consistently, and open the speakers&rsquo; list to more voices before returning to them.</li>
          <li>Debate going off-topic: a firm, polite redirect back to the agenda item usually works better than a long procedural lecture.</li>
          <li>A genuine rules dispute: make a ruling, state it clearly, and move on — indecision from the chair is what actually derails a session.</li>
        </ul>
      </GuideSection>
    </GuideArticle>
  );
}
