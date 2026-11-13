import { Award } from 'lucide-react';

export default function CertificateCatalog() {
  return (
    <main className="plan-subject-page certificate-catalog" aria-labelledby="certificates-title">
      <header className="workspace-heading">
        <h1 id="certificates-title">Сертификаттар</h1>
      </header>
      <div className="certificate-empty">
        <Award size={32} strokeWidth={1.5} aria-hidden="true" />
        <div>
          <h2>Сертификат үлгілері</h2>
          <p>Каталогта әзірге үлгі жоқ.</p>
        </div>
      </div>
    </main>
  );
}
