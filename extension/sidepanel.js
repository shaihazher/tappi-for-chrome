import { HarnessError, createDemoAdapter } from '../shared/adapter.js';

const adapter = createDemoAdapter();
const messages = document.getElementById('messages');
const composer = document.getElementById('composer');
const input = document.getElementById('input');
const send = document.getElementById('send');
const newChat = document.getElementById('new-chat');

let history = [];
let busy = false;

function avatar(who) {
  return who === 'user' ? 'U' : 'T';
}

function addMessage(who, text, { demo = false } = {}) {
  const wrap = document.createElement('div');
  wrap.className = `msg ${who}`;

  const face = document.createElement('div');
  face.className = 'who';
  face.textContent = avatar(who);

  const body = document.createElement('div');
  body.className = `body${demo ? ' demo' : ''}`;
  body.textContent = text;

  wrap.append(face, body);
  messages.append(wrap);
  messages.scrollTop = messages.scrollHeight;
  return body;
}

function clearEmpty() {
  const empty = messages.querySelector('.empty');
  if (empty) empty.remove();
}

function reset() {
  history = [];
  messages.replaceChildren();
  const empty = document.createElement('div');
  empty.className = 'empty';
  empty.innerHTML = `
    <svg class="empty-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8 8h16v5H8zM8 15h11v5H8zM8 22h16v5H8z" fill="currentColor" />
      <circle cx="25" cy="17.5" r="2.4" fill="#f7643a" />
    </svg>
    <p class="eyebrow">A fresh perspective</p>
    <h1>What shall we work on?</h1>
    <p class="muted">This is the sanitized open shell. It runs a demo adapter with no model, no native host, and no network calls.</p>
    <div class="suggestions">
      <button type="button" data-prompt="Explain what this shell does and what is not included.">What is in this shell?</button>
      <button type="button" data-prompt="Show me the adapter contract.">Show the adapter contract</button>
    </div>`;
  messages.append(empty);
  bindSuggestions();
  input.value = '';
  input.focus();
}

async function submit(text) {
  const clean = text.trim();
  if (!clean || busy) return;
  busy = true;
  send.disabled = true;
  clearEmpty();
  addMessage('user', clean);
  history.push({ role: 'user', text: clean });
  input.value = '';

  const pending = addMessage('tappi', 'Working…');
  try {
    const response = await adapter.send({ text: clean });
    pending.classList.remove('demo');
    pending.classList.add('demo');
    pending.textContent = response.text;
    history.push({ role: 'assistant', text: response.text, demo: true });
  } catch (error) {
    pending.textContent =
      error instanceof HarnessError ? `${error.code}: ${error.message}` : 'The demo adapter failed.';
  } finally {
    busy = false;
    send.disabled = false;
    input.focus();
  }
}

function bindSuggestions() {
  for (const button of messages.querySelectorAll('[data-prompt]')) {
    button.addEventListener('click', () => submit(button.dataset.prompt ?? ''));
  }
}

composer.addEventListener('submit', (event) => {
  event.preventDefault();
  submit(input.value);
});

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    submit(input.value);
  }
});

newChat.addEventListener('click', reset);
bindSuggestions();
input.focus();
