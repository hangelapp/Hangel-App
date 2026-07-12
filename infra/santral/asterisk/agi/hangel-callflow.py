#!/usr/bin/env python3
"""
hangel santral — çağrı akışı AGI köprüsü.

Gelen çağrıda dialplan bunu çağırır. Script, hangel resolve API'sine
("/api/santral/call-flow-resolve") sorar ve dönen SADE planı uygular:
  default-ring | dial | ivr | voicemail | forward | closed | hangup

Böylece TÜM akış mantığı panelden (Firestore callFlow) yönetilir; bu dosya
sabit kalır. Ses dosyaları santral-sync-audio ile yerelde
/var/lib/asterisk/sounds/hangel/<ngoId>/<slot> olarak bulunur (uzak URL çalınmaz).

ENV (setup.sh yazar): HANGEL_API_BASE, SANTRAL_GATEWAY_SECRET
Argümanlar: arg1=calledNumber(DID), arg2=webrtcEndpoint (ör. tenant1-webrtc-100)
"""
import sys
import os
import json
import urllib.request

API_BASE = os.environ.get("HANGEL_API_BASE", "https://hangel.org")
SECRET = os.environ.get("SANTRAL_GATEWAY_SECRET", "")
SOUNDS_DIR = "/var/lib/asterisk/sounds/hangel"


def agi_read():
    env = {}
    while True:
        line = sys.stdin.readline().strip()
        if line == "":
            break
        if ":" in line:
            k, v = line.split(":", 1)
            env[k.strip()] = v.strip()
    return env


def cmd(command):
    """AGI komutu gönder, dönüş kodunu oku (result=...)."""
    sys.stdout.write(command + "\n")
    sys.stdout.flush()
    res = sys.stdin.readline().strip()
    return res


def verbose(msg):
    cmd(f'VERBOSE "hangel-callflow: {msg}" 1')


def resolve(called, ngo_id=None, digit=None):
    payload = {"calledNumber": called}
    if ngo_id:
        payload["ngoId"] = ngo_id
    if digit:
        payload["digit"] = digit
    req = urllib.request.Request(
        f"{API_BASE}/api/santral/call-flow-resolve",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {SECRET}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        verbose(f"resolve hata: {e}")
        return {"action": "default-ring"}


def local_sound(ngo_id, slot, url):
    """Yerel ses dosyası yolu (uzantısız — Asterisk kendi ekler). Yoksa None."""
    if not url:
        return None
    base = f"{SOUNDS_DIR}/{ngo_id}/{slot}"
    for ext in (".wav", ".gsm", ".ulaw"):
        if os.path.exists(base + ext):
            return base  # Asterisk uzantısız ister
    return None


def play_or_say(ngo_id, slot, audio_url, text):
    path = local_sound(ngo_id, slot, audio_url)
    if path:
        cmd(f'STREAM FILE "{path}" ""')
    elif text:
        # Yerel ses yoksa TTS yerine basit beep + metni verbose (TTS opsiyonel).
        cmd('STREAM FILE "beep" ""')
        verbose(f"anons: {text[:80]}")


def dial(targets, ring_seconds):
    """PJSIP endpoint(ler)i çaldır. targets: dahili ext listesi."""
    # webrtc-100 gibi dahilileri tenant1-webrtc-<ext> endpoint adına çevir.
    tech = "&".join([f"PJSIP/tenant1-webrtc-{t}" for t in targets])
    verbose(f"dial: {tech} ({ring_seconds}s)")
    cmd(f'EXEC Dial "{tech},{ring_seconds}"')
    status = cmd('GET VARIABLE DIALSTATUS')
    return status


def main():
    agi_read()
    called = sys.argv[1] if len(sys.argv) > 1 else ""
    default_ep = sys.argv[2] if len(sys.argv) > 2 else "tenant1-webrtc-100"
    default_ext = default_ep.replace("tenant1-webrtc-", "") or "100"

    cmd("ANSWER")
    plan = resolve(called)
    ngo_id = plan.get("ngoId")
    action = plan.get("action", "default-ring")
    verbose(f"plan={action} ngo={ngo_id}")

    # Mesai dışı: anons + sonraki plan (then)
    if action == "closed":
        play_or_say(ngo_id, "closed", plan.get("promptAudioUrl"), plan.get("prompt"))
        plan = plan.get("then", {"action": "hangup"})
        action = plan.get("action", "hangup")

    # IVR: menüyü çal, tuş oku, tuşa göre yeniden resolve
    if action == "ivr":
        digit = ""
        for _ in range(3):  # 3 deneme
            play_or_say(ngo_id, "ivr", plan.get("promptAudioUrl"), plan.get("prompt"))
            res = cmd(f'WAIT FOR DIGIT "{int(plan.get("timeout", 7)) * 1000}"')
            # result=<ascii kod> ; 0 = zaman aşımı
            try:
                code = int(res.split("result=")[1].split()[0])
            except Exception:
                code = 0
            if code > 0:
                digit = chr(code)
                break
        if digit:
            plan = resolve(called, ngo_id, digit)
            action = plan.get("action", "default-ring")
        else:
            action = "default-ring"

    # Dial: sıra / hedef dahili(ler)
    if action == "dial":
        targets = plan.get("targets") or [default_ext]
        status = dial(targets, int(plan.get("ringSeconds", 25)))
        if status.upper().find("ANSWER") == -1:
            plan = plan.get("then", {"action": "hangup"})
            action = plan.get("action", "hangup")
        else:
            cmd("HANGUP")
            return

    # Varsayılan: normal telefon gibi — webrtc panelini çaldır
    if action == "default-ring":
        status = dial([default_ext], 30)
        then = plan.get("then")
        if status.upper().find("ANSWER") == -1 and then:
            action = then.get("action", "hangup")
            plan = then
        else:
            cmd("HANGUP")
            return

    # Yönlendirme: dış numaraya (Pasifik trunk üzerinden)
    if action == "forward":
        num = plan.get("number", "")
        if num:
            verbose(f"forward -> {num}")
            cmd(f'EXEC Dial "PJSIP/{num}@tenant1-pasifik-trunk,60"')
        cmd("HANGUP")
        return

    # Sesli mesaj — anons çal, kaydet, hangel'e yükle (recordings/ sayfasında görünür).
    if action == "voicemail":
        play_or_say(ngo_id, "voicemail", plan.get("promptAudioUrl"), plan.get("prompt"))
        cmd('STREAM FILE "beep" ""')
        import time
        rec_base = f"/tmp/vm-{ngo_id}-{int(time.time())}"
        # 120 sn'e kadar, # ile bitir; sessizlikte 5 sn sonra otomatik kes.
        cmd(f'RECORD FILE "{rec_base}" wav "#" 120000 0 s=5')
        wav = rec_base + ".wav"
        if os.path.exists(wav):
            upload_voicemail(wav, called, ngo_id)
            try:
                os.remove(wav)
            except OSError:
                pass
        cmd("HANGUP")
        return

    cmd("HANGUP")


def upload_voicemail(wav_path, called, ngo_id):
    """Kaydı hangel voicemail-upload API'sine multipart POST eder (recordings'te görünür)."""
    import subprocess
    try:
        subprocess.run([
            "curl", "-s", "-X", "POST",
            f"{API_BASE}/api/santral/voicemail-upload",
            "-H", f"Authorization: Bearer {SECRET}",
            "-F", f"file=@{wav_path};type=audio/wav",
            "-F", f"calledNumber={called}",
            "-F", f"ngoId={ngo_id or ''}",
        ], timeout=30)
    except Exception as e:
        verbose(f"voicemail upload hata: {e}")


if __name__ == "__main__":
    main()
