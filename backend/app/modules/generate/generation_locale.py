"""
Small UI-string table for generation placeholders / CTAs.

AI body copy is steered by language_instruction. These strings are the
hardcoded leftovers (review blanks, common buttons) that used to stay English.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

# Popular langs from the embedded supportedLanguages list.
_UI: Dict[str, Dict[str, str]] = {
    "en": {
        "reviewer_name": "Reviewer Name",
        "review_title": "Enter Your Text",
        "review_body": "Enter customer review over here",
        "add_to_cart": "Add to cart",
        "shop_now": "Shop now",
        "key_features": "Key features",
        "sold_out": "Sold out",
        "free_shipping": "Free shipping",
    },
    "pt": {
        "reviewer_name": "Nome do avaliador",
        "review_title": "Digite seu texto",
        "review_body": "Digite a avaliação do cliente aqui",
        "add_to_cart": "Adicionar ao carrinho",
        "shop_now": "Comprar agora",
        "key_features": "Principais recursos",
        "sold_out": "Esgotado",
        "free_shipping": "Frete grátis",
    },
    "es": {
        "reviewer_name": "Nombre del reseñador",
        "review_title": "Escribe tu texto",
        "review_body": "Escribe la reseña del cliente aquí",
        "add_to_cart": "Añadir al carrito",
        "shop_now": "Comprar ahora",
        "key_features": "Características clave",
        "sold_out": "Agotado",
        "free_shipping": "Envío gratis",
    },
    "fr": {
        "reviewer_name": "Nom de l'évaluateur",
        "review_title": "Saisissez votre texte",
        "review_body": "Saisissez l'avis client ici",
        "add_to_cart": "Ajouter au panier",
        "shop_now": "Acheter",
        "key_features": "Caractéristiques clés",
        "sold_out": "Épuisé",
        "free_shipping": "Livraison gratuite",
    },
    "de": {
        "reviewer_name": "Name des Bewerters",
        "review_title": "Text eingeben",
        "review_body": "Kundenbewertung hier eingeben",
        "add_to_cart": "In den Warenkorb",
        "shop_now": "Jetzt kaufen",
        "key_features": "Hauptmerkmale",
        "sold_out": "Ausverkauft",
        "free_shipping": "Kostenloser Versand",
    },
    "it": {
        "reviewer_name": "Nome recensore",
        "review_title": "Inserisci il testo",
        "review_body": "Inserisci la recensione del cliente qui",
        "add_to_cart": "Aggiungi al carrello",
        "shop_now": "Acquista ora",
        "key_features": "Caratteristiche principali",
        "sold_out": "Esaurito",
        "free_shipping": "Spedizione gratuita",
    },
    "ar": {
        "reviewer_name": "اسم المراجع",
        "review_title": "أدخل نصك",
        "review_body": "أدخل مراجعة العميل هنا",
        "add_to_cart": "أضف إلى السلة",
        "shop_now": "تسوق الآن",
        "key_features": "الميزات الرئيسية",
        "sold_out": "نفدت الكمية",
        "free_shipping": "شحن مجاني",
    },
    "hi": {
        "reviewer_name": "समीक्षक का नाम",
        "review_title": "अपना पाठ दर्ज करें",
        "review_body": "यहाँ ग्राहक समीक्षा दर्ज करें",
        "add_to_cart": "कार्ट में जोड़ें",
        "shop_now": "अभी खरीदें",
        "key_features": "मुख्य विशेषताएँ",
        "sold_out": "बिक गया",
        "free_shipping": "मुफ़्त शिपिंग",
    },
    "zh": {
        "reviewer_name": "评价者姓名",
        "review_title": "输入您的文字",
        "review_body": "在此输入顾客评价",
        "add_to_cart": "加入购物车",
        "shop_now": "立即购买",
        "key_features": "主要特点",
        "sold_out": "已售罄",
        "free_shipping": "免费配送",
    },
    "ja": {
        "reviewer_name": "レビュアー名",
        "review_title": "テキストを入力",
        "review_body": "お客様のレビューを入力してください",
        "add_to_cart": "カートに追加",
        "shop_now": "今すぐ購入",
        "key_features": "主な特徴",
        "sold_out": "売り切れ",
        "free_shipping": "送料無料",
    },
    "ko": {
        "reviewer_name": "리뷰어 이름",
        "review_title": "텍스트 입력",
        "review_body": "고객 리뷰를 여기에 입력하세요",
        "add_to_cart": "장바구니에 추가",
        "shop_now": "지금 구매",
        "key_features": "주요 특징",
        "sold_out": "품절",
        "free_shipping": "무료 배송",
    },
    "ru": {
        "reviewer_name": "Имя рецензента",
        "review_title": "Введите текст",
        "review_body": "Введите отзыв клиента здесь",
        "add_to_cart": "В корзину",
        "shop_now": "Купить сейчас",
        "key_features": "Ключевые особенности",
        "sold_out": "Нет в наличии",
        "free_shipping": "Бесплатная доставка",
    },
    "tr": {
        "reviewer_name": "Yorumcu adı",
        "review_title": "Metninizi girin",
        "review_body": "Müşteri yorumunu buraya girin",
        "add_to_cart": "Sepete ekle",
        "shop_now": "Şimdi satın al",
        "key_features": "Öne çıkan özellikler",
        "sold_out": "Tükendi",
        "free_shipping": "Ücretsiz kargo",
    },
    "id": {
        "reviewer_name": "Nama pengulas",
        "review_title": "Masukkan teks Anda",
        "review_body": "Masukkan ulasan pelanggan di sini",
        "add_to_cart": "Tambah ke keranjang",
        "shop_now": "Beli sekarang",
        "key_features": "Fitur utama",
        "sold_out": "Habis",
        "free_shipping": "Gratis ongkir",
    },
    "vi": {
        "reviewer_name": "Tên người đánh giá",
        "review_title": "Nhập văn bản của bạn",
        "review_body": "Nhập đánh giá của khách hàng tại đây",
        "add_to_cart": "Thêm vào giỏ",
        "shop_now": "Mua ngay",
        "key_features": "Tính năng chính",
        "sold_out": "Hết hàng",
        "free_shipping": "Miễn phí vận chuyển",
    },
    "th": {
        "reviewer_name": "ชื่อผู้รีวิว",
        "review_title": "ใส่ข้อความของคุณ",
        "review_body": "ใส่รีวิวลูกค้าที่นี่",
        "add_to_cart": "เพิ่มลงตะกร้า",
        "shop_now": "ซื้อเลย",
        "key_features": "คุณสมบัติเด่น",
        "sold_out": "สินค้าหมด",
        "free_shipping": "จัดส่งฟรี",
    },
}

_NAME_TO_CODE = {
    "english": "en",
    "portuguese": "pt",
    "spanish": "es",
    "french": "fr",
    "german": "de",
    "italian": "it",
    "arabic": "ar",
    "hindi": "hi",
    "mandarin chinese": "zh",
    "chinese": "zh",
    "mandarin": "zh",
    "japanese": "ja",
    "korean": "ko",
    "russian": "ru",
    "turkish": "tr",
    "indonesian": "id",
    "vietnamese": "vi",
    "thai": "th",
}

# English defaults we may overwrite when a non-English language is active.
_ENGLISH_CTA_VALUES = {
    "shop now",
    "shop now!",
    "add to cart",
    "add to cart!",
    "key features",
    "free shipping",
    "free shipping on every order",
}


def normalize_language_code(language: Optional[str]) -> str:
    if not language or not str(language).strip():
        return "en"
    raw = str(language).strip().lower().replace("_", "-")
    if raw in _UI:
        return raw
    base = raw.split("-", 1)[0]
    if base in _UI:
        return base
    if raw in _NAME_TO_CODE:
        return _NAME_TO_CODE[raw]
    # "Portuguese (Brazil)" etc.
    for name, code in _NAME_TO_CODE.items():
        if raw.startswith(name):
            return code
    return "en"


def ui_string(key: str, language: Optional[str] = None) -> str:
    code = normalize_language_code(language)
    table = _UI.get(code) or _UI["en"]
    return table.get(key) or _UI["en"].get(key) or key


def apply_review_placeholders(
    target: Dict[str, Any],
    language: Optional[str] = None,
    *,
    name_key: str = "customer_name_{slot}",
    body_key: str = "customer_review_{slot}",
    title_key: Optional[str] = None,
    slots: int = 4,
) -> None:
    """Force merchant review blanks in the store/PDP language (never AI quotes)."""
    for slot in range(1, slots + 1):
        target[name_key.format(slot=slot)] = ui_string("reviewer_name", language)
        target[body_key.format(slot=slot)] = ui_string("review_body", language)
        if title_key:
            target[title_key.format(slot=slot)] = ui_string("review_title", language)


def apply_common_cta_defaults(
    target: Dict[str, Any],
    language: Optional[str] = None,
) -> None:
    """
    Fill or replace common English CTA defaults when a non-English language
    is selected. Does not invent marketing copy — only known chrome labels.
    """
    code = normalize_language_code(language)
    if code == "en" or not isinstance(target, dict):
        return

    replacements = {
        "hero_add_to_cart_text": "add_to_cart",
        "add_to_cart_text": "add_to_cart",
        "sticky_cta": "shop_now",
        "hero_cta": "shop_now",
        "story_cta": "shop_now",
        "product_story_cta": "shop_now",
        "orbit_eyebrow": "key_features",
        "ribbon_1": "free_shipping",
        "announcement_1": "free_shipping",
    }
    for field, string_key in replacements.items():
        current = target.get(field)
        if current is None or current == "" or str(current).strip().lower() in _ENGLISH_CTA_VALUES:
            target[field] = ui_string(string_key, language)
