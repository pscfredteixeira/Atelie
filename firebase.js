import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import { getFirestore, doc, getDoc, getDocFromServer, setDoc } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';

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
  profile: null,
  profileStatus: 'signed-out',
  // As interações das aulas pertencem exclusivamente ao UID da conta.
  async loadLessonProgress(lessonId) {
    const user=cloud.user;
    if(!user)throw new Error('Entre com Google para acessar seu progresso.');
    if(!['escuta-que-mudou-a-clinica','primeira-topica-freud'].includes(lessonId))throw new Error('Aula não autorizada.');
    const uid=user.uid, seq=session;
    const snap=await getDocFromServer(doc(db,'users',uid,'lessonProgress',lessonId));
    if(seq!==session||cloud.user?.uid!==uid)throw new Error('A conta mudou durante o carregamento.');
    return snap.exists()?snap.data().state:null;
  },
  async saveLessonProgress(lessonId,progress) {
    const user=cloud.user;
    if(!user)throw new Error('Entre com Google antes de salvar.');
    if(!['escuta-que-mudou-a-clinica','primeira-topica-freud'].includes(lessonId))throw new Error('Aula não autorizada.');
    if(!progress||typeof progress!=='object'||Array.isArray(progress))throw new Error('Progresso inválido.');
    const uid=user.uid,seq=session;
    // Somente a última alteração confirmada pelo servidor é considerada salva.
    await setDoc(doc(db,'users',uid,'lessonProgress',lessonId),{schemaVersion:1,state:progress,updatedAt:Date.now()});
    if(seq!==session||cloud.user?.uid!==uid)throw new Error('A conta mudou durante o salvamento.');
    return true;
  },
  async loadProfile() {
    const user = cloud.user;
    if (!user) throw new Error('Entre com sua conta Google para consultar o perfil.');
    const uid = user.uid;
    const expectedSession = session;
    cloud.profileStatus = 'loading';
    signal('atelie-cloud-profile', { uid, status: 'loading' });
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'profile', 'main'));
      if (expectedSession !== session || cloud.user?.uid !== uid) return null;
      const data = snap.exists() ? snap.data() : null;
      cloud.profile = data;
      cloud.profileStatus = 'ready';
      signal('atelie-cloud-profile', { uid, status: 'ready', profile: data });
      return data;
    } catch (error) {
      if (expectedSession !== session || cloud.user?.uid !== uid) return null;
      cloud.profileStatus = 'error';
      signal('atelie-cloud-profile', { uid, status: 'error', errorCode: error?.code || 'unknown' });
      throw error;
    }
  },
  async saveProfile(fields) {
    const user = cloud.user;
    if (!user) throw new Error('Você precisa entrar com Google para editar seu perfil.');
    if (cloud.profileStatus !== 'ready') throw new Error('O perfil não foi carregado. Verifique a conexão e tente novamente.');
    const uid = user.uid, expectedSession = session;
    const preferredName = String(fields?.preferredName ?? '').trim();
    const phone = String(fields?.phone ?? '').trim();
    if (preferredName.length > 80 || phone.length > 30) throw new Error('Confira os limites dos campos antes de salvar.');
    const payload = { preferredName, phone, updatedAt: Date.now() };
    await setDoc(doc(db, 'users', uid, 'profile', 'main'), payload);
    if (expectedSession !== session || cloud.user?.uid !== uid) return null;
    cloud.profile = payload;
    cloud.profileStatus = 'ready';
    signal('atelie-cloud-profile', { uid, status: 'ready', profile: payload });
    return payload;
  },
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
  cloud.profile = null;
  cloud.profileStatus = user ? 'loading' : 'signed-out';
  signal('atelie-cloud-auth', { uid: user?.uid ?? null, name: user?.displayName ?? null });
  if (!user) {
    signal('atelie-cloud-profile', { uid: null, status: 'signed-out' });
    emit('Você está no modo local, sem sincronização na nuvem.');
    return;
  }
  // Perfil é independente do documento de progresso: um erro em estudos
  // não deve impedir a pessoa de consultar ou editar seus dados básicos.
  cloud.loadProfile().catch(() => {});
  emit('Conta conectada · verificando seus estudos na nuvem...');
  try {
    const snap = await getDocFromServer(doc(db, 'users', user.uid, 'state', 'atelier'));
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
  if (cloud.user && cloud.profileStatus === 'error') cloud.loadProfile().catch(() => {});
  if (cloud.user && !cloud.ready) {
    // Recheck the server by signing in state observer is not guaranteed.
    const uid = cloud.user.uid;
    const expectedSession = session;
    getDocFromServer(doc(db, 'users', uid, 'state', 'atelier')).then(snap => {
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
