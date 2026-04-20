const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const contactForm = document.querySelector(".contact-form-card");
const accessKeyField = contactForm?.querySelector('input[name="access_key"]');
const contactSubmitButton = contactForm?.querySelector('button[type="submit"]');
const formStatus = contactForm?.querySelector("[data-form-status]");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });
}

const heroImage = document.querySelector(".hero-image");

if (heroImage?.dataset.heroImages) {
  const heroImages = heroImage.dataset.heroImages
    .split("|")
    .map((imagePath) => imagePath.trim())
    .filter(Boolean);

  if (heroImages.length > 1) {
    const randomIndex = Math.floor(Math.random() * heroImages.length);
    heroImage.src = heroImages[randomIndex];
  }
}

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
