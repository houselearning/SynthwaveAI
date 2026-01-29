// ------------------------------
// DOM ELEMENTS (must be first)
// ------------------------------
const chatBody = document.getElementById("chat-body");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userPill = document.getElementById("user-pill");

// ------------------------------
// 1. WebLLM — browser AI
// ------------------------------
let ai = null;

async function initAI() {
  try {
    ai = await window.webllm.createChatModule({
      model: "Qwen2.5-1.5B-Instruct-q4f16_1"
    });

    appendSystem("Synthwave AI is online.");
  } catch (err) {
    appendSystem("AI failed to load. Check WebLLM CDN.");
    console.error(err);
  }
}

initAI();

// ------------------------------
// 2. Chat UI + history
// ------------------------------
const HISTORY_KEY = "synthwave_history";
let messages = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
}

function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function appendSystem(text) {
  appendMessage("ai", text);
}

messages.forEach(m => appendMessage(m.role, m.text));

// ------------------------------
// 3. Word filter
// ------------------------------
const blocked = ["badword1", "badword2"];

function filterText(t) {
  let out = t;
  blocked.forEach(w => {
    const r = new RegExp(w, "gi");
    out = out.replace(r, "***");
  });
  return out;
}

// ------------------------------
// 4. Send message
// ------------------------------
sendBtn.onclick = async () => {
  const text = filterText(userInput.value.trim());
  if (!text) return;

  appendMessage("user", text);
  messages.push({ role: "user", text });
  saveHistory();
  userInput.value = "";

  if (!ai) {
    appendSystem("AI not ready yet.");
    return;
  }

  const reply = await ai.generate(text);
  appendMessage("ai", reply);
  messages.push({ role: "ai", text: reply });
  saveHistory();
};

// ------------------------------
// 5. Voice input
// ------------------------------
if ("webkitSpeechRecognition" in window) {
  const rec = new webkitSpeechRecognition();
  rec.lang = "en-US";

  voiceBtn.onclick = () => rec.start();
  rec.onresult = e => {
    userInput.value += " " + e.results[0][0].transcript;
  };
} else {
  voiceBtn.disabled = true;
}

// ------------------------------
// 6. Firebase Auth
// ------------------------------
const auth = window.firebaseAuth;
const {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut
} = window.firebaseAuthFns;

loginBtn.onclick = () => signInAnonymously(auth);
logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, user => {
  if (user) {
    userPill.textContent = user.isAnonymous ? "Guest" : user.email;
    logoutBtn.style.display = "inline-block";
  } else {
    userPill.textContent = "";
    logoutBtn.style.display = "none";
  }
});
