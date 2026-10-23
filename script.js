// Initialisierung der Zustände (mit Abfrage aus dem Speicher, falls vorhanden)
let count1 = parseInt(localStorage.getItem('count1')) || 0;
let count2 = parseInt(localStorage.getItem('count2')) || 0;

// DOM-Elemente
const count1Display = document.getElementById('count-1');
const count2Display = document.getElementById('count-2');
const totalDisplay = document.getElementById('total-count');

const scalePointer = document.getElementById('scale-pointer');
const scaleStatus = document.getElementById('scale-status');
const percent1Display = document.getElementById('percent-state-1');
const percent2Display = document.getElementById('percent-state-2');

const btnInc1 = document.getElementById('btn-inc-1');
const btnDec1 = document.getElementById('btn-dec-1');
const btnInc2 = document.getElementById('btn-inc-2');
const btnDec2 = document.getElementById('btn-dec-2');
const btnReset = document.getElementById('btn-reset');

const scaleCard = document.getElementById('scale-card');

// Skala und Status aktualisieren
function updateScale(total) {
  if (total === 0) {
    scalePointer.style.left = '50%';
    scaleStatus.textContent = 'Noch keine Daten';
    percent1Display.textContent = '0%';
    percent2Display.textContent = '0%';
    return;
  }

  // Prozentualer Anteil (Links = Gut/Happy = 0%, Rechts = Schlecht/Beef = 100%)
  const badRatio = (count2 / total) * 100;
  const percentHappy = Math.round((count1 / total) * 100);
  const percentBeef = 100 - percentHappy;

  scalePointer.style.left = `${badRatio}%`;
  percent1Display.textContent = `${percentHappy}%`;
  percent2Display.textContent = `${percentBeef}%`;

  // Status-Text anhand des Verhältnisses
  if (percentHappy >= 80) {
    scaleStatus.textContent = 'Super harmonisch! 🟢';
  } else if (percentHappy >= 60) {
    scaleStatus.textContent = 'Frieden 🙂';
  } else if (percentHappy >= 45) {
    scaleStatus.textContent = 'Ausgeglichen ⚖️';
  } else if (percentHappy >= 25) {
    scaleStatus.textContent = 'Erhöhte Unruhe ⚠️';
  } else {
    scaleStatus.textContent = 'Auf die Fresse! 🔴';
  }
}

// Anzeige aktualisieren und im Speicher sichern
function updateDisplay() {
  const total = count1 + count2;

  count1Display.textContent = count1;
  count2Display.textContent = count2;
  totalDisplay.textContent = total;

  updateScale(total);

  localStorage.setItem('count1', count1);
  localStorage.setItem('count2', count2);
}

function showScale() {
  scaleCard.classList.remove('hidden');
}

// Smileys fliegen lassen
function launchEmojis(type) {
  const goodEmojis = ['😄', '🐹', '✨', '🥬', '❤️', '🥰', '🥳'];
  const badEmojis = ['😡', '⚡', '💥', '💢', '🥊', '🔥', '🗯️'];
  const emojis = (type === 'good') ? goodEmojis : badEmojis;

  const count = 16;
  for (let i = 0; i < count; i++) {
    const span = document.createElement('span');
    span.classList.add('flying-emoji');
    span.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    // Zufällige horizontale Position über den Bildschirm
    const randomX = Math.random() * 90 + 5; // 5vw bis 95vw
    span.style.left = `${randomX}vw`;

    // Versetzte Flugdauer und Größen für natürlichen Effekt
    const duration = 1.6 + Math.random() * 1.0; // 1.6s bis 2.6s
    const delay = Math.random() * 0.3;          // 0s bis 0.3s Startverzögerung
    const size = 1.6 + Math.random() * 1.4;      // 1.6rem bis 3rem

    span.style.animationDuration = `${duration}s`;
    span.style.animationDelay = `${delay}s`;
    span.style.fontSize = `${size}rem`;

    document.body.appendChild(span);

    // Nach Ablauf der Animation wieder sauber aus dem DOM entfernen
    setTimeout(() => {
      span.remove();
    }, (duration + delay) * 1000 + 200);
  }
}

// Event-Listener für Zustand 1
btnInc1.addEventListener('click', () => {
  showScale();
  launchEmojis('good');
  count1++;
  updateDisplay();
});

btnDec1.addEventListener('click', () => {
  showScale();
  if (count1 > 0) {
    count1--;
    updateDisplay();
  }
});

// Event-Listener für Zustand 2
btnInc2.addEventListener('click', () => {
  showScale();
  launchEmojis('bad');
  count2++;
  updateDisplay();
});

btnDec2.addEventListener('click', () => {
  showScale();
  if (count2 > 0) {
    count2--;
    updateDisplay();
  }
});

// Zähler zurücksetzen
btnReset.addEventListener('click', () => {
  if (count1 === 0 && count2 === 0) return;
  
  const confirmReset = confirm('Möchtest du beide Zähler wirklich auf 0 zurücksetzen?');
  if (confirmReset) {
    count1 = 0;
    count2 = 0;
    scaleCard.classList.add('hidden');
    updateDisplay();
  }
});

// Erste Anzeige beim Laden der Seite
updateDisplay();
