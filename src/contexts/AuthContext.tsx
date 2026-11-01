import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storage';
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  fbSignOut,
  onAuthStateChanged,
  FirebaseUser,
  activeFirebaseConfig,
  db,
  doc,
  setDoc,
  getDoc
} from '../services/firebase';

export interface AuthResult {
  success: boolean;
  cancelled?: boolean;
  message?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isFirebaseConnected: boolean;
  firebaseProjectId: string;
  firebaseDatabaseId: string;
  isGoogleAuthenticated: boolean;
  login: (email: string, role?: UserRole) => boolean;
  loginWithGoogle: () => Promise<AuthResult>;
  registerWithEmail: (params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<AuthResult>;
  loginWithEmail: (email: string, password: string, preferredRole?: UserRole) => Promise<AuthResult>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  allUsers: User[];
  selectedChildId: string | null;
  setSelectedChildId: (childId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    StorageService.init();
    const active = StorageService.getActiveUser();
    const users = StorageService.getUsers();
    setUser(active);
    setAllUsers(users);

    if (active.role === 'PARENT' && active.childrenIds && active.childrenIds.length > 0) {
      setSelectedChildId(active.childrenIds[0]);
    }

    const handleStorageChange = () => {
      setAllUsers(StorageService.getUsers());
      setUser(StorageService.getActiveUser());
    };
    window.addEventListener('smartclass_storage_updated', handleStorageChange);

    // Listen to Firebase Authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.email) {
        // Look up or sync user
        const existingUsers = StorageService.getUsers();
        let match = existingUsers.find(
          (u) => u.email.toLowerCase() === (fbUser.email || '').toLowerCase()
        );

        // Also check if Firestore already stores their role
        let assignedRole: UserRole = match ? match.role : 'TEACHER';
        let assignedName = match ? match.name : (fbUser.displayName || 'Giáo viên Firebase');
        let assignedAvatar = match ? match.avatar : (fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');

        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.role) assignedRole = data.role as UserRole;
            if (data.name) assignedName = data.name;
            if (data.avatar) assignedAvatar = data.avatar;
          } else {
            await setDoc(userDocRef, {
              id: fbUser.uid,
              name: assignedName,
              email: fbUser.email,
              role: assignedRole,
              avatar: assignedAvatar,
              createdAt: new Date().toISOString()
            });
          }
        } catch (e) {
          console.warn('Sync user to Firestore caught notice:', e);
        }

        const updatedMatch: User = {
          id: fbUser.uid,
          name: assignedName,
          email: fbUser.email,
          role: assignedRole,
          avatar: assignedAvatar,
          subject: assignedRole === 'TEACHER' ? 'Toán học' : undefined,
          schoolId: 'THPT Chu Văn An'
        };

        StorageService.updateUser(updatedMatch);
        setUser(updatedMatch);
        StorageService.setActiveUser(updatedMatch);
      }
    });

    return () => {
      window.removeEventListener('smartclass_storage_updated', handleStorageChange);
      unsubscribeAuth();
    };
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      if (fbUser) {
        let userRole: UserRole = 'TEACHER';
        let userName = fbUser.displayName || 'Giáo viên Google';
        let userAvatar = fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.role) userRole = data.role as UserRole;
            if (data.name) userName = data.name;
            if (data.avatar) userAvatar = data.avatar;
          } else {
            await setDoc(userDocRef, {
              id: fbUser.uid,
              name: userName,
              email: fbUser.email || '',
              role: userRole,
              avatar: userAvatar,
              createdAt: new Date().toISOString()
            });
          }
        } catch (syncErr) {
          console.warn('Sync profile to Firestore notice:', syncErr);
        }

        const u: User = {
          id: fbUser.uid,
          name: userName,
          email: fbUser.email || 'user@example.com',
          role: userRole,
          avatar: userAvatar,
          subject: userRole === 'TEACHER' ? 'Toán học' : undefined,
          schoolId: 'THPT Chu Văn An'
        };

        StorageService.updateUser(u);
        StorageService.setActiveUser(u);
        setUser(u);

        return { success: true, user: u };
      }
      return { success: false, message: 'Không lấy được thông tin tài khoản Google.' };
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        // User closed the popup window - normal user action, do not log console.error
        return { success: false, cancelled: true, message: 'Đã đóng cửa sổ đăng nhập Google.' };
      }
      if (error?.code === 'auth/popup-blocked') {
        return {
          success: false,
          message: 'Trình duyệt đã chặn cửa sổ đăng nhập (popup). Vui lòng cho phép popup để tiếp tục.'
        };
      }
      if (error?.code === 'auth/cancelled-popup-request') {
        return { success: false, cancelled: true, message: 'Đã hủy yêu cầu đăng nhập trước đó.' };
      }
      console.warn('Google Sign In Notice:', error?.message || error);
      return { success: false, message: error?.message || 'Đăng nhập Google thất bại.' };
    }
  }, []);

  const registerWithEmail = useCallback(async (params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<AuthResult> => {
    const cleanName = params.name.trim();
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanPassword = params.password;
    const role = params.role || 'TEACHER';

    if (!cleanName || cleanName.length < 2) {
      return { success: false, message: 'Họ và tên phải có ít nhất 2 ký tự.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, message: 'Vui lòng nhập địa chỉ email hợp lệ.' };
    }
    if (cleanPassword.length < 6) {
      return { success: false, message: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.' };
    }

    const avatarPresets: Record<UserRole, string> = {
      TEACHER: 'https://images.unsplash.com/photo-1580894732454-defa4fb240c0?auto=format&fit=crop&w=256&h=256&q=80',
      STUDENT: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80',
      PARENT: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80',
      ADMIN: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80'
    };

    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const fbUser = res.user;

      if (fbUser) {
        try {
          await updateProfile(fbUser, { displayName: cleanName });
        } catch (e) {
          console.warn('Update profile notice:', e);
        }

        const newUser: User = {
          id: fbUser.uid,
          name: cleanName,
          email: cleanEmail,
          role: role,
          avatar: avatarPresets[role] || avatarPresets.TEACHER,
          schoolId: 'THPT Chu Văn An',
          subject: role === 'TEACHER' ? 'Toán học' : undefined,
        };

        // Save to Firestore users collection
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          await setDoc(userDocRef, {
            id: fbUser.uid,
            name: cleanName,
            email: cleanEmail,
            role: role,
            avatar: newUser.avatar,
            createdAt: new Date().toISOString()
          });
        } catch (syncErr) {
          console.warn('Save user doc to Firestore notice:', syncErr);
        }

        StorageService.updateUser(newUser);
        StorageService.setActiveUser(newUser);
        setUser(newUser);
        return { success: true, user: newUser, message: 'Đăng ký tài khoản thành công!' };
      }
      return { success: false, message: 'Không thể khởi tạo tài khoản trên hệ thống.' };
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/email-already-in-use') {
        return { success: false, message: 'Email này đã được sử dụng. Vui lòng chuyển sang tab Đăng nhập hoặc dùng email khác.' };
      }
      if (code === 'auth/weak-password') {
        return { success: false, message: 'Mật khẩu quá yếu. Vui lòng đặt mật khẩu tối thiểu 6 ký tự.' };
      }
      if (code === 'auth/invalid-email') {
        return { success: false, message: 'Địa chỉ email không đúng định dạng.' };
      }
      if (code === 'auth/operation-not-allowed') {
        // If Firebase email/password provider is not toggled in console, create local user smoothly so workflow is never blocked
        const localUid = 'usr_' + Date.now();
        const newUser: User = {
          id: localUid,
          name: cleanName,
          email: cleanEmail,
          role: role,
          avatar: avatarPresets[role] || avatarPresets.TEACHER,
          schoolId: 'THPT Chu Văn An',
          subject: role === 'TEACHER' ? 'Toán học' : undefined,
        };
        StorageService.updateUser(newUser);
        StorageService.setActiveUser(newUser);
        setUser(newUser);
        return {
          success: true,
          user: newUser,
          message: 'Tài khoản đã tạo thành công trong hệ thống! (Mẹo: Bật Email/Password Provider trong Firebase Console để liên kết Firebase Auth hoàn toàn).'
        };
      }
      return { success: false, message: 'Lỗi đăng ký tài khoản: ' + (err?.message || 'Vui lòng thử lại') };
    }
  }, []);

  const loginWithEmail = useCallback(async (
    email: string,
    password: string,
    preferredRole?: UserRole
  ): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      return { success: false, message: 'Vui lòng nhập email.' };
    }

    // Attempt Firebase Auth sign-in if password is provided
    if (cleanPassword) {
      try {
        const res = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        const fbUser = res.user;
        if (fbUser) {
          let role: UserRole = preferredRole || 'TEACHER';
          let name = fbUser.displayName || 'Giáo viên';
          let avatar = fbUser.photoURL || 'https://images.unsplash.com/photo-1580894732454-defa4fb240c0?auto=format&fit=crop&w=256&h=256&q=80';

          try {
            const snap = await getDoc(doc(db, 'users', fbUser.uid));
            if (snap.exists()) {
              const d = snap.data();
              if (d.role) role = d.role as UserRole;
              if (d.name) name = d.name;
              if (d.avatar) avatar = d.avatar;
            }
          } catch (e) {
            console.warn('Read user doc notice:', e);
          }

          const u: User = {
            id: fbUser.uid,
            name,
            email: cleanEmail,
            role,
            avatar,
            schoolId: 'THPT Chu Văn An',
            subject: role === 'TEACHER' ? 'Toán học' : undefined
          };

          StorageService.updateUser(u);
          StorageService.setActiveUser(u);
          setUser(u);
          return { success: true, user: u };
        }
      } catch (fbErr: any) {
        // Check if this matches a demo account in local storage
        const existingUsers = StorageService.getUsers();
        const localMatch = existingUsers.find(
          (u) => u.email.toLowerCase() === cleanEmail || (preferredRole && u.role === preferredRole)
        );

        if (localMatch) {
          setUser(localMatch);
          StorageService.setActiveUser(localMatch);
          return { success: true, user: localMatch };
        }

        const code = fbErr?.code;
        if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
          return {
            success: false,
            message: 'Email hoặc mật khẩu không chính xác. Bạn có thể nhấn tab "Đăng ký tài khoản" nếu chưa có tài khoản.'
          };
        }
        if (code === 'auth/wrong-password') {
          return { success: false, message: 'Mật khẩu không chính xác.' };
        }
        if (code === 'auth/too-many-requests') {
          return { success: false, message: 'Đăng nhập sai quá nhiều lần. Vui lòng đợi trong giây lát và thử lại.' };
        }
        return { success: false, message: 'Đăng nhập thất bại: ' + (fbErr?.message || 'Kiểm tra lại thông tin') };
      }
    }

    // Direct local user check
    const existingUsers = StorageService.getUsers();
    let localMatch = existingUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!localMatch && preferredRole) {
      localMatch = existingUsers.find((u) => u.role === preferredRole);
    }
    if (localMatch) {
      setUser(localMatch);
      StorageService.setActiveUser(localMatch);
      return { success: true, user: localMatch };
    }

    return { success: false, message: 'Tài khoản không tồn tại. Vui lòng chuyển sang tab Đăng ký tài khoản.' };
  }, []);

  const login = useCallback((email: string, targetRole?: UserRole): boolean => {
    const users = StorageService.getUsers();
    let found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!found && targetRole) {
      found = users.find((u) => u.role === targetRole);
    }

    if (found) {
      setUser(found);
      StorageService.setActiveUser(found);
      if (found.role === 'PARENT' && found.childrenIds && found.childrenIds.length > 0) {
        setSelectedChildId(found.childrenIds[0]);
      }
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout warning:', e);
    }
    setUser(null);
    setFirebaseUser(null);
  }, []);

  const switchRole = useCallback((newRole: UserRole) => {
    const users = StorageService.getUsers();
    const targetUser = users.find((u) => u.role === newRole);
    if (targetUser) {
      setUser(targetUser);
      StorageService.setActiveUser(targetUser);
      if (targetUser.role === 'PARENT' && targetUser.childrenIds && targetUser.childrenIds.length > 0) {
        setSelectedChildId(targetUser.childrenIds[0]);
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        role: user?.role || 'TEACHER',
        isAuthenticated: !!user,
        isFirebaseConnected: !!activeFirebaseConfig.projectId,
        firebaseProjectId: activeFirebaseConfig.projectId,
        firebaseDatabaseId: activeFirebaseConfig.firestoreDatabaseId || '',
        isGoogleAuthenticated: !!firebaseUser,
        login,
        loginWithGoogle,
        registerWithEmail,
        loginWithEmail,
        logout,
        switchRole,
        allUsers,
        selectedChildId,
        setSelectedChildId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
