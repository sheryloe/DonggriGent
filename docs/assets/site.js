(() => {
  const path = window.location.pathname.split("/").pop() || "index.html";
  const links = Array.from(document.querySelectorAll(".nav a[data-path]"));
  for (const link of links) {
    if (link.getAttribute("data-path") === path) {
      link.classList.add("active");
    }
  }
})();
