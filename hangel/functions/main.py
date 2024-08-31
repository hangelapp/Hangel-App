from firebase_functions import https_fn
from firebase_admin import initialize_app, firestore, credentials
from flask import Flask, Request, jsonify
from flask_cors import CORS
import os

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


# https://deneme.com/postback?adv_sub={ADV_SUB}&sale_amount={SALE_AMOUNT}&aff_sub={AFF_SUB}&aff_sub2={aff_sub2}
@https_fn.on_request()
def handle_postback(request: Request):
    try:
        adv_sub = request.args.get('adv_sub') # Sipariş Numarası        ->Bu şuan kullanılmayacak
        sale_amount = request.args.get('sale_amount') # Satış Tutarı    ->Bu tutar ikiye bölünüp stk'lara dağıtılacak
        aff_sub = request.args.get('aff_sub') # Marka Offer Id          ->Bu markayı eşleştirmek için kullanılacak
        aff_sub2 = request.args.get('aff_sub2') # User Phone Number     ->Kullanıcıyı eşleştirmek için kullanılacak

        users_ref = db.collection('users').document(
            "6kGnMPHZdVTAUr9RC9Y885dvTZS2")
        users_ref.update({
            "city": "ADANA"
        })
        # query = users_ref.where('phone', '==', phone_number).stream()

        # for doc in query:
        #     users_ref.document(doc.id).update({
        #         'city': "Adana"
        #     })

        return {'status': 'success', 'message': 'Postback received and processed.'}, 200

    except Exception as e:
        return {'status': 'error', 'message': str(e)}, 500
