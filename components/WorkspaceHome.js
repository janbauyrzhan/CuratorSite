import { ArrowUpRight, Users, Clock, Cpu, Instagram } from 'lucide-react';

export default function WorkspaceHome({ username, onSelect }) {
  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-copy">
            <span className="eyebrow">infoLogia / Куратор кабинеті</span>
            <h1 id="home-title">Бір команда.<br />Ортақ <span>нәтиже.</span></h1>
            <p className="home-greeting">Қош келдіңіз, <strong>{username}</strong>!</p>
            <p className="home-description">Топтарыңыз, жұптық жұмыс және сабақ кестесі — күнделікті жұмысыңызға қажет құралдар бір жерде.</p>
            <a href="#workspace-modules" className="brand-button brand-button-dark">Жұмысты бастау <ArrowUpRight size={18} /></a>
          </div>
          <figure className="home-team">
            <img src="/infologia-team.jpg" alt="infoLogia командасы" fetchPriority="high" />
            <figcaption><span>Білімге бірге.</span><span>infoLogia командасы</span></figcaption>
          </figure>
        </section>

        <section id="workspace-modules" className="home-modules" aria-labelledby="modules-title">
          <div className="home-section-heading">
            <div><span className="eyebrow">Күнделікті жұмыс</span><h2 id="modules-title">Жұмыс құралдары</h2></div>
            <p>Қажетті бөлімді таңдаңыз</p>
          </div>
          <div className="module-grid">
            <article className="module-card module-card-pairs">
              <div className="module-visual" aria-hidden="true"><Users size={46} strokeWidth={1.4} /><span className="module-visual-label">Бірге үйренеміз</span><span className="module-number">01</span></div>
              <div className="module-content">
                <span className="eyebrow">25 апта · Жұптарға бөлу</span>
                <h3>Жұптық жұмыс</h3>
                <p>Оқушыларды жұптарға бөліп, апта сайынғы постерді дайындаңыз. Қажет болса, жұптарды қолмен өзгертіңіз.</p>
                <button className="brand-button" onClick={() => onSelect('pairs')}>Жұптарды құру <ArrowUpRight size={18} /></button>
              </div>
            </article>
            <article className="module-card module-card-exam">
              <div className="module-visual" aria-hidden="true"><Clock size={46} strokeWidth={1.4} /><span className="module-visual-label">Әр сабақ өз уақытында</span><span className="module-number">02</span></div>
              <div className="module-content">
                <span className="eyebrow">16 уақыт аралығы · Кесте</span>
                <h3>Сабақ тапсыру</h3>
                <p>Күнді, басталу уақытын және аралықты белгілеңіз. Дайын кестені суретке сақтап, оқушыларға жіберіңіз.</p>
                <button className="brand-button" onClick={() => onSelect('exam')}>Кестені дайындау <ArrowUpRight size={18} /></button>
              </div>
            </article>
            <article className="module-card module-card-automation">
              <div className="module-visual" aria-hidden="true"><Cpu size={46} strokeWidth={1.4} /><span className="module-visual-label">Идеядан — автоматты жүйеге</span><span className="module-number">03</span></div>
              <div className="module-content">
                <span className="eyebrow">Жаңа бағыт · Практикалық жоба</span>
                <h3>Автоматтандыру</h3>
                <p>Автоматтандыру жобасымен танысып, оның қалай жұмыс істейтінін YouTube-та көріңіз.</p>
                <a className="brand-button" href="https://www.youtube.com/@infologiakz" target="_blank" rel="noreferrer">YouTube-та көру <ArrowUpRight size={18} /></a>
              </div>
            </article>
          </div>
        </section>
        <footer className="workspace-footer"><img src="/infologia-wordmark.png" alt="infoLogia" /><span>Кураторлардың жұмыс кеңістігі</span><a className="workspace-social-link" href="https://www.instagram.com/infologia.kz/" target="_blank" rel="noreferrer" aria-label="infoLogia Instagram парақшасы"><Instagram size={18} strokeWidth={1.8} /><span>Instagram</span><ArrowUpRight size={14} /></a></footer>
      </div>
    </main>
  );
}
