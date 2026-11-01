import {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  handleFirestoreError
} from './firebase';
import { BankQuestion } from '../types';

const QUESTIONS_COLLECTION = 'questions';

export const FirestoreQuestionsService = {
  /**
   * Listen to real-time question bank updates from Cloud Firestore
   */
  subscribeQuestions: (
    onSuccess: (questions: BankQuestion[]) => void,
    onError?: (error: unknown) => void
  ) => {
    try {
      const qColl = collection(db, QUESTIONS_COLLECTION);
      return onSnapshot(
        qColl,
        (snapshot) => {
          const list: BankQuestion[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ ...(docSnap.data() as BankQuestion), id: docSnap.id });
          });
          onSuccess(list);
        },
        (err) => {
          try {
            handleFirestoreError(err, {
              operation: 'list',
              path: QUESTIONS_COLLECTION
            });
          } catch (e) {
            console.error(e);
          }
          if (onError) onError(err);
        }
      );
    } catch (err) {
      console.warn('Firestore subscription failed, falling back to local:', err);
      if (onError) onError(err);
      return () => {};
    }
  },

  /**
   * Fetch all questions once from Firestore
   */
  fetchQuestions: async (): Promise<BankQuestion[]> => {
    try {
      const qColl = collection(db, QUESTIONS_COLLECTION);
      const snapshot = await getDocs(qColl);
      const list: BankQuestion[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as BankQuestion), id: docSnap.id });
      });
      return list;
    } catch (err) {
      try {
        handleFirestoreError(err, {
          operation: 'list',
          path: QUESTIONS_COLLECTION
        });
      } catch (e) {
        console.error(e);
      }
      return [];
    }
  },

  /**
   * Save or update a question in Cloud Firestore
   */
  saveQuestion: async (question: BankQuestion): Promise<boolean> => {
    try {
      const docRef = doc(db, QUESTIONS_COLLECTION, question.id);
      // Clean undefined fields to keep Firestore payload strictly JSON valid
      const cleanData = JSON.parse(JSON.stringify(question));
      await setDoc(docRef, cleanData, { merge: true });
      return true;
    } catch (err) {
      try {
        handleFirestoreError(err, {
          operation: 'update',
          path: `${QUESTIONS_COLLECTION}/${question.id}`
        });
      } catch (e) {
        console.error(e);
      }
      return false;
    }
  },

  /**
   * Batch save questions (e.g. from Word/Excel import or AI generator)
   */
  batchSaveQuestions: async (questions: BankQuestion[]): Promise<number> => {
    let savedCount = 0;
    for (const q of questions) {
      const success = await FirestoreQuestionsService.saveQuestion(q);
      if (success) savedCount++;
    }
    return savedCount;
  },

  /**
   * Delete a question from Cloud Firestore
   */
  deleteQuestion: async (id: string): Promise<boolean> => {
    try {
      const docRef = doc(db, QUESTIONS_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      try {
        handleFirestoreError(err, {
          operation: 'delete',
          path: `${QUESTIONS_COLLECTION}/${id}`
        });
      } catch (e) {
        console.error(e);
      }
      return false;
    }
  },
};
