export interface Branding {
  id: string;
  deploymentId: string | null;
  brandName: string;
  logoUrl: string | null;
  logoStorageKey: string | null;
  createdAt: string;
  updatedAt: string;
}

/** POST /branding — multipart (one of brandName / logo required). */
export interface CreateBrandingPayload {
  brandName?: string;
  deploymentId?: string;
  logo?: File;
}

export interface UpdateBrandingPayload {
  brandName?: string;
  deploymentId?: string;
  logo?: File;
}
