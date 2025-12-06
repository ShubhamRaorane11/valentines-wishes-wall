document.addEventListener("DOMContentLoaded", () => {
  // Elements on wishes page
  const form = document.getElementById("wishForm");
  const nameInput = document.getElementById("name");
  const messageInput = document.getElementById("message");
  const statusEl = document.getElementById("status");
  const wishesGrid = document.getElementById("wishesGrid");
  const emptyState = document.querySelector(".empty-state");

  // Optional fun button on home
  const justLookingBtn = document.querySelector(".btn-ghost");
  if (justLookingBtn) {
    justLookingBtn.addEventListener("click", () => {
      justLookingBtn.textContent = "Hope you like the design 💕";
      setTimeout(() => {
        justLookingBtn.textContent = "Just looking 👀";
      }, 2000);
    });
  }

  // ---------- ADD WISH (AJAX) ---------- //
  if (form && messageInput && wishesGrid) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = nameInput.value.trim();
      const message = messageInput.value.trim();

      if (!message) {
        setStatus("Message cannot be empty.", "error");
        return;
      }

      if (message.length > 300) {
        setStatus("Message is too long (max 300 characters).", "error");
        return;
      }

      setStatus("Sending...", "info");

      try {
        const response = await fetch("/api/wishes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name, message })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errMsg = data.error || "Something went wrong. Please try again.";
          setStatus(errMsg, "error");
          return;
        }

        setStatus("Sent with ❤️", "success");
        form.reset();

        if (emptyState) {
          emptyState.style.display = "none";
        }

        if (data.wish) {
          prependWishCard(data.wish);
        }

        spawnFloatingHeart();
      } catch (err) {
        console.error(err);
        setStatus("Server error. Please try again.", "error");
      }
    });
  }

  function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color =
      type === "error"
        ? "red"
        : type === "success"
        ? "green"
        : "#5a3c5f";
  }

  // Create a new wish card (with delete button)
  function prependWishCard(wish) {
    const card = document.createElement("div");
    card.className = "wish-card";

    if (wish.id !== undefined && wish.id !== null) {
      card.dataset.id = wish.id;
    }

    const safeName = wish.name || "Someone";
    const safeTime = wish.created_at || "";
    const safeMessage = wish.message || "";

    card.innerHTML = `
      <div class="wish-header">
        <span class="wish-name">${escapeHtml(safeName)}</span>
        <span class="wish-time">${escapeHtml(safeTime)}</span>
      </div>
      <p class="wish-text">${escapeHtml(safeMessage)}</p>
      <button class="delete-btn" type="button">🗑️</button>
    `;

    wishesGrid.prepend(card);
  }

  // Floating hearts animation
  function spawnFloatingHeart() {
    const heart = document.createElement("div");
    heart.textContent = "❤";
    heart.style.position = "fixed";
    heart.style.left = Math.random() * 70 + 15 + "%";
    heart.style.bottom = "0";
    heart.style.fontSize = "24px";
    heart.style.opacity = "1";
    heart.style.zIndex = "9999";
    heart.style.transition = "transform 2s linear, opacity 2s linear";

    document.body.appendChild(heart);

    requestAnimationFrame(() => {
      heart.style.transform = "translateY(-200px)";
      heart.style.opacity = "0";
    });

    setTimeout(() => {
      heart.remove();
    }, 2200);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

    // ---------- DELETE WISH (POST to /api/delete-wish) ---------- //
  document.addEventListener("click", async (e) => {
    // works even if you click an icon/image inside the button
    const btn = e.target.closest(".delete-btn");
    if (!btn) return;

    const card = btn.closest(".wish-card");
    if (!card) return;

    const id = card.dataset.id;
    if (!id) return;

    const confirmed = confirm("Delete this wish?");
    if (!confirmed) return;

    try {
      const response = await fetch("/api/delete-wish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id })
      });

      const data = await response.json();

      if (data.success) {
        card.remove();

        const remaining = document.querySelectorAll(".wish-card").length;
        if (remaining === 0 && emptyState) {
          emptyState.style.display = "block";
        }
      } else {
        console.error("Delete error:", data.error);
        alert("Could not delete the wish.");
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("Server error while deleting.");
    }
  });
});
