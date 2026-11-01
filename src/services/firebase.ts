import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  FirestoreError
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific database ID if provided in config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const activeFirebaseConfig = {
  projectId: firebaseConfig.projectId,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
  authDomain: firebaseConfig.authDomain,
  appId: firebaseConfig.appId
};

// Rich Firestore error context helper conforming to skill standard
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface SecurityRuleContext {
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write' | string;
  path: string;
  authUid?: string | null;
}

export function handleFirestoreError(
  error: unknown,
  operationOrContext: OperationType | SecurityRuleContext,
  optionalPath?: string | null
): never {
  const operationType: OperationType =
    typeof operationOrContext === 'string'
      ? (operationOrContext as OperationType)
      : (operationOrContext.operation as OperationType);
  const path: string | null =
    typeof operationOrContext === 'string'
      ? optionalPath ?? null
      : operationOrContext.path ?? null;

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Translate Firestore errors into clear Vietnamese for UI toasts
export function getVietnameseErrorMessage(error: unknown, actionDesc: string): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
    return `${actionDesc} thất bại do không có quyền truy cập. Bạn chỉ có thể xem/sửa dữ liệu lớp học thuộc tài khoản của bạn.`;
  }
  if (msg.includes('unavailable') || msg.includes('offline')) {
    return `${actionDesc} thất bại: Mất kết nối tới Cloud Firestore hoặc đang ngoại tuyến.`;
  }
  if (msg.includes('not-found')) {
    return `${actionDesc} thất bại: Bản ghi không tồn tại trên hệ thống.`;
  }
  if (msg.includes('already-exists')) {
    return `${actionDesc} thất bại: Bản ghi đã tồn tại trên Cloud Firestore.`;
  }
  return `${actionDesc} thất bại: ${msg}`;
}

export {
  app,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  fbSignOut,
  onAuthStateChanged,
  signInAnonymously,
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp
};
export type { FirebaseUser };
