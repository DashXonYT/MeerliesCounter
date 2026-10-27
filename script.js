// =============================================================================
// FIREBASE KONFIGURATION (Realtime Database)
// =============================================================================
// Trage hier deine Zugangsdaten aus den Firebase-Projekteinstellungen ein:
const firebaseConfig = {
  apiKey: "AIzaSyC_p-biClReXYAR22yCk7d4iLWUkK8G5y8",
  authDomain: "meerliesdatabase.firebaseapp.com",
  databaseURL: "https://meerliesdatabase-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "meerliesdatabase",
  storageBucket: "meerliesdatabase.firebasestorage.app",
  messagingSenderId: "469109618136",
  appId: "1:469109618136:web:7b94ed7587ca6f06ea6ead",
  measurementId: "G-PDNTHDY29P"
};

// Standard-Namen der 4 Personen (können in der App jederzeit über "Namen anpassen" geändert werden)
const DEFAULT_PERSON_NAMES = ['Person 1', 'Person 2', 'Person 3', 'Person 4'];

// Initialisierung der Zähler aus dem lokalen Speicher
let count1 = parseInt(localStorage.getItem('count1')) || 0;
let count2 = parseInt(localStorage.getItem('count2')) || 0;
let persons = loadPersons();

// Firebase Status-Variablen
let isFirebaseEnabled = false;
let dbRef = null;

// Personen aus dem localStorage laden oder mit Standardwerten initialisieren
function loadPersons() {
  try {
    const saved = localStorage.getItem('beefPersons');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 4) {
        return parsed.map((p, index) => ({
          id: index,
          name: (p.name && p.name.trim()) ? p.name.trim() : DEFAULT_PERSON_NAMES[index],
          count: typeof p.count === 'number' && p.count >= 0 ? p.count : 0
        }));
      }
    }
  } catch (e) {
    console.error('Fehler beim Laden der Personen:', e);
  }

  return DEFAULT_PERSON_NAMES.map((name, index) => ({
    id: index,
    name: name,
    count: 0
  }));
}

// Alle Daten im lokalen Speicher sichern
function saveData() {
  localStorage.setItem('count1', count1);
  localStorage.setItem('count2', count2);
  localStorage.setItem('beefPersons', JSON.stringify(persons));
}

// Daten an Firebase senden (Echtzeit-Synchronisation)
function syncToFirebase() {
  if (!isFirebaseEnabled || !dbRef) return;

  dbRef.set({
    count1: count1,
    count2: count2,
    persons: persons,
    lastUpdated: Date.now()
  }).catch((err) => {
    console.warn('Fehler beim Speichern in Firebase:', err);
  });
}

// DOM-Elemente
const count1Display = document.getElementById('count-1');
const count2Display = document.getElementById('count-2');
const totalDisplay = document.getElementById('total-count');

const scalePointer = document.getElementById('scale-pointer');
const scaleStatus = document.getElementById('scale-status');
const percent1Display = document.getElementById('percent-state-1');
const percent2Display = document.getElementById('percent-state-2');
const scaleCard = document.getElementById('scale-card');

const syncDot = document.getElementById('sync-dot');
const syncText = document.getElementById('sync-text');

const btnInc1 = document.getElementById('btn-inc-1');
const btnDec1 = document.getElementById('btn-dec-1');
const btnInc2 = document.getElementById('btn-inc-2');
const btnDec2 = document.getElementById('btn-dec-2');
const btnReset = document.getElementById('btn-reset');

// Elemente für "Wer hat Schuld?" und Modals
const personsGrid = document.getElementById('persons-grid');
const btnOpenEditNames = document.getElementById('btn-open-edit-names');

const modalBlame = document.getElementById('modal-blame');
const modalBlameTitle = document.getElementById('modal-blame-title');
const modalBlameSubtitle = document.getElementById('modal-blame-subtitle');
const blameSelectionGrid = document.getElementById('blame-selection-grid');
const btnCloseBlame = document.getElementById('btn-close-blame');
const btnCancelBlame = document.getElementById('btn-cancel-blame');

const modalEditNames = document.getElementById('modal-edit-names');
const formEditNames = document.getElementById('form-edit-names');
const btnCloseEdit = document.getElementById('btn-close-edit');
const btnCancelEdit = document.getElementById('btn-cancel-edit');

// Status-Anzeige im Footer aktualisieren
function setSyncStatus(status, text) {
  if (!syncDot || !syncText) return;
  syncDot.className = 'sync-dot ' + (status || '');
  syncText.textContent = text;
}

// Hilfsfunktion: HTML sicher escapen
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Avatar / Initiale ermitteln
function getPersonAvatar(name, index) {
  if (!name || !name.trim()) return `${index + 1}`;
  const trimmed = name.trim();
  const match = trimmed.match(/^Person\s*(\d+)$/i);
  if (match) {
    return match[1];
  }
  const chars = Array.from(trimmed);
  return chars.length > 0 ? chars[0].toUpperCase() : `${index + 1}`;
}

// Skala und Status aktualisieren
function updateScale(total) {
  if (total === 0) {
    scalePointer.style.left = '50%';
    scaleStatus.textContent = 'Noch keine Daten';
    percent1Display.textContent = '0%';
    percent2Display.textContent = '0%';
    return;
  }

  const badRatio = (count2 / total) * 100;
  const percentHappy = Math.round((count1 / total) * 100);
  const percentBeef = 100 - percentHappy;

  scalePointer.style.left = `${badRatio}%`;
  percent1Display.textContent = `${percentHappy}%`;
  percent2Display.textContent = `${percentBeef}%`;

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

// Übersicht der 4 Personen auf der Hauptseite rendern
function renderPersonsList() {
  personsGrid.innerHTML = '';
  const totalBeef = count2;

  persons.forEach((person, index) => {
    const card = document.createElement('div');
    card.className = `person-stat-card person-theme-${index}`;

    const percentage = totalBeef > 0 ? Math.round((person.count / totalBeef) * 100) : 0;
    const avatar = getPersonAvatar(person.name, index);

    card.innerHTML = `
      <div class="person-stat-top">
        <div class="person-stat-info">
          <div class="person-avatar-small">${escapeHtml(avatar)}</div>
          <div class="person-name-wrap">
            <span class="person-stat-name" title="${escapeHtml(person.name)}">${escapeHtml(person.name)}</span>
            <span class="person-stat-percent">${totalBeef > 0 ? percentage + '%' : '0%'}</span>
          </div>
        </div>
        <div class="person-stat-counter">
          <span class="person-stat-num">${person.count}</span>
          <button type="button" class="btn-person-dec" title="1 Beef abziehen bei ${escapeHtml(person.name)}" ${person.count <= 0 ? 'disabled' : ''} aria-label="1 Beef bei ${escapeHtml(person.name)} abziehen">-1</button>
        </div>
      </div>
      <div class="person-progress-track">
        <div class="person-progress-bar" style="width: ${percentage}%;"></div>
      </div>
    `;

    // Schnelles Verringern direkt an der Personen-Karte
    const decBtn = card.querySelector('.btn-person-dec');
    decBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (person.count > 0) {
        person.count--;
        if (count2 > 0) count2--;
        updateDisplay(true);
      }
    });

    personsGrid.appendChild(card);
  });
}

// Gesamte Anzeige aktualisieren und sichern
// syncCloud: ob die Änderung an Firebase geschickt werden soll (false bei eingehenden Cloud-Updates)
function updateDisplay(syncCloud = true) {
  const total = count1 + count2;

  count1Display.textContent = count1;
  count2Display.textContent = count2;
  totalDisplay.textContent = total;

  if (total > 0) {
    showScale();
  }

  updateScale(total);
  renderPersonsList();
  saveData();

  if (syncCloud) {
    syncToFirebase();
  }
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

    const randomX = Math.random() * 90 + 5;
    span.style.left = `${randomX}vw`;

    const duration = 1.6 + Math.random() * 1.0;
    const delay = Math.random() * 0.3;
    const size = 1.6 + Math.random() * 1.4;

    span.style.animationDuration = `${duration}s`;
    span.style.animationDelay = `${delay}s`;
    span.style.fontSize = `${size}rem`;

    document.body.appendChild(span);

    setTimeout(() => {
      span.remove();
    }, (duration + delay) * 1000 + 200);
  }
}

// Modal: Schuldigen-Auswahl öffnen
function openBlameModal(mode = 'inc') {
  blameSelectionGrid.innerHTML = '';

  if (mode === 'inc') {
    modalBlameTitle.textContent = '💥 Wer ist schuld?';
    modalBlameSubtitle.textContent = 'Wähle aus, wer den Beef verursacht hat:';
  } else {
    modalBlameTitle.textContent = '💥 Beef verringern (-1)';
    modalBlameSubtitle.textContent = 'Bei wem soll 1 Vorfall abgezogen werden?';
  }

  persons.forEach((person, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `blame-person-btn person-theme-${index}`;

    if (mode === 'dec' && person.count <= 0) {
      btn.disabled = true;
    }

    const avatar = getPersonAvatar(person.name, index);

    btn.innerHTML = `
      <div class="person-avatar">${escapeHtml(avatar)}</div>
      <span class="person-btn-name">${escapeHtml(person.name)}</span>
      <span class="person-btn-count">${person.count} ${person.count === 1 ? 'Vorfall' : 'Vorfälle'}</span>
    `;

    btn.addEventListener('click', () => {
      if (mode === 'inc') {
        person.count++;
        count2++;
        showScale();
        launchEmojis('bad');
      } else {
        if (person.count > 0) {
          person.count--;
          if (count2 > 0) count2--;
        }
      }
      closeBlameModal();
      updateDisplay(true);
    });

    blameSelectionGrid.appendChild(btn);
  });

  modalBlame.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeBlameModal() {
  modalBlame.classList.add('hidden');
  document.body.style.overflow = '';
}

// Modal: Namen anpassen öffnen
function openEditNamesModal() {
  persons.forEach((person, index) => {
    const input = document.getElementById(`input-person-${index}`);
    if (input) {
      input.value = person.name;
    }
  });

  modalEditNames.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const firstInput = document.getElementById('input-person-0');
  if (firstInput) {
    firstInput.focus();
    firstInput.select();
  }
}

function closeEditNamesModal() {
  modalEditNames.classList.add('hidden');
  document.body.style.overflow = '';
}

// Formular zum Umbenennen absenden
formEditNames.addEventListener('submit', (e) => {
  e.preventDefault();

  persons.forEach((person, index) => {
    const input = document.getElementById(`input-person-${index}`);
    if (input) {
      const val = input.value.trim();
      person.name = val || DEFAULT_PERSON_NAMES[index];
    }
  });

  closeEditNamesModal();
  updateDisplay(true);
});

// Event-Listener für Modal-Steuerung
btnOpenEditNames.addEventListener('click', openEditNamesModal);
btnCloseBlame.addEventListener('click', closeBlameModal);
btnCancelBlame.addEventListener('click', closeBlameModal);
btnCloseEdit.addEventListener('click', closeEditNamesModal);
btnCancelEdit.addEventListener('click', closeEditNamesModal);

// Modal per Klick auf Hintergrund schließen
modalBlame.addEventListener('click', (e) => {
  if (e.target === modalBlame) closeBlameModal();
});

modalEditNames.addEventListener('click', (e) => {
  if (e.target === modalEditNames) closeEditNamesModal();
});

// Modal per Escape-Taste schließen
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeBlameModal();
    closeEditNamesModal();
  }
});

// Event-Listener für Zustand 1 (Alle sind happy)
btnInc1.addEventListener('click', () => {
  showScale();
  launchEmojis('good');
  count1++;
  updateDisplay(true);
});

btnDec1.addEventListener('click', () => {
  showScale();
  if (count1 > 0) {
    count1--;
    updateDisplay(true);
  }
});

// Event-Listener für Zustand 2 (Meelies-Beef)
btnInc2.addEventListener('click', () => {
  openBlameModal('inc');
});

btnDec2.addEventListener('click', () => {
  if (count2 <= 0) return;
  showScale();

  const activePersons = persons.filter(p => p.count > 0);

  if (activePersons.length === 0) {
    count2--;
    updateDisplay(true);
  } else if (activePersons.length === 1) {
    activePersons[0].count--;
    count2--;
    updateDisplay(true);
  } else {
    openBlameModal('dec');
  }
});

// Zähler zurücksetzen
btnReset.addEventListener('click', () => {
  const totalBeef = persons.reduce((sum, p) => sum + p.count, 0);
  if (count1 === 0 && count2 === 0 && totalBeef === 0) return;

  const confirmReset = confirm('Möchtest du alle Zähler (inklusive der Schuldigen) wirklich auf 0 zurücksetzen?');
  if (confirmReset) {
    count1 = 0;
    count2 = 0;
    persons.forEach(p => p.count = 0);
    scaleCard.classList.add('hidden');
    updateDisplay(true);
  }
});

// =============================================================================
// Firebase Realtime Database Initialisierung & Live-Sync
// =============================================================================
function initFirebase() {
  if (typeof firebase === 'undefined') {
    setSyncStatus('', 'Lokal (SDK nicht geladen)');
    return;
  }

  const isConfigured = firebaseConfig.apiKey &&
                       !firebaseConfig.apiKey.includes('DEIN_') &&
                       firebaseConfig.databaseURL &&
                       !firebaseConfig.databaseURL.includes('HIER_');

  if (!isConfigured) {
    setSyncStatus('', 'Lokal (Firebase noch nicht konfiguriert)');
    return;
  }

  try {
    setSyncStatus('connecting', 'Verbinde mit Cloud...');

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    const db = firebase.database();
    dbRef = db.ref('counterData');

    // Online-Status überwachen
    db.ref('.info/connected').on('value', (snap) => {
      if (snap.val() === true) {
        isFirebaseEnabled = true;
        setSyncStatus('online', 'Live synchronisiert');
      } else {
        setSyncStatus('connecting', 'Verbindung getrennt...');
      }
    });

    // Echtzeit-Listener: Aktualisierungen von anderen Nutzern direkt empfangen
    dbRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        count1 = typeof data.count1 === 'number' ? data.count1 : count1;
        count2 = typeof data.count2 === 'number' ? data.count2 : count2;
        if (Array.isArray(data.persons) && data.persons.length === 4) {
          persons = data.persons.map((p, index) => ({
            id: index,
            name: (p.name && p.name.trim()) ? p.name.trim() : DEFAULT_PERSON_NAMES[index],
            count: typeof p.count === 'number' && p.count >= 0 ? p.count : 0
          }));
        }
        // Lokale Anzeige aktualisieren OHNE erneut an Firebase zu senden (Endlosschleife vermeiden)
        updateDisplay(false);
      }
    }, (error) => {
      console.warn('Firebase-Lesezugriff fehlgeschlagen:', error);
      setSyncStatus('', 'Fehler bei Cloud-Verbindung');
    });

  } catch (error) {
    console.error('Firebase Initialisierungsfehler:', error);
    setSyncStatus('', 'Lokal (Fehler)');
  }
}

// Erste lokale Anzeige beim Laden der Seite
updateDisplay(false);

// Firebase starten
initFirebase();
