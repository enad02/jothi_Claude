(function () {
  "use strict";

  const gallery = document.querySelector("[data-sats-gallery]");
  if (gallery) {
    const slides = Array.from(gallery.querySelectorAll("[data-sats-slide]"));
    const panels = Array.from(gallery.querySelectorAll("[data-sats-panel]"));
    const controls = Array.from(gallery.querySelectorAll("[data-sats-control]"));
    const steppers = Array.from(gallery.querySelectorAll("[data-sats-step]"));
    let index = 0;

    function show(nextIndex, moveFocus) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === index;
        slide.hidden = !active;
        slide.classList.toggle("is-active", active);
      });
      panels.forEach((panel, panelIndex) => { panel.hidden = panelIndex !== index; });
      controls.forEach((control, controlIndex) => {
        const active = controlIndex === index;
        control.setAttribute("aria-selected", String(active));
        control.tabIndex = active ? 0 : -1;
        if (active && moveFocus) control.focus();
      });
    }

    controls.forEach((control, controlIndex) => {
      control.addEventListener("click", () => show(controlIndex, false));
      control.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); show(index + 1, true); }
        if (event.key === "ArrowLeft") { event.preventDefault(); show(index - 1, true); }
        if (event.key === "Home") { event.preventDefault(); show(0, true); }
        if (event.key === "End") { event.preventDefault(); show(slides.length - 1, true); }
      });
    });
    steppers.forEach((button) => button.addEventListener("click", () => show(index + Number(button.dataset.satsStep), false)));
    show(0, false);
  }

  const prototypeButton = document.querySelector("[data-sats-prototype-submit]");
  const prototypeMessage = document.querySelector("[data-sats-prototype-message]");
  if (prototypeButton && prototypeMessage) {
    prototypeButton.addEventListener("click", () => {
      prototypeMessage.hidden = false;
      prototypeMessage.textContent = "This local prototype does not submit or store information.";
    });
  }

  const parentStories = document.getElementById("satsParentStoriesStage");
  if (parentStories) {
    const cards = Array.from(parentStories.querySelectorAll("[data-sats-parent-story]"));
    const dots = Array.from(parentStories.querySelectorAll("[data-sats-parent-dot]"));
    const previous = parentStories.querySelector("[data-sats-parent-prev]");
    const next = parentStories.querySelector("[data-sats-parent-next]");
    let current = 0;

    function showStory(nextIndex, moveFocus) {
      current = (nextIndex + cards.length) % cards.length;
      cards.forEach((card, index) => {
        const active = index === current;
        card.hidden = !active;
        card.classList.toggle("is-active", active);
      });
      dots.forEach((dot, index) => {
        const active = index === current;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", String(active));
        dot.tabIndex = active ? 0 : -1;
        if (active && moveFocus) dot.focus();
      });
    }

    previous?.addEventListener("click", () => showStory(current - 1, false));
    next?.addEventListener("click", () => showStory(current + 1, false));
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => showStory(index, false));
      dot.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); showStory(current + 1, true); }
        if (event.key === "ArrowLeft") { event.preventDefault(); showStory(current - 1, true); }
        if (event.key === "Home") { event.preventDefault(); showStory(0, true); }
        if (event.key === "End") { event.preventDefault(); showStory(cards.length - 1, true); }
      });
    });
    showStory(0, false);
  }

  const floatingWhatsApp = document.querySelector("[data-sats-whatsapp-float]");
  const hero = document.querySelector(".sats-hero");
  const enquiry = document.getElementById("sats-enquiry");
  if (floatingWhatsApp && "IntersectionObserver" in window) {
    const mobileQuery = window.matchMedia("(max-width: 600px)");
    let heroVisible = false;
    let enquiryVisible = false;
    const syncFloatingWhatsApp = () => { floatingWhatsApp.hidden = enquiryVisible || (mobileQuery.matches && heroVisible); };
    if (hero) new IntersectionObserver((entries) => { heroVisible = entries.some((entry) => entry.isIntersecting); syncFloatingWhatsApp(); }, { threshold: 0.08 }).observe(hero);
    if (enquiry) new IntersectionObserver((entries) => { enquiryVisible = entries.some((entry) => entry.isIntersecting); syncFloatingWhatsApp(); }, { threshold: 0.08 }).observe(enquiry);
    if (typeof mobileQuery.addEventListener === "function") mobileQuery.addEventListener("change", syncFloatingWhatsApp);
    else if (typeof mobileQuery.addListener === "function") mobileQuery.addListener(syncFloatingWhatsApp);
    syncFloatingWhatsApp();
  }

  const navToggle = document.querySelector(".sats-nav-toggle");
  const mobileNav = document.getElementById("satsMobileNav");
  if (navToggle && mobileNav) {
    const closeNav = () => { mobileNav.hidden = true; navToggle.setAttribute("aria-expanded", "false"); navToggle.setAttribute("aria-label", "Open navigation"); };
    navToggle.addEventListener("click", () => { const opening = mobileNav.hidden; mobileNav.hidden = !opening; navToggle.setAttribute("aria-expanded", String(opening)); navToggle.setAttribute("aria-label", opening ? "Close navigation" : "Open navigation"); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeNav(); });
    mobileNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNav));
    window.matchMedia("(min-width: 601px)").addEventListener?.("change", closeNav);
  }
})();
