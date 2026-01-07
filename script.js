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

  const customSelects = document.querySelectorAll("[data-select]");
  const closeSelect = (select) => {
    select.classList.remove("is-open");
    const button = select.querySelector(".select__button");
    if (button) button.setAttribute("aria-expanded", "false");
  };

  customSelects.forEach((select) => {
    const button = select.querySelector(".select__button");
    const label = select.querySelector(".select__label");
    const list = select.querySelector(".select__list");
    const options = Array.from(select.querySelectorAll(".select__option"));
    const hiddenInput = select.querySelector("input[type=\"hidden\"]");

    if (!button || !label || !list || !options.length || !hiddenInput) return;

    list.tabIndex = -1;

    const setHighlight = (index) => {
      options.forEach((option, idx) => {
        option.classList.toggle("is-highlighted", idx === index);
      });
      const highlighted = options[index];
      if (highlighted) {
        highlighted.scrollIntoView({ block: "nearest" });
      }
    };

    const selectOption = (option) => {
      const value = option.dataset.value || option.textContent.trim();
      hiddenInput.value = value;
      label.textContent = option.textContent.trim();

      options.forEach((item) => {
        item.classList.remove("is-selected");
        item.removeAttribute("aria-selected");
      });
      option.classList.add("is-selected");
      option.setAttribute("aria-selected", "true");

      button.classList.remove("is-invalid");
      closeSelect(select);
    };

    button.addEventListener("click", () => {
      const isOpen = select.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        const selectedIndex = options.findIndex((option) =>
          option.classList.contains("is-selected")
        );
        setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
        list.focus();
      }
    });

    button.addEventListener("keydown", (event) => {
      const { key } = event;
      if (key === "ArrowDown" || key === "ArrowUp") {
        event.preventDefault();
        select.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        const selectedIndex = options.findIndex((option) =>
          option.classList.contains("is-selected")
        );
        setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
        list.focus();
      }
    });

    list.addEventListener("keydown", (event) => {
      const { key } = event;
      const currentIndex = options.findIndex((option) =>
        option.classList.contains("is-highlighted")
      );

      if (key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, options.length - 1);
        setHighlight(nextIndex);
      }
      if (key === "ArrowUp") {
        event.preventDefault();
        const nextIndex = Math.max(currentIndex - 1, 0);
        setHighlight(nextIndex);
      }
      if (key === "Enter" || key === " ") {
        event.preventDefault();
        const option = options[currentIndex];
        if (option) selectOption(option);
        button.focus();
      }
      if (key === "Escape") {
        event.preventDefault();
        closeSelect(select);
        button.focus();
      }
    });

    options.forEach((option) => {
      option.addEventListener("click", () => selectOption(option));
    });

    document.addEventListener("click", (event) => {
      if (!select.contains(event.target)) {
        closeSelect(select);
      }
    });
  });

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
      if (field.type === "hidden") return;
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
          const selectField = field.closest("[data-select]");
          if (selectField) {
            const trigger = selectField.querySelector(".select__button");
            if (trigger) trigger.classList.add("is-invalid");
          } else {
            field.classList.add("is-invalid");
          }
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

      const selectsInForm = Array.from(form.querySelectorAll("[data-select]"));
      selectsInForm.forEach((select) => {
        const label = select.querySelector(".select__label");
        const hiddenInput = select.querySelector("input[type=\"hidden\"]");
        const options = Array.from(select.querySelectorAll(".select__option"));

        if (hiddenInput) hiddenInput.value = "";
        if (label) label.textContent = "Selecione";
        options.forEach((option) => {
          option.classList.remove("is-selected", "is-highlighted");
          option.removeAttribute("aria-selected");
        });
      });

      if (submitBtn) {
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = "Solicitar curadoria";
        }, 2000);
      }
    });
  }
})();
