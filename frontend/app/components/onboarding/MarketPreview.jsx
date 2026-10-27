import { ChevronDown, Lock, ShoppingBag } from "lucide-react";
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
 * Live storefront preview for the market step. It re-renders with the chosen language and country,
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
      className="relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e3a8a] via-[#3b3fc4] to-[#7c3aed] p-5 text-white shadow-[0_24px_48px_-28px_rgba(30,58,138,0.9)]"
    >
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(160deg,#000,transparent_70%)]" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-fuchsia-400/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-sky-300/25 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ring-inset ring-white/25">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
          </span>
          Live preview
        </span>
        <span className="text-[11px] text-white/70">How customers will see your store</span>
      </div>

      <div className="relative mx-auto mt-5 w-full max-w-[420px] flex-1">
        <div className="absolute inset-x-6 -bottom-2 h-6 rounded-full bg-black/25 blur-xl" />
        <div
          key={`${language.value}-${country?.label || "none"}`}
          dir={rtl ? "rtl" : "ltr"}
          className="market-preview-in relative overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl ring-1 ring-black/5"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2" dir="ltr">
            <span className="flex gap-1">
              <i className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <i className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <i className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            </span>
            <span className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-400 ring-1 ring-inset ring-slate-200">
              <Lock size={9} /> yourstore.com
            </span>
          </div>

          <div className="flex items-center justify-between px-4 pt-3" dir="ltr">
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

            <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 ring-1 ring-inset ring-slate-100">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-violet-100 text-[#4f46e5]">
                <ShoppingBag size={20} />
              </span>
              <span className="min-w-0 flex-1 space-y-1.5">
                <span className="block h-2 w-3/4 rounded-full bg-slate-200" />
                <span className="block h-2 w-1/3 rounded-full bg-slate-200" />
              </span>
              <span className="block h-2.5 w-10 rounded-full bg-slate-300" />
            </div>

            <div className="mt-3 space-y-2">
              <span className="flex items-center gap-2.5 rounded-lg bg-blue-50/70 px-3 py-2 text-[12.5px] font-medium ring-1 ring-inset ring-[#1e40af]/60">
                <span className="flex h-3.5 w-3.5 flex-none items-center justify-center rounded-full border-[4px] border-[#1e40af] bg-white" />
                {copy.cod}
              </span>
              <span className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                <span className="h-3.5 w-3.5 flex-none rounded-full border border-slate-300" />
                {copy.online}
              </span>
            </div>

            <span className="mt-3 flex items-center justify-center rounded-lg bg-[#1e3a8a] py-2.5 text-[13px] font-semibold text-white">
              {copy.cta}
            </span>
          </div>
        </div>
      </div>

      <p className="relative m-0 mt-4 text-center text-[11px] leading-snug text-white/65">
        Illustration. Your real pages are written in {language.name} by AI.
      </p>
    </div>
  );
}
