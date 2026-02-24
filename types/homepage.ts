export interface HomepageNavigationProps {
  // Navigation component props if needed
}

export interface HomepageHeroProps {
  // Hero section props if needed
}

export interface UserRole {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface HomepageUserRolesProps {
  roles: UserRole[];
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  delay: number;
}

export interface HomepageFeaturesProps {
  features: Feature[];
}

export interface HomepageCTAProps {
  // CTA section props if needed
}