const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Array untuk menyimpan riwayat percakapan (digunakan untuk multiturn chat)
let conversationHistory = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // 1. Tambahkan pesan pengguna ke chat box
  appendMessage('user', userMessage);
  input.value = '';
  
  // Tambahkan pesan pengguna ke riwayat (role: user)
  conversationHistory.push({ role: 'user', text: userMessage });

  // 2. Tampilkan pesan bot "Thinking..." (placeholder)
  const thinkingMessageElement = appendMessage('bot', 'Thinking...');
  
  try {
    // 3. Kirim permintaan POST ke /api/chat
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Kirim seluruh riwayat percakapan
      body: JSON.stringify(conversationHistory),
    });

    if (!response.ok) {
      // Jika respons HTTP tidak 2xx (misalnya 400 atau 500)
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    let botReply = data.result;

    if (!botReply) {
      botReply = 'Sorry, no response received from AI.';
    }
    
    // 4. Ganti pesan "Thinking..." dengan balasan AI
    updateMessage(thinkingMessageElement, botReply);
    
    // Tambahkan balasan bot ke riwayat (role: model)
    conversationHistory.push({ role: 'model', text: botReply });

  } catch (error) {
    // 5. Tangani error dan tampilkan pesan kesalahan
    console.error('API Error:', error);
    updateMessage(thinkingMessageElement, `Failed to get response from server: ${error.message}`);
    
    // Opsional: Hapus pesan pengguna terakhir dari riwayat jika API gagal
    conversationHistory.pop();
  }
});

/**
 * Menambahkan pesan baru ke chat box.
 * @param {string} sender - 'user' atau 'bot'
 * @param {string} text - Isi pesan
 * @returns {HTMLElement} Elemen pesan yang dibuat
 */
function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

/**
 * Mengganti isi teks dari elemen pesan yang sudah ada.
 * @param {HTMLElement} element - Elemen pesan yang akan diperbarui (misalnya, pesan "Thinking...")
 * @param {string} newText - Teks baru dari AI
 */
function updateMessage(element, newText) {
  element.textContent = newText;
  chatBox.scrollTop = chatBox.scrollHeight;
}