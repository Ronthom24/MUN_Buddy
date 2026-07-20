import { GuideArticle, GuideSection } from "@/components/guide-article";

export default function OrganizerGuidePage() {
  return (
    <GuideArticle
      category="Organizers"
      title="Organizer Guide"
      intro="How to structure your organization, launch a conference, and run registration end to end."
    >
      <GuideSection title="Set up your organization once">
        <p>
          An organization in MUN Buddy represents your MUN society, institution, or federation — it can host
          multiple conferences over time (an annual conference held in different years, or several sub-conferences
          run by the same team). Create it once from your dashboard, then launch as many conferences under it as
          you need.
        </p>
      </GuideSection>

      <GuideSection title="Launching a conference">
        <p>Before you open registration, a conference typically needs:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Committees created, with their type (standard or crisis) and capacity set.</li>
          <li>A registration form configured, with any custom questions you want delegates to answer.</li>
          <li>A fee structure, if you&rsquo;re charging — fee categories, amounts, and whether they&rsquo;re required.</li>
          <li>Your organizing team invited with appropriate roles (see the Team Center in your conference workspace).</li>
        </ul>
        <p>
          Draft conferences aren&rsquo;t publicly visible or open for registration until you publish them — this
          lets you finish setup without delegates seeing an incomplete conference.
        </p>
      </GuideSection>

      <GuideSection title="Running registration">
        <p>
          Delegates apply through your public registration form. Review applications individually or in bulk from
          the Registrations tab — approve, waitlist, or reject, with an optional reason recorded for each decision.
        </p>
        <p>
          Once delegates are approved, assign them to committees and portfolios (countries/roles) from the
          Assignments tab. Conflict checking flags when a portfolio would be assigned to more than one delegate, so
          you can catch double-bookings before publishing assignments.
        </p>
      </GuideSection>

      <GuideSection title="Running the conference">
        <p>
          The Schedule tab holds your multi-day session plan; Attendance lets you check delegates in per session,
          either manually or via each delegate&rsquo;s personal QR check-in code. Payments tracks fee collection —
          record payments manually (cash, bank transfer, UPI, cheque) and mark them verified once confirmed.
        </p>
        <p>
          Communication Center covers announcements, shared resources (background guides, handbooks), FAQs, and
          email broadcasts to delegates — one place instead of splitting updates across email, WhatsApp, and printed
          notices.
        </p>
      </GuideSection>

      <GuideSection title="Closing out">
        <p>
          After the conference, publish results and awards from the Results tab, then issue certificates —
          individually or in bulk by template. Delegates can download their own certificates from their workspace,
          and anyone can verify a certificate&rsquo;s authenticity using its certificate number on the public
          verification page.
        </p>
      </GuideSection>
    </GuideArticle>
  );
}
