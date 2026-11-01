import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  handleFirestoreError,
  OperationType,
  getVietnameseErrorMessage
} from './firebase';
import { ClassRoom, Student } from '../types';

export interface FirestoreClass extends ClassRoom {
  teacherUid: string;
  createdAt: string;
}

export interface FirestoreStudent extends Student {
  teacherUid: string;
  createdAt: string;
}

export const FirestoreDataService = {
  /**
   * Real-time subscription to classes owned by the authenticated teacher.
   * Path: /classes/{classId}
   */
  subscribeClasses(
    teacherUid: string,
    onData: (classes: FirestoreClass[]) => void,
    onError?: (error: Error) => void
  ) {
    if (!teacherUid) {
      onData([]);
      return () => {};
    }

    const classesRef = collection(db, 'classes');
    const q = query(classesRef, where('teacherUid', '==', teacherUid));

    return onSnapshot(
      q,
      (snapshot) => {
        const list: FirestoreClass[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as FirestoreClass;
          list.push({
            ...data,
            id: docSnap.id,
          });
        });
        // Sort by creation date descending or name
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onData(list);
      },
      (err) => {
        console.error('Firestore subscribeClasses error:', err);
        if (onError) onError(err);
      }
    );
  },

  /**
   * Real-time subscription to students owned by the authenticated teacher.
   * Path: /students/{studentId}
   */
  subscribeStudents(
    teacherUid: string,
    onData: (students: FirestoreStudent[]) => void,
    onError?: (error: Error) => void
  ) {
    if (!teacherUid) {
      onData([]);
      return () => {};
    }

    const studentsRef = collection(db, 'students');
    const q = query(studentsRef, where('teacherUid', '==', teacherUid));

    return onSnapshot(
      q,
      (snapshot) => {
        const list: FirestoreStudent[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as FirestoreStudent;
          list.push({
            ...data,
            id: docSnap.id,
          });
        });
        list.sort((a, b) => (a.studentCode || '').localeCompare(b.studentCode || ''));
        onData(list);
      },
      (err) => {
        console.error('Firestore subscribeStudents error:', err);
        if (onError) onError(err);
      }
    );
  },

  /**
   * Fetch one-off classes for a teacher
   */
  async getClasses(teacherUid: string): Promise<FirestoreClass[]> {
    const path = 'classes';
    try {
      const q = query(collection(db, path), where('teacherUid', '==', teacherUid));
      const snap = await getDocs(q);
      const list: FirestoreClass[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as FirestoreClass), id: d.id });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  /**
   * 1. CREATE CLASS
   * Must save: name, teacherUid, createdAt (plus required applet fields)
   * Path: /classes/{classId}
   */
  async createClass(
    classData: Partial<ClassRoom> & { name: string },
    teacherUid: string
  ): Promise<FirestoreClass> {
    const classId = classData.id || `cls_${Date.now()}`;
    const path = `classes/${classId}`;
    const createdAt = new Date().toISOString();

    const record: FirestoreClass = {
      id: classId,
      name: classData.name.trim(),
      teacherUid: teacherUid,
      createdAt: createdAt,
      grade: classData.grade ?? 10,
      academicYear: classData.academicYear || '2025-2026',
      room: classData.room || 'Phòng 301',
      subject: classData.subject || 'Toán học',
      code: classData.code || `CLS${classData.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-2026`,
      homeroomTeacherId: teacherUid,
      homeroomTeacherName: classData.homeroomTeacherName || 'Giáo viên',
      studentCount: classData.studentCount ?? 0,
      attendanceRate: classData.attendanceRate ?? 100,
      pendingAssignments: classData.pendingAssignments ?? 0,
      alertCount: classData.alertCount ?? 0,
      status: classData.status || 'active',
      description: classData.description || '',
    };

    try {
      // Must await Firestore write confirmation
      await setDoc(doc(db, 'classes', classId), record);
      return record;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  /**
   * 2. UPDATE CLASS
   * Updates fields of a class owned by the teacher
   */
  async updateClass(
    classId: string,
    updates: Partial<ClassRoom>,
    teacherUid: string
  ): Promise<void> {
    const path = `classes/${classId}`;
    try {
      const docRef = doc(db, 'classes', classId);
      // Ensure teacherUid is retained
      const payload: Record<string, any> = {
        ...updates,
        teacherUid,
        updatedAt: new Date().toISOString(),
      };
      if (updates.name) payload.name = updates.name.trim();

      await updateDoc(docRef, payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  /**
   * 3. DELETE CLASS
   * Deletes a class and all associated students belonging to this teacher
   */
  async deleteClass(classId: string, teacherUid: string): Promise<void> {
    const path = `classes/${classId}`;
    try {
      // Delete the class doc
      await deleteDoc(doc(db, 'classes', classId));

      // Also batch delete associated students in this class
      try {
        const studentQ = query(
          collection(db, 'students'),
          where('teacherUid', '==', teacherUid),
          where('classId', '==', classId)
        );
        const studentSnap = await getDocs(studentQ);
        if (!studentSnap.empty) {
          const batch = writeBatch(db);
          studentSnap.forEach((sDoc) => {
            batch.delete(sDoc.ref);
          });
          await batch.commit();
        }
      } catch (cascadeErr) {
        console.warn('Cascade delete students warning:', cascadeErr);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  /**
   * 4. CREATE STUDENT
   * Must save: name, classId, teacherUid, createdAt
   * Path: /students/{studentId}
   */
  async createStudent(
    studentData: Partial<Student> & { name: string; classId: string },
    teacherUid: string
  ): Promise<FirestoreStudent> {
    const studentId = studentData.id || `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `students/${studentId}`;
    const createdAt = new Date().toISOString();

    const record: FirestoreStudent = {
      id: studentId,
      name: studentData.name.trim(),
      classId: studentData.classId,
      teacherUid: teacherUid,
      createdAt: createdAt,
      studentCode: studentData.studentCode || `HS-${Date.now().toString().slice(-4)}`,
      className: studentData.className || '10A1',
      group: studentData.group ?? 1,
      gender: studentData.gender || 'Nam',
      dob: studentData.dob || '2010-01-01',
      email: studentData.email || `${studentId}@smartclass.edu.vn`,
      phone: studentData.phone || '0901234567',
      parentName: studentData.parentName || 'Phụ huynh',
      parentPhone: studentData.parentPhone || '0987654321',
      parentAvatar: studentData.parentAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
      avatar: studentData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      address: studentData.address || 'Hà Nội',
      attendanceRate: studentData.attendanceRate ?? 100,
      gpa: studentData.gpa ?? 8.0,
      status: studentData.status || 'active',
      conduct: studentData.conduct || 'Tốt',
      rewardsCount: studentData.rewardsCount ?? 0,
      alertsCount: studentData.alertsCount ?? 0,
    };

    try {
      // Must await Firestore write confirmation
      await setDoc(doc(db, 'students', studentId), record);

      // Increment class student count if class exists
      try {
        const classRef = doc(db, 'classes', studentData.classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          const currentCount = classSnap.data().studentCount || 0;
          await updateDoc(classRef, { studentCount: currentCount + 1 });
        }
      } catch (countErr) {
        console.warn('Update class studentCount warning:', countErr);
      }

      return record;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  /**
   * 5. UPDATE STUDENT
   * Path: /students/{studentId}
   */
  async updateStudent(
    studentId: string,
    updates: Partial<Student>,
    teacherUid: string
  ): Promise<void> {
    const path = `students/${studentId}`;
    try {
      const docRef = doc(db, 'students', studentId);
      const payload: Record<string, any> = {
        ...updates,
        teacherUid,
        updatedAt: new Date().toISOString(),
      };
      if (updates.name) payload.name = updates.name.trim();

      await updateDoc(docRef, payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  /**
   * 6. DELETE STUDENT
   * Path: /students/{studentId}
   */
  async deleteStudent(
    studentId: string,
    classId: string,
    teacherUid: string
  ): Promise<void> {
    const path = `students/${studentId}`;
    try {
      await deleteDoc(doc(db, 'students', studentId));

      // Decrement class student count
      if (classId) {
        try {
          const classRef = doc(db, 'classes', classId);
          const classSnap = await getDoc(classRef);
          if (classSnap.exists()) {
            const currentCount = classSnap.data().studentCount || 0;
            await updateDoc(classRef, { studentCount: Math.max(0, currentCount - 1) });
          }
        } catch (countErr) {
          console.warn('Decrement class studentCount warning:', countErr);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  /**
   * 7. BATCH IMPORT STUDENTS FROM EXCEL / CSV
   */
  async batchImportStudents(
    students: Array<Partial<Student> & { name: string; classId: string }>,
    teacherUid: string
  ): Promise<number> {
    const path = 'students';
    try {
      const batch = writeBatch(db);
      const createdAt = new Date().toISOString();
      let count = 0;

      for (const s of students) {
        const studentId = s.id || `std_${Date.now()}_${count}_${Math.random().toString(36).substring(2, 6)}`;
        const record: FirestoreStudent = {
          id: studentId,
          name: s.name.trim(),
          classId: s.classId,
          teacherUid: teacherUid,
          createdAt: createdAt,
          studentCode: s.studentCode || `HS-${String(count + 1).padStart(4, '0')}`,
          className: s.className || '10A1',
          group: s.group ?? 1,
          gender: s.gender || 'Nam',
          dob: s.dob || '2010-01-01',
          email: s.email || `${studentId}@smartclass.edu.vn`,
          phone: s.phone || '0901234567',
          parentName: s.parentName || 'Phụ huynh',
          parentPhone: s.parentPhone || '0987654321',
          parentAvatar: s.parentAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
          avatar: s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
          address: s.address || 'Hà Nội',
          attendanceRate: s.attendanceRate ?? 100,
          gpa: s.gpa ?? 8.0,
          status: s.status || 'active',
          conduct: s.conduct || 'Tốt',
          rewardsCount: 0,
          alertsCount: 0,
        };

        const docRef = doc(db, 'students', studentId);
        batch.set(docRef, record);
        count++;
      }

      await batch.commit();

      // Recalculate student counts for affected classes
      const affectedClassIds = Array.from(new Set(students.map((s) => s.classId)));
      for (const cId of affectedClassIds) {
        try {
          const q = query(
            collection(db, 'students'),
            where('teacherUid', '==', teacherUid),
            where('classId', '==', cId)
          );
          const snap = await getDocs(q);
          const classRef = doc(db, 'classes', cId);
          await updateDoc(classRef, { studentCount: snap.size });
        } catch (e) {
          console.warn('Update class count after batch import:', e);
        }
      }

      return count;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  /**
   * Helper: Initialize starter classroom on Firestore for a newly signed-in teacher
   */
  async seedInitialClassForTeacher(teacherUid: string, teacherName: string): Promise<void> {
    try {
      const existing = await FirestoreDataService.getClasses(teacherUid);
      if (existing.length > 0) return; // already has classes

      const classId = `cls_${teacherUid.substring(0, 8)}_10a1`;
      const starterClass = await FirestoreDataService.createClass(
        {
          id: classId,
          name: '10A1',
          grade: 10,
          academicYear: '2025-2026',
          room: 'Phòng STEM-302',
          subject: 'Toán học',
          code: 'CLS10A1-2026',
          homeroomTeacherName: teacherName || 'Giáo viên',
          description: 'Lớp chuyên Toán - Tin học trường THPT Chu Văn An',
        },
        teacherUid
      );

      // Add 4 initial students so teacher has immediate live data
      const starterStudents = [
        {
          name: 'Trần Minh Đức',
          studentCode: 'HS-0001',
          classId: starterClass.id,
          className: '10A1',
          gender: 'Nam' as const,
          dob: '2010-03-15',
          phone: '0912345671',
          parentName: 'Trần Văn Bình',
          parentPhone: '0987654311',
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80',
          parentAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80',
          address: 'Hoàn Kiếm, Hà Nội',
          group: 1,
          attendanceRate: 98,
          gpa: 8.9,
          conduct: 'Tốt' as const,
        },
        {
          name: 'Lê Hoàng Yến',
          studentCode: 'HS-0002',
          classId: starterClass.id,
          className: '10A1',
          gender: 'Nữ' as const,
          dob: '2010-07-22',
          phone: '0912345672',
          parentName: 'Nguyễn Thị Hồng',
          parentPhone: '0987654312',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80',
          parentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
          address: 'Ba Đình, Hà Nội',
          group: 1,
          attendanceRate: 100,
          gpa: 9.2,
          conduct: 'Tốt' as const,
        },
        {
          name: 'Phạm Quang Huy',
          studentCode: 'HS-0003',
          classId: starterClass.id,
          className: '10A1',
          gender: 'Nam' as const,
          dob: '2010-11-05',
          phone: '0912345673',
          parentName: 'Phạm Quốc Cường',
          parentPhone: '0987654313',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
          parentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
          address: 'Cầu Giấy, Hà Nội',
          group: 2,
          attendanceRate: 95,
          gpa: 7.8,
          conduct: 'Tốt' as const,
        },
        {
          name: 'Đặng Thảo Linh',
          studentCode: 'HS-0004',
          classId: starterClass.id,
          className: '10A1',
          gender: 'Nữ' as const,
          dob: '2010-09-18',
          phone: '0912345674',
          parentName: 'Vũ Thị Minh',
          parentPhone: '0987654314',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
          parentAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
          address: 'Tây Hồ, Hà Nội',
          group: 2,
          attendanceRate: 99,
          gpa: 8.6,
          conduct: 'Tốt' as const,
        },
      ];

      for (const st of starterStudents) {
        await FirestoreDataService.createStudent(st, teacherUid);
      }
    } catch (err) {
      console.warn('Seed initial class error:', err);
    }
  },
};
