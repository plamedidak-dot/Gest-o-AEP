import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from './firebase';
import { 
  Member, 
  DepartmentItem, 
  QuotaPayment, 
  AssociationEvent, 
  EventAttendance, 
  AssociationDocument, 
  AssociationSettings,
  SchoolStudentRegistryItem
} from '../types';

export interface CloudSyncStatus {
  connected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error?: string | null;
}

let syncStatus: CloudSyncStatus = {
  connected: false,
  isSyncing: false,
  lastSyncedAt: null,
  error: null,
};

const listeners: ((status: CloudSyncStatus) => void)[] = [];

export function subscribeToSyncStatus(listener: (status: CloudSyncStatus) => void) {
  listeners.push(listener);
  listener({ ...syncStatus });
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function updateSyncStatus(patch: Partial<CloudSyncStatus>) {
  syncStatus = { ...syncStatus, ...patch };
  listeners.forEach(fn => fn({ ...syncStatus }));
  window.dispatchEvent(new CustomEvent('ae_cloud_sync_status', { detail: syncStatus }));
}

export function getSyncStatus(): CloudSyncStatus {
  return { ...syncStatus };
}

// Local storage keys mirror storage.ts
const STORAGE_KEYS = {
  MEMBERS: 'ae_escola_members_v2',
  QUOTAS: 'ae_escola_quotas_v2',
  EVENTS: 'ae_escola_events_v2',
  ATTENDANCE: 'ae_escola_attendance_v2',
  DOCUMENTS: 'ae_escola_documents_v2',
  SETTINGS: 'ae_escola_settings_v2',
  DEPARTMENTS: 'ae_escola_departments_v2',
  STUDENTS_REGISTRY: 'ae_escola_student_registry_v2',
};

// Flag to avoid echo loop between local save and cloud snapshot
let isReceivingFromCloud = false;

export function initFirestoreRealtimeSync() {
  testFirestoreConnection().then(online => {
    updateSyncStatus({ connected: online, lastSyncedAt: online ? new Date().toISOString() : null });
  });

  try {
    // 1. Members Real-time Sync
    onSnapshot(collection(db, 'members'), (snapshot) => {
      const cloudMembers: Member[] = [];
      snapshot.forEach(docSnap => {
        cloudMembers.push(docSnap.data() as Member);
      });

      if (cloudMembers.length > 0 || snapshot.metadata.fromCache === false) {
        isReceivingFromCloud = true;
        // Merge with existing local or replace if cloud is authoritative
        const localRaw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
        let localMembers: Member[] = [];
        try { localMembers = localRaw ? JSON.parse(localRaw) : []; } catch { localMembers = []; }

        // Combine by ID, cloud taking precedence
        const memberMap = new Map<string, Member>();
        localMembers.forEach(m => memberMap.set(m.id, m));
        cloudMembers.forEach(m => memberMap.set(m.id, m));

        const merged = Array.from(memberMap.values());
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(merged));
        window.dispatchEvent(new Event('ae_storage_updated'));
        isReceivingFromCloud = false;
        updateSyncStatus({ connected: true, lastSyncedAt: new Date().toISOString() });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'members');
      updateSyncStatus({ error: error.message });
    });

    // 2. Departments Real-time Sync
    onSnapshot(collection(db, 'departments'), (snapshot) => {
      const cloudDepts: DepartmentItem[] = [];
      snapshot.forEach(docSnap => {
        cloudDepts.push(docSnap.data() as DepartmentItem);
      });

      if (cloudDepts.length > 0 || snapshot.metadata.fromCache === false) {
        isReceivingFromCloud = true;
        const localRaw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
        let localDepts: DepartmentItem[] = [];
        try { localDepts = localRaw ? JSON.parse(localRaw) : []; } catch { localDepts = []; }

        const deptMap = new Map<string, DepartmentItem>();
        localDepts.forEach(d => deptMap.set(d.id, d));
        cloudDepts.forEach(d => deptMap.set(d.id, d));

        localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(Array.from(deptMap.values())));
        window.dispatchEvent(new Event('ae_storage_updated'));
        isReceivingFromCloud = false;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'departments');
    });

    // 3. Quotas Real-time Sync
    onSnapshot(collection(db, 'quotas'), (snapshot) => {
      const cloudQuotas: QuotaPayment[] = [];
      snapshot.forEach(docSnap => {
        cloudQuotas.push(docSnap.data() as QuotaPayment);
      });

      if (cloudQuotas.length > 0 || snapshot.metadata.fromCache === false) {
        isReceivingFromCloud = true;
        const localRaw = localStorage.getItem(STORAGE_KEYS.QUOTAS);
        let localQuotas: QuotaPayment[] = [];
        try { localQuotas = localRaw ? JSON.parse(localRaw) : []; } catch { localQuotas = []; }

        const qMap = new Map<string, QuotaPayment>();
        localQuotas.forEach(q => qMap.set(q.id, q));
        cloudQuotas.forEach(q => qMap.set(q.id, q));

        localStorage.setItem(STORAGE_KEYS.QUOTAS, JSON.stringify(Array.from(qMap.values())));
        window.dispatchEvent(new Event('ae_storage_updated'));
        isReceivingFromCloud = false;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'quotas');
    });

    // 4. Events Real-time Sync
    onSnapshot(collection(db, 'events'), (snapshot) => {
      const cloudEvents: AssociationEvent[] = [];
      snapshot.forEach(docSnap => {
        cloudEvents.push(docSnap.data() as AssociationEvent);
      });

      if (cloudEvents.length > 0 || snapshot.metadata.fromCache === false) {
        isReceivingFromCloud = true;
        const localRaw = localStorage.getItem(STORAGE_KEYS.EVENTS);
        let localEvents: AssociationEvent[] = [];
        try { localEvents = localRaw ? JSON.parse(localRaw) : []; } catch { localEvents = []; }

        const eMap = new Map<string, AssociationEvent>();
        localEvents.forEach(e => eMap.set(e.id, e));
        cloudEvents.forEach(e => eMap.set(e.id, e));

        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(Array.from(eMap.values())));
        window.dispatchEvent(new Event('ae_storage_updated'));
        isReceivingFromCloud = false;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'events');
    });

    // 5. Attendance Real-time Sync
    onSnapshot(collection(db, 'attendance'), (snapshot) => {
      const cloudAtt: EventAttendance[] = [];
      snapshot.forEach(docSnap => {
        cloudAtt.push(docSnap.data() as EventAttendance);
      });

      if (cloudAtt.length > 0 || snapshot.metadata.fromCache === false) {
        isReceivingFromCloud = true;
        const localRaw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
        let localAtt: EventAttendance[] = [];
        try { localAtt = localRaw ? JSON.parse(localRaw) : []; } catch { localAtt = []; }

        const aMap = new Map<string, EventAttendance>();
        localAtt.forEach(a => aMap.set(a.id, a));
        cloudAtt.forEach(a => aMap.set(a.id, a));

        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(Array.from(aMap.values())));
        window.dispatchEvent(new Event('ae_storage_updated'));
        isReceivingFromCloud = false;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'attendance');
    });

    // 6. Documents Real-time Sync
    onSnapshot(collection(db, 'documents'), (snapshot) => {
      const cloudDocs: AssociationDocument[] = [];
      snapshot.forEach(docSnap => {
        cloudDocs.push(docSnap.data() as AssociationDocument);
      });

      if (cloudDocs.length > 0 || snapshot.metadata.fromCache === false) {
        isReceivingFromCloud = true;
        const localRaw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
        let localDocs: AssociationDocument[] = [];
        try { localDocs = localRaw ? JSON.parse(localRaw) : []; } catch { localDocs = []; }

        const dMap = new Map<string, AssociationDocument>();
        localDocs.forEach(d => dMap.set(d.id, d));
        cloudDocs.forEach(d => dMap.set(d.id, d));

        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(Array.from(dMap.values())));
        window.dispatchEvent(new Event('ae_storage_updated'));
        isReceivingFromCloud = false;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'documents');
    });

    // 7. Settings Real-time Sync
    onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        const cloudSettings = snapshot.data() as AssociationSettings;
        isReceivingFromCloud = true;
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cloudSettings));
        window.dispatchEvent(new Event('ae_storage_updated'));
        isReceivingFromCloud = false;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/config');
    });

  } catch (err) {
    console.warn('Real-time sync error: ', err);
  }
}

// Write-through helper methods to Firestore
export async function syncMemberToCloud(member: Member): Promise<void> {
  if (isReceivingFromCloud) return;
  try {
    updateSyncStatus({ isSyncing: true });
    // Clean undefined fields for Firestore
    const cleanDoc = JSON.parse(JSON.stringify(member));
    await setDoc(doc(db, 'members', member.id), cleanDoc);
    updateSyncStatus({ isSyncing: false, connected: true, lastSyncedAt: new Date().toISOString() });
  } catch (error) {
    updateSyncStatus({ isSyncing: false });
    handleFirestoreError(error, OperationType.WRITE, `members/${member.id}`);
  }
}

export async function deleteMemberFromCloud(memberId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'members', memberId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `members/${memberId}`);
  }
}

export async function syncDepartmentToCloud(dept: DepartmentItem): Promise<void> {
  if (isReceivingFromCloud) return;
  try {
    updateSyncStatus({ isSyncing: true });
    const cleanDoc = JSON.parse(JSON.stringify(dept));
    await setDoc(doc(db, 'departments', dept.id), cleanDoc);
    updateSyncStatus({ isSyncing: false, connected: true, lastSyncedAt: new Date().toISOString() });
  } catch (error) {
    updateSyncStatus({ isSyncing: false });
    handleFirestoreError(error, OperationType.WRITE, `departments/${dept.id}`);
  }
}

export async function deleteDepartmentFromCloud(deptId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'departments', deptId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `departments/${deptId}`);
  }
}

export async function syncQuotaToCloud(quota: QuotaPayment): Promise<void> {
  if (isReceivingFromCloud) return;
  try {
    updateSyncStatus({ isSyncing: true });
    const cleanDoc = JSON.parse(JSON.stringify(quota));
    await setDoc(doc(db, 'quotas', quota.id), cleanDoc);
    updateSyncStatus({ isSyncing: false, connected: true, lastSyncedAt: new Date().toISOString() });
  } catch (error) {
    updateSyncStatus({ isSyncing: false });
    handleFirestoreError(error, OperationType.WRITE, `quotas/${quota.id}`);
  }
}

export async function deleteQuotaFromCloud(quotaId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'quotas', quotaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `quotas/${quotaId}`);
  }
}

export async function syncEventToCloud(event: AssociationEvent): Promise<void> {
  if (isReceivingFromCloud) return;
  try {
    updateSyncStatus({ isSyncing: true });
    const cleanDoc = JSON.parse(JSON.stringify(event));
    await setDoc(doc(db, 'events', event.id), cleanDoc);
    updateSyncStatus({ isSyncing: false, connected: true, lastSyncedAt: new Date().toISOString() });
  } catch (error) {
    updateSyncStatus({ isSyncing: false });
    handleFirestoreError(error, OperationType.WRITE, `events/${event.id}`);
  }
}

export async function deleteEventFromCloud(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `events/${eventId}`);
  }
}

export async function syncAttendanceToCloud(attendance: EventAttendance): Promise<void> {
  if (isReceivingFromCloud) return;
  try {
    const cleanDoc = JSON.parse(JSON.stringify(attendance));
    await setDoc(doc(db, 'attendance', attendance.id), cleanDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `attendance/${attendance.id}`);
  }
}

export async function syncDocumentToCloud(docItem: AssociationDocument): Promise<void> {
  if (isReceivingFromCloud) return;
  try {
    updateSyncStatus({ isSyncing: true });
    const cleanDoc = JSON.parse(JSON.stringify(docItem));
    await setDoc(doc(db, 'documents', docItem.id), cleanDoc);
    updateSyncStatus({ isSyncing: false, connected: true, lastSyncedAt: new Date().toISOString() });
  } catch (error) {
    updateSyncStatus({ isSyncing: false });
    handleFirestoreError(error, OperationType.WRITE, `documents/${docItem.id}`);
  }
}

export async function deleteDocumentFromCloud(docId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'documents', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `documents/${docId}`);
  }
}

export async function syncSettingsToCloud(settings: AssociationSettings): Promise<void> {
  if (isReceivingFromCloud) return;
  try {
    updateSyncStatus({ isSyncing: true });
    const cleanDoc = JSON.parse(JSON.stringify(settings));
    await setDoc(doc(db, 'settings', 'config'), cleanDoc);
    updateSyncStatus({ isSyncing: false, connected: true, lastSyncedAt: new Date().toISOString() });
  } catch (error) {
    updateSyncStatus({ isSyncing: false });
    handleFirestoreError(error, OperationType.WRITE, 'settings/config');
  }
}

// Push all current local data up to cloud (useful when first connecting or manual resync)
export async function pushAllLocalDataToCloud(data: {
  members: Member[];
  departments: DepartmentItem[];
  quotas: QuotaPayment[];
  events: AssociationEvent[];
  attendance: EventAttendance[];
  documents: AssociationDocument[];
  settings: AssociationSettings;
}): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    updateSyncStatus({ isSyncing: true });
    let count = 0;

    // Settings
    await setDoc(doc(db, 'settings', 'config'), JSON.parse(JSON.stringify(data.settings)));
    count++;

    // Departments
    for (const d of data.departments) {
      await setDoc(doc(db, 'departments', d.id), JSON.parse(JSON.stringify(d)));
      count++;
    }

    // Members
    for (const m of data.members) {
      await setDoc(doc(db, 'members', m.id), JSON.parse(JSON.stringify(m)));
      count++;
    }

    // Quotas
    for (const q of data.quotas) {
      await setDoc(doc(db, 'quotas', q.id), JSON.parse(JSON.stringify(q)));
      count++;
    }

    // Events
    for (const e of data.events) {
      await setDoc(doc(db, 'events', e.id), JSON.parse(JSON.stringify(e)));
      count++;
    }

    // Attendance
    for (const a of data.attendance) {
      await setDoc(doc(db, 'attendance', a.id), JSON.parse(JSON.stringify(a)));
      count++;
    }

    // Documents
    for (const docItem of data.documents) {
      await setDoc(doc(db, 'documents', docItem.id), JSON.parse(JSON.stringify(docItem)));
      count++;
    }

    updateSyncStatus({ isSyncing: false, connected: true, lastSyncedAt: new Date().toISOString() });
    return { success: true, count };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    updateSyncStatus({ isSyncing: false, error: msg });
    return { success: false, count: 0, error: msg };
  }
}
