import "./WeddingWelcome.scss";

export function RotateNotice() {
  return <div className="rotate-notice" role="status">
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect x="33" y="22" width="34" height="59" rx="5" stroke="currentColor" strokeWidth="3" transform="rotate(-35 50 50)" />
      <path d="M18 41C20 15 63 6 82 32m0-15v15H67" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <strong>Xoay ngang điện thoại nhé!</strong>
    <p>Để xem đầy đủ và ở chất lượng tốt nhất.</p>
  </div>;
}

export default function WeddingWelcome({ onStart, rotateRequired, phone }) {
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const guestName = (searchParams?.get("to") || searchParams?.get("guest") || searchParams?.get("k") || "").trim();

  return <main className="wedding-welcome">
    <div className="wedding-welcome__paper">
      <div className="wedding-welcome__copy">
        <span className="wedding-welcome__eyebrow">THIỆP CƯỚI CỦA CHÚNG MÌNH</span>
        <h1>Dũng <span>&</span> Linh</h1>
        <p className="wedding-welcome__names">Nguyễn Lê Dũng & Phạm Khánh Linh</p>
        <p className="wedding-welcome__date">27 · 28 / 11 / 2026</p>
        <div className="wedding-welcome__greeting">
          <span className="wedding-welcome__greeting-label">Kính mời</span>
          <strong className="wedding-welcome__greeting-name">{guestName || "Quý khách và gia đình"}</strong>
        </div>
        {rotateRequired ? <RotateNotice /> : <>
          <p className="wedding-welcome__instruction">{phone ? "Vuốt ngang để cùng tụi mình đi qua những kỷ niệm." : "Cuộn hoặc kéo để cùng tụi mình đi qua những kỷ niệm."}</p>
          <button onClick={onStart} className="wedding-welcome__start">Mở thiệp cưới</button>
        </>}
      </div>
      <div className="wedding-welcome__art" aria-hidden="true">
        <img className="wedding-welcome__castle" src="/scenery/enchanted-castle.svg" alt="" />
        <img className="wedding-welcome__couple" src="/media/wedding-couple-portrait.png" alt="" />
        <span className="wedding-welcome__heart">♡</span>
      </div>
    </div>
  </main>;
}
