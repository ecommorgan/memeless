
document.addEventListener("DOMContentLoaded", () => {
  const joinBtn = document.getElementById("joinAirdropBtn");
  const buyBtn = document.getElementById("buyPresaleBtn");
  const modal = document.getElementById("loginModal");
  const goToLoginBtn = document.getElementById("goToLoginBtn");

  if (joinBtn && buyBtn && modal && goToLoginBtn) {
    joinBtn.onclick = () => openModal("airdrop");
    buyBtn.onclick = () => openModal("presale");

    function openModal(target) {
      localStorage.setItem("redirectTo", target);
      modal.classList.add("active");
    }

    goToLoginBtn.onclick = () => {
      modal.classList.remove("active");
      document.querySelector(".login-box")?.scrollIntoView({ behavior: "smooth" });
    };
  }

  // Redirect after login
  const redirectTarget = localStorage.getItem("redirectTo");
  if (redirectTarget && window.location.pathname.includes("dashboard")) {
    if (redirectTarget === "airdrop") window.location.href = "dashboard#airdrop";
    if (redirectTarget === "presale") window.location.href = "dashboard#presale";
    localStorage.removeItem("redirectTo");
  }
});
