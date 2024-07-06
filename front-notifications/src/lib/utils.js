import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const prueba = []

prueba.length

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function smoothScrollToElement(element, container, duration) {
  const start = container.scrollTop;
  const end =
    element.offsetTop - container.clientHeight / 2 + element.offsetHeight / 2;
  const startTime = performance.now();

  const smoothScroll = (currentTime) => {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);

    container.scrollTop = start + (end - start) * progress;

    if (progress < 1) {
      requestAnimationFrame(smoothScroll);
    }
  };

  requestAnimationFrame(smoothScroll);
}
