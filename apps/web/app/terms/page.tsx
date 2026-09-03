import Link from "next/link";
import { Logo } from "../../components/logo";
import { ThemeToggle } from "../../components/theme-toggle";

export default function TermsPage() {
  return <main className="legal-page">
    <header className="site-header"><Logo /><nav><ThemeToggle /><Link className="button button-dark" href="/">Back to standings <span>→</span></Link></nav></header>
    <article className="legal-content">
      <p className="eyebrow">Legal notice</p>
      <h1>Terms of use</h1>
      <p className="legal-updated">Last updated: 3 September 2026</p>
      <section><h2>Ownership</h2><p>Leonardo V Academy Houses, including its source code, interface design, content, house identities and visual assets, is the proprietary work of Oleksandr Vasyliukov, known publicly as neoprostitute. © 2026 Oleksandr Vasyliukov. All rights reserved.</p></section>
      <section><h2>Permitted review</h2><p>You may view and evaluate this project only for an authorised review, demonstration or discussion. Access to the project does not grant ownership, a licence to reuse it, or permission to publish it.</p></section>
      <section><h2>Restricted uses</h2><p>Without prior written permission from the copyright holder, you may not copy, reproduce, adapt, redistribute, sell, sublicense, remove attribution from, or use any part of this project in another product or service.</p></section>
      <section><h2>Confidentiality and data</h2><p>Do not upload real student, staff or school data to a review environment. Any production deployment must have its own approved privacy notice, data-retention policy and security review.</p></section>
      <section><h2>Changes</h2><p>These terms may be updated as the project develops. Continued access after an update means that the updated terms apply.</p></section>
      <p className="legal-note">This is a practical project notice, not legal advice. Before public launch or commercial use, have a qualified lawyer adapt the terms, privacy notice and applicable jurisdiction.</p>
    </article>
  </main>;
}
