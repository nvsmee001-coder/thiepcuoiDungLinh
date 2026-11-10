import "./WeddingWelcome.scss";
import { optimizedPhoto } from "../../Experience/utils/photoAssets";

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

export default function WeddingWelcome({ onStart, rotateRequired }) {
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const guestName = (searchParams?.get("to") || searchParams?.get("guest") || searchParams?.get("k") || "").trim();

  return <main className="wedding-welcome">
    <div className="wedding-welcome__paper">
      <div className="wedding-welcome__copy">
        <p className="wedding-welcome__invitation">Kính mời</p>
        <p className="wedding-welcome__guests">{guestName || "Quý khách và gia đình"}</p>
        <span className="wedding-welcome__eyebrow">ĐẾN DỰ ĐÁM CƯỚI CỦA CHÚNG MÌNH</span>
        <h1><span className="wedding-welcome__name">Lê Dũng</span>{" "}<span className="wedding-welcome__name"><span className="wedding-welcome__ampersand">&</span> Khánh Linh</span></h1>
        <p className="wedding-welcome__date"><time dateTime="2026-11-28T10:00:00+07:00">28/11/2026</time>{" "}<span>lúc <strong>10h00</strong></span></p>
        <p className="wedding-welcome__venue">
          <span>tại trung tâm Đại Hoàng Sơn Palace</span>{" "}
          <span>54 Hùng Vương, Bắc Giang, TP Bắc Ninh</span>
        </p>
        {rotateRequired ? <RotateNotice /> : <>
          <p className="wedding-welcome__instruction">Vui lòng cuộn và kéo để xem thiệp</p>
          <button onClick={onStart} className="wedding-welcome__start">Mở thiệp cưới</button>
        </>}
      </div>
      <div className="wedding-welcome__art" aria-hidden="true">
        <img className="wedding-welcome__castle" src="/scenery/enchanted-castle.svg" alt="" />
        <img className="wedding-welcome__couple" src={optimizedPhoto("/media/wedding-couple-portrait.png")} alt="" />
        <span className="wedding-welcome__heart">♡</span>
      </div>
    </div>
  </main>;
}
