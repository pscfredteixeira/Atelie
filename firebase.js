import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';

// Configuração do aplicativo web é pública. Nunca inclua contas de serviço ou chaves privadas aqui.
const firebaseConfig = {
  apiKey: 'AIzaSyA02-Pw2iFJ2ebooWkQdlKG7869RwG-blA',
  authDomain: 'ateliepsi.firebaseapp.com',
  projectId: 'ateliepsi',
  storageBucket: 'ateliepsi.firebasestorage.app',
  messagingSenderId: '599058974240',
  appId: '1:599058974240:web:0dd136bd2242cfd5f65e45',
};
const app = initializeApp(firebaseConfig);
const auth=getAuth(app), db=getFirestore(app);
const signal=(name,detail)=>window.dispatchEvent(new CustomEvent(name,{detail}));
let remoteReady=false;
const cloud={
  user:null,
  login:()=>signInWithPopup(auth,new GoogleAuthProvider()),
  logout:()=>signOut(auth),
  async save(data){
    if(!cloud.user||!remoteReady)return;
    const payload={saved:data.saved,completed:data.completed,notes:data.notes,answers:data.answers,updatedAt:Date.now()};
    await setDoc(doc(db,'users',cloud.user.uid,'state','atelier'),payload);
    signal('atelie-cloud-state',{message:'Estudos sincronizados com o Firebase.'});
  }
};
window.AtelieCloud=cloud;
onAuthStateChanged(auth,async user=>{
  cloud.user=user;remoteReady=false;
  if(!user){signal('atelie-cloud-state',{message:''});return}
  signal('atelie-cloud-state',{message:'Conta conectada · carregando seus estudos...'});
  try{
    const ref=doc(db,'users',user.uid,'state','atelier');
    const snap=await getDoc(ref);
    // Não sobrescreva rascunhos locais do Estúdio nem publique materiais dos cursos.
    if(snap.exists())signal('atelie-cloud-loaded',snap.data());
    remoteReady=true;
    signal('atelie-cloud-state',{message:snap.exists()?'Estudos carregados da sua conta.':'Conta conectada. Novas alterações serão sincronizadas.'});
  }catch(err){remoteReady=false;signal('atelie-cloud-state',{message:'Firestore indisponível ('+(err.code||err.message)+'). Seus dados continuam locais.'})}
},err=>signal('atelie-cloud-state',{message:'Falha de autenticação: '+(err.code||err.message)}));
