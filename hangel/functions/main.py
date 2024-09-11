from firebase_functions import https_fn
from firebase_admin import initialize_app, firestore, credentials
from flask import Flask, Request, jsonify
from flask_cors import CORS
import os
from datetime import datetime

# Servis hesabı kimlik bilgilerini ayarlayın
credential_path = './credentials-file.json'
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credential_path

cred = credentials.Certificate(credential_path)
initialize_app(cred)
db = firestore.client()

# Flask uygulamasını başlat
app = Flask(__name__)
CORS(app)  # CORS ayarlarını yap

# Firebase Function


@https_fn.on_request()
def handle_postback(request: Request):
    try:
        adv_sub = request.args.get('adv_sub')  # Sipariş Numarası
        sale_amount = float(request.args.get('sale_amount'))  # Satış Tutarı
        aff_sub = request.args.get('aff_sub')  # Kullanıcının id'si
        aff_sub2 = request.args.get('aff_sub2')  # Unique değer

        if not adv_sub or not sale_amount or not aff_sub or not aff_sub2:
            return {'status': 'error', 'message': 'Missing required parameters'}, 400

        # Click document'ını aff_sub2 ile bul
        clicks_ref = db.collection('clicks')
        matching_clicks = clicks_ref.where('aff_sub2', '==', aff_sub2).stream()

        updated = False
        for click in matching_clicks:
            click_data = click.to_dict()

            # Click kaydını güncelle
            click_ref = clicks_ref.document(click.id)
            click_ref.update({
                'adv_sub': adv_sub,
                'sale_amount': sale_amount
            })
            updated = True

            # DonationRate'i click dokümanından al ve yüzdelik orana çevir
            donation_rate = click_data.get('donation_rate', 0) / 100
            stk_ids = click_data.get('stk_ids', [])
            brand_id = click_data.get('offer_id', "")
            user_id = aff_sub  # Kullanıcıyı tanımla (örnek olarak)

            if len(stk_ids) != 2:
                return {'status': 'error', 'message': 'Expected exactly 2 stk_ids'}, 400

            # Bağış miktarını hesapla (donation_rate yüzdelik orana çevrildi)
            donation_amount = sale_amount * donation_rate

            # Donation kaydını oluştur
            donation_ref = db.collection('donations').document()
            donation_data = {
                'userId': user_id,
                'brandId': brand_id,
                'stkId1': stk_ids[0],
                'stkId2': stk_ids[1],
                'saleAmount': donation_amount,
                'orderNumber': adv_sub,
                'shoppingDate': datetime.now()
            }
            donation_ref.set(donation_data)

            # STK güncelleme işlemi
            # Artık 'id' alanına göre 'stklar' koleksiyonunda kayıt arıyoruz
            update_stk_donation(stk_ids[0], donation_amount / 2, user_id)
            update_stk_donation(stk_ids[1], donation_amount / 2, user_id)

        if not updated:
            return {'status': 'error', 'message': 'No matching click found'}, 404

        return {'status': 'success', 'message': 'Click updated and donation processed successfully'}, 200

    except Exception as e:
        return {'status': 'error', 'message': str(e)}, 500


def update_stk_donation(stk_id, half_donation_amount, user_id):
    # 'stklar' koleksiyonunda id alanı ile eşleşen belgeyi bulalım
    stk_ref_stream = db.collection('stklar').where(
        'id', '==', stk_id).limit(1).stream()

    for stk in stk_ref_stream:
        stk_doc = stk.to_dict()

        # STK belgesinin referansını alalım
        stk_ref = db.collection('stklar').document(stk.id)

        # Toplam bağışı arttır
        total_donation = stk_doc.get('totalDonation', 0)
        stk_ref.update({
            'totalDonation': total_donation + half_donation_amount,
            'processCount': firestore.Increment(1)
        })

        # Donor kontrolü - Eğer bu kullanıcı daha önce bağış yapmadıysa totalDonor arttır
        donation_ref_stream = db.collection('donations')\
            .where('userId', '==', user_id)\
            .where(f'stkId1', '==', stk_id)\
            .limit(1).stream()

        # Eğer kullanıcı daha önce bağış yapmamışsa `totalDonor`'ü arttır
        if not any(donation_ref_stream):
            total_donor = stk_doc.get('totalDonor', 0)
            stk_ref.update({
                'totalDonor': total_donor + 1
            })
