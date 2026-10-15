import { useEffect } from "react";

/*
  Scroll reveal engine.

  Any element carrying a `data-reveal` attribute fades/slides into view the
  first time it enters the viewport. Sibling elements are automatically
  staggered so grids of cards cascade nicely.

  Variants (via the attribute value):
    data-reveal            -> slide up (default)
    data-reveal="down"     -> slide down
    data-reveal="left"     -> slide in from the left
    data-reveal="right"    -> slide in from the right
    data-reveal="zoom"     -> scale up
    data-reveal="fade"     -> fade only

  Once the animation finishes we mark the element with `data-reveal-done`
  so the reveal CSS stops applying and normal styles (e.g. hover transforms)
  take over again.
*/

const MAX_STAGGER_STEPS = 6;
const STAGGER_MS = 90;
const FALLBACK_MS = 1500;

export function useScrollReveal(dependency) {
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll("[data-reveal]:not([data-reveal-done])")
    );

    if (!nodes.length) {
      return undefined;
    }

    const finish = (el) => {
      el.setAttribute("data-reveal-done", "");
      el.classList.remove("is-revealed");
    };

    const reveal = (el) => {
      if (el.hasAttribute("data-reveal-done")) return;
      el.classList.add("is-revealed");
      window.setTimeout(() => finish(el), FALLBACK_MS);
    };

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(finish);
      return undefined;
    }

    // Stagger elements that share the same parent.
    const groups = new Map();
    nodes.forEach((el) => {
      const parent = el.parentElement;
      if (!parent) return;
      const siblings = groups.get(parent) || [];
      siblings.push(el);
      groups.set(parent, siblings);
    });

    groups.forEach((siblings) => {
      siblings.forEach((el, index) => {
        if (index > 0) {
          el.style.setProperty(
            "--reveal-delay",
            `${Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}ms`
          );
        }
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    nodes.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [dependency]);
}
