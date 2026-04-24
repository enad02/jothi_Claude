const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const contactForm = document.querySelector(".contact-form-card");
const accessKeyField = contactForm?.querySelector('input[name="access_key"]');
const contactSubmitButton = contactForm?.querySelector('button[type="submit"]');
const formStatus = contactForm?.querySelector("[data-form-status]");

if (navToggle && siteNav) {
  const closeNav = () => {
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
      closeNav();
    }
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 860 && siteNav.classList.contains("is-open")) {
        closeNav();
      }
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) {
      closeNav();
    }
  });
}

(function () {
  const track = document.getElementById("heroCarouselTrack");
  if (!track) return;
  const dots = Array.from(document.querySelectorAll(".hero-carousel-dot"));
  let current = 0;
  let timer;

  function goTo(idx) {
    current = idx;
    track.style.transform = "translateX(-" + idx * 100 + "%)";
    dots.forEach(function (d, i) {
      d.classList.toggle("is-active", i === idx);
      d.setAttribute("aria-selected", i === idx ? "true" : "false");
    });
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(function () {
      goTo((current + 1) % dots.length);
    }, 4000);
  }

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      goTo(Number(dot.dataset.idx));
      startTimer();
    });
  });

  startTimer();
})();

(function () {
  const track = document.getElementById("tutorTrack");
  const prevBtn = document.getElementById("tutorPrev");
  const nextBtn = document.getElementById("tutorNext");
  if (!track || !prevBtn || !nextBtn) return;

  function cardWidth() {
    const card = track.querySelector(".tutor-strip-card");
    return card ? card.offsetWidth + 18 : 0;
  }

  prevBtn.addEventListener("click", function () {
    track.scrollBy({ left: -cardWidth(), behavior: "smooth" });
  });
  nextBtn.addEventListener("click", function () {
    track.scrollBy({ left: cardWidth(), behavior: "smooth" });
  });
})();

if (contactForm && accessKeyField && formStatus) {
  const defaultSubmitLabel = contactSubmitButton?.textContent ?? "Send enquiry";

  const setFormStatus = (message, state) => {
    formStatus.textContent = message;
    formStatus.hidden = false;
    formStatus.dataset.state = state;
  };

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) {
      return;
    }

    const formData = new FormData(contactForm);

    setFormStatus("Sending your enquiry...", "sending");

    if (contactSubmitButton) {
      contactSubmitButton.disabled = true;
      contactSubmitButton.textContent = "Sending...";
    }

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Something went wrong while sending your enquiry.");
      }

      contactForm.reset();
      setFormStatus("Your enquiry has been sent. We will be in touch shortly.", "success");
    } catch (error) {
      setFormStatus(
        error instanceof Error ? error.message : "We could not send your enquiry. Please try again.",
        "error",
      );
    } finally {
      if (contactSubmitButton) {
        contactSubmitButton.disabled = false;
        contactSubmitButton.textContent = defaultSubmitLabel;
      }
    }
  });
}
