import {initializeApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from 'firebase/auth';
import {getFirestore,doc,getDoc,runTransaction} from 'firebase/firestore';
import {mergeProgress} from './engine';
const app=initializeApp({projectId:'tentaplugg-japanska-2026',appId:'1:475360574850:web:8ada8aea9c6a8b8555239b',apiKey:'AIzaSyCB22oJUwzWpZi-c8oVXyONqeK1E5Nspao',authDomain:'tentaplugg-japanska-2026.firebaseapp.com',messagingSenderId:'475360574850'});
export const auth=getAuth(app);
const db=getFirestore(app);
export const login=()=>signInWithPopup(auth,new GoogleAuthProvider());
export const logout=()=>signOut(auth);
export const watchUser=cb=>onAuthStateChanged(auth,cb);
export async function pull(uid){const s=await getDoc(doc(db,'users',uid,'progress','state'));return s.exists()?JSON.parse(s.data().payload):null;}
export const push=(uid,state)=>runTransaction(db,async transaction=>{const ref=doc(db,'users',uid,'progress','state');const previous=await transaction.get(ref);const merged=previous.exists()?mergeProgress(JSON.parse(previous.data().payload),state):state;transaction.set(ref,{payload:JSON.stringify(merged),updatedAt:Date.now()});});
