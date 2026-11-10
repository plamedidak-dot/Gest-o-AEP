import { UserProfile, Member } from '../types';

/**
 * Checks if the user is the General System Administrator / Developer / Technical Engineer
 */
export const isSuperAdmin = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  return user.role === 'superadmin' || 
         user.isDeveloper === true || 
         (user.adminRole || '').toLowerCase().includes('engenheiro') || 
         (user.adminRole || '').toLowerCase().includes('desenvolvedor');
};

/**
 * Checks if the user is part of the central administration (President, Vice-President, General Secretary, Treasurer, SuperAdmin)
 */
export const isGlobalAdmin = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  if (user.role === 'superadmin' || user.role === 'admin') return true;
  const role = (user.adminRole || user.departmentRole || '').toLowerCase();
  const dept = (user.department || '').toLowerCase();
  return dept.includes('administra') || 
         role.includes('presidente') || 
         role.includes('secretário-geral') || 
         role.includes('secretario-geral') || 
         role.includes('tesour') ||
         role.includes('engenheiro') ||
         role.includes('desenvolvedor');
};

/**
 * Checks if user is a department Coordinator or Subcoordinator
 */
export const isDepartmentLeader = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  if (user.role === 'coordinator' || user.role === 'subcoordinator') return true;
  const role = (user.departmentRole || '').toLowerCase();
  return role.includes('coordenador') || role.includes('subcoordenador') || role.includes('vice-coordenador');
};

/**
 * Checks if user is a department Secretary
 */
export const isDepartmentSecretary = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  if (user.role === 'secretary') return true;
  const role = (user.departmentRole || '').toLowerCase();
  return (role.includes('secretár') || role.includes('secretar')) && !isGlobalAdmin(user);
};

/**
 * Checks if user has management permissions over their department (Coordinator, Subcoordinator, or Secretary)
 */
export const canManageDepartment = (user?: UserProfile | null): boolean => {
  return isGlobalAdmin(user) || isDepartmentLeader(user) || isDepartmentSecretary(user);
};

/**
 * Checks if user can manage member records
 */
export const canManageMembers = (user?: UserProfile | null): boolean => {
  return canManageDepartment(user);
};

/**
 * Checks if user can register, draft, and archive documents/acts
 */
export const canManageDocuments = (user?: UserProfile | null): boolean => {
  return isGlobalAdmin(user) || isDepartmentSecretary(user) || isDepartmentLeader(user);
};

/**
 * Checks if user can manage attendance and assembly desks
 */
export const canManageAttendance = (user?: UserProfile | null): boolean => {
  return canManageDepartment(user);
};

/**
 * Helper to determine if a member belongs to the user's manageable scope
 */
export const isMemberInUserScope = (user: UserProfile, member: Member): boolean => {
  if (isGlobalAdmin(user)) return true;
  if (!user.department) return false;
  return member.department?.trim().toLowerCase() === user.department.trim().toLowerCase();
};

/**
 * Returns strictly the members accessible to the user:
 * - Central Admin: all members
 * - Department heads (Coordenador, Subcoordenador, Secretária): ONLY members associated with their department
 * - Regular member: only their own member record
 */
export const getAccessibleMembers = (user: UserProfile, members: Member[]): Member[] => {
  if (isGlobalAdmin(user)) return members;
  if (isDepartmentLeader(user) || isDepartmentSecretary(user)) {
    if (!user.department) return [];
    const deptLower = user.department.trim().toLowerCase();
    return members.filter(m => (m.department || '').trim().toLowerCase() === deptLower);
  }
  // Regular member: only their own record
  return members.filter(m => 
    (user.memberId && m.id === user.memberId) || 
    (user.accessCode && m.accessCode?.toLowerCase() === user.accessCode?.toLowerCase()) ||
    (user.memberNumber && m.memberNumber?.toLowerCase() === user.memberNumber?.toLowerCase())
  );
};

/**
 * Return a human-readable title badge for the user
 */
export const getUserBadgeInfo = (user: UserProfile): { title: string; badgeClass: string; roleType: string } => {
  if (isSuperAdmin(user)) {
    return {
      title: 'Engenheiro do Sistema (Desenvolvedor)',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 font-black',
      roleType: 'superadmin'
    };
  }
  if (isGlobalAdmin(user)) {
    return {
      title: user.adminRole || 'Administração Geral',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      roleType: 'admin'
    };
  }
  if (isDepartmentLeader(user)) {
    return {
      title: `${user.departmentRole || 'Coordenador'} · ${user.department || 'Departamento'}`,
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
      roleType: 'coordinator'
    };
  }
  if (isDepartmentSecretary(user)) {
    return {
      title: `Secretária · ${user.department || 'Departamento'}`,
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      roleType: 'secretary'
    };
  }
  return {
    title: `Sócio (${user.memberNumber || 'Aluno'})`,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    roleType: 'member'
  };
};
