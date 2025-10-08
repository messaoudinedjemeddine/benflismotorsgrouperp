import { useAuth, UserRole } from '@/contexts/AuthContext';

export type VnOrderStage = 
  | 'PROFORMA'
  | 'COMMANDE'
  | 'VALIDATION'
  | 'ACCUSÉ'
  | 'FACTURATION'
  | 'ARRIVAGE'
  | 'CARTE_JAUNE'
  | 'LIVRAISON'
  | 'DOSSIER_DAIRA';

/**
 * Hook to check if current user has access to specific VN order stages
 */
export const useVnOrderStageAccess = () => {
  const { userRole, hasRole } = useAuth();

  const canAccessStage = (stage: VnOrderStage): boolean => {
    // Sys admin and director can access everything
    if (hasRole(['sys_admin', 'director'])) {
      return true;
    }

    // CDV can access all stages
    if (hasRole(['cdv'])) {
      return true;
    }

    // Commercial can access only PROFORMA and COMMANDE
    if (hasRole(['commercial'])) {
      return stage === 'PROFORMA' || stage === 'COMMANDE';
    }

    // GED can access VALIDATION and ACCUSÉ
    if (hasRole(['ged'])) {
      return stage === 'VALIDATION' || stage === 'ACCUSÉ';
    }

    // ADV can access FACTURATION and ARRIVAGE
    if (hasRole(['adv'])) {
      return stage === 'FACTURATION' || stage === 'ARRIVAGE';
    }

    // Livraison can access CARTE_JAUNE and LIVRAISON
    if (hasRole(['livraison'])) {
      return stage === 'CARTE_JAUNE' || stage === 'LIVRAISON';
    }

    // Immatriculation can access DOSSIER_DAIRA
    if (hasRole(['immatriculation'])) {
      return stage === 'DOSSIER_DAIRA';
    }

    return false;
  };

  const canEditOrder = (): boolean => {
    return hasRole(['sys_admin', 'director', 'cdv', 'commercial']);
  };

  const canCreateOrder = (): boolean => {
    return hasRole(['sys_admin', 'director', 'cdv', 'commercial']);
  };

  const canCompleteAnyStage = (): boolean => {
    // Sys admin, director, and immatriculation can complete any stage regardless of validation requirements
    return hasRole(['sys_admin', 'director', 'immatriculation']);
  };

  const canBypassStageValidation = (): boolean => {
    // Sys admin, director, and immatriculation can bypass stage validation requirements
    return hasRole(['sys_admin', 'director', 'immatriculation']);
  };

  return {
    canAccessStage,
    canEditOrder,
    canCreateOrder,
    canCompleteAnyStage,
    canBypassStageValidation,
    userRole
  };
};
