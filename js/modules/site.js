/* PORTFOLIO · site.js
   Carga data/site.json y puebla los hrefs de contacto (email, GitHub, LinkedIn, CV).
   Centraliza los links de la nav (single source of truth en site.json). */

export default async function site() {
    const res = await fetch('./data/site.json');
    if (!res.ok) throw new Error(`site.json fetch failed: ${res.status}`);
    const data = await res.json();

    const populateLinks = () => {
        const { emailHref, githubUrl, githubOverviewUrl, linkedinUrl } = data.contact;
        const { url: cvUrl, filename: cvFilename } = data.cv;

        // Email
        const emailEls = document.querySelectorAll(
            '.js-cta-email, .js-contact-email, .js-footer-email'
        );
        emailEls.forEach((el) => el.setAttribute('href', emailHref));

        // GitHub (perfil)
        const githubEls = document.querySelectorAll(
            '.js-cta-github, .js-contact-github, .js-footer-github'
        );
        githubEls.forEach((el) => el.setAttribute('href', githubUrl));

        // GitHub overview / actividad reciente (botón nuevo del hero)
        const activityEls = document.querySelectorAll('.js-cta-activity, .js-footer-activity');
        if (githubOverviewUrl) {
            activityEls.forEach((el) => el.setAttribute('href', githubOverviewUrl));
        } else {
            activityEls.forEach((el) => el.setAttribute('hidden', ''));
        }

        // LinkedIn (footer)
        const linkedinEls = document.querySelectorAll('.js-footer-linkedin, .js-contact-linkedin');
        if (linkedinUrl) {
            linkedinEls.forEach((el) => {
                el.setAttribute('href', linkedinUrl);
                el.removeAttribute('hidden');
            });
        } else {
            linkedinEls.forEach((el) => el.setAttribute('hidden', ''));
        }

        // CV
        const cvEls = document.querySelectorAll('.js-cv-download');
        cvEls.forEach((el) => {
            el.setAttribute('href', cvUrl);
            el.setAttribute('download', cvFilename);
        });
    };

    return { data, populateLinks };
}
