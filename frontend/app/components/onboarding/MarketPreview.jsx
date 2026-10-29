import { ChevronDown } from "lucide-react";
import FlagIcon from "../FlagIcon.jsx";

/** Storefront wording in each supported language (illustrative; the real store copy is AI-written). */
const COPY = {
  en: { hello: "Welcome", cod: "Cash on delivery", online: "Pay online", cta: "Add to cart" },
  zh: { hello: "欢迎光临", cod: "货到付款", online: "在线支付", cta: "加入购物车" },
  es: { hello: "Bienvenido", cod: "Pago contra reembolso", online: "Pagar en línea", cta: "Añadir al carrito" },
  hi: { hello: "स्वागत है", cod: "कैश ऑन डिलीवरी", online: "ऑनलाइन भुगतान", cta: "कार्ट में जोड़ें" },
  ar: { hello: "أهلاً وسهلاً", cod: "الدفع عند الاستلام", online: "الدفع عبر الإنترنت", cta: "أضف إلى السلة" },
  fr: { hello: "Bienvenue", cod: "Paiement à la livraison", online: "Payer en ligne", cta: "Ajouter au panier" },
  pt: { hello: "Bem-vindo", cod: "Pagamento na entrega", online: "Pagar online", cta: "Adicionar ao carrinho" },
  ru: { hello: "Добро пожаловать", cod: "Оплата при получении", online: "Оплата онлайн", cta: "В корзину" },
  de: { hello: "Willkommen", cod: "Nachnahme", online: "Online bezahlen", cta: "In den Warenkorb" },
  ja: { hello: "ようこそ", cod: "代金引換", online: "オンライン決済", cta: "カートに追加" },
  ko: { hello: "환영합니다", cod: "착불 결제", online: "온라인 결제", cta: "장바구니에 담기" },
  it: { hello: "Benvenuto", cod: "Pagamento alla consegna", online: "Paga online", cta: "Aggiungi al carrello" },
  tr: { hello: "Hoş geldiniz", cod: "Kapıda ödeme", online: "Online öde", cta: "Sepete ekle" },
  id: { hello: "Selamat datang", cod: "Bayar di tempat", online: "Bayar online", cta: "Tambah ke keranjang" },
  vi: { hello: "Chào mừng", cod: "Thanh toán khi nhận hàng", online: "Thanh toán trực tuyến", cta: "Thêm vào giỏ hàng" },
  th: { hello: "ยินดีต้อนรับ", cod: "เก็บเงินปลายทาง", online: "ชำระเงินออนไลน์", cta: "เพิ่มลงตะกร้า" },
};

/**
 * Storefront preview for the market step. It re-renders with the chosen language and country,
 * so the merchant sees what the two pickers change. Purely illustrative and decorative.
 * @param {{ language: { value: string, name: string, nativeName?: string },
 *           country: { label: string, flag?: string } | null }} props
 */
export default function MarketPreview({ language, country }) {
  const copy = COPY[language.value] || COPY.en;
  const rtl = language.value === "ar";

  return (
    <div
      aria-hidden
      className="flex h-full flex-col rounded-2xl bg-white/60 p-4 ring-1 ring-inset ring-blue-100"
    >
      <p className="m-0 text-[13px] text-slate-500">
        <span className="font-semibold text-slate-700">Example preview.</span> Your real pages are
        written in {language.name} by AI.
      </p>

      <div className="mt-3 flex flex-1 items-center">
        <div
          key={`${language.value}-${country?.label || "none"}`}
          dir={rtl ? "rtl" : "ltr"}
          className="market-preview-in mx-auto w-full max-w-[380px] overflow-hidden rounded-2xl bg-white text-slate-900 shadow-lg ring-1 ring-slate-200/70"
        >
          <div className="flex items-center justify-between px-4 pt-4" dir="ltr">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-slate-800">YOUR STORE</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-1.5 pr-2 text-[11px] font-medium text-slate-700">
              {country ? <FlagIcon flag={country.flag} width={16} /> : <FlagIcon width={16} />}
              <span className="max-w-[110px] truncate">{country ? country.label : "Select country"}</span>
              <ChevronDown size={11} className="text-slate-400" />
            </span>
          </div>

          <div className="px-4 pb-4 pt-3">
            <p className="m-0 text-[26px] font-bold leading-tight tracking-tight">{copy.hello}</p>
            <p className="m-0 mt-0.5 text-[11px] text-slate-400">
              {language.nativeName || language.name}
              {country ? ` · ${country.label}` : ""}
            </p>

            <div className="mt-4 space-y-2">
              <span className="flex items-center gap-2.5 rounded-lg bg-blue-50/70 px-3 py-2 text-[12.5px] font-medium ring-1 ring-inset ring-[#1e40af]/60">
                <span className="flex h-3.5 w-3.5 flex-none items-center justify-center rounded-full border-[4px] border-[#1e40af] bg-white" />
                {copy.cod}
              </span>
              <span className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                <span className="h-3.5 w-3.5 flex-none rounded-full border border-slate-300" />
                {copy.online}
              </span>
            </div>

            <span className="mt-4 flex items-center justify-center rounded-lg bg-[#1e3a8a] py-2.5 text-[13px] font-semibold text-white">
              {copy.cta}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
