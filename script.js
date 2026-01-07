(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const nav = document.querySelector(".nav");
  const navHeight = nav ? nav.offsetHeight : 0;

  document.querySelectorAll("a[href^=\"#\"]").forEach((link) => {
    const id = link.getAttribute("href").slice(1);
    if (!id) return;

    link.addEventListener("click", (event) => {
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 8;
      window.scrollTo({
        top,
        behavior: prefersReduced ? "auto" : "smooth",
      });
    });
  });

  const revealTargets = document.querySelectorAll(".reveal, .reveal-line");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  const navLinks = Array.from(document.querySelectorAll(".nav__link"));
  const linkById = new Map(
    navLinks.map((link) => [link.getAttribute("href").slice(1), link])
  );

  if ("IntersectionObserver" in window && linkById.size) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const link = linkById.get(entry.target.id);
          if (!link) return;
          navLinks.forEach((item) => item.classList.toggle("is-active", item === link));
        });
      },
      { rootMargin: "-40% 0px -50%" }
    );

    document.querySelectorAll("section[id]").forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  const countEls = document.querySelectorAll("[data-count]");
  const runCount = (el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;

    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const duration = prefersReduced ? 0 : 1200;

    if (!duration) {
      el.textContent = `${prefix}${target}${suffix}`;
      return;
    }

    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${value}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window && countEls.length) {
    const countObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCount(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );

    countEls.forEach((el) => countObserver.observe(el));
  } else {
    countEls.forEach(runCount);
  }

  const hero = document.querySelector(".hero");
  const heroBg = document.querySelector(".hero__bg");

  if (hero && heroBg && !prefersReduced) {
    let ticking = false;
    const updateParallax = () => {
      ticking = false;
      const offset = Math.min(window.scrollY, hero.offsetHeight);
      heroBg.style.transform = `translate3d(0, ${offset * 0.12}px, 0) scale(1.03)`;
    };

    updateParallax();
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(updateParallax);
      },
      { passive: true }
    );

    let glowRaf = 0;
    hero.addEventListener("mousemove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      if (glowRaf) cancelAnimationFrame(glowRaf);
      glowRaf = requestAnimationFrame(() => {
        hero.style.setProperty("--spot-x", `${x.toFixed(2)}%`);
        hero.style.setProperty("--spot-y", `${y.toFixed(2)}%`);
      });
    });

    hero.addEventListener("mouseleave", () => {
      hero.style.removeProperty("--spot-x");
      hero.style.removeProperty("--spot-y");
    });
  }

  const concierge = document.querySelector(".concierge");
  if (concierge) {
    const toggleConcierge = () => {
      concierge.classList.toggle("is-visible", window.scrollY > 520);
    };

    toggleConcierge();
    window.addEventListener("scroll", toggleConcierge, { passive: true });
  }

  const form = document.getElementById("lead-form");
  if (form) {
    const feedback = form.querySelector(".form__feedback");
    const submitBtn = form.querySelector("button[type=\"submit\"]");
    const requiredFields = Array.from(form.querySelectorAll("[required]"));
    const phoneInput = form.querySelector("#lead-phone");

    const setFeedback = (message, isError = false) => {
      if (!feedback) return;
      feedback.textContent = message;
      feedback.style.color = isError ? "rgba(255,160,160,0.95)" : "var(--text-warm)";
    };

    const formatPhone = (value) => {
      const digits = value.replace(/\D/g, "").slice(0, 11);
      if (!digits) return "";
      if (digits.length <= 2) return `(${digits}`;
      if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    if (phoneInput) {
      phoneInput.addEventListener("input", () => {
        phoneInput.value = formatPhone(phoneInput.value);
      });
    }

    requiredFields.forEach((field) => {
      field.addEventListener("input", () => {
        field.classList.remove("is-invalid");
        setFeedback("");
      });
      field.addEventListener("change", () => {
        field.classList.remove("is-invalid");
        setFeedback("");
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      let hasError = false;
      requiredFields.forEach((field) => {
        const value = field.value.trim();
        if (!value) {
          field.classList.add("is-invalid");
          hasError = true;
        }
      });

      if (hasError) {
        setFeedback("Por favor, preencha os campos obrigatórios.", true);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Curadoria solicitada";
      }

      setFeedback("Obrigado. Vamos retornar em até 24h úteis.");
      form.reset();

      if (submitBtn) {
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = "Solicitar curadoria";
        }, 2000);
      }
    });
  }
})();
