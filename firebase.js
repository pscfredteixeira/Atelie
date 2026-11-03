import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';

// Firebase Web config is public. Never publish service account credentials.
const firebaseConfig = {
  apiKey: 'AIzaSyA02-Pw2iFJ2ebooWkQdlKG7869RwG-blA',
  authDomain: 'ateliepsi.firebaseapp.com',
  projectId: 'ateliepsi',
  storageBucket: 'ateliepsi.firebasestorage.app',
  messagingSenderId: '599058974240',
  appId: '1:599058974240:web:0dd136bd2242cfd5f65e45',
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const signal = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
const emit = message => signal('atelie-cloud-state', { message });
let session = 0;

const cloud = {
  user: null,
  ready: false,
  async login() {
    const provider = new GoogleAuthProvider();
    try {
      return await signInWithPopup(auth, provider);
    } catch (error) {
      // Popup may be blocked on mobile. Redirect needs an authorized domain
      // and, on some browsers, a same-domain auth handler/proxy.
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(error.code)) {
        emit('Redirecionando para autenticação do Google...');
        await signInWithRedirect(auth, provider);
        return;
      }
      throw error;
    }
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
  signal('atelie-cloud-auth', { uid: user?.uid ?? null, name: user?.displayName ?? null });
  if (!user) {
    emit('Você está no modo local, sem sincronização na nuvem.');
    return;
  }
  emit('Conta conectada · verificando seus estudos na nuvem...');
  try {
    const snap = await getDoc(doc(db, 'users', user.uid, 'state', 'atelier'));
    if (currentSession !== session || cloud.user?.uid !== user.uid) return;
    signal('atelie-cloud-loaded', { uid: user.uid, exists: snap.exists(), state: snap.exists() ? snap.data() : null });
    cloud.ready = true;
    signal('atelie-cloud-ready', { uid: user.uid });
    emit(snap.exists() ? 'Conta conectada · estudos carregados.' : 'Conta conectada · nenhum estudo anterior na nuvem.');
  } catch (error) {
    if (currentSession !== session) return;
    cloud.ready = false;
    emit('Firestore indisponível (' + (error.code || error.message) + '). Alterações ficam guardadas neste dispositivo.');
  }
}, error => emit('Falha na autenticação: ' + (error.code || error.message)));

getRedirectResult(auth).catch(error => emit('Não foi possível concluir o retorno do login: ' + (error.code || error.message)));
window.addEventListener('online', () => {
  if (cloud.user && !cloud.ready) {
    // Recheck the server by signing in state observer is not guaranteed.
    getDoc(doc(db, 'users', cloud.user.uid, 'state', 'atelier')).then(snap => {
      if (!cloud.user) return;
      cloud.ready = true;
      signal('atelie-cloud-loaded', { uid: cloud.user.uid, exists: snap.exists(), state: snap.exists() ? snap.data() : null });
      signal('atelie-cloud-ready', { uid: cloud.user.uid });
    }).catch(() => {});
  } else if (cloud.user && cloud.ready) {
    signal('atelie-cloud-ready', { uid: cloud.user.uid });
  }
});
