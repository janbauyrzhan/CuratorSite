import { ArrowUpRight, Users, Clock, Award, Cpu, Instagram, CalendarDays } from 'lucide-react';

export default function WorkspaceHome({ username, onSelect }) {
  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-copy">
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
            <div><h2 id="modules-title">Жұмыс құралдары</h2></div>
          </div>
          <div className="module-grid module-grid-four">
            <article className="module-card module-card-pairs">
              <div className="module-visual" aria-hidden="true"><Users size={46} strokeWidth={1.4} /><span className="module-visual-label">Бірге үйренеміз</span><span className="module-number">01</span></div>
              <div className="module-content">
                <h3>Жұптық жұмыс</h3>
                <p>Оқушыларды жұпқа бөліп, дайын постерді жүктеп алыңыз.</p>
                <button className="brand-button" onClick={() => onSelect('pairs')}>Жұптарды құру <ArrowUpRight size={18} /></button>
              </div>
            </article>
            <article className="module-card module-card-exam">
              <div className="module-visual" aria-hidden="true"><Clock size={46} strokeWidth={1.4} /><span className="module-visual-label">Сабақ тапсыру кестесі</span><span className="module-number">02</span></div>
              <div className="module-content">
                <h3>Сабақ тапсыру</h3>
                <p>Тапсыру күні мен уақытын белгілеңіз. Қажет болса, оқушыға жеке уақыт тағайындаңыз.</p>
                <button className="brand-button" onClick={() => onSelect('exam')}>Кестені дайындау <ArrowUpRight size={18} /></button>
              </div>
            </article>
            <article className="module-card module-card-certificates">
              <div className="module-visual" aria-hidden="true"><Award size={46} strokeWidth={1.4} /><span className="module-visual-label">Сертификат үлгілері</span><span className="module-number">03</span></div>
              <div className="module-content">
                <h3>Сертификаттар</h3>
                <p>Оқушыларға арналған сертификат үлгілерінің каталогы.</p>
                <button type="button" className="brand-button" onClick={() => onSelect('certificates')}>Каталогты ашу <ArrowUpRight size={18} /></button>
              </div>
            </article>
            <article className="module-card module-card-plan">
              <div className="module-visual" aria-hidden="true"><CalendarDays size={46} strokeWidth={1.4}/><span className="module-visual-label">Аптаңызды жоспарлаңыз</span><span className="module-number">04</span></div>
              <div className="module-content"><h3>Апталық жоспар</h3><p>Пәнді таңдап, апталық жоспар дайындаңыз. Күндерді өзгертіп, практикалық және кураторлық сабақтарды қосыңыз.</p><button className="brand-button" onClick={()=>onSelect('plan')}>Пәнді таңдау <ArrowUpRight size={18}/></button></div>
            </article>
          </div>
        </section>
        <footer className="workspace-footer">
          <img src="/infologia-wordmark.png" alt="infoLogia" />
          <div className="workspace-footer-links">
            <a className="workspace-social-link" href="https://youtu.be/VJF8I3vDvgo?si=jtned4dcu7_Is8mA" target="_blank" rel="noreferrer">
              <Cpu size={16} strokeWidth={1.8} aria-hidden="true" />Автоматтандыру<ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <a className="workspace-social-link" href="https://www.instagram.com/infologia.kz/" target="_blank" rel="noreferrer" aria-label="infoLogia Instagram парақшасы">
              <Instagram size={18} strokeWidth={1.8} /><span>Instagram</span><ArrowUpRight size={14} />
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
