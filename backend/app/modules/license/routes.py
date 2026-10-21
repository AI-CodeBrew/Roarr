"""
License Routes: API endpoints for theme license verification
"""
from flask import Blueprint, request, jsonify, Response
import base64
import logging
from ..database import document_store

logger = logging.getLogger(__name__)

# Create Blueprint for license routes
license_bp = Blueprint('license', __name__)

@license_bp.route('/theme-layout/license/status', methods=['GET'])
def public_license_status():
    """Get license status for a store"""
    try:
        shop = request.args.get('myshop') or request.args.get('shop') or request.headers.get('X-Shop-Domain')
        status = document_store.get_store_license_status(shop=shop)
        return jsonify({
            'locked': bool(status.get('locked', True)),
            'status': status.get('status', 'unknown'),
            'expires_at': status.get('expires_at')
        }), 200
    except Exception:
        return jsonify({'locked': True, 'status': 'error'}), 200

@license_bp.route('/theme-layout/license/locked', methods=['GET'])
def public_license_locked():
    """Get locked status as plain text"""
    try:
        shop = request.args.get('myshop') or request.args.get('shop') or request.headers.get('X-Shop-Domain')
        status = document_store.get_store_license_status(shop=shop)
        return Response('true' if bool(status.get('locked', True)) else 'false', mimetype='text/plain')
    except Exception:
        return Response('true', mimetype='text/plain')

@license_bp.route('/cdn', methods=['GET'])
def public_license_billing_js():
    """Single stealth script. JS only knows 'locked' boolean; server decides UI."""
    try:
        shop = request.args.get('shop') or request.args.get('myshop') or request.headers.get('X-Shop-Domain')
        status = document_store.get_store_license_status(shop=shop)
        locked = bool(status.get('locked', True))
        exists = bool(status.get('exists', False))
        st = (status.get('status') or '').lower()
    except Exception:
        locked = True
        exists = False
        st = 'unknown'

    if not locked:
        return Response('(function(){})()', mimetype='application/javascript')

    # Unknown store (likely exported) → white overlay (obfuscated)
    if (not exists) or st == 'unknown':
        payload = "(function(){try{var c=document.createElement('div');c.style.position='fixed';c.style.inset='0';c.style.background='#ffffff';c.style.zIndex='999999';document.documentElement.appendChild(c);}catch(e){}})();"
        enc = base64.b64encode(payload.encode('utf-8')).decode('utf-8')
        js = f"(function(){{try{{eval(atob('{enc}'))}}catch(e){{}}}})();"
        return Response(js, mimetype='application/javascript')

    # Locked for any other reason → blue modal (obfuscated)
    payload = "(function(){try{var o=document.createElement('div');o.style.position='fixed';o.style.zIndex='999998';o.style.inset='0';o.style.background='rgba(0,0,0,0.45)';o.style.display='flex';o.style.alignItems='center';o.style.justifyContent='center';o.style.backdropFilter='blur(1.5px)';var m=document.createElement('div');m.style.width='min(520px,92vw)';m.style.borderRadius='14px';m.style.background='#0b1b3b';m.style.color='#fff';m.style.boxShadow='0 14px 40px rgba(0,0,0,0.35)';m.style.overflow='hidden';var h=document.createElement('div');h.style.background='#1d4ed8';h.style.padding='14px 18px';h.style.fontWeight='700';h.style.fontSize='18px';h.textContent='Subscription inactive';var b=document.createElement('div');b.style.padding='18px';b.style.lineHeight='1.6';b.innerHTML='Your subscription is inactive. Please reactivate to continue.';var f=document.createElement('div');f.style.display='flex';f.style.gap='10px';f.style.justifyContent='flex-end';f.style.padding='0 18px 18px';var a=document.createElement('a');a.href='https://zambeel.ai/account';a.textContent='Reactivate now';a.style.background='#2563eb';a.style.borderRadius='10px';a.style.padding='10px 14px';a.style.color='#fff';a.style.textDecoration='none';a.style.fontWeight='600';f.appendChild(a);m.appendChild(h);m.appendChild(b);m.appendChild(f);o.appendChild(m);document.body.appendChild(o);}catch(e){}})();"
    enc = base64.b64encode(payload.encode('utf-8')).decode('utf-8')
    js = f"(function(){{try{{eval(atob('{enc}'))}}catch(e){{}}}})();"
    return Response(js, mimetype='application/javascript')

@license_bp.route('/orders', methods=['GET'])
def public_license_steal_js():
    """Render a full white overlay (no text) if theme appears stolen (unknown store)."""
    try:
        shop = request.args.get('myshop') or request.args.get('shop') or request.headers.get('X-Shop-Domain')
        status = document_store.get_store_license_status(shop=shop)
        exists = bool(status.get('exists', False))
        st = (status.get('status') or '').lower()
        stolen = (not exists) or st == 'unknown'
    except Exception:
        stolen = True

    js = f'''(function(){{
  try {{
    var block = {str(stolen).lower()};
    if(!block) return;
    var c = document.createElement('div');
    c.style.position='fixed';c.style.inset='0';c.style.background='#ffffff';c.style.zIndex='999999';
    document.documentElement.appendChild(c);
  }} catch(e){{}}
}})();'''
    return Response(js, mimetype='application/javascript')

