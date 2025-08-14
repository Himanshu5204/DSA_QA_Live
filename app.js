const backendInput = document.getElementById('backendUrl');
const messagesEl = document.getElementById('messages');
const form = document.getElementById('composer');
const input = document.getElementById('input');
const toneSelect = document.getElementById('toneSelect');
const clearBtn = document.getElementById('clearHistory');
const promptBtns = Array.from(document.querySelectorAll('.prompt'));
const exampleBtn = document.getElementById('exampleBtn');

// Auto-set backend path
backendInput.value = `http://localhost:3000/api/answer`;

function scrollToBottom(){ messagesEl.scrollTop = messagesEl.scrollHeight; }

function renderMessage(role, text, meta = ''){
  const li = document.createElement('li');
  li.className = 'message ' + (role === 'user' ? 'user' : 'assistant');
  if(meta) li.innerHTML = `<div class="meta">${meta}</div>` + `<div class="content"></div>`;
  else li.innerHTML = `<div class="content"></div>`;
  li.querySelector('.content').innerHTML = markedSafe(text);
  messagesEl.appendChild(li);
  scrollToBottom();
  return li;
}

function markedSafe(text){
  return text
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/\n/g,'<br>');
}
const themeToggle = document.getElementById('themeToggle');

// Load saved theme
if (localStorage.getItem('theme') === 'light') {
  document.documentElement.classList.add('light-mode');
  themeToggle.textContent = '☀️';
}

// Toggle theme on click
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

function showTyping(){
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

function saveHistory(){
  const items = Array.from(messagesEl.querySelectorAll('.message')).map(m => ({
    role: m.classList.contains('user')? 'user':'assistant',
    text: m.querySelector('.content')?.innerText || ''
  }));
  localStorage.setItem('dsa_chat_history', JSON.stringify(items));
}

function loadHistory(){
  const data = localStorage.getItem('dsa_chat_history');
  if(!data) return;
  try{
    const items = JSON.parse(data);
    items.forEach(it => renderMessage(it.role, it.text));
  }catch(e){console.warn(e)}
}

clearBtn.addEventListener('click', ()=>{
  localStorage.removeItem('dsa_chat_history');
  messagesEl.innerHTML = '';
});

promptBtns.forEach(btn => btn.addEventListener('click', ()=>{
  input.value = btn.innerText;
  input.focus();
}));

exampleBtn.addEventListener('click', ()=>{
  input.value = 'Show me a code example for quicksort in JavaScript';
  input.focus();
});

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const question = input.value.trim();
  if(!question) return;
  const style = toneSelect.value;
  
  renderMessage('user', question);
  input.value = '';

  const typingNode = showTyping();

  try{
    const res = await fetch(backendInput.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question})
    });

    if(!res.ok) throw new Error('Server returned ' + res.status);
    const json = await res.json();
    
    typingNode.remove();

    const answer = json.answer || 'No answer returned from backend';
    renderMessage('assistant', answer);
    saveHistory();
  }catch(err){
    console.error(err);
    typingNode.remove();
    renderMessage('assistant', 'Error: ' + (err.message||err));
  }
});

loadHistory();

input.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    form.requestSubmit();
  }
});

window._dsaChat = { renderMessage, saveHistory };
