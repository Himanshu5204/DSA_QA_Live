const backendInput = document.getElementById('backendUrl');
const messagesEl = document.getElementById('messages');
const form = document.getElementById('composer');
const input = document.getElementById('input');
const toneSelect = document.getElementById('toneSelect');
const clearBtn = document.getElementById('clearHistory');
const promptBtns = Array.from(document.querySelectorAll('.prompt'));
const exampleBtn = document.getElementById('exampleBtn');
const themeToggle = document.getElementById('themeToggle');

const sidebar = document.querySelector('.sidebar');
const toggleBtn = document.getElementById('sidebarToggle');
const closeBtn = document.querySelector('.sidebar-close');
const prompts = document.querySelectorAll('.prompt');

// Auto-set backend path
backendInput.value = `https://dsa-qa-live.onrender.com/api/answer`;

// Toggle theme
if (localStorage.getItem('theme') === 'light') {
  document.documentElement.classList.add('light-mode');
  themeToggle.textContent = '☀️';
}
themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('light-mode');
  if (document.documentElement.classList.contains('light-mode')) {
    localStorage.setItem('theme', 'light');
    themeToggle.textContent = '☀️';
  } else {
    localStorage.setItem('theme', 'dark');
    themeToggle.textContent = '🌙';
  }
});

// Sidebar open/close
toggleBtn.addEventListener('click', () => {
  sidebar.classList.add('open');
  toggleBtn.style.display = 'none';
});
closeBtn.addEventListener('click', () => {
  sidebar.classList.remove('open');
  toggleBtn.style.display = 'block';
});
prompts.forEach(btn => {
  btn.addEventListener('click', () => {
    sidebar.classList.remove('open');
    toggleBtn.style.display = 'block';
    input.value = btn.textContent;
    input.focus();
  });
});

// Messages
function scrollToBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }
function renderMessage(role, text) {
  const li = document.createElement('li');
  li.className = 'message ' + (role === 'user' ? 'user' : 'assistant');
  li.innerHTML = `<div class="content"></div>`;
  li.querySelector('.content').innerHTML = markedSafe(text);
  messagesEl.appendChild(li);
  scrollToBottom();
}
function markedSafe(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

// Typing animation
function showTyping() {
  const el = document.createElement('div');
  el.className = 'typing';
  el.innerHTML = '<span></span><span></span><span></span>';
  const wrapper = document.createElement('li');
  wrapper.className = 'message assistant typing-wrap';
  wrapper.appendChild(el);
  messagesEl.appendChild(wrapper);
  scrollToBottom();
  return wrapper;
}

// History
function saveHistory() {
  const items = Array.from(messagesEl.querySelectorAll('.message')).map(m=>({
    role: m.classList.contains('user')?'user':'assistant',
    text: m.querySelector('.content')?.innerText || ''
  }));
  localStorage.setItem('dsa_chat_history', JSON.stringify(items));
}
function loadHistory() {
  const data = localStorage.getItem('dsa_chat_history');
  if (!data) return;
  try {
    const items = JSON.parse(data);
    items.forEach(it => renderMessage(it.role, it.text));
  } catch(e){ console.warn(e); }
}
clearBtn.addEventListener('click', ()=> { localStorage.removeItem('dsa_chat_history'); messagesEl.innerHTML=''; });
loadHistory();

// Quick prompts
promptBtns.forEach(btn => btn.addEventListener('click', ()=> { input.value=btn.innerText; input.focus(); }));
exampleBtn.addEventListener('click', ()=> { input.value='Show me a code example for quicksort in JavaScript'; input.focus(); });

// Form submit
form.addEventListener('submit', async e=>{
  e.preventDefault();
  const question = input.value.trim();
  if (!question) return;
  renderMessage('user', question);
  input.value='';
  const typingNode = showTyping();
  try {
    const res = await fetch(backendInput.value, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({question})
    });
    if(!res.ok) throw new Error('Server returned ' + res.status);
    const json = await res.json();
    typingNode.remove();
    renderMessage('assistant', json.answer || 'No answer returned');
    saveHistory();
  } catch(err){
    console.error(err);
    typingNode.remove();
    renderMessage('assistant','Error: ' + (err.message||err));
  }
});

// Enter key
input.addEventListener('keydown', e=>{
  if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); form.requestSubmit(); }
});

window._dsaChat = { renderMessage, saveHistory };
