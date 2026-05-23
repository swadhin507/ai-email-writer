console.log("Email Writer Extension - Content Script Loaded");

/* ================= CREATE TONE DROPDOWN ================= */

function createToneSelector() {
  const select = document.createElement("select");

  select.className = "ai-tone-selector";

  select.style.marginRight = "8px";
  select.style.height = "36px";
  select.style.borderRadius = "18px";
  select.style.border = "1px solid #ccc";
  select.style.padding = "0 10px";
  select.style.cursor = "pointer";
  select.style.fontSize = "15px";

  const tones = [
    { value: "professional", label: "Professional" },
    { value: "friendly", label: "Friendly" },
    { value: "casual", label: "Casual" },
    { value: "formal", label: "Formal" },
    { value: "enthusiastic", label: "Enthusiastic" },
  ];

  tones.forEach((tone) => {
    const option = document.createElement("option");
    option.value = tone.value;
    option.textContent = tone.label;
    select.appendChild(option);
  });

  return select;
}

/* ================= CREATE BUTTON ================= */

function createAIButton() {
  const button = document.createElement("div");

  button.className = "T-I J-J5-Ji T-I-KE L3 ai-reply-btn";
  button.innerHTML = "✨ AI Reply";

  button.style.marginRight = "8px";
  button.style.background = "#e8f0fe";
  button.style.color = "#1967d2";
  button.style.borderRadius = "18px";
  button.style.padding = "0 16px";
  button.style.height = "36px";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.cursor = "pointer";
  button.style.fontWeight = "500";

  return button;
}

/* ================= GET EMAIL CONTENT ================= */

function getEmailContent() {
  const selectors = [
    ".h7",
    ".a3s.aiL",
    ".gmail_quote",
    '[role="presentation"]',
  ];

  for (const selector of selectors) {
    const content = document.querySelector(selector);
    if (content) {
      return content.innerText.trim();
    }
  }
  return "";
}

/* ================= FIND TOOLBAR ================= */

function findComposeToolbar() {
  const selectors = [".aDh", ".btC", '[role="toolbar"]', ".gU.Up"];

  for (const selector of selectors) {
    const toolbar = document.querySelector(selector);
    if (toolbar) {
      return toolbar;
    }
  }
  return null;
}

/* ================= INJECT BUTTON + DROPDOWN ================= */

function injectButton() {
  // remove old elements
  const oldBtn = document.querySelector(".ai-reply-btn");
  const oldSelect = document.querySelector(".ai-tone-selector");
  if (oldBtn) oldBtn.remove();
  if (oldSelect) oldSelect.remove();

  const toolbar = findComposeToolbar();
  if (!toolbar) {
    console.log("Toolbar not found");
    return;
  }

  const sendButton = toolbar.querySelector(".T-I.T-I-atl");

  if (!sendButton) {
    console.log("Send button not found");
    return;
  }

  console.log("Injecting AI button + tone selector");

  const toneSelector = createToneSelector();
  const button = createAIButton();

  /* ===== CLICK EVENT ===== */
  button.addEventListener("click", async () => {
    try {
      button.innerHTML = "Generating...";
      button.style.pointerEvents = "none";

      const emailContent = getEmailContent();
      const selectedTone = toneSelector.value;

      const response = await fetch("http://localhost:8080/api/email/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailContent: emailContent,
          tone: selectedTone,
        }),
      });

      if (!response.ok) {
        throw new Error("API Request Failed");
      }

      const generatedReply = await response.text();

      const composeBox = document.querySelector(
        '[role="textbox"][g_editable="true"]',
      );

      if (composeBox) {
        composeBox.focus();
        document.execCommand("insertText", false, generatedReply);
      } else {
        console.error("Compose box not found");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate reply");
    } finally {
      button.innerHTML = "✨ AI Reply";
      button.style.pointerEvents = "auto";
    }
  });

  /* ===== INSERT INTO TOOLBAR ===== */

  const parent = sendButton.parentNode;

  parent.insertBefore(toneSelector, sendButton);
  parent.insertBefore(button, sendButton);
}

/* ================= OBSERVER ================= */

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes);

    const hasCompose = addedNodes.some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches('.aDh, .btC, [role="dialog"]') ||
          node.querySelector('.aDh, .btC, [role="dialog"]')),
    );

    if (hasCompose) {
      console.log("Compose Window Detected");

      setTimeout(() => {
        injectButton();
      }, 800);
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
