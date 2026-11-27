import type { ReactNode } from 'react';

interface PageHeroProps {
  label: string;
  title: ReactNode;
  description: ReactNode;
  image?: string;
  children?: ReactNode;
}

export default function PageHero({ label, title, description, image, children }: PageHeroProps) {
  return (
    <header className="site-page-hero">
      <div className="home-shell site-page-hero-inner">
        {image && <img className="site-page-hero-image" src={image} alt="" />}
        <div className="site-page-hero-copy">
          <p className="home-kicker"><span aria-hidden="true">/// </span>{label}</p>
          <h1><span className="campaign-mark" aria-hidden="true" />{title}</h1>
          <p className="site-page-description">{description}</p>
          {children && <div className="site-page-actions">{children}</div>}
        </div>
      </div>
    </header>
  );
}
