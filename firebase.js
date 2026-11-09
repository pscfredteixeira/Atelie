import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';

// Firebase Web config is public. Never publish service account credentials.
import {firebaseConfig} from './firebase-config.js';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const signal = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
const emit = message => signal('atelie-cloud-state', { message });
let session = 0;

const cloud = {
  user: null,
  ready: false,
  snapshot: null,
  login() {
    // The app runs on GitHub Pages, not Firebase Hosting.
    // Redirect auth via firebaseapp.com may fail in Safari/modern browsers
    // because its cross-origin helper loses storage access. Use a popup only
    // and give users a clear message if their browser blocks it.
    return signInWithPopup(auth, new GoogleAuthProvider());
  },
  logout: () => signOut(auth),
  async save(data) {
    const user = cloud.user;
    if (!user || !cloud.ready) throw new Error('Conexão com o Firestore não está disponível.');
    const payload = {
      saved: data.saved,
      completed: data.completed,
      notes: data.notes,
      answers: data.answers,
      updatedAt: data.updatedAt
    };
    await setDoc(doc(db, 'users', user.uid, 'state', 'atelier'), payload);
    return true;
  }
};
window.AtelieCloud = cloud;

onAuthStateChanged(auth, async user => {
  const currentSession = ++session;
  cloud.user = user;
  cloud.ready = false;
  cloud.snapshot = null;
  signal('atelie-cloud-auth', { uid: user?.uid ?? null, name: user?.displayName ?? null });
  if (!user) {
    emit('Você está no modo local, sem sincronização na nuvem.');
    return;
  }
  emit('Conta conectada · verificando seus estudos na nuvem...');
  try {
    const snap = await getDoc(doc(db, 'users', user.uid, 'state', 'atelier'));
    if (currentSession !== session || cloud.user?.uid !== user.uid) return;
    cloud.snapshot = { uid: user.uid, exists: snap.exists(), state: snap.exists() ? snap.data() : null };
    signal('atelie-cloud-loaded', cloud.snapshot);
    cloud.ready = true;
    signal('atelie-cloud-ready', { uid: user.uid });
    emit(snap.exists() ? 'Conta conectada · estudos carregados.' : 'Conta conectada · nenhum estudo anterior na nuvem.');
  } catch (error) {
    if (currentSession !== session) return;
    cloud.ready = false;
    emit('Firestore indisponível (' + (error.code || error.message) + '). Alterações ficam guardadas neste dispositivo.');
  }
}, error => emit('Falha na autenticação: ' + (error.code || error.message)));

window.addEventListener('online', () => {
  if (cloud.user && !cloud.ready) {
    // Recheck the server by signing in state observer is not guaranteed.
    const uid = cloud.user.uid;
    const expectedSession = session;
    getDoc(doc(db, 'users', uid, 'state', 'atelier')).then(snap => {
      if (session !== expectedSession || cloud.user?.uid !== uid) return;
      cloud.ready = true;
      cloud.snapshot = { uid, exists: snap.exists(), state: snap.exists() ? snap.data() : null };
      signal('atelie-cloud-loaded', cloud.snapshot);
      signal('atelie-cloud-ready', { uid });
    }).catch(() => {});
  } else if (cloud.user && cloud.ready) {
    signal('atelie-cloud-ready', { uid: cloud.user.uid });
  }
});
