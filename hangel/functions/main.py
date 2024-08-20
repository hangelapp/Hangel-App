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


@https_fn.on_request()
def handle_postback(request: Request):
    try:
        phone_number = request.args.get('phone')
        payout = request.args.get('payout')
        revenue = request.args.get('revenue')
        transaction_id = request.args.get('transaction_id')

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
