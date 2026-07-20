import { GuideArticle, GuideSection } from "@/components/guide-article";

export default function DelegateHandbookPage() {
  return (
    <GuideArticle
      category="Delegates"
      title="Delegate Handbook"
      intro="Everything a first-time delegate needs — from registering to walking into committee prepared."
    >
      <GuideSection title="Before the conference">
        <p>
          Once you&rsquo;re assigned a committee and country (or role), read the background guide the committee
          provided, if there is one. It sets out the topics on the agenda and what the organizers expect delegates
          to already know walking in.
        </p>
        <p>
          Research your assigned country&rsquo;s actual position on each topic — not what you personally think should
          happen, but what your country&rsquo;s government has said or done. Government websites, the UN&rsquo;s own
          documentation, and major news outlets are usually better sources than opinion pieces.
        </p>
        <p>
          Most committees expect a position paper: a short written statement of your country&rsquo;s stance on each
          agenda topic, submitted before the conference. Check your committee&rsquo;s requirements for length and
          format — chairs often use position papers to decide early speaking order or award consideration.
        </p>
      </GuideSection>

      <GuideSection title="Committee basics">
        <p>
          Most committee sessions run on a mix of formal and informal debate. In formal debate (moderated caucus),
          speakers are recognized one at a time by the chair, usually on a speakers&rsquo; list, and address the
          committee as a whole. In informal debate (unmoderated caucus), delegates move freely around the room to
          negotiate directly in small groups — this is where most of the actual drafting and alliance-building
          happens.
        </p>
        <p>
          You&rsquo;ll refer to yourself in the third person as your country ("The delegation of France believes
          ...") and address other delegates the same way, not by their real name. Points and motions are how the
          committee moves through its agenda: a motion to open a moderated caucus on a specific sub-topic, a point of
          order if procedure is being broken, a point of personal privilege if you can&rsquo;t hear or need something.
        </p>
        <p>
          Working papers and draft resolutions are how proposals get written down. A working paper is informal and
          doesn&rsquo;t need signatories; a draft resolution usually needs a minimum number of sponsors and
          signatories before it can be introduced to the floor, and is what the committee ultimately votes on.
        </p>
      </GuideSection>

      <GuideSection title="During the conference">
        <p>
          Show up on time, in the attire your conference specifies (usually Western business formal). Bring a
          physical or digital copy of your position paper and background guide — you won&rsquo;t always have
          reliable wifi in a committee room.
        </p>
        <p>
          Your MUN Buddy delegate workspace has your schedule, position paper upload, committee assignment, and
          check-in status all in one place, so you don&rsquo;t need to track conference logistics separately from
          your substantive prep.
        </p>
      </GuideSection>

      <GuideSection title="Common first-timer mistakes">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Writing a position paper that states an opinion instead of your assigned country&rsquo;s actual position.</li>
          <li>Staying quiet in unmoderated caucus instead of approaching other delegations directly — that&rsquo;s where the real negotiating happens.</li>
          <li>Not reading the rules of procedure your specific conference uses — they vary conference to conference.</li>
          <li>Treating committee like a debate you need to win, rather than a negotiation you need to build consensus in.</li>
        </ul>
      </GuideSection>
    </GuideArticle>
  );
}
