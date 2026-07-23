import perform6SidebarIcon from '../assets/sidebar-logo-icon.png';

export const PERFORM6_LOGO_URL =
  'https://images.squarespace-cdn.com/content/v1/608f22d244f885787df69047/1621183988287-HRYLDN7NULR1DKEKZZJW/P6_logo.jpg?format=1500w';

export type DeploymentBrandingMode = 'default' | 'custom';

export const DEFAULT_COMPANY_NAME = 'Perform6';
export const DEFAULT_BRANDING_LOGO_URL = perform6SidebarIcon;

export const deploymentBrandingOptions = [
  { value: 'default' as const, label: 'Perform6 (default)' },
  { value: 'custom' as const, label: 'Custom company branding' },
] as const;

export function resolveDeploymentBranding(
  mode: DeploymentBrandingMode,
  custom: { companyName: string; brandingLogoUrl: string | null },
) {
  if (mode === 'custom') {
    return {
      brandingMode: mode,
      companyName: custom.companyName.trim() || undefined,
      brandingLogoUrl: custom.brandingLogoUrl,
    };
  }

  return {
    brandingMode: mode,
    companyName: DEFAULT_COMPANY_NAME,
    brandingLogoUrl: DEFAULT_BRANDING_LOGO_URL,
  };
}

export function getDeploymentBrandingLabel(mode?: DeploymentBrandingMode): string {
  return mode === 'custom' ? 'Custom company branding' : 'Perform6 (default)';
}
